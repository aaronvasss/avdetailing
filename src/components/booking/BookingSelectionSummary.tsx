interface BookingSelectionSummaryProps {
  service: string;
  vehicle: string;
  packageName: string;
  extras: string[];
  extrasApplicable: boolean;
  total: number | null;
  quoteOnly: boolean;
}

export function BookingSelectionSummary({ service, vehicle, packageName, extras, extrasApplicable, total, quoteOnly }: BookingSelectionSummaryProps) {
  return (
    <section aria-label="Current booking summary" className="mb-6 border-y border-border py-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="font-semibold">Your booking</span>
        <p aria-live="polite" aria-atomic="true" className="font-semibold">
          <span className="text-muted-foreground font-normal">Running total: </span>
          <span className="text-primary tabular-nums">{quoteOnly ? "By quote" : total === null ? "Select vehicle / package" : `$${total.toFixed(2)}`}</span>
        </p>
      </div>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 min-w-0">
        {[['Service', service], ['Vehicle type', vehicle || 'Not selected'], ['Package', packageName || 'Not selected'], ['Extras', extrasApplicable ? extras.join(', ') || 'None — optional' : 'Not applicable']].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="break-words leading-snug">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}