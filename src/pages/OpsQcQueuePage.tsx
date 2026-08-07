import { useNavigate } from "react-router-dom";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { useOpsJobs } from "@/hooks/useOpsJobs";
import { OpsStatusBadge } from "@/components/ops/OpsStatusUI";
import { jobVehicleLabel } from "@/lib/ops-workflow";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ChevronRight } from "lucide-react";

export default function OpsQcQueuePage() {
  const navigate = useNavigate();
  const { jobs, loading } = useOpsJobs({
    statuses: ["submitted_for_qc", "rework_required", "approved"],
  });

  const waiting = jobs.filter((j) => j.status === "submitted_for_qc");
  const rework = jobs.filter((j) => j.status === "rework_required");
  const approved = jobs.filter((j) => j.status === "approved");

  const section = (title: string, rows: typeof jobs) =>
    rows.length > 0 && (
      <div className="space-y-3">
        <p className="text-sm font-semibold">{title}</p>
        {rows.map((job) => (
          <button
            key={job.id}
            className="w-full text-left"
            onClick={() => navigate(`/worker/ops/${job.id}`)}
          >
            <Card className="transition hover:border-primary/50">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{job.job_number}</span>
                    <OpsStatusBadge status={job.status} />
                  </div>
                  <p className="truncate font-semibold">{job.booking?.guest_name || "Customer"}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {jobVehicleLabel(job)}
                    {job.rework_count > 0 ? ` · ${job.rework_count} rework(s)` : ""}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
    );

  return (
    <WorkerLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Quality control</h1>
          <p className="text-sm text-muted-foreground">
            Review submitted jobs, approve them or send them back with notes.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nothing waiting for QC right now.
            </CardContent>
          </Card>
        ) : (
          <>
            {section("Waiting for QC", waiting)}
            {section("Rework in progress", rework)}
            {section("Approved — ready to deliver", approved)}
          </>
        )}
      </div>
    </WorkerLayout>
  );
}
