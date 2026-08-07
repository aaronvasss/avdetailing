import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: AppRole | AppRole[];
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, role, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    const redirect = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirect)}`} replace />;
  }

  if (requiredRole) {
    const required = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const held = new Set<string>([...(roles ?? []), ...(role ? [role] : [])]);
    const allowed = required.some((r) => r && held.has(r));

    // Admin has access to everything
    if (!allowed && !held.has("admin")) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <>{children}</>;
}

