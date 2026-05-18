/**
 * Login page — the route-level component that the router renders.
 *
 * Responsibilities at the page layer (everything else belongs in components/
 * or hooks/):
 *   - Page chrome / layout
 *   - Wire success path: store token, redirect to dashboard
 *   - Compose feature components
 *
 * Use this file as the template for any new feature page: thin shell, real
 * work in `./components/` and `./hooks/`.
 */
import { useNavigate } from 'react-router-dom';
import { setAuthToken } from '@react-vault/core/http';

import axiosInstance from '@/api/axiosInstance';

import { LoginForm } from './components/LoginForm';

export function LoginPage(): JSX.Element {
  const navigate = useNavigate();

  return (
    <main className="container mx-auto flex min-h-screen items-center justify-center py-12">
      <section className="w-full max-w-sm space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-muted-foreground">
            Use your organisation username and password.
          </p>
        </header>

        <LoginForm
          onLoggedIn={(response) => {
            setAuthToken(axiosInstance, response.data.token);
            navigate('/dashboard', { replace: true });
          }}
        />
      </section>
    </main>
  );
}

export default LoginPage;
