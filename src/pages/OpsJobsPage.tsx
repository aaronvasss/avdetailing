import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { useOpsJobs } from "@/hooks/useOpsJobs";
import { useAuth } from "@/hooks/useAuth";
import { OpsStatusBadge } from "@/components/ops/OpsStatusUI";
import { jobVehicleLabel, OpsStatus } from "@/lib/ops-workflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronRight, MapPin, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const ACTIVE_STATUSES: OpsStatus[] = [
  "assigned",
  "checked_in",
  "in_progress",
  "rework_required",
  "submitted_for_qc",
];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatTime(time?: string | null) {
  if (!time) return "";
  const [h, m] = time.split(":");
  const hour = Number(h);
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:${m} ${suffix}`;
}

export default function OpsJobsPage() {
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const [scope, setScope] = useState<"today" | "active" | "all">("today");
  const [mineOnly, setMineOnly] = useState(!isManager);

  const { jobs, loading } = useOpsJobs({
    mineOnly,
    statuses: scope === "all" ? undefined : ACTIVE_STATUSES,
    date: scope === "today" ? todayIso() : undefined,
  });

  const grouped = useMemo(() => {
    return {
      needsWork: jobs.filter((j) => j.status === "rework_required"),
      rest: jobs.filter((j) => j.status !== "rework_required"),
    };
  }, [jobs]);

  const renderCard = (job: (typeof jobs)[number]) => (
    <button
      key={job.id}
      onClick={() => navigate(`/worker/ops/${job.id}`)}
      className="w-full text-left"
    >
      <Card
        className={cn(
          "transition hover:border-primary/50",
          job.status === "rework_required" && "border-destructive/50",
        )}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-muted-foreground">{job.job_number}</span>
              <OpsStatusBadge status={job.status} />
            </div>
            <p className="truncate text-base font-semibold">
              {job.booking?.guest_name || "Customer"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {jobVehicleLabel(job)}
              {job.booking?.services?.name ? ` · ${job.booking.services.name}` : ""}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {job.booking?.scheduled_time && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(job.booking.scheduled_time)}
                </span>
              )}
              {job.booking?.service_city && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {job.booking.service_city}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </CardContent>
      </Card>
    </button>
  );

  return (
    <WorkerLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Job board</h1>
          <p className="text-sm text-muted-foreground">
            Work each job through check-in, service and QC.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(["today", "active", "all"] as const).map((option) => (
            <Button
              key={option}
              size="sm"
              variant={scope === option ? "default" : "outline"}
              onClick={() => setScope(option)}
            >
              {option === "today" ? "Today" : option === "active" ? "Open jobs" : "All"}
            </Button>
          ))}
          {isManager && (
            <Button
              size="sm"
              variant={mineOnly ? "default" : "outline"}
              onClick={() => setMineOnly((v) => !v)}
            >
              {mineOnly ? "My jobs" : "Whole team"}
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No jobs to show here.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {grouped.needsWork.length > 0 && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-destructive">Rework required</p>
                {grouped.needsWork.map(renderCard)}
              </div>
            )}
            {grouped.rest.map(renderCard)}
          </div>
        )}
      </div>
    </WorkerLayout>
  );
}
