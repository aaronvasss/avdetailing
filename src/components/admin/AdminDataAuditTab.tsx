import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, RefreshCw, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  created_at: string;
}

interface Client {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}

type Severity = "ok" | "warn" | "error";

interface AuditRow {
  contact: Contact;
  client: Client | null;
  issues: string[];
  severity: Severity;
}

const normPhone = (p?: string | null) => (p || "").replace(/\D/g, "").slice(-10);
const normEmail = (e?: string | null) => (e || "").trim().toLowerCase();

function audit(contacts: Contact[], clients: Client[]): AuditRow[] {
  const byEmail = new Map<string, Client>();
  const byPhone = new Map<string, Client>();
  for (const c of clients) {
    const e = normEmail(c.email);
    const p = normPhone(c.phone);
    if (e) byEmail.set(e, c);
    if (p) byPhone.set(p, c);
  }

  return contacts.map((contact) => {
    const issues: string[] = [];
    const e = normEmail(contact.email);
    const p = normPhone(contact.phone);
    const client =
      (e && byEmail.get(e)) ||
      (p && byPhone.get(p)) ||
      null;

    if (!client) {
      issues.push("No matching client record");
    } else {
      const hasAddress =
        !!(client.address_line1 && client.address_line1.trim()) &&
        !!(client.city && client.city.trim());
      if (!hasAddress) issues.push("Client is missing address");
      if (!normPhone(client.phone)) issues.push("Client is missing phone");
      if (p && normPhone(client.phone) && p !== normPhone(client.phone)) {
        issues.push("Phone mismatch between contact & client");
      }
      if (e && normEmail(client.email) && e !== normEmail(client.email)) {
        issues.push("Email mismatch between contact & client");
      }
    }

    if (!contact.phone && !contact.email) {
      issues.push("Contact has no email or phone");
    }

    const severity: Severity =
      issues.length === 0
        ? "ok"
        : issues.some((i) => i.includes("No matching") || i.includes("no email or phone"))
        ? "error"
        : "warn";

    return { contact, client, issues, severity };
  });
}

export function AdminDataAuditTab() {
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filter, setFilter] = useState<"all" | "issues" | "error" | "warn" | "ok">("issues");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, clRes] = await Promise.all([
        supabase
          .from("contacts")
          .select("id,name,email,phone,source,created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("clients")
          .select("id,full_name,first_name,last_name,email,phone,address_line1,city,state,zip"),
      ]);
      if (cRes.error) throw cRes.error;
      if (clRes.error) throw clRes.error;
      setContacts((cRes.data || []) as Contact[]);
      setClients((clRes.data || []) as Client[]);
    } catch (e: any) {
      toast.error("Failed to load audit data", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const rows = useMemo(() => audit(contacts, clients), [contacts, clients]);

  const stats = useMemo(() => {
    return {
      total: rows.length,
      ok: rows.filter((r) => r.severity === "ok").length,
      warn: rows.filter((r) => r.severity === "warn").length,
      error: rows.filter((r) => r.severity === "error").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    let list = rows;
    if (filter === "issues") list = list.filter((r) => r.severity !== "ok");
    else if (filter !== "all") list = list.filter((r) => r.severity === filter);
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (r) =>
          (r.contact.name || "").toLowerCase().includes(q) ||
          (r.contact.email || "").toLowerCase().includes(q) ||
          (r.contact.phone || "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [rows, filter, query]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Contacts" value={stats.total} />
        <StatCard label="Healthy" value={stats.ok} tone="ok" />
        <StatCard label="Warnings" value={stats.warn} tone="warn" />
        <StatCard label="Errors" value={stats.error} tone="error" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Contact ↔ Client Cross-Check</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 w-56"
              />
            </div>
            <div className="flex gap-1">
              {(["issues", "error", "warn", "ok", "all"] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? "default" : "outline"}
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                </Button>
              ))}
            </div>
            <Button size="sm" variant="outline" onClick={load}>
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No records match the current filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Email / Phone</TableHead>
                    <TableHead>Matched Client</TableHead>
                    <TableHead>Address on file</TableHead>
                    <TableHead>Issues</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => {
                    const clientName =
                      r.client?.full_name ||
                      [r.client?.first_name, r.client?.last_name].filter(Boolean).join(" ") ||
                      "—";
                    const addr = r.client
                      ? [r.client.address_line1, r.client.city, r.client.state, r.client.zip]
                          .filter(Boolean)
                          .join(", ")
                      : "";
                    return (
                      <TableRow key={r.contact.id}>
                        <TableCell>
                          {r.severity === "ok" ? (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                            </Badge>
                          ) : r.severity === "warn" ? (
                            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Warn
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {r.contact.name || "—"}
                          <div className="text-xs text-muted-foreground">
                            {r.contact.source || "—"}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{r.contact.email || "—"}</div>
                          <div className="text-muted-foreground">{r.contact.phone || "—"}</div>
                        </TableCell>
                        <TableCell className="text-sm">{clientName}</TableCell>
                        <TableCell className="text-sm max-w-[240px] truncate">
                          {addr || <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.issues.length === 0 ? (
                            <span className="text-muted-foreground">None</span>
                          ) : (
                            <ul className="space-y-0.5">
                              {r.issues.map((i, idx) => (
                                <li key={idx}>• {i}</li>
                              ))}
                            </ul>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "error";
}) {
  const color =
    tone === "ok"
      ? "text-green-600"
      : tone === "warn"
      ? "text-yellow-600"
      : tone === "error"
      ? "text-destructive"
      : "";
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
