import { useState, useEffect } from "react";
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

  useEffect(() => {
    const checkRole = async () => {
      setIsLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      // Check for admin role first
      const { data: adminRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (adminRole) {
        setRole("admin");
        setIsLoading(false);
        return;
      }

      // Check for staff role
      const { data: staffRole } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "staff")
        .maybeSingle();

      if (staffRole) {
        setRole("staff");
        setIsLoading(false);
        return;
      }

      // Default to customer
      setRole("customer");
      setIsLoading(false);
    };

    checkRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { 
    role, 
    isAdmin: role === "admin", 
    isStaff: role === "admin" || role === "staff",
    isLoading, 
    user 
  };
}
