import { useAuth } from "./useAuth";

export type UserRole = "admin" | "manager" | "staff" | "marketing" | "customer" | null;

interface RoleCheckResult {
  role: UserRole;
  isAdmin: boolean;
  isStaff: boolean;
  isManager: boolean;
  isMarketing: boolean;
  isLoading: boolean;
  user: any;
}

export function useRoleCheck(): RoleCheckResult {
  const { role, isAdmin, isStaff, isManager, isMarketing, loading, user } = useAuth();

  return {
    role,
    isAdmin,
    isStaff,
    isManager,
    isMarketing,
    isLoading: loading,
    user,
  };
}
