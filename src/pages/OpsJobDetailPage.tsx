import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { useOpsJob } from "@/hooks/useOpsJob";
import { useAuth } from "@/hooks/useAuth";
import { OpsMediaCapture } from "@/components/ops/OpsMediaCapture";
import { SignaturePad } from "@/components/ops/SignaturePad";
import { OpsGateList, OpsProgressBar, OpsReworkBanner, OpsStatusBadge } from "@/components/ops/OpsStatusUI";
import {
  DAMAGE_TYPES,
  REQUIRED_AFTER_CATEGORIES,
  REQUIRED_BEFORE_CATEGORIES,
  checkInComplete,
  jobVehicleLabel,
  submitGates,
} from "@/lib/ops-workflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Phone, MapPin, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { JobSopPanel } from "@/components/ops/JobSopPanel";

export default function OpsJobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { isManager } = useAuth();
  const ops = useOpsJob(jobId);
  const { job, booking, checklist, damage, media } = ops;

  const [checkIn, setCheckIn] = useState({
    vehicle_year: "",
    vehicle_make: "",
    vehicle_model: "",
    vehicle_color: "",
    license_plate: "",
    odometer: "",
    fuel_level: "",
    customer_concerns: "",
  });
  const [notes, setNotes] = useState("");
  const [newItem, setNewItem] = useState("");
  const [damageForm, setDamageForm] = useState({ damage_type: "", location_note: "", note: "" });
  const [qcNotes, setQcNotes] = useState("");

  useEffect(() => {
    if (!job) return;
    setCheckIn({
      vehicle_year: job.vehicle_year ? String(job.vehicle_year) : "",
      vehicle_make: job.vehicle_make ?? "",
      vehicle_model: job.vehicle_model ?? "",
      vehicle_color: job.vehicle_color ?? "",
      license_plate: job.license_plate ?? "",
      odometer: job.odometer ?? "",
      fuel_level: job.fuel_level ?? "",
      customer_concerns: job.customer_concerns ?? "",
    });
    setNotes(job.technician_notes ?? "");
    setQcNotes(job.qc_notes ?? "");
  }, [job?.id, job?.updated_at]);

  useEffect(() => {
    if (job && checklist.length === 0) void ops.ensureChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job?.id, checklist.length]);

  const gates = useMemo(
    () => (job ? submitGates({ job, checklist, damage, media }) : []),
    [job, checklist, damage, media],
  );
  const canSubmit = gates.length > 0 && gates.every((g) => g.done);

  if (ops.loading) {
    return (
      <WorkerLayout>
        <div className="flex justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </WorkerLayout>
    );
  }

  if (!job) {
    return (
      <WorkerLayout>
        <Card>
          <CardContent className="space-y-4 py-12 text-center">
            <p className="text-muted-foreground">This job could not be found.</p>
            <Button onClick={() => navigate("/worker/ops")}>Back to job board</Button>
          </CardContent>
        </Card>
      </WorkerLayout>
    );
  }

  const locked = job.status === "approved" || job.status === "delivered";
  const readOnly = locked || job.status === "submitted_for_qc";

  const saveCheckIn = async () => {
    const year = Number(checkIn.vehicle_year);
    if (!year || year < 1900 || year > 2100) {
      toast.error("Enter a valid 4-digit vehicle year");
      return;
    }
    if (!checkIn.vehicle_make.trim() || !checkIn.vehicle_model.trim()) {
      toast.error("Vehicle make and model are required");
      return;
    }
    if (!checkIn.vehicle_color.trim() || !checkIn.license_plate.trim()) {
      toast.error("Vehicle color and license plate are required");
      return;
    }
    const ok = await ops.updateJob({
      vehicle_year: year,
      vehicle_make: checkIn.vehicle_make.trim(),
      vehicle_model: checkIn.vehicle_model.trim(),
      vehicle_color: checkIn.vehicle_color.trim(),
      license_plate: checkIn.license_plate.trim().toUpperCase(),
      odometer: checkIn.odometer.trim() || null,
      fuel_level: checkIn.fuel_level.trim() || null,
      customer_concerns: checkIn.customer_concerns.trim() || null,
      checked_in_at: job.checked_in_at ?? new Date().toISOString(),
      status: job.status === "assigned" ? "checked_in" : job.status,
    });
    if (ok) toast.success("Check-in saved");
  };

  const startWork = async () => {
    if (!checkInComplete(job)) {
      toast.error("Finish vehicle check-in first");
      return;
    }
    const ok = await ops.setStatus("in_progress");
    if (ok) toast.success("Job started");
  };

  const addDamage = async () => {
    if (!damageForm.damage_type) {
      toast.error("Pick a damage type");
      return;
    }
    const ok = await ops.addDamage(damageForm);
    if (ok) {
      setDamageForm({ damage_type: "", location_note: "", note: "" });
      toast.success("Damage recorded");
    }
  };

  const submitForQc = async () => {
    if (!canSubmit) {
      toast.error("Complete every required step before submitting");
      return;
    }
    const ok = await ops.updateJob({
      status: "submitted_for_qc",
      technician_notes: notes.trim() || null,
      technician_completed_at: new Date().toISOString(),
    });
    if (ok) toast.success("Sent to quality control");
  };

  const qcApprove = async () => {
    const ok = await ops.updateJob({
      status: "approved",
      qc_notes: qcNotes.trim() || null,
      qc_approved_at: new Date().toISOString(),
    });
    if (ok) toast.success("Job approved");
  };

  const qcReject = async () => {
    if (!qcNotes.trim()) {
      toast.error("Add notes so the technician knows what to fix");
      return;
    }
    const ok = await ops.updateJob({
      status: "rework_required",
      rework_notes: qcNotes.trim(),
      qc_notes: qcNotes.trim(),
      rework_count: (job.rework_count ?? 0) + 1,
    });
    if (ok) toast.success("Returned to technician");
  };

  const markDelivered = async () => {
    const ok = await ops.updateJob({
      status: "delivered",
      delivered_at: new Date().toISOString(),
    });
    if (ok) toast.success("Marked delivered");
  };

  const address = [booking?.service_address, booking?.service_city, booking?.service_state]
    .filter(Boolean)
    .join(", ");

  return (
    <WorkerLayout>
      <div className="space-y-4">
        <Button variant="ghost" size="sm" className="-ml-2" onClick={() => navigate("/worker/ops")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Job board
        </Button>

        <Card>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground">{job.job_number}</span>
              <OpsStatusBadge status={job.status} />
            </div>
            <h1 className="text-xl font-bold">{booking?.guest_name || "Customer"}</h1>
            <p className="text-sm text-muted-foreground">
              {jobVehicleLabel(job)}
              {booking?.services?.name ? ` · ${booking.services.name}` : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {booking?.guest_phone && (
                <Button asChild variant="outline" size="sm">
                  <a href={`tel:${booking.guest_phone}`}>
                    <Phone className="mr-2 h-4 w-4" />
                    Call
                  </a>
                </Button>
              )}
              {address && (
                <Button asChild variant="outline" size="sm">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    Directions
                  </a>
                </Button>
              )}
            </div>
            <OpsProgressBar status={job.status} />
          </CardContent>
        </Card>

        <OpsReworkBanner notes={job.status === "rework_required" ? job.rework_notes : null} />

        {booking?.customer_notes && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Customer concerns</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm text-muted-foreground">
              {booking.customer_notes}
            </CardContent>
          </Card>
        )}

        <JobSopPanel
          jobId={job.id}
          bookingId={job.booking_id}
          existingChecklist={checklist.map((i) => i.item_text)}
          onChecklistAdded={ops.reload ?? (() => {})}
          canEditChecklist={job.status !== "delivered" && job.status !== "approved"}
        />

        <Accordion type="multiple" defaultValue={["checkin"]} className="space-y-3">
          {/* 1. Vehicle check-in */}
          <AccordionItem value="checkin" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="text-base font-semibold">
              1. Vehicle check-in
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    inputMode="numeric"
                    className="h-12"
                    value={checkIn.vehicle_year}
                    disabled={readOnly}
                    onChange={(e) => setCheckIn({ ...checkIn, vehicle_year: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    className="h-12"
                    value={checkIn.vehicle_color}
                    disabled={readOnly}
                    onChange={(e) => setCheckIn({ ...checkIn, vehicle_color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    className="h-12"
                    value={checkIn.vehicle_make}
                    disabled={readOnly}
                    onChange={(e) => setCheckIn({ ...checkIn, vehicle_make: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    className="h-12"
                    value={checkIn.vehicle_model}
                    disabled={readOnly}
                    onChange={(e) => setCheckIn({ ...checkIn, vehicle_model: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="plate">License plate</Label>
                  <Input
                    id="plate"
                    className="h-12 uppercase"
                    value={checkIn.license_plate}
                    disabled={readOnly}
                    onChange={(e) => setCheckIn({ ...checkIn, license_plate: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="odometer">Odometer</Label>
                  <Input
                    id="odometer"
                    inputMode="numeric"
                    className="h-12"
                    value={checkIn.odometer}
                    disabled={readOnly}
                    onChange={(e) => setCheckIn({ ...checkIn, odometer: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="concerns">Customer concerns noted at check-in</Label>
                <Textarea
                  id="concerns"
                  rows={3}
                  value={checkIn.customer_concerns}
                  disabled={readOnly}
                  onChange={(e) => setCheckIn({ ...checkIn, customer_concerns: e.target.value })}
                />
              </div>
              {!readOnly && (
                <Button size="lg" className="w-full" onClick={saveCheckIn} disabled={ops.saving}>
                  Save check-in
                </Button>
              )}
            </AccordionContent>
          </AccordionItem>

          {/* 2. Before media */}
          <AccordionItem value="before" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="text-base font-semibold">2. Before photos</AccordionTrigger>
            <AccordionContent className="pb-4">
              <OpsMediaCapture
                jobId={job.id}
                phase="before"
                categories={REQUIRED_BEFORE_CATEGORIES}
                media={media}
                onChange={ops.reload}
                readOnly={readOnly}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 3. Existing damage */}
          <AccordionItem value="damage" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="text-base font-semibold">3. Existing damage</AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {damage.length > 0 ? (
                <ul className="space-y-2">
                  {damage.map((d) => (
                    <li
                      key={d.id}
                      className="flex items-start justify-between gap-3 rounded-lg border p-3 text-sm"
                    >
                      <div>
                        <p className="font-medium">{d.damage_type}</p>
                        {d.location_note && (
                          <p className="text-muted-foreground">{d.location_note}</p>
                        )}
                        {d.note && <p className="text-muted-foreground">{d.note}</p>}
                      </div>
                      {!readOnly && (
                        <button
                          type="button"
                          aria-label="Remove damage entry"
                          onClick={() => ops.removeDamage(d.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <Checkbox
                    id="no-damage"
                    checked={job.no_prior_damage}
                    disabled={readOnly}
                    onCheckedChange={(checked) =>
                      ops.updateJob({ no_prior_damage: Boolean(checked) })
                    }
                  />
                  <Label htmlFor="no-damage" className="text-sm font-medium">
                    No pre-existing damage found
                  </Label>
                </div>
              )}

              {!readOnly && (
                <div className="space-y-3 rounded-lg border p-3">
                  <Select
                    value={damageForm.damage_type}
                    onValueChange={(v) => setDamageForm({ ...damageForm, damage_type: v })}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Damage type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DAMAGE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    className="h-12"
                    placeholder="Where on the vehicle?"
                    value={damageForm.location_note}
                    onChange={(e) => setDamageForm({ ...damageForm, location_note: e.target.value })}
                  />
                  <Textarea
                    rows={2}
                    placeholder="Optional detail"
                    value={damageForm.note}
                    onChange={(e) => setDamageForm({ ...damageForm, note: e.target.value })}
                  />
                  <Button size="lg" variant="outline" className="w-full" onClick={addDamage}>
                    <Plus className="mr-2 h-4 w-4" />
                    Record damage
                  </Button>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-medium">Damage photos</p>
                <OpsMediaCapture
                  jobId={job.id}
                  phase="damage"
                  media={media}
                  onChange={ops.reload}
                  readOnly={readOnly}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 4. Checklist */}
          <AccordionItem value="checklist" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="text-base font-semibold">
              4. Service checklist
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-4">
              {job.status === "checked_in" && (
                <Button size="lg" className="w-full" onClick={startWork}>
                  Start service
                </Button>
              )}
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <Checkbox
                      id={item.id}
                      className="mt-0.5 h-6 w-6"
                      checked={item.is_completed}
                      disabled={readOnly}
                      onCheckedChange={(checked) =>
                        ops.toggleChecklistItem(item.id, Boolean(checked))
                      }
                    />
                    <Label htmlFor={item.id} className="text-sm font-medium leading-6">
                      {item.item_text}
                      {!item.is_required && (
                        <span className="ml-2 text-xs text-muted-foreground">(optional)</span>
                      )}
                    </Label>
                  </li>
                ))}
              </ul>
              {!readOnly && (
                <div className="flex gap-2">
                  <Input
                    className="h-12"
                    placeholder="Add a task"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={async () => {
                      await ops.addChecklistItem(newItem);
                      setNewItem("");
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div>
                <p className="mb-2 text-sm font-medium">During-service media</p>
                <OpsMediaCapture
                  jobId={job.id}
                  phase="during"
                  media={media}
                  onChange={ops.reload}
                  readOnly={readOnly}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* 5. After media */}
          <AccordionItem value="after" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="text-base font-semibold">5. After photos</AccordionTrigger>
            <AccordionContent className="pb-4">
              <OpsMediaCapture
                jobId={job.id}
                phase="after"
                categories={REQUIRED_AFTER_CATEGORIES}
                media={media}
                onChange={ops.reload}
                readOnly={readOnly}
              />
            </AccordionContent>
          </AccordionItem>

          {/* 6. Notes & signature */}
          <AccordionItem value="signoff" className="rounded-lg border bg-card px-4">
            <AccordionTrigger className="text-base font-semibold">
              6. Notes & signature
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div>
                <Label htmlFor="tech-notes">Technician notes</Label>
                <Textarea
                  id="tech-notes"
                  rows={4}
                  value={notes}
                  disabled={readOnly}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={() => {
                    if (!readOnly && notes !== (job.technician_notes ?? "")) {
                      void ops.updateJob({ technician_notes: notes.trim() || null });
                    }
                  }}
                />
              </div>
              <div className="flex items-center gap-3 rounded-lg border p-3">
                <Checkbox
                  id="consent"
                  checked={job.marketing_consent}
                  disabled={readOnly}
                  onCheckedChange={(checked) =>
                    ops.updateJob({ marketing_consent: Boolean(checked) })
                  }
                />
                <Label htmlFor="consent" className="text-sm font-medium">
                  Customer approved use of photos for marketing
                </Label>
              </div>
              <div>
                <Label>Technician signature</Label>
                <SignaturePad
                  value={job.technician_signature}
                  disabled={readOnly}
                  onSave={async (dataUrl) => {
                    await ops.updateJob({ technician_signature: dataUrl || null });
                  }}
                />

              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {!readOnly && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ready for QC?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <OpsGateList gates={gates} />
              <Button
                size="lg"
                className="w-full"
                disabled={!canSubmit || ops.saving}
                onClick={submitForQc}
              >
                Submit for quality control
              </Button>
            </CardContent>
          </Card>
        )}

        {isManager && (job.status === "submitted_for_qc" || job.status === "approved") && (
          <Card className="border-primary/40">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Quality control review</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={3}
                placeholder="QC notes (required when returning the job)"
                value={qcNotes}
                onChange={(e) => setQcNotes(e.target.value)}
              />
              <div className="mb-2">
                <p className="mb-2 text-sm font-medium">Correction photos</p>
                <OpsMediaCapture
                  jobId={job.id}
                  phase="rework"
                  media={media}
                  onChange={ops.reload}
                />
              </div>
              {job.status === "submitted_for_qc" ? (
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button size="lg" className="flex-1" onClick={qcApprove} disabled={ops.saving}>
                    Approve job
                  </Button>
                  <Button
                    size="lg"
                    variant="destructive"
                    className="flex-1"
                    onClick={qcReject}
                    disabled={ops.saving}
                  >
                    Return for rework
                  </Button>
                </div>
              ) : (
                <Button size="lg" className="w-full" onClick={markDelivered} disabled={ops.saving}>
                  Mark delivered
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </WorkerLayout>
  );
}
