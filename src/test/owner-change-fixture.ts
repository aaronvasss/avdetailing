import { vi } from "vitest";

export function ownerChangeFixture(options: { failSave?: boolean; blocked?: boolean; userId?: string | null; emailLink?: boolean; guest?: string | null } = {}) {
  const state = { id: "00000000-0000-4000-8000-000000000201", user_id: "customer", scheduled_date: "2026-10-28", scheduled_time: "09:00:00",
    status: "confirmed", updated_at: "rev0", manage_token: "a".repeat(64), guest_name: options.guest === undefined ? "Mock Customer" : options.guest,
    services: { name: "Car Detailing" }, duration_minutes: 135, vehicle_year: 2022, vehicle_make: "Toyota", vehicle_model: "Camry", vehicle_type: "car",
    deposit_amount: 100, total_price: 145.18, payment_status: "deposit_paid", customer_notes: "Keep this original note" };
  const queued: any[] = []; let saves = 0;
  const db = {
    rpc: vi.fn(async (name: string, args: any) => {
      if (name === "get_booking_capacity") return { data: 2, error: null };
      if (name !== "commit_owner_appointment_change") throw new Error("Unexpected RPC");
      if (options.failSave) return { data: null, error: new Error("Mock save failure") };
      if (args._expected_updated_at !== state.updated_at || args._expected_status !== state.status
        || args._expected_date !== state.scheduled_date || args._expected_time !== state.scheduled_time
        || (args._manage_token ? args._manage_token !== state.manage_token : args._user_id !== state.user_id)) return { data: { changed: false }, error: null };
      if (args._kind === "reschedule") Object.assign(state, { scheduled_date: args._new_date, scheduled_time: args._new_time, status: "pending" });
      else Object.assign(state, { status: "cancelled", customer_notes: args._notes });
      state.updated_at = `rev${++saves}`; queued.push(args);
      return { data: { changed: true, eventId: "mock-event" }, error: null };
    }),
    from(table: string) {
      const chain: any = { select: () => chain, eq: () => chain, neq: () => chain, in: () => chain, limit: () => chain,
        maybeSingle: async () => ({ data: table === "profiles" ? { full_name: "Profile Customer" } : { ...state }, error: null }),
        then: (resolve: any) => Promise.resolve({ data: table === "blocked_dates" && options.blocked ? [{ id: "blocked" }] : [], error: null }).then(resolve),
      }; return chain;
    },
  };
  return { state, queued, db, get saves() { return saves; }, dependencies: {
    db, cors: {}, now: () => new Date("2026-10-25T21:43:00Z"), parse: (body: unknown) => body as any,
    authenticate: async () => options.emailLink ? null : options.userId === undefined ? "customer" : options.userId,
    verifyLink: async (id: string, token: string) => id === state.id && token === state.manage_token,
  } };
}