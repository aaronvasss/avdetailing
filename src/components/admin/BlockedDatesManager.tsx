import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarOff, Plus, Trash2, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
}

export function BlockedDatesManager() {
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [reason, setReason] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    try {
      const { data, error } = await supabase
        .from("blocked_dates" as any)
        .select("*")
        .order("blocked_date", { ascending: true });

      if (error) throw error;
      setBlockedDates((data as any[]) || []);
    } catch (err) {
      console.error("Error fetching blocked dates:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedDate) {
      toast.error("Please select a date");
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");

    // Check if already blocked
    if (blockedDates.some((d) => d.blocked_date === dateStr)) {
      toast.error("This date is already blocked");
      return;
    }

    setAdding(true);
    try {
      const { error } = await supabase
        .from("blocked_dates" as any)
        .insert({
          blocked_date: dateStr,
          reason: reason.trim() || null,
        } as any);

      if (error) throw error;

      toast.success(`Blocked ${format(selectedDate, "MMMM d, yyyy")}`);
      setSelectedDate(undefined);
      setReason("");
      fetchBlockedDates();
    } catch (err: any) {
      console.error("Error blocking date:", err);
      if (err.code === "23505") {
        toast.error("This date is already blocked");
      } else {
        toast.error("Failed to block date");
      }
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string, date: string) => {
    try {
      const { error } = await supabase
        .from("blocked_dates" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success(`Unblocked ${date}`);
      fetchBlockedDates();
    } catch (err) {
      console.error("Error removing blocked date:", err);
      toast.error("Failed to unblock date");
    }
  };

  const blockedDateStrings = blockedDates.map((d) => d.blocked_date);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Split into upcoming and past
  const today = new Date().toISOString().split("T")[0];
  const upcoming = blockedDates.filter((d) => d.blocked_date >= today);
  const past = blockedDates.filter((d) => d.blocked_date < today);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          Blocked Dates
        </CardTitle>
        <CardDescription>
          Block off holidays, vacations, or any days you're unavailable. Blocked dates will be disabled on the customer booking calendar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new blocked date */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label className="mb-2 block">Select Date to Block</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => {
                const dateStr = format(date, "yyyy-MM-dd");
                return date < new Date() || blockedDateStrings.includes(dateStr);
              }}
              className="rounded-md border"
              modifiers={{
                blocked: blockedDates
                  .filter((d) => d.blocked_date >= today)
                  .map((d) => new Date(d.blocked_date + "T00:00:00")),
              }}
              modifiersStyles={{
                blocked: {
                  backgroundColor: "hsl(var(--destructive) / 0.15)",
                  color: "hsl(var(--destructive))",
                  fontWeight: "bold",
                },
              }}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="block-reason">Reason (optional)</Label>
              <Input
                id="block-reason"
                placeholder="e.g., Holiday, Vacation, Equipment maintenance"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>

            <Button onClick={handleAdd} disabled={adding || !selectedDate}>
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Block Date
            </Button>

            {/* Upcoming blocked dates list */}
            {upcoming.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label>Upcoming Blocked Dates</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {upcoming.map((d) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <span className="font-medium text-sm">
                          {format(new Date(d.blocked_date + "T00:00:00"), "EEEE, MMM d, yyyy")}
                        </span>
                        {d.reason && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {d.reason}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-8 w-8"
                        onClick={() =>
                          handleRemove(
                            d.id,
                            format(new Date(d.blocked_date + "T00:00:00"), "MMM d, yyyy")
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground mt-4">
                No upcoming dates blocked. Select a date to block it.
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
