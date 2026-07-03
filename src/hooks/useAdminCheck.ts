import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminCheck() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const lastUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAdmin = async (userId: string) => {
      const { data: roles, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!mounted) return;
      setIsAdmin(!!roles && !error);
      setIsLoading(false);
    };

    const applySession = (sessionUser: any | null) => {
      const newId = sessionUser?.id ?? null;
      setUser(sessionUser);
      if (newId === lastUserIdRef.current) {
        if (!newId) setIsLoading(false);
        return;
      }
      lastUserIdRef.current = newId;
      if (!newId) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        if (mounted) loadAdmin(newId);
      }, 0);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;
        applySession(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      applySession(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { isAdmin, isLoading, user };
}
