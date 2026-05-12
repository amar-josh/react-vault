import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from '../shared/ErrorBoundary.js';
import { AppRoutes } from '../routes/index.js';

export function App(): JSX.Element {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
