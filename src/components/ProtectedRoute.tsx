import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student' | 'driver' | 'pnp' | 'rescue' | 'rescue_admin';
  redirectTo?: string;
}

/**
 * ProtectedRoute - Wraps components that require authentication
 * Automatically redirects unauthenticated users to login or authorized dashboard
 * Handles session persistence and role-based redirects
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  redirectTo = '/login',
}) => {
  const navigate = useNavigate();
  const { user, loading, userRole } = useAuth();

  useEffect(() => {
    // If still loading session, don't redirect yet
    // AppLayout will show splash screen during this time
    if (loading) {
      return;
    }

    // Session is loaded, now check auth
    if (!user) {
      // Not authenticated - redirect to login
      navigate(redirectTo, { replace: true });
      return;
    }

    if (requiredRole && userRole !== requiredRole) {
      // Wrong role - redirect to appropriate dashboard
      if (userRole === 'admin') navigate('/admin', { replace: true });
      else if (userRole === 'rescue_admin') navigate('/rescue-admin', { replace: true });
      else if (userRole === 'pnp') navigate('/pnp', { replace: true });
      else if (userRole === 'rescue') navigate('/rescue', { replace: true });
      else if (userRole === 'student') navigate('/student', { replace: true });
      else if (userRole === 'driver') navigate('/driver-portal', { replace: true });
      else navigate('/', { replace: true });
      return;
    }
  }, [user, loading, userRole, navigate, requiredRole, redirectTo]);

  // Still loading, show nothing (AppLayout shows splash screen)
  if (loading) {
    return null;
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  // Wrong role
  if (requiredRole && userRole !== requiredRole) {
    return null;
  }

  // Authenticated with correct role - render component
  return <>{children}</>;
};

export default ProtectedRoute;
