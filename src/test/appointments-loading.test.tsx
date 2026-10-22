import { act, cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppointmentsTab } from "@/components/account/AppointmentsTab";

const { fetchResult } = vi.hoisted(() => ({ fetchResult: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => {
    const query = {
      select: () => query, order: () => query, eq: () => query,
      gte: () => query, lte: () => query,
      then: (resolve: (value: unknown) => unknown) => fetchResult().then(resolve),
    };
    return query;
  },
} }));
vi.mock("@/components/account/AppointmentsCalendarView", () => ({ AppointmentsCalendarView: () => null }));
vi.mock("@/components/account/BookingDetailsDialog", () => ({ BookingDetailsDialog: () => null }));
vi.mock("@/components/account/RescheduleDialog", () => ({ RescheduleDialog: () => null }));
vi.mock("@/components/account/CancelBookingDialog", () => ({ CancelBookingDialog: () => null }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); fetchResult.mockReset(); });

describe("appointment loading hook order", () => {
  it.each([
    { label: "owner calendar", isAdmin: true, defaultView: "calendar" as const },
    { label: "owner appointments", isAdmin: true, defaultView: "list" as const },
    { label: "customer appointments", isAdmin: false, defaultView: "list" as const },
  ])("loads $label without changing hook order", async ({ isAdmin, defaultView }) => {
    let complete: ((value: { data: unknown[] }) => void) | undefined;
    fetchResult.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<MemoryRouter><AppointmentsTab userId="portal-user" isAdmin={isAdmin} defaultView={defaultView} /></MemoryRouter>);
    expect(fetchResult).toHaveBeenCalledTimes(1);
    await act(async () => { complete?.({ data: [] }); });
    expect(errors.mock.calls.filter(call => /hook|rendered more/i.test(String(call[0])))).toEqual([]);
  });
});