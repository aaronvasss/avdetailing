import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function DangerZoneSection() {
  const [confirmText, setConfirmText] = useState("");
  const [clearing, setClearing] = useState(false);
  const [open, setOpen] = useState(false);

  const handleClearAllBookings = async () => {
    if (confirmText !== "DELETE") return;

    setClearing(true);
    try {
      // Delete child records first (foreign key constraints)
      const steps = [
        supabase.from("booking_add_ons").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("booking_internal_notes").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
        supabase.from("booking_photos").delete().neq("id", "00000000-0000-0000-0000-000000000000"),
      ];

      await Promise.all(steps);

      // Clear booking references from payment_records and sms_messages
      await Promise.all([
        supabase.from("payment_records").update({ booking_id: null }).not("booking_id", "is", null),
        supabase.from("sms_messages").update({ booking_id: null }).not("booking_id", "is", null),
      ]);

      // Delete all bookings
      const { error } = await supabase
        .from("bookings")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      toast.success("All bookings have been permanently deleted");
      setOpen(false);
      setConfirmText("");
    } catch (err: any) {
      console.error("Error clearing bookings:", err);
      toast.error(`Failed to clear bookings: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible actions that affect your business data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
          <div>
            <p className="font-medium">Clear All Bookings</p>
            <p className="text-sm text-muted-foreground">
              Permanently delete every booking record. Customer profiles, memberships, and Stripe data are preserved.
            </p>
          </div>
          <AlertDialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirmText(""); }}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Bookings
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Are you sure?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-2">
                  <span className="block">
                    This will permanently delete <strong>ALL bookings</strong> and cannot be undone.
                  </span>
                  <span className="block">
                    Customer records, memberships, and Stripe data will not be affected.
                  </span>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="space-y-2 py-2">
                <Label htmlFor="confirm-delete">
                  Type <strong className="text-destructive">DELETE</strong> to confirm
                </Label>
                <Input
                  id="confirm-delete"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE here"
                  className="font-mono"
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleClearAllBookings}
                  disabled={confirmText !== "DELETE" || clearing}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {clearing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete All Bookings"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
