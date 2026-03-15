import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WorkerOption {
  user_id: string;
  display_name: string;
}

export function useWorkersList() {
  const [workers, setWorkers] = useState<WorkerOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkers = async () => {
      setLoading(true);

      // Get active worker profiles
      const { data: workerProfiles } = await supabase
        .from("worker_profiles")
        .select("user_id")
        .eq("is_active", true);

      // Get admin user IDs
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      const allUserIds = new Set<string>();
      (workerProfiles || []).forEach((w) => allUserIds.add(w.user_id));
      (adminRoles || []).forEach((a) => allUserIds.add(a.user_id));

      if (allUserIds.size === 0) {
        setWorkers([]);
        setLoading(false);
        return;
      }

      // Fetch profile names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, email")
        .in("user_id", Array.from(allUserIds));

      const adminIds = new Set((adminRoles || []).map((a) => a.user_id));

      const workerOptions: WorkerOption[] = (profiles || []).map((p) => ({
        user_id: p.user_id,
        display_name: `${p.full_name || p.email || "Unknown"}${adminIds.has(p.user_id) ? " (Owner)" : ""}`,
      }));

      // Sort: owner first, then alphabetical
      workerOptions.sort((a, b) => {
        if (a.display_name.includes("(Owner)")) return -1;
        if (b.display_name.includes("(Owner)")) return 1;
        return a.display_name.localeCompare(b.display_name);
      });

      setWorkers(workerOptions);
      setLoading(false);
    };

    fetchWorkers();
  }, []);

  return { workers, loading };
}
