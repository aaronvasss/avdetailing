import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { WorkerLayout } from "@/components/worker/WorkerLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, User, LogOut, Star, Briefcase, DollarSign, Calendar } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";

export default function WorkerProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ full_name: "", email: "", phone: "" });
  const [workerProfile, setWorkerProfile] = useState<any>(null);
  const [stats, setStats] = useState({ totalJobs: 0, weekEarnings: 0, avgRating: 0, ratingCount: 0, memberSince: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [{ data: p }, { data: wp }] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("worker_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    setProfile({
      full_name: p?.full_name || "",
      email: p?.email || user.email || "",
      phone: p?.phone || wp?.phone || "",
    });
    setWorkerProfile(wp);

    // Fetch stats only for bookings assigned to this worker
    const { data: completedBookings } = await supabase
      .from("bookings")
      .select("id, total_price, scheduled_date, worker_pay_rate, worker_pay_type")
      .eq("status", "completed")
      .eq("assigned_worker_id", user.id);

    const totalJobs = completedBookings?.length || 0;

    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekJobs = (completedBookings || []).filter(
      (b) => b.scheduled_date >= weekStart && b.scheduled_date <= weekEnd
    );

    let weekEarnings = 0;
    if (wp) {
      if (wp.pay_type === "percentage") {
        weekEarnings = weekJobs.reduce((s, b) => s + (b.total_price || 0) * (wp.pay_rate / 100), 0);
      } else {
        weekEarnings = weekJobs.length * wp.pay_rate;
      }
    }

    // Get ratings
    const bookingIds = (completedBookings || []).map((b) => b.id);
    let avgRating = 0;
    let ratingCount = 0;
    if (bookingIds.length > 0) {
      const { data: ratings } = await supabase
        .from("booking_ratings")
        .select("rating")
        .in("booking_id", bookingIds);

      if (ratings && ratings.length > 0) {
        ratingCount = ratings.length;
        avgRating = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      }
    }

    setStats({
      totalJobs,
      weekEarnings,
      avgRating,
      ratingCount,
      memberSince: wp?.created_at ? format(new Date(wp.created_at), "MMMM yyyy") : format(new Date(user.created_at || ""), "MMMM yyyy"),
    });

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/worker/login");
  };

  if (loading) {
    return (
      <WorkerLayout>
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </WorkerLayout>
    );
  }

  return (
    <WorkerLayout>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Profile</h1>
        </div>

        {/* Profile info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-7 w-7 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-lg">{profile.full_name || "Worker"}</p>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                {profile.phone && <p className="text-sm text-muted-foreground">{profile.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Briefcase className="h-3 w-3" /> Total Jobs
              </div>
              <p className="text-2xl font-bold mt-1">{stats.totalJobs}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <DollarSign className="h-3 w-3" /> This Week
              </div>
              <p className="text-2xl font-bold mt-1 text-primary">${stats.weekEarnings.toFixed(2)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Star className="h-3 w-3" /> Avg Rating
              </div>
              <div className="flex items-center gap-1 mt-1">
                <p className="text-2xl font-bold">
                  {stats.ratingCount > 0 ? stats.avgRating.toFixed(1) : "—"}
                </p>
                {stats.ratingCount > 0 && <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />}
              </div>
              <p className="text-xs text-muted-foreground">{stats.ratingCount} review{stats.ratingCount !== 1 ? "s" : ""}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" /> Member Since
              </div>
              <p className="text-sm font-semibold mt-2">{stats.memberSince}</p>
            </CardContent>
          </Card>
        </div>

        {/* Pay rate */}
        {workerProfile && (
          <Card>
            <CardContent className="pt-4 pb-3 px-4">
              <p className="text-sm text-muted-foreground">Pay Rate</p>
              <p className="font-semibold">
                {workerProfile.pay_type === "percentage"
                  ? `${workerProfile.pay_rate}% per job`
                  : `$${workerProfile.pay_rate} flat per job`}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Contact admin to update your pay rate</p>
            </CardContent>
          </Card>
        )}

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </WorkerLayout>
  );
}
