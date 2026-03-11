import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Users, CalendarDays, Download, History, Loader2 } from "lucide-react";
import { CsvImportWizard, type ImportType } from "./CsvImportWizard";
import { format } from "date-fns";

const CUSTOMER_TEMPLATE_HEADERS = [
  "First Name", "Last Name", "Email", "Phone", "Address", "City", "ZIP",
  "Vehicle Make", "Vehicle Model", "Vehicle Year", "Vehicle Type", "Notes",
];

const BOOKING_TEMPLATE_HEADERS = [
  "Customer First Name", "Customer Last Name", "Customer Email", "Customer Phone",
  "Service Type", "Vehicle Type", "Vehicle Make", "Vehicle Model",
  "Date", "Time", "Address", "City", "ZIP",
  "Amount Paid", "Payment Method", "Status", "Notes",
];

function downloadTemplate(type: ImportType) {
  const headers = type === "customers" ? CUSTOMER_TEMPLATE_HEADERS : BOOKING_TEMPLATE_HEADERS;
  const csv = headers.join(",") + "\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-import-template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface ImportHistoryRow {
  id: string;
  import_type: string;
  total_rows: number;
  imported_rows: number;
  skipped_rows: number;
  error_rows: number;
  created_at: string;
}

export function CsvImportSection() {
  const [activeImport, setActiveImport] = useState<ImportType | null>(null);
  const [history, setHistory] = useState<ImportHistoryRow[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const fetchHistory = async () => {
    setLoadingHistory(true);
    const { data } = await supabase
      .from("import_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    setHistory((data as any[]) || []);
    setLoadingHistory(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  if (activeImport) {
    return (
      <CsvImportWizard
        type={activeImport}
        onClose={() => { setActiveImport(null); fetchHistory(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Import Data</h2>
        <p className="text-sm text-muted-foreground">
          Migrate customers and bookings from your old website via CSV
        </p>
      </div>

      {/* Import options */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveImport("customers")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-5 w-5 text-primary" />
              Import Customers
            </CardTitle>
            <CardDescription className="text-xs">
              Import customer contact info and vehicle details
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button size="sm"><Upload className="mr-1.5 h-3.5 w-3.5" />Upload CSV</Button>
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadTemplate("customers"); }}>
              <Download className="mr-1.5 h-3.5 w-3.5" />Template
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setActiveImport("bookings")}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-5 w-5 text-primary" />
              Import Bookings
            </CardTitle>
            <CardDescription className="text-xs">
              Import past appointments and booking history
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button size="sm"><Upload className="mr-1.5 h-3.5 w-3.5" />Upload CSV</Button>
            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); downloadTemplate("bookings"); }}>
              <Download className="mr-1.5 h-3.5 w-3.5" />Template
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Import History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-5 w-5" />
            Import History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingHistory ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No imports yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Imported</TableHead>
                  <TableHead className="text-right">Skipped</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-xs">{format(new Date(row.created_at), "MMM d, yyyy h:mm a")}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize text-xs">{row.import_type}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">{row.imported_rows}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.skipped_rows}</TableCell>
                    <TableCell className="text-right text-destructive">{row.error_rows}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
