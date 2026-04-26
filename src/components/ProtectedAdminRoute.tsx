import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protects admin routes.
 * - If loading: show minimal spinner (no branded UI that would leak route existence).
 * - If not logged in OR not admin: redirect to the independent admin login page.
 *   Non-admin logged-in users will see a permission warning on the login page.
 * - Only fully-authenticated admins see the children.
 *
 * IMPORTANT: The admin path is intentionally obscure (`/sn-studio-mgmt-7k3x9q/`)
 * and must not be linked from any public-facing page.
 */
const ADMIN_LOGIN_PATH = '/sn-studio-mgmt-7k3x9q/login';

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
}) => {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Loading state (intentionally minimal - no branded copy)
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-400"></div>
      </div>
    );
  }

  // Not logged in -> redirect to admin login
  if (!user) {
    return (
      <Navigate
        to={ADMIN_LOGIN_PATH}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Logged in but not admin -> redirect to admin login (shows permission error there)
  if (!isAdmin) {
    return (
      <Navigate
        to={ADMIN_LOGIN_PATH}
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Authorized admin
  return <>{children}</>;
};

export default ProtectedAdminRoute;