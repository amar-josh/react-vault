/**
 * Cross-API cache invalidation middleware. Pattern from rsense-react-org:
 * when one API's mutation fulfills, invalidate tags on related APIs.
 *
 * Add invalidation rules below. The default impl is a no-op; specialise as
 * cross-API relationships emerge.
 */
import type { Middleware } from '@reduxjs/toolkit';

const invalidateCacheMiddleware: Middleware = () => (next) => (action) => {
  // Example pattern (uncomment + adapt):
  //
  // if (kycApi.endpoints.submitKyc.matchFulfilled(action)) {
  //   storeApi.dispatch(userApi.util.invalidateTags(['User']));
  // }

  return next(action);
};

export default invalidateCacheMiddleware;
