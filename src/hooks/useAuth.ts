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
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        // Defer role fetch with setTimeout to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
      setUserRole(resolvePrimaryRole(roles));
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
    hasRole,
    requireRole,
  };
};

