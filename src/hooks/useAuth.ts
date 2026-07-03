import { useSyncExternalStore } from "react";
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

const listeners = new Set<() => void>();

let authState: AuthState = {
  user: null,
  session: null,
  role: null,
  isAdmin: false,
  isStaff: false,
  loading: true,
};

let initialized = false;
let lastUserId: string | null = null;
let roleRequestId = 0;
let authSubscription: { unsubscribe: () => void } | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setAuthState(next: Partial<AuthState>) {
  const role = next.role !== undefined ? next.role : authState.role;
  authState = {
    ...authState,
    ...next,
    role,
    isAdmin: role === "admin",
    isStaff: role === "admin" || role === "staff",
  };
  emit();
}

async function fetchRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) return "customer";

  const roles = new Set((data ?? []).map((row) => row.role));
  if (roles.has("admin")) return "admin";
  if (roles.has("staff")) return "staff";
  return "customer";
}

function applySession(currentSession: Session | null) {
  if (!currentSession) {
    lastUserId = null;
    roleRequestId += 1;
    setAuthState({
      user: null,
      session: null,
      role: null,
      loading: false,
    });
    return;
  }

  const currentUserId = currentSession.user.id;

  if (currentUserId === lastUserId) {
    setAuthState({
      user: currentSession.user,
      session: currentSession,
      loading: authState.role ? false : authState.loading,
    });
    return;
  }

  lastUserId = currentUserId;
  const requestId = roleRequestId + 1;
  roleRequestId = requestId;

  setAuthState({
    user: currentSession.user,
    session: currentSession,
    role: null,
    loading: true,
  });

  setTimeout(async () => {
    const role = await fetchRole(currentUserId);
    if (requestId !== roleRequestId || currentUserId !== lastUserId) return;
    setAuthState({ role, loading: false });
  }, 0);
}

function ensureAuthSubscription() {
  if (initialized) return;
  initialized = true;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, currentSession) => {
    applySession(currentSession);
  });

  authSubscription = subscription;
}

function subscribe(listener: () => void) {
  ensureAuthSubscription();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      authSubscription?.unsubscribe();
      authSubscription = null;
      initialized = false;
      authState = { ...authState, loading: true };
    }
  };
}

function getSnapshot() {
  return authState;
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
