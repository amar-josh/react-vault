/**
 * TanStack variant routes — overlays the _shared placeholder with the real
 * `features/login` page. Treat this file as the wiring layer:
 *   - import feature pages from `src/features/<feature>/index.tsx`
 *   - wrap protected ones in <ProtectedRoute permission="...">
 *   - keep route paths in lockstep with `src/constants/endPoints.ts` only
 *     where they share a name (login UI route ≠ login API endpoint).
 */
import { Routes, Route } from 'react-router-dom';

import { ProtectedRoute } from './ProtectedRoute.js';
import LoginPage from '../features/login/index.js';

export function AppRoutes(): JSX.Element {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute permission="dashboard.view">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function Landing(): JSX.Element {
  return (
    <main className="container mx-auto py-12">
      <h1 className="text-3xl font-bold tracking-tight">{`{{projectName}}`}</h1>
      <p className="mt-2 text-muted-foreground">
        Scaffolded from @react-vault/create-app. Go to{' '}
        <a className="underline" href="/login">
          /login
        </a>{' '}
        to try the example feature, then{' '}
        <a className="underline" href="/dashboard">
          /dashboard
        </a>
        .
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        Run <code className="rounded bg-muted px-1.5 py-0.5">claude</code> in this directory to
        start a Claude Code session with the BFSI toolkit enabled. Then run{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">/bfsi-doctor</code>.
      </p>
    </main>
  );
}

function Dashboard(): JSX.Element {
  return (
    <main className="container mx-auto py-12">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">Protected by &lt;ProtectedRoute&gt;.</p>
    </main>
  );
}

function NotFound(): JSX.Element {
  return (
    <main className="container mx-auto py-12">
      <h1 className="text-2xl font-semibold">Not found</h1>
      <p className="mt-2 text-muted-foreground">The page you were looking for doesn't exist.</p>
    </main>
  );
}
