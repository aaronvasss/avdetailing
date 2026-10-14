import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Car } from "lucide-react";

export interface PickedVehicle {
  year: string;
  make: string;
  model: string;
  notes: string | null;
}

export function SavedVehiclePicker({ userId, onPick }: { userId?: string; onPick: (v: PickedVehicle) => void }) {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("customer_vehicles")
      .select("id, nickname, year, make, model, vehicle_type, notes, is_default")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .then(({ data }) => setVehicles(data ?? []));
  }, [userId]);

  if (!userId || vehicles.length === 0) return null;

  return (
    <div className="md:col-span-2 space-y-2">
      <p className="text-sm font-medium">Choose a saved vehicle</p>
      <div className="flex flex-wrap gap-2">
        {vehicles.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => {
              setSelected(v.id);
              onPick({ year: v.year ? String(v.year) : "", make: v.make ?? "", model: v.model ?? "", notes: v.notes });
            }}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
              selected === v.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
            }`}
          >
            <Car className="h-4 w-4 text-primary" />
            {v.nickname || [v.year, v.make, v.model].filter(Boolean).join(" ") || v.vehicle_type}
          </button>
        ))}
      </div>
    </div>
  );
}
