# Audited mutation wrapper

Every state-changing API call in a BFSI app should emit an audit event (RBI Annexure I §8, SOC2 CC7.3). Without an `axiosBaseQuery`-style abstraction, we wrap `useMutation` with a custom hook.

## The wrapper

```ts
// src/services/useAuditedMutation.ts
import {
  useMutation,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query';
import type { ApiError } from '@<scope>/core/http';
import { AuditClient, generateEventId } from '@<scope>/core/audit';
import { env } from '@/env';

const auditClient = new AuditClient({
  endpoint: env.VITE_AUDIT_ENDPOINT,
  batchSize: env.VITE_AUDIT_BATCH_SIZE,
  flushIntervalMs: env.VITE_AUDIT_FLUSH_INTERVAL_MS,
});

export interface UseAuditedMutationOptions<TData, TVars>
  extends UseMutationOptions<TData, ApiError, TVars> {
  /** Audit event name — convention: <feature>.<entity>.<action> */
  eventName: string;
  /** Optional toast on success */
  successMessage?: string;
  /** Function to extract audit target from variables */
  getTarget?: (vars: TVars) => { type: string; id?: string };
}

export function useAuditedMutation<TData, TVars>(
  options: UseAuditedMutationOptions<TData, TVars>,
): UseMutationResult<TData, ApiError, TVars> {
  return useMutation({
    ...options,
    onMutate: async (vars) => {
      // Record audit event (pending)
      const eventId = generateEventId();
      const target = options.getTarget?.(vars);
      auditClient.record({
        event_id: eventId,
        event_name: options.eventName,
        actor_id: getCurrentUserId(), // your auth context
        target_type: target?.type,
        target_id: target?.id,
        timestamp: new Date().toISOString(),
        outcome: 'pending',
      });
      // Pass eventId through context for outcome update on success/error
      const inherited = await options.onMutate?.(vars);
      return { eventId, inherited } as never;
    },
    onSuccess: (data, vars, ctx) => {
      const eventId = (ctx as { eventId: string } | undefined)?.eventId;
      if (eventId) {
        auditClient.record({
          event_id: eventId,
          event_name: options.eventName,
          actor_id: getCurrentUserId(),
          timestamp: new Date().toISOString(),
          outcome: 'success',
        });
      }
      options.onSuccess?.(data, vars, ctx);
    },
    onError: (err, vars, ctx) => {
      const eventId = (ctx as { eventId: string } | undefined)?.eventId;
      if (eventId) {
        auditClient.record({
          event_id: eventId,
          event_name: options.eventName,
          actor_id: getCurrentUserId(),
          timestamp: new Date().toISOString(),
          outcome: 'failure',
        });
      }
      options.onError?.(err, vars, ctx);
    },
  });
}

function getCurrentUserId(): string {
  // Wire to your auth context
  return 'TODO';
}
```

## Usage

```tsx
const submit = useAuditedMutation({
  mutationFn: submitKyc,
  eventName: 'kyc.verification.submitted',
  successMessage: 'KYC submitted successfully',
  getTarget: (payload) => ({ type: 'kyc_record', id: undefined }), // id assigned on success
  onSuccess: (record) => {
    queryClient.invalidateQueries({ queryKey: kycKeys.all });
    navigate(`/kyc/${record.id}`);
  },
});
```

## Audit event naming

`<feature>.<entity>.<action>` — see `bfsi-feature` skill in the toolkit for full naming convention. Examples:

- `kyc.verification.submitted`
- `kyc.verification.approved`
- `transaction.transfer.initiated`
- `user.session.logged_in`
- `data.pan.revealed` (when PII is unmasked)

## Why this wraps useMutation

In the RTK variant, audit events flow through the `axiosBaseQuery` because that's the single chokepoint every API call goes through. In TanStack, there's no equivalent — each service call is direct. The wrapper hook brings back the chokepoint for state-changing operations.

You CAN skip the wrapper for read-only queries (no audit needed for reads, by default). Reads via `useQuery` don't get the wrapper.

## Reveal events (separate from mutations)

When a user clicks "reveal PAN" in `<PIIMaskedDisplay>`, you fire an audit event directly:

```tsx
<PIIMaskedDisplay
  type="pan"
  value={user.pan}
  onReveal={() =>
    auditClient.record({
      event_id: generateEventId(),
      event_name: 'data.pan.revealed',
      actor_id: getCurrentUserId(),
      target_type: 'user',
      target_id: user.id,
      timestamp: new Date().toISOString(),
      outcome: 'success',
    })
  }
/>
```

No mutation involved — just a direct audit call.
