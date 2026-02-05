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
    if (loading) {
      // Still loading session from storage, don't redirect yet
      return;
    }

    if (!user) {
      // No user and session is loaded, redirect to login
      navigate(redirectTo);
      return;
    }

    if (requiredRole && userRole !== requiredRole) {
      // User is logged in but doesn't have the required role
      // Redirect them to their appropriate dashboard based on their role
      if (userRole === 'admin') navigate('/admin');
      else if (userRole === 'rescue_admin') navigate('/rescue-admin');
      else if (userRole === 'pnp') navigate('/pnp');
      else if (userRole === 'rescue') navigate('/rescue');
      else if (userRole === 'student') navigate('/student');
      else if (userRole === 'driver') navigate('/');
      else navigate('/');
      return;
    }
  }, [user, loading, userRole, navigate, requiredRole, redirectTo]);

  if (loading) {
    // Still checking session, show nothing or a loader
    return null;
  }

  if (!user) {
    // Not authenticated
    return null;
  }

  if (requiredRole && userRole !== requiredRole) {
    // Wrong role
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
