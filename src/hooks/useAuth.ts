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
let refreshingSession = false;

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

async function refreshSessionSnapshot() {
  if (refreshingSession) return;
  refreshingSession = true;
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    applySession(session);
  } finally {
    refreshingSession = false;
  }
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

  // In the Lovable preview iframe, session storage can hydrate just before or
  // just after React mounts. The auth event is still primary, but this snapshot
  // keeps the rendered login state in sync if that initial event is missed.
  void refreshSessionSnapshot();

  if (typeof window !== "undefined") {
    window.addEventListener("focus", refreshSessionSnapshot);
    window.addEventListener("pageshow", refreshSessionSnapshot);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void refreshSessionSnapshot();
    });
  }
}

function subscribe(listener: () => void) {
  ensureAuthSubscription();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return authState;
}

export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
