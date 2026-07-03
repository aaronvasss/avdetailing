import { useAuth } from "./useAuth";

export type UserRole = "admin" | "staff" | "customer" | null;

interface RoleCheckResult {
  role: UserRole;
  isAdmin: boolean;
  isStaff: boolean;
  isLoading: boolean;
  user: any;
}

export function useRoleCheck(): RoleCheckResult {
  const { role, isAdmin, isStaff, loading, user } = useAuth();

  return {
    role,
    isAdmin,
    isStaff,
    isLoading: loading,
    user,
  };
}
