/**
 * RTK variant App.tsx — overlays the _shared App.tsx with Redux Provider.
 *
 * If you need to change the global layout / routes / error boundary, do it
 * here. This file replaces _shared/src/app/App.tsx during scaffold.
 */
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../shared/ErrorBoundary.js';
import { AppRoutes } from '../routes/index.js';
import store from '../redux/store.js';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <Provider store={store}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </Provider>
    </ErrorBoundary>
  );
}
