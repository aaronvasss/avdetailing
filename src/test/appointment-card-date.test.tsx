import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppointmentCard } from "@/components/account/AppointmentCard";
import { CancelBookingDialog } from "@/components/account/CancelBookingDialog";

vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));

const booking: any = { id: "b1", scheduled_date: "2026-10-28", scheduled_time: "09:00", status: "confirmed",
  payment_status: "unpaid", total_price: 145.18, deposit_amount: 0, payment_method: "in_person",
  services: { name: "Car Detailing" }, booking_add_ons: [], service_city: "Baton Rouge" };

describe("client-space dates", () => {
  it("card shows Oct 28 for a booking stored as 2026-10-28", () => {
    render(<AppointmentCard booking={booking} onViewDetails={() => {}} onReschedule={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("Wed, Oct 28, 2026")).toBeInTheDocument();
  });
  it("compact card shows day 28", () => {
    render(<AppointmentCard compact booking={booking} onViewDetails={() => {}} onReschedule={() => {}} onCancel={() => {}} />);
    expect(screen.getByText("28")).toBeInTheDocument();
  });
  it("cancellation dialog shows October 28", () => {
    render(<CancelBookingDialog booking={booking} open onOpenChange={() => {}} onSuccess={() => {}} />);
    expect(screen.getByText(/October 28, 2026/)).toBeInTheDocument();
  });
});
