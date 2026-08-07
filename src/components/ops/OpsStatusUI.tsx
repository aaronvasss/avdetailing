import { OPS_STATUS_LABELS, OPS_STATUS_ORDER, OpsGate, OpsStatus } from "@/lib/ops-workflow";
import { Check, CircleDot, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export function OpsStatusBadge({ status }: { status: OpsStatus }) {
  const tone =
    status === "rework_required"
      ? "bg-destructive/10 text-destructive border-destructive/30"
      : status === "approved" || status === "delivered"
        ? "bg-primary/10 text-primary border-primary/30"
        : status === "submitted_for_qc"
          ? "bg-secondary text-secondary-foreground border-border"
          : "bg-muted text-muted-foreground border-border";
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", tone)}>
      {OPS_STATUS_LABELS[status]}
    </span>
  );
}

export function OpsProgressBar({ status }: { status: OpsStatus }) {
  const rework = status === "rework_required";
  const index = rework
    ? OPS_STATUS_ORDER.indexOf("submitted_for_qc")
    : OPS_STATUS_ORDER.indexOf(status);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {OPS_STATUS_ORDER.map((step, i) => (
          <div
            key={step}
            className={cn(
              "h-2 flex-1 rounded-full",
              i <= index ? (rework ? "bg-destructive" : "bg-primary") : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-sm font-medium">
        {rework ? "Rework required — fix and resubmit" : OPS_STATUS_LABELS[status]}
      </p>
    </div>
  );
}

export function OpsGateList({ gates }: { gates: OpsGate[] }) {
  return (
    <ul className="space-y-2">
      {gates.map((gate) => (
        <li key={gate.key} className="flex items-center gap-3 text-sm">
          {gate.done ? (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Check className="h-4 w-4" />
            </span>
          ) : (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <CircleDot className="h-4 w-4" />
            </span>
          )}
          <span className={cn(gate.done ? "text-muted-foreground" : "font-medium")}>{gate.label}</span>
        </li>
      ))}
    </ul>
  );
}

export function OpsReworkBanner({ notes }: { notes: string | null }) {
  if (!notes) return null;
  return (
    <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-4">
      <p className="flex items-center gap-2 font-semibold text-destructive">
        <AlertTriangle className="h-4 w-4" />
        QC returned this job
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{notes}</p>
    </div>
  );
}
