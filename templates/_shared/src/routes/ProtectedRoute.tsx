import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * v0.1 stub. Wire up to your auth context once you have it.
 *
 * Expected behaviour:
 *  - If not authenticated → redirect to /login (with `from` for return)
 *  - If authenticated but lacks `permission` → render 403 + emit audit event
 *  - Else → render children
 */
export interface ProtectedRouteProps {
  permission?: string;
  /** Override idle timeout for this route (in ms). */
  idleTimeoutMs?: number;
  children: ReactNode;
}

export function ProtectedRoute({ permission: _permission, children }: ProtectedRouteProps): JSX.Element {
  const location = useLocation();
  // TODO: wire to actual auth context
  const isAuthenticated = true; // placeholder
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  // TODO: check permission against user's permission set
  return <>{children}</>;
}
