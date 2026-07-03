import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export type UserRole = "admin" | "staff" | "customer" | null;

interface RoleCheckResult {
  role: UserRole;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  user: any;
}

export function useRoleCheck(): RoleCheckResult {
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadRole = async (userId: string) => {
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!mounted) return;
      if (adminRole) {
        setRole("admin");
        setIsLoading(false);
        return;
      }

      const { data: staffRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "staff")
        .maybeSingle();
      if (!mounted) return;
      setRole(staffRole ? "staff" : "customer");
      setIsLoading(false);
    };

    const applySession = (sessionUser: any | null) => {
      const newId = sessionUser?.id ?? null;
      setUser(sessionUser);
      if (newId === lastUserIdRef.current) {
        // Same user (or still signed out) — no need to re-query roles on
        // token refresh / other noisy auth events.
        if (!newId) setIsLoading(false);
        return;
      }
      lastUserIdRef.current = newId;
      if (!newId) {
        setRole(null);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      // Defer the DB call to avoid deadlocks inside the auth callback.
      setTimeout(() => {
        if (mounted) loadRole(newId);
      }, 0);
    };

    // Listener first, then initial session — avoids races.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        applySession(session?.user ?? null);
      }
    );

    // onAuthStateChange fires INITIAL_SESSION on subscribe, so no extra
    // getSession() call is needed (it would race with the role fetch).

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);


  return {
    role,
    isAdmin: role === "admin",
    isStaff: role === "admin" || role === "staff",
    isLoading,
    user,
  };
}
