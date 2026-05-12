import { useCallback, useEffect, useRef, useState } from 'react';
import { mask, type MaskerType } from '@your-real-scope/core/pii';
import { cn } from '../utils/cn.js';

export interface PIIMaskedDisplayProps {
  /** PII type — controls masking and reveal duration. */
  type: MaskerType;
  /** The actual value. Masked by default; revealed on click. */
  value: string | null | undefined;
  /**
   * Audit target — when user reveals, an audit event is emitted with this
   * target attached. Pattern: `{ type: 'user', id: user.id }`.
   */
  auditTarget?: { type: string; id: string };
  /** Reveal duration override (ms). Default depends on type. */
  revealDurationMs?: number;
  /** Disable reveal entirely (display-only mask). */
  disabled?: boolean;
  /** Custom className for the outer wrapper. */
  className?: string;
  /** Override label for the reveal toggle (defaults to `Reveal <type>`). */
  revealLabel?: string;
  /**
   * Called when value is revealed. Use this to fire an audit event from
   * the app (the component itself doesn't have a direct dependency on
   * the audit client to keep the bundle small).
   */
  onReveal?: () => void;
  /** Called when value re-masks. */
  onMask?: () => void;
}

const DEFAULT_REVEAL_MS: Record<MaskerType, number> = {
  pan: 30_000,
  aadhaar: 15_000,
  account_number: 30_000,
  card_last4: 60_000,
  mobile: 30_000,
  email: 30_000,
  name: 60_000,
  address: 60_000,
  dob: 60_000,
  generic: 30_000,
};

/**
 * BFSI PII display with click-to-reveal.
 *
 * Behaviour:
 *  - Shows masked value by default
 *  - Click "reveal" → shows real value + fires `onReveal` callback
 *  - After `revealDurationMs`, automatically re-masks + fires `onMask`
 *  - Copy guard: copying the revealed text returns the value, but copying
 *    the masked text returns "****" (browser default behaviour from text content)
 */
export function PIIMaskedDisplay({
  type,
  value,
  auditTarget,
  revealDurationMs,
  disabled,
  className,
  revealLabel,
  onReveal,
  onMask,
}: PIIMaskedDisplayProps): JSX.Element {
  const [revealed, setRevealed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reMask = useCallback(() => {
    setRevealed(false);
    onMask?.();
  }, [onMask]);

  const handleReveal = useCallback(() => {
    if (disabled) {
      return;
    }
    if (revealed) {
      // Toggle off
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      reMask();
      return;
    }
    setRevealed(true);
    onReveal?.();
    const duration = revealDurationMs ?? DEFAULT_REVEAL_MS[type];
    if (duration > 0) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(reMask, duration);
    }
  }, [disabled, revealed, onReveal, revealDurationMs, type, reMask]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Re-mask if value changes while revealed
  useEffect(() => {
    if (revealed) {
      reMask();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const displayValue = revealed ? value ?? '' : mask(type, value);

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 tabular-nums', className)}
      data-testid={`pii-${type}`}
      data-target-type={auditTarget?.type}
      data-target-id={auditTarget?.id}
    >
      <span
        className={cn(revealed ? 'text-foreground' : 'text-muted-foreground')}
        aria-label={revealed ? undefined : `masked ${type}, click to reveal`}
      >
        {displayValue || '—'}
      </span>
      {!disabled && value ? (
        <button
          type="button"
          onClick={handleReveal}
          className={cn(
            'inline-flex items-center justify-center rounded-md p-0.5 opacity-60 hover:opacity-100',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'text-xs',
          )}
          aria-label={revealLabel ?? `${revealed ? 'mask' : 'reveal'} ${type}`}
          aria-pressed={revealed}
        >
          {revealed ? '🙈' : '👁'}
        </button>
      ) : null}
    </span>
  );
}
