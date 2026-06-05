/**
 * Translate raw booking/checkout errors into short, friendly, actionable
 * messages customers can act on. Always falls back to a helpful default
 * that nudges the user to call/text instead of getting stuck.
 */

export const SUPPORT_PHONE_DISPLAY = "(225) 228-4796";
export const SUPPORT_PHONE_TEL = "+12252284796";

export interface FriendlyError {
  title: string;
  description: string;
}

const TIME_SLOT_PATTERNS = [
  /time.*(taken|unavailable|conflict|overlap|already)/i,
  /slot.*(taken|unavailable|conflict)/i,
  /double.?book/i,
  /no_availability/i,
];

const NETWORK_PATTERNS = [
  /network|fetch|failed to fetch|load failed|timeout|timed out|offline/i,
];

const AUTH_PATTERNS = [
  /jwt|unauthorized|permission denied|forbidden|not allowed|rls/i,
];

const PAYMENT_PATTERNS = [
  /stripe|checkout|payment|card|declined/i,
];

const VALIDATION_PATTERNS = [
  /invalid|required|must be|missing|validation/i,
];

const RATE_LIMIT_PATTERNS = [
  /rate.?limit|too many|429/i,
];

export function getFriendlyBookingError(err: unknown): FriendlyError {
  const raw =
    (err as any)?.message ||
    (err as any)?.error_description ||
    (err as any)?.error ||
    (typeof err === "string" ? err : "") ||
    "";
  const code = String((err as any)?.code || (err as any)?.status || "");
  const text = `${raw} ${code}`.trim();

  if (RATE_LIMIT_PATTERNS.some((re) => re.test(text))) {
    return {
      title: "Too many attempts",
      description: `Please wait a minute and try again. Still stuck? Call or text us at ${SUPPORT_PHONE_DISPLAY}.`,
    };
  }

  if (TIME_SLOT_PATTERNS.some((re) => re.test(text))) {
    return {
      title: "That time was just taken",
      description:
        "Someone grabbed this slot moments ago. Please pick another time — your info is saved.",
    };
  }

  if (NETWORK_PATTERNS.some((re) => re.test(text))) {
    return {
      title: "Connection problem",
      description: `Check your internet and tap "Book Now" again. If it keeps happening, call or text ${SUPPORT_PHONE_DISPLAY}.`,
    };
  }

  if (AUTH_PATTERNS.some((re) => re.test(text))) {
    return {
      title: "Session expired",
      description:
        "Please refresh the page and try again. If you were logged in, you may need to sign back in.",
    };
  }

  if (PAYMENT_PATTERNS.some((re) => re.test(text))) {
    return {
      title: "Payment couldn't start",
      description:
        "Online payment is temporarily unavailable. Choose \"Pay in Person\" to lock in your time, or try again in a moment.",
    };
  }

  if (VALIDATION_PATTERNS.some((re) => re.test(text))) {
    return {
      title: "Some info needs a fix",
      description:
        "Please double-check the highlighted fields (name, phone, address, vehicle) and try again.",
    };
  }

  return {
    title: "Booking didn't go through",
    description: `Something went wrong on our end. Please try again, or call/text us at ${SUPPORT_PHONE_DISPLAY} and we'll book you right away.`,
  };
}
