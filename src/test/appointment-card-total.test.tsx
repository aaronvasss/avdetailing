import { render, screen, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { AppointmentCard } from "@/components/account/AppointmentCard";
const base: any = { id: "b1", status: "confirmed", scheduled_date: "2030-01-10", scheduled_time: "09:00:00", services: { name: "Car Detailing" }, booking_add_ons: [], deposit_amount: 0, subtotal: 145.18, add_ons_total: 0 };
afterEach(cleanup);
describe("appointment card total", () => {
  for (const method of ["online", "in_person"]) for (const ps of ["paid", "unpaid"]) {
    it(`${method}/${ps} shows saved $145.18 only`, () => {
      render(<MemoryRouter><AppointmentCard booking={{ ...base, total_price: 145.18, payment_method: method, payment_status: ps }} onViewDetails={() => {}} onReschedule={() => {}} onCancel={() => {}} /></MemoryRouter>);
      expect(screen.getAllByText(/145\.18/).length).toBeGreaterThan(0);
      expect(screen.queryByText(/150\.26/)).toBeNull();
    });
  }
});
