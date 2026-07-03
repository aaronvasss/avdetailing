import { useAuth } from "./useAuth";

export function useAdminCheck() {
  const { isAdmin, loading, user } = useAuth();
  return { isAdmin, isLoading: loading, user };
}
