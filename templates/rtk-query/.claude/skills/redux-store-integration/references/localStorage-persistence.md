# Persisting a slice to localStorage

For state that must survive a page reload (locale, theme, in-progress form drafts) but is NOT sensitive (no PII, no tokens).

## Rule

> Tokens NEVER go in localStorage. Use `setAuthToken()` from `@<scope>/core/http` instead, which keeps them in memory.

For non-sensitive state, this pattern is fine.

## Pattern — `store.subscribe`

```ts
// src/redux/store.ts
import { LOCALE_KEY, THEME_KEY } from '@/utils/constants/appConstants';

store.subscribe(() => {
  const state = store.getState();
  // Only persist allow-listed slices, not the entire store:
  localStorage.setItem(LOCALE_KEY, JSON.stringify(state.locale));
  localStorage.setItem(THEME_KEY, JSON.stringify(state.theme));
});
```

## Pattern — `preloadedState`

Rehydrate on store init:

```ts
const preloadedState = {
  locale: tryParse(localStorage.getItem(LOCALE_KEY)) ?? initialLocaleState,
  theme: tryParse(localStorage.getItem(THEME_KEY)) ?? initialThemeState,
};

const store = configureStore({
  reducer: rootReducer,
  preloadedState,
  middleware: ...,
});

function tryParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try { return JSON.parse(raw) as T; } catch { return null; }
}
```

## Don't persist these slices

- Anything containing auth tokens
- Anything containing PII (PAN, Aadhaar, account#)
- RTK Query API cache (`[api.reducerPath]`) — let RTK Query handle its own cache lifecycle
- Anything with timestamps that go stale (notifications, idle markers)

## Preferred alternative for non-trivial cases

Use `@<scope>/core/storage` (`secureStorage.put/get`) with sensitivity tier `'session'`. It does the same job but:

- One memory + sessionStorage codepath (no leak risk)
- Optional TTL eviction
- Easier to swap to encrypted IndexedDB later

```ts
import { put, get } from '@<scope>/core/storage';

// On store.subscribe:
put('locale', state.locale, { sensitivity: 'session' });

// On init:
const persisted = get<LocaleState>('locale', { sensitivity: 'session' });
```
