import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "staff" | "customer" | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isAdmin: boolean;
  isStaff: boolean;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = useCallback(async (userId: string) => {
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    if (adminRole) return "admin" as AppRole;

    const { data: staffRole } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "staff")
      .maybeSingle();

    if (staffRole) return "staff" as AppRole;

    return "customer" as AppRole;
  }, []);

  useEffect(() => {
    let mounted = true;
    let lastUserId: string | null = null;

    const applySession = (currentSession: Session | null) => {
      if (!mounted) return;

      if (!currentSession) {
        lastUserId = null;
        setSession(null);
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setSession(currentSession);
      setUser(currentSession.user);

      // Only refetch role when the user actually changes — token refreshes
      // should not re-query user_roles.
      if (currentSession.user.id === lastUserId) {
        setLoading(false);
        return;
      }
      lastUserId = currentSession.user.id;

      setTimeout(async () => {
        if (!mounted) return;
        const userRole = await fetchRole(currentSession.user.id);
        if (mounted) {
          setRole(userRole);
          setLoading(false);
        }
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => applySession(currentSession)
    );

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      applySession(initialSession);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchRole]);


  return {
    user,
    session,
    role,
    isAdmin: role === "admin",
    isStaff: role === "admin" || role === "staff",
    loading,
  };
}
