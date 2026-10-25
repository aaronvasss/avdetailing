/** Step IDs follow the existing booking flow; skipped screens never count as remaining. */
export function bookingProgress(service: string, step: number) {
  const screens: ReadonlyArray<readonly [number, string]> = service === "ceramic"
    ? [[1, "Service"], [2, "Tier & Pricing"], [5, "Schedule"], [7, "Details"]] as const
    : service === "aircraft"
      ? [[1, "Service"], [2, "Quote Request"]] as const
      : service === "boat"
        ? [[1, "Service"], [3, "Package"], [5, "Schedule"], [7, "Details"]] as const
        : service === "rv"
          ? [[1, "Service"], [3, "Package"], [4, "Extras"], [5, "Schedule"], [6, "Payment"], [7, "Details"]] as const
          : [[1, "Service"], [2, "Vehicle"], [3, "Package"], [4, "Extras"], [5, "Schedule"], [6, "Payment"], [7, "Details"]] as const;
  const index = Math.max(0, screens.findIndex(([id]) => id === step));
  return { current: index + 1, total: screens.length, remaining: screens.length - index - 1, label: screens[index][1] };
}