import { useSyncExternalStore } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

export type AppRole = "admin" | "manager" | "staff" | "marketing" | "customer" | null;

interface AuthState {
  user: User | null;
  session: Session | null;
  role: AppRole;
  roles: Exclude<AppRole, null>[];
  isAdmin: boolean;
  isStaff: boolean;
  isManager: boolean;
  isMarketing: boolean;
  loading: boolean;
}

const listeners = new Set<() => void>();

let authState: AuthState = {
  user: null,
  session: null,
  role: null,
  roles: [],
  isAdmin: false,
  isStaff: false,
  isManager: false,
  isMarketing: false,
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
  const roles = next.roles !== undefined ? next.roles : authState.roles;
  const has = (r: Exclude<AppRole, null>) => role === r || roles.includes(r);
  authState = {
    ...authState,
    ...next,
    role,
    roles,
    isAdmin: has("admin"),
    isStaff: has("admin") || has("manager") || has("staff"),
    isManager: has("admin") || has("manager"),
    isMarketing: has("admin") || has("marketing"),
  };
  emit();
}

type RoleSnapshot = { role: AppRole; roles: Exclude<AppRole, null>[] };

const ROLE_PRECEDENCE: Exclude<AppRole, null>[] = [
  "admin",
  "manager",
  "staff",
  "marketing",
  "customer",
];

async function fetchRole(userId: string): Promise<RoleSnapshot> {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) return { role: "customer", roles: ["customer"] };

  const roles = ROLE_PRECEDENCE.filter((r) =>
    (data ?? []).some((row) => row.role === r),
  );
  const primary = roles[0] ?? "customer";
  return { role: primary, roles: roles.length ? roles : ["customer"] };
}


function applySession(currentSession: Session | null) {
  if (!currentSession) {
    lastUserId = null;
    roleRequestId += 1;
    setAuthState({
      user: null,
      session: null,
      role: null,
      roles: [],
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
    roles: [],
    loading: true,
  });


  setTimeout(async () => {
    const snapshot = await fetchRole(currentUserId);
    if (requestId !== roleRequestId || currentUserId !== lastUserId) return;
    setAuthState({ role: snapshot.role, roles: snapshot.roles, loading: false });
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
  listeners.add(listener);
  ensureAuthSubscription();
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
