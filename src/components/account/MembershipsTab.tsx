import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Calendar, Car, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface MembershipsTabProps {
  userId: string;
}

interface Membership {
  id: string;
  status: string;
  next_service_date: string | null;
  current_period_end: string | null;
  membership_plans: {
    name: string;
    price: number;
    frequency: string;
    features: string[];
  } | null;
  customer_vehicles: {
    make: string | null;
    model: string | null;
    year: number | null;
  } | null;
}

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  paused: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  cancelled: "bg-muted text-muted-foreground border-muted",
  past_due: "bg-red-500/10 text-red-500 border-red-500/20",
};

export function MembershipsTab({ userId }: MembershipsTabProps) {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMemberships();
  }, [userId]);

  const fetchMemberships = async () => {
    const { data, error } = await supabase
      .from("customer_memberships")
      .select(`
        id,
        status,
        next_service_date,
        current_period_end,
        membership_plans (name, price, frequency, features),
        customer_vehicles (make, model, year)
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (data) {
      setMemberships(data);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="animate-pulse">Loading memberships...</div>;
  }

  const activeMemberships = memberships.filter((m) => m.status === "active");
  const inactiveMemberships = memberships.filter((m) => m.status !== "active");

  return (
    <div className="space-y-6">
      {/* Active Memberships */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Active Memberships</h2>
          <Button asChild variant="outline">
            <Link to="/memberships">
              View Plans
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {activeMemberships.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">No active memberships</p>
              <p className="text-sm text-muted-foreground mb-4">
                Join a membership plan for recurring maintenance and exclusive benefits
              </p>
              <Button asChild>
                <Link to="/memberships">Explore Memberships</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {activeMemberships.map((membership) => (
              <Card key={membership.id} className="border-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {membership.membership_plans?.name}
                      </CardTitle>
                      <CardDescription className="capitalize">
                        {membership.membership_plans?.frequency} Plan • $
                        {membership.membership_plans?.price}/
                        {membership.membership_plans?.frequency === "weekly"
                          ? "week"
                          : membership.membership_plans?.frequency === "bi-weekly"
                          ? "2 weeks"
                          : "month"}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[membership.status]}>
                      {membership.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-4 text-sm">
                    {membership.customer_vehicles && (
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {membership.customer_vehicles.year}{" "}
                          {membership.customer_vehicles.make}{" "}
                          {membership.customer_vehicles.model}
                        </span>
                      </div>
                    )}
                    {membership.next_service_date && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>
                          Next Service:{" "}
                          {format(new Date(membership.next_service_date), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                  </div>

                  {membership.membership_plans?.features && (
                    <div>
                      <p className="text-sm font-medium mb-2">Included Features:</p>
                      <ul className="text-sm text-muted-foreground grid grid-cols-2 gap-1">
                        {membership.membership_plans.features.slice(0, 4).map((feature, i) => (
                          <li key={i}>• {feature}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">
                      Manage Subscription
                    </Button>
                    <Button variant="ghost" size="sm">
                      Schedule Next Visit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Past/Inactive Memberships */}
      {inactiveMemberships.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Memberships</h2>
          <div className="grid gap-4">
            {inactiveMemberships.map((membership) => (
              <Card key={membership.id} className="opacity-75">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">
                      {membership.membership_plans?.name}
                    </CardTitle>
                    <Badge variant="secondary">{membership.status}</Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
