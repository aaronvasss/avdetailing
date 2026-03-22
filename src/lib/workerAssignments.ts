import { supabase } from "@/integrations/supabase/client";

export interface WorkerOption {
  user_id: string;
  display_name: string;
  email: string | null;
  profile_id: string | null;
  worker_profile_id: string | null;
  is_owner: boolean;
}

const BUSINESS_TIME_ZONE = "America/Chicago";

const getDatePartsInTimeZone = (date: Date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: BUSINESS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const lookup = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
  };
};

export const getBusinessDateString = (offsetDays = 0) => {
  const { year, month, day } = getDatePartsInTimeZone(new Date());
  return new Date(Date.UTC(year, month - 1, day + offsetDays, 12, 0, 0))
    .toISOString()
    .slice(0, 10);
};

export const resolveAssignedWorkerUserId = (
  candidate: string | null | undefined,
  workers: WorkerOption[]
) => {
  if (!candidate || candidate === "unassigned") return null;

  const matchedWorker = workers.find((worker) =>
    [worker.user_id, worker.profile_id, worker.worker_profile_id]
      .filter(Boolean)
      .includes(candidate)
  );

  return matchedWorker?.user_id ?? candidate;
};

export const getCurrentWorkerIdentity = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [{ data: profile }, { data: workerProfile }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("worker_profiles")
      .select("id, user_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const identity = {
    authUserId: user.id,
    authEmail: user.email ?? null,
    profileId: profile?.id ?? null,
    profileName: profile?.full_name ?? null,
    profileEmail: profile?.email ?? null,
    workerProfileId: workerProfile?.id ?? null,
    workerProfileUserId: workerProfile?.user_id ?? null,
  };

  console.log("[worker-identity] resolved authenticated worker", identity);

  return identity;
};