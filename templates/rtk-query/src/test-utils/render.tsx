/**
 * Test-render helper for RTK Query / Redux components and hooks.
 *
 * Each test builds its own store with only the slices + API middleware it
 * cares about. Don't import the app's store directly — that introduces
 * cross-test cache leakage and forces every test to register every feature.
 *
 * Usage:
 *
 *   import { setupApiStore, renderWithProviders } from '@/test-utils/render';
 *   import { kycApi } from '@/features/kyc/api';
 *
 *   const { store } = setupApiStore({ apis: [kycApi] });
 *   renderWithProviders(<KycList />, { store });
 *
 * Or for a hook test:
 *
 *   const { wrapper, store } = createWrapper({ apis: [kycApi] });
 *   const { result } = renderHook(() => useGetKycListQuery(), { wrapper });
 */
import { combineReducers, configureStore, type Reducer } from '@reduxjs/toolkit';
import type { Api } from '@reduxjs/toolkit/query';
import { setupListeners } from '@reduxjs/toolkit/query';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

interface SetupOptions {
  /** RTK Query APIs to register (reducer + middleware). */
  apis?: Array<Api<any, any, any, any>>;
  /** Plain slice reducers keyed by slice name. */
  slices?: Record<string, Reducer>;
  /** Optional preloaded state. */
  preloadedState?: Record<string, unknown>;
}

export function setupApiStore({ apis = [], slices = {}, preloadedState }: SetupOptions = {}): {
  store: ReturnType<typeof configureStore>;
} {
  const apiReducers = apis.reduce<Record<string, Reducer>>((acc, api) => {
    acc[api.reducerPath] = api.reducer;
    return acc;
  }, {});

  const rootReducer = combineReducers({ ...slices, ...apiReducers });
  const apiMiddleware = apis.map((api) => api.middleware);

  const store = configureStore({
    reducer: rootReducer,
    middleware: (gdm) => gdm({ serializableCheck: false }).concat(apiMiddleware),
    preloadedState,
  });

  setupListeners(store.dispatch);
  return { store };
}

interface ProviderOptions extends SetupOptions {
  /** Pass a pre-built store to reuse across multiple calls (e.g. when asserting on dispatched actions). */
  store?: ReturnType<typeof configureStore>;
  /** Initial entry for MemoryRouter. */
  initialRoute?: string;
}

export function createWrapper(options: ProviderOptions = {}): {
  wrapper: (props: { children: ReactNode }) => JSX.Element;
  store: ReturnType<typeof configureStore>;
} {
  const { store: passed, initialRoute = '/', ...setup } = options;
  const store = passed ?? setupApiStore(setup).store;
  function Wrapper({ children }: { children: ReactNode }): JSX.Element {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </Provider>
    );
  }
  return { wrapper: Wrapper, store };
}

export function renderWithProviders(
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {},
): RenderResult & { store: ReturnType<typeof configureStore> } {
  const { store: passed, apis, slices, preloadedState, initialRoute, ...renderOptions } = options;
  const { wrapper, store } = createWrapper({
    store: passed,
    apis,
    slices,
    preloadedState,
    initialRoute,
  });
  return {
    ...render(ui, { wrapper, ...renderOptions }),
    store,
  };
}
