import { cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppointmentDocuments } from "@/components/account/AppointmentDocuments";
import { AppointmentPhotos } from "@/components/account/AppointmentPhotos";

const { reads, signed, responses } = vi.hoisted(() => ({
  reads: [] as { table: string; bookingId: string }[],
  signed: vi.fn(),
  responses: new Map<string, { data: unknown[]; error: unknown }>(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: (table: string) => {
    let bookingId = "";
    const query = {
      select: () => query,
      eq: (_field: string, id: string) => { bookingId = id; return query; },
      in: () => query,
      order: () => { reads.push({ table, bookingId }); return Promise.resolve(responses.get(table) ?? { data: [], error: null }); },
    };
    return query;
  },
  storage: { from: () => ({ createSignedUrl: signed }) },
} }));

afterEach(() => { cleanup(); reads.length = 0; responses.clear(); signed.mockReset(); });

describe("customer appointment records", () => {
  it("reads only published notes and payments for the selected appointment", async () => {
    render(<AppointmentDocuments bookingId="completed-booking" />);
    await waitFor(() => expect(reads).toEqual([
      { table: "customer_service_notes", bookingId: "completed-booking" },
      { table: "payment_records", bookingId: "completed-booking" },
    ]));
    expect(reads.some(read => read.table === "booking_internal_notes")).toBe(false);
  });
  it("keeps published notes available when receipt retrieval fails", async () => {
    responses.set("customer_service_notes", { data: [{ id: "note", note: "Applied ceramic aftercare", created_at: "2026-10-22T00:00:00Z" }], error: null });
    responses.set("payment_records", { data: [], error: new Error("Unavailable") });
    const result = render(<AppointmentDocuments bookingId="completed-booking" />);
    await waitFor(() => expect(result.container.textContent).toContain("Applied ceramic aftercare"));
    expect(reads.every(read => read.bookingId === "completed-booking")).toBe(true);
  });
  it("requests private signed URLs only for the selected appointment photos", async () => {
    responses.set("booking_photos", { data: [{ id: "before", photo_type: "before", caption: null, storage_path: "completed-booking/before.jpg" }, { id: "after", photo_type: "after", caption: null, storage_path: "completed-booking/after.jpg" }], error: null });
    signed.mockResolvedValue({ data: { signedUrl: "https://example.test/private-photo" }, error: null });
    render(<AppointmentPhotos bookingId="completed-booking" />);
    await waitFor(() => expect(signed).toHaveBeenCalledTimes(2));
    expect(signed).toHaveBeenCalledWith("completed-booking/before.jpg", 3600);
    expect(signed).toHaveBeenCalledWith("completed-booking/after.jpg", 3600);
    expect(reads).toEqual([{ table: "booking_photos", bookingId: "completed-booking" }]);
  });
});