import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Phone, Send, Loader2, ArrowDownLeft, ArrowUpRight, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface SmsMessage {
  id: string;
  direction: string;
  from_number: string;
  to_number: string;
  body: string;
  status: string;
  booking_id: string | null;
  created_at: string;
}

export function AdminMessagesTab() {
  const [messages, setMessages] = useState<SmsMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("sms_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching messages:", error);
      // Table might not exist yet or no messages
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const sendReply = async () => {
    if (!replyTo || !replyMessage.trim()) return;
    
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-sms", {
        body: { to: replyTo, message: replyMessage },
      });

      if (error) throw error;
      
      toast.success("Reply sent!");
      setReplyMessage("");
      setReplyTo(null);
      // Refresh messages
      setTimeout(fetchMessages, 1000);
    } catch (err) {
      console.error("Error sending reply:", err);
      toast.error("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  // Group messages by phone number for conversation view
  const groupedMessages = messages.reduce((acc, msg) => {
    const phone = msg.direction === "inbound" ? msg.from_number : msg.to_number;
    if (!acc[phone]) {
      acc[phone] = [];
    }
    acc[phone].push(msg);
    return acc;
  }, {} as Record<string, SmsMessage[]>);

  const uniquePhones = Object.keys(groupedMessages);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Messages Yet</h3>
          <p className="text-muted-foreground mb-4">
            SMS messages will appear here once customers start texting your Twilio number.
          </p>
          <Button variant="outline" onClick={fetchMessages}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Customer Messages ({uniquePhones.length} conversations)</h3>
        <Button variant="outline" size="sm" onClick={fetchMessages}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {uniquePhones.map((phone) => {
          const conversation = groupedMessages[phone];
          const lastMessage = conversation[0];
          const hasInbound = conversation.some(m => m.direction === "inbound");

          return (
            <Card key={phone} className={hasInbound ? "border-primary/50" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${phone}`} className="font-medium hover:text-primary">
                      {phone}
                    </a>
                    {hasInbound && <Badge variant="secondary">Needs Reply</Badge>}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(lastMessage.created_at), "MMM d, h:mm a")}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                  {conversation.slice().reverse().map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-2 ${msg.direction === "outbound" ? "justify-end" : ""}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          msg.direction === "outbound"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-1 mb-1">
                          {msg.direction === "inbound" ? (
                            <ArrowDownLeft className="h-3 w-3" />
                          ) : (
                            <ArrowUpRight className="h-3 w-3" />
                          )}
                          <span className="text-xs opacity-70">
                            {format(new Date(msg.created_at), "h:mm a")}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply form */}
                <div className="flex gap-2 border-t pt-4">
                  <Textarea
                    placeholder="Type a reply..."
                    value={replyTo === phone ? replyMessage : ""}
                    onChange={(e) => {
                      setReplyTo(phone);
                      setReplyMessage(e.target.value);
                    }}
                    onFocus={() => setReplyTo(phone)}
                    className="min-h-[60px] resize-none"
                  />
                  <Button
                    onClick={sendReply}
                    disabled={sending || !replyMessage.trim() || replyTo !== phone}
                    className="self-end"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
