/**
 * Redux store. Mirrors rsense-react-org's pattern:
 *   - configureStore with rootReducer
 *   - middleware concat with each feature API's middleware (add as you create them)
 *   - setupListeners for RTK Query refetch-on-focus / reconnect
 *   - devTools enabled
 *
 * As you add features, import their api and:
 *   1. Register the reducer in ./rootReducer.ts
 *   2. Add the middleware below
 */
import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import rootReducer from './rootReducer.js';

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
      },
    }).concat([
      // Append feature API middleware here, e.g.:
      // loginApi.middleware,
      // kycApi.middleware,
    ]),
  devTools: true,
});

setupListeners(store.dispatch);

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;

export default store;
