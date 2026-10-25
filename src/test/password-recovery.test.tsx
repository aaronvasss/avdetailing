import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, cleanup } from "@testing-library/react";
import { ForgotPasswordForm } from "@/components/account/ForgotPasswordForm";
import { recoveryCredentials, recoveryDestination, recoveryUrl, replacementPasswordSchema } from "@/lib/password-recovery";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { resetPasswordForEmail: mocks.request } } }));
beforeEach(() => { cleanup(); mocks.request.mockReset(); });
describe("recovery policy", () => {
  it("uses the production reset page and preserves the account destination", () => {
    expect(recoveryUrl("https://avdetailing.net", "/account?tab=vehicles")).toBe("https://avdetailing.net/reset-password?redirect=%2Faccount%3Ftab%3Dvehicles");
  });
  it.each(["//evil.example", "/\\evil.example", "https://evil.example", "/admin", "/auth"])("does not redirect recovery to %s", value => expect(recoveryDestination(value)).toBe("/account"));
  it("requires a recovery token rather than a normal sign-in hash", () => {
    expect(recoveryCredentials("#type=signup&access_token=mock&refresh_token=mock")).toBeNull();
    expect(recoveryCredentials("#type=recovery&access_token=mock&refresh_token=mock")).toEqual({ accessToken: "mock" });
    expect(recoveryCredentials("#type=recovery&error_code=otp_expired")).toBeNull();
  });
  it("refuses mismatched replacement passwords", () => expect(replacementPasswordSchema.safeParse({ password: "mockpass", confirmation: "different" }).success).toBe(false));
  it("accepts matching replacement passwords", () => expect(replacementPasswordSchema.safeParse({ password: "mockpass", confirmation: "mockpass" }).success).toBe(true));
});
describe("intercepted recovery requests", () => {
  const request = () => {
    render(<ForgotPasswordForm destination="/account?tab=vehicles" onBack={() => {}} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "mock@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
  };
  it.each([{ error: null }, { error: { status: 400, message: "Account not found" } }])("gives the same neutral response without account disclosure: %j", async response => {
    mocks.request.mockResolvedValue(response); request();
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("If an account uses that email"));
    expect(mocks.request).toHaveBeenCalledWith("mock@example.test", { redirectTo: recoveryUrl(window.location.origin, "/account?tab=vehicles") });
  });
  it("makes a failed request retryable without provider details", async () => {
    mocks.request.mockRejectedValue(new Error("network")); request();
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("Unable to request"));
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeEnabled();
  });
  it("blocks double submission while email request is pending", async () => {
    mocks.request.mockReturnValue(new Promise(() => {})); request();
    fireEvent.submit(screen.getByLabelText("Email").closest("form") as HTMLFormElement);
    expect(mocks.request).toHaveBeenCalledTimes(1);
  });
});