import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Message {
  id: string;
  user_id: string;
  sender_name: string;
  message: string;
  is_admin: boolean;
  created_at: string;
}

export function TeamChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState("");
  const [isCurrentUserAdmin, setIsCurrentUserAdmin] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initUser();
    fetchMessages();

    const channel = supabase
      .channel("team-chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "team_messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("user_id", user.id)
      .maybeSingle();

    setCurrentUserName(profile?.full_name || user.email || "User");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    setIsCurrentUserAdmin((roles || []).some((r) => r.role === "admin"));
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("team_messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(200);

    setMessages((data || []) as Message[]);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    setSending(true);

    await supabase.from("team_messages").insert({
      user_id: currentUserId,
      sender_name: currentUserName,
      message: newMessage.trim(),
      is_admin: isCurrentUserAdmin,
    });

    setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const groupByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    msgs.forEach((m) => {
      const date = format(new Date(m.created_at), "MMM d, yyyy");
      const last = groups[groups.length - 1];
      if (last && last.date === date) {
        last.messages.push(m);
      } else {
        groups.push({ date, messages: [m] });
      }
    });
    return groups;
  };

  const grouped = groupByDate(messages);

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Team Chat</h1>
      </div>

      <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-card/50 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
        ) : (
          grouped.map((group) => (
            <div key={group.date}>
              <div className="flex justify-center my-3">
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {group.date}
                </span>
              </div>
              {group.messages.map((msg) => {
                const isMe = msg.user_id === currentUserId;
                return (
                  <div key={msg.id} className={cn("flex mb-2", isMe ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[80%] rounded-2xl px-3 py-2", isMe ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted rounded-bl-sm")}>
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-xs font-semibold">{msg.sender_name}</span>
                          {msg.is_admin && (
                            <Badge className="text-[9px] px-1 py-0 h-4 bg-primary/20 text-primary border-primary/30">Boss</Badge>
                          )}
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={cn("text-[10px] mt-0.5", isMe ? "text-primary-foreground/60" : "text-muted-foreground")}>
                        {format(new Date(msg.created_at), "h:mm a")}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 mt-3">
        <Input
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={sending}
          className="flex-1"
        />
        <Button onClick={handleSend} disabled={sending || !newMessage.trim()} className="shrink-0">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
