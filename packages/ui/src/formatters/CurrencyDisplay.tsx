import { type ComponentProps } from 'react';
import { cn } from '../utils/cn.js';

export interface CurrencyDisplayProps extends Omit<ComponentProps<'span'>, 'children'> {
  /** Amount in MAJOR units (₹, not paise). */
  value: number | string | null | undefined;
  /** ISO 4217 code. Default INR. */
  currency?: string;
  /** Locale for formatting. Default en-IN. */
  locale?: string;
  /** Whether to show the currency symbol. Default true. */
  showSymbol?: boolean;
  /** Show negative as `(N)` instead of `-N` (accounting style). */
  accountingStyle?: boolean;
  /** Maximum fraction digits. Default 2. */
  maximumFractionDigits?: number;
}

/**
 * Locale-aware currency display. Uses Intl.NumberFormat.
 *
 * IMPORTANT: NEVER use floats internally for money. Store amounts as integer
 * paise (or minor units) and only format to major units at display.
 */
export function CurrencyDisplay({
  value,
  currency = 'INR',
  locale = 'en-IN',
  showSymbol = true,
  accountingStyle = false,
  maximumFractionDigits = 2,
  className,
  ...rest
}: CurrencyDisplayProps): JSX.Element {
  if (value === null || value === undefined || value === '') {
    return (
      <span className={cn('text-muted-foreground', className)} {...rest}>
        —
      </span>
    );
  }

  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) {
    return (
      <span className={cn('text-muted-foreground', className)} {...rest}>
        —
      </span>
    );
  }

  const formatted = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency: showSymbol ? currency : undefined,
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
    currencyDisplay: 'symbol',
  }).format(Math.abs(numeric));

  const isNegative = numeric < 0;
  const display = isNegative
    ? accountingStyle
      ? `(${formatted})`
      : `-${formatted}`
    : formatted;

  return (
    <span
      className={cn(
        'tabular-nums',
        isNegative ? 'text-destructive' : '',
        className,
      )}
      {...rest}
    >
      {display}
    </span>
  );
}
