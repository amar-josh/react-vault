import { type ComponentProps } from 'react';
import { cn } from '../utils/cn.js';

export interface DateTimeDisplayProps extends Omit<ComponentProps<'time'>, 'children' | 'dateTime'> {
  value: Date | string | number | null | undefined;
  /** Locale for formatting. Default en-IN. */
  locale?: string;
  /** Display preset. Default 'date'. */
  preset?: 'date' | 'datetime' | 'time' | 'relative';
  /** Timezone. Default 'Asia/Kolkata' (IST). */
  timeZone?: string;
}

/**
 * Locale + timezone-aware date display. Renders inside <time dateTime="...">
 * for SR friendliness.
 *
 * BFSI default is IST (Asia/Kolkata). Override per use as needed.
 */
export function DateTimeDisplay({
  value,
  locale = 'en-IN',
  preset = 'date',
  timeZone = 'Asia/Kolkata',
  className,
  ...rest
}: DateTimeDisplayProps): JSX.Element {
  if (value === null || value === undefined || value === '') {
    return (
      <span className={cn('text-muted-foreground', className)}>
        —
      </span>
    );
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return (
      <span className={cn('text-muted-foreground', className)}>
        —
      </span>
    );
  }

  let formatted: string;
  if (preset === 'relative') {
    formatted = formatRelative(date, locale);
  } else {
    const options: Intl.DateTimeFormatOptions = {
      timeZone,
      ...(preset === 'date'
        ? { dateStyle: 'medium' }
        : preset === 'datetime'
          ? { dateStyle: 'medium', timeStyle: 'short' }
          : { timeStyle: 'short' }),
    };
    formatted = new Intl.DateTimeFormat(locale, options).format(date);
  }

  return (
    <time className={cn('tabular-nums', className)} dateTime={date.toISOString()} {...rest}>
      {formatted}
    </time>
  );
}

function formatRelative(date: Date, locale: string): string {
  const diffMs = date.getTime() - Date.now();
  const diffSec = Math.round(diffMs / 1000);
  const diffMin = Math.round(diffSec / 60);
  const diffHour = Math.round(diffMin / 60);
  const diffDay = Math.round(diffHour / 24);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  if (Math.abs(diffDay) >= 1) return rtf.format(diffDay, 'day');
  if (Math.abs(diffHour) >= 1) return rtf.format(diffHour, 'hour');
  if (Math.abs(diffMin) >= 1) return rtf.format(diffMin, 'minute');
  return rtf.format(diffSec, 'second');
}
