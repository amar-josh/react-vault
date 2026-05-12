# Notification wiring

`axiosBaseQuery` and `interceptor.ts` both have commented-out hooks for dispatching toast notifications. This is how you wire them once you have a Notification slice.

## 1. Create the slice

`src/shared/Notification/slice.ts`:

```ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationState {
  type: NotificationType | null;
  message: string;
}

const initialState: NotificationState = { type: null, message: '' };

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    setNotification: (
      state,
      action: PayloadAction<{ type: NotificationType; message: string }>,
    ) => {
      state.type = action.payload.type;
      state.message = action.payload.message;
    },
    clearNotification: (state) => {
      state.type = null;
      state.message = '';
    },
  },
});

export const { setNotification, clearNotification } = notificationSlice.actions;
export const notificationReducer = notificationSlice.reducer;
```

Register it in `src/redux/rootReducer.ts`:

```ts
import { notificationReducer } from '@/shared/Notification/slice';

const rootReducer = combineReducers({
  notification: notificationReducer,
  // ...
});
```

## 2. Wire into the response interceptor

Uncomment in `src/axiosconfig/interceptor.ts`:

```ts
import store from '../redux/store.js';
import { setNotification } from '../shared/Notification/slice.js';

// inside the response error handler:
store.dispatch(
  setNotification({
    type: 'error',
    message: extractMessage(err),
  }),
);
```

A typical `extractMessage`:

```ts
function extractMessage(err: ApiErrorShape): string {
  const errors = err.response?.data?.errors;
  if (Array.isArray(errors) && errors[0]) {
    return errors[0].detail ?? errors[0].details ?? 'Request failed';
  }
  if (errors && typeof errors === 'object') {
    const firstKey = Object.keys(errors)[0];
    const firstVal = firstKey ? errors[firstKey]?.[0] : undefined;
    return firstVal ?? 'Validation failed';
  }
  return err.response?.data?.message ?? 'Request failed';
}
```

## 3. Wire into `axiosBaseQuery`

Each endpoint sets `showSuccessNotification` / `showFailureNotification`. Adapt `baseQuery.ts`:

```ts
import store from '../redux/store.js';
import { setNotification } from '../shared/Notification/slice.js';

// success branch:
if (showSuccessNotification) {
  store.dispatch(setNotification({ type: 'success', message: result.data?.message }));
}

// failure branch:
if (showFailureNotification) {
  store.dispatch(setNotification({ type: 'error', message: extractMessage(error) }));
}
```

## 4. Render the notifications

A small `<Notification />` component listens to the slice and renders toast UI (shadcn `<Toast>`, Sonner, etc.):

```tsx
import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '@/redux/reduxHooks';
import { clearNotification } from './slice';
import { toast } from 'sonner';

export function Notification() {
  const { type, message } = useAppSelector((s) => s.notification);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!type) return;
    toast[type](message);
    const t = setTimeout(() => dispatch(clearNotification()), 3000);
    return () => clearTimeout(t);
  }, [type, message, dispatch]);

  return null;
}
```

Mount it once in `App.tsx`:

```tsx
<Provider store={store}>
  <Notification />
  <BrowserRouter>
    <AppRoutes />
  </BrowserRouter>
</Provider>
```
