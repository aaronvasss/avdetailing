import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const mocks = vi.hoisted(() => ({ auth: { user: null as null | { id: string }, role: "customer", roles: ["customer"], loading: false } }));
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => mocks.auth }));
const appointment = "/admin?booking=11111111-1111-4111-8111-111111111111";
function Location() { const location = useLocation(); return <output data-testid="location">{location.pathname + location.search}</output>; }
function renderGuard() {
  render(<MemoryRouter initialEntries={[appointment]}><Routes>
    <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><div>Fictional appointment</div></ProtectedRoute>} />
    <Route path="/auth" element={<Location />} />
    <Route path="/unauthorized" element={<div>Denied</div>} />
  </Routes></MemoryRouter>);
}
beforeEach(() => { cleanup(); mocks.auth = { user: null, role: "customer", roles: ["customer"], loading: false }; });
describe("owner appointment authorization", () => {
  it("preserves the booking through signed-out login without rendering private content", async () => {
    renderGuard();
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/auth?redirect="));
    expect(new URL(screen.getByTestId("location").textContent || "", "https://avdetailing.net").searchParams.get("redirect")).toBe(appointment);
    expect(screen.queryByText("Fictional appointment")).not.toBeInTheDocument();
  });
  it("renders only after authenticated admin authorization", () => {
    mocks.auth = { user: { id: "mock-owner" }, role: "admin", roles: ["admin"], loading: false };
    renderGuard(); expect(screen.getByText("Fictional appointment")).toBeInTheDocument();
  });
  it.each(["customer", "staff"])("denies a signed-in %s without exposing the appointment", async role => {
    mocks.auth = { user: { id: "mock-user" }, role, roles: [role], loading: false };
    renderGuard(); await waitFor(() => expect(screen.getByText("Denied")).toBeInTheDocument());
    expect(screen.queryByText("Fictional appointment")).not.toBeInTheDocument();
  });
});