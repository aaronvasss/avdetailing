import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, Gift, Link2, Share2, Users, DollarSign, Check } from "lucide-react";

interface ReferralTabProps {
  userId: string;
}

export function ReferralTab({ userId }: ReferralTabProps) {
  const [referralCode, setReferralCode] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [rewards, setRewards] = useState<any[]>([]);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    loadReferralData();
  }, [userId]);

  const loadReferralData = async () => {
    setLoading(true);

    // Get or create referral code
    const { data: existing } = await supabase
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing?.code) {
      setReferralCode(existing.code);
    } else {
      // Generate a unique code from profile name or random
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();

      const firstName = (profile?.full_name || "").split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "");
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = firstName ? `${firstName}${randomSuffix}` : `AV${randomSuffix}`;

      const { error } = await supabase
        .from("referral_codes")
        .insert({ user_id: userId, code } as any);

      if (!error) {
        setReferralCode(code);
      }
    }

    // Load rewards
    const { data: rewardData } = await supabase
      .from("referral_rewards")
      .select("*")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false });

    setRewards(rewardData || []);
    setLoading(false);
  };

  const referralLink = `${window.location.origin}/book?ref=${referralCode}`;
  const availableCredits = rewards.filter((r) => !r.is_redeemed).reduce((sum: number, r: any) => sum + Number(r.reward_amount), 0);
  const totalEarned = rewards.reduce((sum: number, r: any) => sum + Number(r.reward_amount), 0);
  const totalReferrals = rewards.length;

  const copyToClipboard = async (text: string, type: "code" | "link") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast.success(type === "code" ? "Referral code copied!" : "Referral link copied!");
    setTimeout(() => setCopied(null), 2000);
  };

  const shareReferral = async () => {
    const shareData = {
      title: "AV Detailing Referral",
      text: `Use my referral code ${referralCode} to book with AV Detailing!`,
      url: referralLink,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled share
      }
    } else {
      copyToClipboard(referralLink, "link");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">${availableCredits}</p>
                <p className="text-xs text-muted-foreground">Available Credit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Users className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Friends Referred</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Gift className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">${totalEarned}</p>
                <p className="text-xs text-muted-foreground">Total Earned</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Code & Link */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            Your Referral Code
          </CardTitle>
          <CardDescription>
            Share your code with friends. When they book, you earn <span className="font-semibold text-primary">$10 credit</span> toward your next service!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Code */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Referral Code</label>
            <div className="flex gap-2">
              <Input
                value={referralCode}
                readOnly
                className="font-mono text-lg font-bold tracking-widest text-center bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralCode, "code")}
                className="shrink-0"
              >
                {copied === "code" ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Shareable Link</label>
            <div className="flex gap-2">
              <Input
                value={referralLink}
                readOnly
                className="text-sm bg-muted truncate"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => copyToClipboard(referralLink, "link")}
                className="shrink-0"
              >
                {copied === "link" ? <Check className="h-4 w-4 text-green-500" /> : <Link2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Share Button */}
          <Button onClick={shareReferral} className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            Share with Friends
          </Button>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">How It Works</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="font-bold text-primary">1</span>
              </div>
              <p className="text-sm font-medium">Share Your Code</p>
              <p className="text-xs text-muted-foreground">Send your code or link to friends</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="font-bold text-primary">2</span>
              </div>
              <p className="text-sm font-medium">Friend Books</p>
              <p className="text-xs text-muted-foreground">They enter your code when booking</p>
            </div>
            <div className="text-center space-y-2">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <span className="font-bold text-primary">3</span>
              </div>
              <p className="text-sm font-medium">You Save $10</p>
              <p className="text-xs text-muted-foreground">Credit applied to your next booking</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reward History */}
      {rewards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Referral History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rewards.map((reward: any) => (
                <div
                  key={reward.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-full ${reward.is_redeemed ? "bg-muted" : "bg-primary/10"}`}>
                      <Gift className={`h-4 w-4 ${reward.is_redeemed ? "text-muted-foreground" : "text-primary"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        ${reward.reward_amount} referral credit
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(reward.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge variant={reward.is_redeemed ? "secondary" : "default"}>
                    {reward.is_redeemed ? "Used" : "Available"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
