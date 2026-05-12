/**
 * Safe error envelope. Maps internal errors to user-facing messages.
 * See packages/claude-toolkit/skills/bfsi-error-message/SKILL.md for rationale.
 */
import { generateErrorRef } from '../audit/auditClient.js';
import type { ApiError } from '../http/errors.js';

export interface SafeErrorView {
  title: string;
  description: string;
  /** Short ref code to show user; correlate to log entry. */
  ref: string;
}

/**
 * Translate an ApiError into a user-safe view. Caller passes a `t()` function
 * so messages can be i18n'd.
 */
export function toSafeView(err: unknown, t: (key: string, params?: Record<string, unknown>) => string): SafeErrorView {
  const ref = generateErrorRef();
  if (isApiError(err)) {
    switch (err.kind) {
      case 'network':
        return { title: t('errors.network.title'), description: t('errors.network.description'), ref };
      case 'timeout':
        return { title: t('errors.timeout.title'), description: t('errors.timeout.description'), ref };
      case 'unauthorized':
        return { title: t('errors.session_expired.title'), description: t('errors.session_expired.description'), ref };
      case 'forbidden':
        return { title: t('errors.forbidden.title'), description: t('errors.forbidden.description'), ref };
      case 'not_found':
        return { title: t('errors.not_found.title'), description: t('errors.not_found.description'), ref };
      case 'validation':
        return { title: t('errors.validation.title'), description: t('errors.validation.description'), ref };
      case 'rate_limited':
        return { title: t('errors.rate_limited.title'), description: t('errors.rate_limited.description'), ref };
      case 'server_error':
        return { title: t('errors.server.title'), description: t('errors.server.description', { ref }), ref };
      default:
        return { title: t('errors.generic.title'), description: t('errors.generic.description', { ref }), ref };
    }
  }
  return { title: t('errors.generic.title'), description: t('errors.generic.description', { ref }), ref };
}

function isApiError(err: unknown): err is ApiError {
  return !!err && typeof err === 'object' && (err as { name?: string }).name === 'ApiError';
}
