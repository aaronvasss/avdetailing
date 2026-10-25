import { describe, expect, it } from "vitest";
import { safeAuthReturn, signInReturnUrl } from "@/lib/auth-return";

describe("protected sign-in returns", () => {
  const destination = "/admin?booking=11111111-1111-4111-8111-111111111111";
  it("preserves the exact owner appointment destination through an encoded login URL", () => {
    const url = new URL(signInReturnUrl(destination), "https://avdetailing.net");
    expect(url.pathname).toBe("/auth");
    expect(safeAuthReturn(url.searchParams.get("redirect"))).toBe(destination);
  });
  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "/%5cevil.example", "/%2f%2fevil.example", "/admin\n", "/auth", "/reset-password", "/%61uth", "/%ZZ"])("rejects unsafe or looping return %s", value => {
    expect(safeAuthReturn(value)).toBeNull();
    expect(new URL(signInReturnUrl(value), "https://avdetailing.net").searchParams.get("redirect")).toBe("/account");
  });
  it.each(["/account?tab=vehicles", "/worker/jobs", "/manage-appointment?booking=mock&token=mock&action=cancel", "/book?service=car&package=gold"])("preserves existing internal destination %s", value => {
    expect(safeAuthReturn(value)).toBe(value);
  });
});