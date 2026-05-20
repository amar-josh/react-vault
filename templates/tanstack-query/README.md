# Template: TanStack Query variant

Overlay applied on top of `templates/_shared/` when the user picks **TanStack Query**.

## What lands in `src/`

```
src/
├── api/
│   ├── axiosInstance.ts    single shared axios from @<projectName>/core/http
│   ├── http.ts             typed GET / POST / PUT / PATCH / DELETE helpers
│   └── queryClient.ts      QueryClient with BFSI defaults
├── app/App.tsx             overlays _shared App with <QueryClientProvider>
├── components/common/
│   └── FormInput.tsx       generic typed RHF wrapper used by feature forms
├── constants/
│   ├── endPoints.ts        Object.freeze maps per service block
│   └── statusCodes.ts      STATUS_CODE.OK / .UNAUTHORIZED / ...
├── features/
│   └── login/              reference feature — copy the shape for new ones
│       ├── components/LoginForm.tsx
│       ├── hooks/useLogin.ts
│       ├── index.tsx
│       ├── services.ts
│       ├── types.ts
│       └── utils.ts        Zod schema + form defaults
└── routes/index.tsx        overlay wiring features/login into the router
```

## Feature-folder pattern

Every feature owns its services, hooks, types, schemas, and components. The
`src/features/login/` folder is a working example — open it when adding a new
feature and copy the shape.

### services.ts

```ts
import { POST } from '@/api/http';
import { ENDPOINTS } from '@/constants/endPoints';
import type { ILoginRequest, ILoginResponse } from './types';

export const loginService = (payload: ILoginRequest): Promise<ILoginResponse> =>
  POST<ILoginRequest, ILoginResponse>(ENDPOINTS.LOGIN, payload);
```

Generic order is `<TRequest, TResponse>` — request first, response second.
Reads like the call: "POST this, get this back".

### hooks/useLogin.ts

```ts
import { useMutation } from '@tanstack/react-query';
import { loginService } from '../services';

export const useLogin = () => useMutation({ mutationFn: loginService });
```

Don't bake `onSuccess`/`onError` into the hook — pass them at the call-site.

### utils.ts — Zod schema

```ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().trim().min(1, 'Password is required'),
});

export type ILoginFormValues = z.infer<typeof loginSchema>;
export const LOGIN_FORM_DEFAULT_VALUES: ILoginFormValues = { username: '', password: '' };
```

Form value types are inferred from the schema — never hand-written.

### components/LoginForm.tsx — RHF + zodResolver + FormInput

```tsx
const form = useForm<ILoginFormValues>({
  resolver: zodResolver(loginSchema),
  defaultValues: LOGIN_FORM_DEFAULT_VALUES,
});
const { mutate, isPending } = useLogin();

<FormInput control={form.control} name="username" label="Username" isRequired />
<FormInput control={form.control} name="password" label="Password" isSensitive isRequired />
```

## Auth: set-once at login

The axios instance has no per-request token interceptor. Set the token once on
login success:

```ts
import { setAuthToken } from '@react-vault/core/http';
import axiosInstance from '@/api/axiosInstance';

mutate(values, {
  onSuccess: (response) => {
    setAuthToken(axiosInstance, response.data.token);
    navigate('/dashboard', { replace: true });
  },
});
```

On 401, the instance's `onUnauthorized` callback clears the token and
redirects to `/login`.

## Why Zustand for client state

TanStack Query owns **server state** (fetches, caches, invalidation). Use
Zustand for **client state** (UI state surviving route changes, form drafts,
cross-component selections). Don't use Zustand for server data — that's what
TanStack Query is for.
