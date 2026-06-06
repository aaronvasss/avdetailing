import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MapPin, Clock, Users, History, Navigation } from "lucide-react";
import { format, formatDistanceToNow, startOfDay, endOfDay, subDays } from "date-fns";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon paths (Leaflet + bundlers)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// @ts-expect-error - private prop
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Baton Rouge default center
const DEFAULT_CENTER: [number, number] = [30.4515, -91.1871];

interface WorkerRow {
  user_id: string;
  full_name: string;
  shift: { id: string; clock_in_at: string } | null;
  latest: { lat: number; lng: number; recorded_at: string; accuracy: number | null } | null;
}

function workerColor(seed: string) {
  // simple hash → hue
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return `hsl(${h}, 75%, 50%)`;
}

export function AdminTeamTrackingTab() {
  return (
    <Tabs defaultValue="live" className="space-y-4">
      <TabsList>
        <TabsTrigger value="live">
          <Navigation className="h-4 w-4 mr-2" /> Live Map
        </TabsTrigger>
        <TabsTrigger value="history">
          <History className="h-4 w-4 mr-2" /> History
        </TabsTrigger>
      </TabsList>
      <TabsContent value="live">
        <LiveMap />
      </TabsContent>
      <TabsContent value="history">
        <HistoryView />
      </TabsContent>
    </Tabs>
  );
}

function LiveMap() {
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    // 1. Active shifts
    const { data: shifts } = await supabase
      .from("worker_shifts")
      .select("id, user_id, clock_in_at")
      .is("clock_out_at", null);

    const userIds = (shifts || []).map((s) => s.user_id);
    if (userIds.length === 0) {
      setWorkers([]);
      setLoading(false);
      return;
    }

    // 2. Profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, full_name")
      .in("user_id", userIds);
    const nameMap = new Map(
      (profiles || []).map((p) => [p.user_id, p.full_name || "Worker"])
    );

    // 3. Latest location per worker
    const rows: WorkerRow[] = [];
    for (const s of shifts || []) {
      const { data: loc } = await supabase
        .from("worker_locations")
        .select("lat, lng, recorded_at, accuracy")
        .eq("user_id", s.user_id)
        .order("recorded_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      rows.push({
        user_id: s.user_id,
        full_name: nameMap.get(s.user_id) || "Worker",
        shift: { id: s.id, clock_in_at: s.clock_in_at },
        latest: loc
          ? {
              lat: Number(loc.lat),
              lng: Number(loc.lng),
              recorded_at: loc.recorded_at,
              accuracy: loc.accuracy ? Number(loc.accuracy) : null,
            }
          : null,
      });
    }
    setWorkers(rows);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("admin-team-tracking-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "worker_locations" },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "worker_shifts" },
        () => fetchAll()
      )
      .subscribe();
    const interval = window.setInterval(fetchAll, 60_000);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(interval);
    };
  }, []);

  const center = useMemo<[number, number]>(() => {
    const withLoc = workers.find((w) => w.latest);
    return withLoc?.latest ? [withLoc.latest.lat, withLoc.latest.lng] : DEFAULT_CENTER;
  }, [workers]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
      <Card>
        <CardContent className="p-0 overflow-hidden rounded-lg">
          <div className="h-[60vh] min-h-[400px] w-full bg-muted">
            <MapContainer
              center={center}
              zoom={12}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {workers.map(
                (w) =>
                  w.latest && (
                    <Marker key={w.user_id} position={[w.latest.lat, w.latest.lng]}>
                      <Popup>
                        <div className="space-y-1 text-sm">
                          <p className="font-bold">{w.full_name}</p>
                          <p>
                            On the clock since{" "}
                            {format(new Date(w.shift!.clock_in_at), "h:mm a")}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Last update{" "}
                            {formatDistanceToNow(new Date(w.latest.recorded_at), {
                              addSuffix: true,
                            })}
                          </p>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${w.latest.lat},${w.latest.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline text-xs"
                          >
                            Open in Google Maps
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  )
              )}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> On the Clock
            <Badge variant="outline" className="ml-auto">
              {workers.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          ) : workers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No workers are clocked in right now.
            </p>
          ) : (
            workers.map((w) => (
              <div
                key={w.user_id}
                className="rounded-md border border-border/50 p-3 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{w.full_name}</p>
                  <Badge className="bg-primary/15 text-primary border-primary/30 text-[10px]">
                    Live
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Started {format(new Date(w.shift!.clock_in_at), "h:mm a")}
                </p>
                {w.latest ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Updated{" "}
                    {formatDistanceToNow(new Date(w.latest.recorded_at), {
                      addSuffix: true,
                    })}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">No GPS ping yet</p>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function HistoryView() {
  const [workers, setWorkers] = useState<{ user_id: string; full_name: string }[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<string>("");
  const [dayOffset, setDayOffset] = useState(0); // 0 = today
  const [shifts, setShifts] = useState<any[]>([]);
  const [pings, setPings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("worker_profiles")
        .select("user_id, is_active");
      const userIds = (data || []).filter((w) => w.is_active).map((w) => w.user_id);
      if (userIds.length === 0) return;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .in("user_id", userIds);
      const list = (profiles || []).map((p) => ({
        user_id: p.user_id,
        full_name: p.full_name || "Worker",
      }));
      setWorkers(list);
      if (list[0]) setSelectedWorker(list[0].user_id);
    })();
  }, []);

  useEffect(() => {
    if (!selectedWorker) return;
    (async () => {
      setLoading(true);
      const day = subDays(new Date(), dayOffset);
      const from = startOfDay(day).toISOString();
      const to = endOfDay(day).toISOString();
      const [{ data: s }, { data: l }] = await Promise.all([
        supabase
          .from("worker_shifts")
          .select("*")
          .eq("user_id", selectedWorker)
          .gte("clock_in_at", from)
          .lte("clock_in_at", to)
          .order("clock_in_at", { ascending: true }),
        supabase
          .from("worker_locations")
          .select("lat, lng, recorded_at, accuracy")
          .eq("user_id", selectedWorker)
          .gte("recorded_at", from)
          .lte("recorded_at", to)
          .order("recorded_at", { ascending: true }),
      ]);
      setShifts(s || []);
      setPings(l || []);
      setLoading(false);
    })();
  }, [selectedWorker, dayOffset]);

  const path = useMemo<[number, number][]>(
    () => pings.map((p) => [Number(p.lat), Number(p.lng)] as [number, number]),
    [pings]
  );
  const center = path[0] || DEFAULT_CENTER;
  const color = selectedWorker ? workerColor(selectedWorker) : "#ef4444";

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground mb-1 block">Worker</label>
            <Select value={selectedWorker} onValueChange={setSelectedWorker}>
              <SelectTrigger>
                <SelectValue placeholder="Pick a worker" />
              </SelectTrigger>
              <SelectContent>
                {workers.map((w) => (
                  <SelectItem key={w.user_id} value={w.user_id}>
                    {w.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Day</label>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 7].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={dayOffset === n ? "default" : "outline"}
                  onClick={() => setDayOffset(n)}
                >
                  {n === 0 ? "Today" : n === 1 ? "Yesterday" : `-${n}d`}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-lg">
            <div className="h-[60vh] min-h-[400px] w-full bg-muted">
              <MapContainer
                key={`${selectedWorker}-${dayOffset}`}
                center={center as [number, number]}
                zoom={path.length ? 13 : 11}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; OpenStreetMap'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {path.length > 1 && (
                  <Polyline positions={path} pathOptions={{ color, weight: 4 }} />
                )}
                {pings.map((p, i) => (
                  <CircleMarker
                    key={i}
                    center={[Number(p.lat), Number(p.lng)]}
                    radius={4}
                    pathOptions={{ color, fillColor: color, fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <p className="text-xs">
                        {format(new Date(p.recorded_at), "h:mm:ss a")}
                      </p>
                    </Popup>
                  </CircleMarker>
                ))}
                {shifts.map((s) =>
                  s.clock_in_lat && s.clock_in_lng ? (
                    <Marker
                      key={`in-${s.id}`}
                      position={[Number(s.clock_in_lat), Number(s.clock_in_lng)]}
                    >
                      <Popup>
                        <p className="text-xs font-bold">Clock in</p>
                        <p className="text-xs">
                          {format(new Date(s.clock_in_at), "h:mm a")}
                        </p>
                      </Popup>
                    </Marker>
                  ) : null
                )}
              </MapContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Shifts
              <Badge variant="outline" className="ml-auto">
                {shifts.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto" />
            ) : shifts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No shifts recorded for this day.
              </p>
            ) : (
              shifts.map((s) => (
                <div
                  key={s.id}
                  className="rounded-md border border-border/50 p-3 space-y-1"
                >
                  <p className="text-sm font-semibold">
                    {format(new Date(s.clock_in_at), "h:mm a")}
                    {" → "}
                    {s.clock_out_at
                      ? format(new Date(s.clock_out_at), "h:mm a")
                      : "Active"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.total_minutes
                      ? `${(s.total_minutes / 60).toFixed(2)} hrs`
                      : "In progress"}
                  </p>
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
              {pings.length} GPS pings recorded
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
