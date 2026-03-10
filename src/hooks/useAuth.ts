import { useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { resolvePrimaryRole, type AppRole } from "@/lib/roles";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    // Restore session from storage immediately
    const restoreSession = async () => {
      try {
        console.log("[useAuth] Attempting to restore session...");
        
        // If offline, skip trying to fetch session and just load from cache
        if (!navigator.onLine) {
          console.log("[useAuth] Offline - skipping session fetch, using cached session if available");
          setUserRole(null);
          setLoading(false);
          return;
        }
        
        // Get the stored session directly from supabase auth
        // This will be retrieved from localStorage immediately
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error("[useAuth] Error getting session:", error);
          setSession(null);
          setUser(null);
          setUserRole(null);
          setLoading(false);
          return;
        }

        if (session && session.user) {
          console.log("[useAuth] Session restored successfully:", session.user?.email);
          setSession(session);
          setUser(session.user ?? null);
          // Fetch role but don't set loading false yet - let fetchUserRole do it
          await fetchUserRole(session.user.id);
        } else {
          console.log("[useAuth] No session found");
          setUserRole(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("[useAuth] Unexpected error restoring session:", error);
        if (isMounted) {
          setUserRole(null);
          setLoading(false);
        }
      }
    };

    // Restore session first
    restoreSession();

    // Set up auth state listener to watch for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;

        console.log("[useAuth] Auth state change:", event, session?.user?.email);
        
        if (event === 'SIGNED_OUT' || session === null) {
          console.log("[useAuth] User signed out");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setUserRoles([]);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            fetchUserRole(session.user.id);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // NOTE: a user can have multiple rows in user_roles. We resolve a single
      // primary role deterministically to avoid maybeSingle() failures.
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
        return;
      }

      const roles = (data ?? []).map((r: any) => r.role as AppRole);
      const primaryRole = resolvePrimaryRole(roles);
      console.log("[useAuth] User role resolved:", primaryRole);
      setUserRole(primaryRole);
      setUserRoles(roles);
    } catch (error) {
      console.error("Error fetching user role:", error);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: AppRole): boolean => {
    return userRole === role;
  };

  const requireRole = (requiredRole: AppRole, redirectTo: string = "/login") => {
    useEffect(() => {
      if (!loading) {
        if (!user) {
          navigate(redirectTo);
        } else if (userRole !== null && userRole !== requiredRole) {
          // User is logged in but has wrong role
          navigate("/");
        }
      }
    }, [loading, user, userRole, navigate, requiredRole, redirectTo]);
  };

  return {
    user,
    session,
    loading,
    userRole,
    userRoles,
    hasRole,
    requireRole,
  };
};

