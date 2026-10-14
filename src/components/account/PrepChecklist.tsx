import { ShieldAlert } from "lucide-react";

const ITEMS = [
  "Remove valuables and personal belongings before we arrive.",
  "Closed areas like the center console and glove box are not opened or cleaned unless emptied and specifically requested.",
  "Remove or secure any firearms, weapons, needles, sharp objects and hazardous materials. We may pause service if any are found.",
  "We recommend uploading pre-service photos and telling us about any existing damage or hazardous conditions.",
];

export function PrepChecklist() {
  return (
    <div className="rounded-xl border border-primary/40 bg-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShieldAlert className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Before your appointment</h2>
      </div>
      <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
        {ITEMS.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
    </div>
  );
}
