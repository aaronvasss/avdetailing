import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Upload, ArrowLeft, ArrowRight, Check, AlertTriangle, Loader2, X, FileSpreadsheet } from "lucide-react";

export type ImportType = "customers" | "bookings";

interface Props {
  type: ImportType;
  onClose: () => void;
}

type Step = "upload" | "mapping" | "preview" | "importing" | "done";

const CUSTOMER_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "full_name_combined", label: "Full Name (combined)" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "address_line1", label: "Street Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "ZIP" },
  { key: "notes", label: "Notes / Labels" },
  { key: "source", label: "Source" },
  { key: "created_at", label: "Created At" },
];

const BOOKING_FIELDS: { key: string; label: string; required?: boolean }[] = [
  { key: "guest_name_first", label: "Customer First Name", required: true },
  { key: "guest_name_last", label: "Customer Last Name" },
  { key: "guest_email", label: "Customer Email" },
  { key: "guest_phone", label: "Customer Phone" },
  { key: "service_type", label: "Service Type", required: true },
  { key: "vehicle_type", label: "Vehicle Type" },
  { key: "vehicle_make", label: "Vehicle Make" },
  { key: "vehicle_model", label: "Vehicle Model" },
  { key: "scheduled_date", label: "Date", required: true },
  { key: "scheduled_time", label: "Time", required: true },
  { key: "service_address", label: "Address" },
  { key: "service_city", label: "City" },
  { key: "service_zip", label: "ZIP" },
  { key: "total_price", label: "Amount Paid" },
  { key: "payment_method", label: "Payment Method" },
  { key: "status", label: "Status" },
  { key: "customer_notes", label: "Notes" },
];

// Header matching heuristics — includes Wix export format
const HEADER_ALIASES: Record<string, string[]> = {
  first_name: ["first name", "firstname", "first", "fname"],
  last_name: ["last name", "lastname", "last", "lname", "surname"],
  email: ["email", "e-mail", "email address", "email 1"],
  phone: ["phone", "phone number", "telephone", "mobile", "cell", "phone 1"],
  address_line1: [
    "address", "street", "address line 1", "street address",
    "address 2 - street", "address 1 - street",
  ],
  city: ["city", "town", "address 2 - city", "address 1 - city"],
  state: ["state", "state/region", "address 2 - state/region", "address 1 - state/region"],
  zip: ["zip", "zipcode", "zip code", "postal", "postal code", "address 2 - zip", "address 1 - zip"],
  notes: ["notes", "note", "comments", "comment", "labels"],
  source: ["source"],
  created_at: ["created at", "created at (utc+0)", "created date", "date created"],
  // bookings
  guest_name_first: ["customer first name", "first name", "firstname", "first"],
  guest_name_last: ["customer last name", "last name", "lastname", "last"],
  guest_email: ["customer email", "email", "e-mail"],
  guest_phone: ["customer phone", "phone", "mobile", "cell"],
  service_type: ["service type", "service", "service name"],
  scheduled_date: ["date", "appointment date", "scheduled date", "booking date"],
  scheduled_time: ["time", "appointment time", "scheduled time", "booking time"],
  service_address: ["address", "service address", "location"],
  service_city: ["city", "service city"],
  service_zip: ["zip", "service zip", "zipcode"],
  total_price: ["amount paid", "amount", "total", "price", "total price"],
  payment_method: ["payment method", "payment", "pay method"],
  status: ["status", "booking status", "appointment status"],
  customer_notes: ["notes", "customer notes", "comments"],
};

// For Wix CSVs: composite columns that should fall back (prioritize Address 2 over Address 1)
const WIX_COMPOSITE_FIELDS: Record<string, { primary: string; fallback: string }> = {
  address_line1: { primary: "Address 2 - Street", fallback: "Address 1 - Street" },
  city: { primary: "Address 2 - City", fallback: "Address 1 - City" },
  state: { primary: "Address 2 - State/Region", fallback: "Address 1 - State/Region" },
  zip: { primary: "Address 2 - Zip", fallback: "Address 1 - Zip" },
};

function autoMap(csvHeaders: string[], fields: { key: string }[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  const headerLower = csvHeaders.map((h) => h.toLowerCase().trim());

  for (const field of fields) {
    // For composite Wix fields, try primary first then fallback
    const composite = WIX_COMPOSITE_FIELDS[field.key];
    if (composite) {
      const primaryIdx = headerLower.indexOf(composite.primary.toLowerCase());
      const fallbackIdx = headerLower.indexOf(composite.fallback.toLowerCase());
      if (primaryIdx >= 0) { mapping[field.key] = csvHeaders[primaryIdx]; continue; }
      if (fallbackIdx >= 0) { mapping[field.key] = csvHeaders[fallbackIdx]; continue; }
    }

    const aliases = HEADER_ALIASES[field.key] || [field.key.replace(/_/g, " ")];
    const match = csvHeaders.find((h) =>
      aliases.some((a) => h.toLowerCase().trim() === a.toLowerCase())
    );
    if (match) mapping[field.key] = match;
  }
  return mapping;
}

/** Format phone: strip leading +1 and quotes, format as (XXX) XXX-XXXX */
function formatPhone(raw: string): string | null {
  if (!raw) return null;
  // Strip quotes, spaces, dashes, parens, dots
  let digits = raw.replace(/[^0-9]/g, "");
  // Strip leading country code 1 if 11 digits
  if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
  if (digits.length !== 10) return raw.trim() || null; // return as-is if not 10 digits
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Get a composite value: try primary column first, then fallback */
function getCompositeValue(row: Record<string, string>, fieldKey: string, mapping: Record<string, string>, allHeaders: string[]): string {
  // If mapped to a specific column, use it
  const mapped = mapping[fieldKey];
  if (mapped && row[mapped]?.trim()) return row[mapped].trim();

  // Try Wix composite fallback
  const composite = WIX_COMPOSITE_FIELDS[fieldKey];
  if (composite) {
    const primaryVal = row[composite.primary]?.trim();
    const fallbackVal = row[composite.fallback]?.trim();
    if (primaryVal) return primaryVal;
    if (fallbackVal) return fallbackVal;
  }

  return "";
}

function parseCsv(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const values = parseLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  });
  return { headers, rows };
}

export function CsvImportWizard({ type, onClose }: Props) {
  const fields = type === "customers" ? CUSTOMER_FIELDS : BOOKING_FIELDS;
  const [step, setStep] = useState<Step>("upload");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsv(text);
      if (headers.length === 0 || rows.length === 0) {
        toast.error("CSV file appears to be empty");
        return;
      }
      setCsvHeaders(headers);
      setCsvRows(rows);
      const autoMapping = autoMap(headers, fields);
      setMapping(autoMapping);
      const requiredFields = fields.filter((f) => f.required);
      const allMapped = requiredFields.every((f) => autoMapping[f.key]);
      setStep(allMapped ? "preview" : "mapping");
    };
    reader.readAsText(file);
  }, [fields]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const validationErrors = useCallback(() => {
    const requiredFields = fields.filter((f) => f.required);
    const errors: { row: number; field: string }[] = [];
    csvRows.forEach((row, i) => {
      requiredFields.forEach((f) => {
        const csvCol = mapping[f.key];
        if (!csvCol || !row[csvCol]?.trim()) {
          errors.push({ row: i, field: f.label });
        }
      });
    });
    return errors;
  }, [csvRows, mapping, fields]);

  const errRows = new Set(validationErrors().map((e) => e.row));

  // For customers: also compute duplicate count
  const [duplicateCount, setDuplicateCount] = useState(0);
  const validCount = csvRows.length - errRows.size;

  const handleImport = async () => {
    setImporting(true);
    setStep("importing");

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    try {
      if (type === "customers") {
        // Check for existing emails
        const emails = csvRows.map((r) => mapping.email ? r[mapping.email]?.trim().toLowerCase() : "").filter(Boolean);
        const { data: existingByEmail } = await supabase.from("clients").select("email, phone").in("email", emails.length > 0 ? emails : ["__none__"]);
        const existingEmails = new Set((existingByEmail || []).map((e) => e.email?.toLowerCase()).filter(Boolean));

        // Check for existing phones (for rows without email)
        const phones = csvRows
          .map((r) => {
            const rawEmail = mapping.email ? r[mapping.email]?.trim() : "";
            if (rawEmail) return ""; // only check phone dups for rows without email
            const rawPhone = mapping.phone ? r[mapping.phone]?.trim() : "";
            return formatPhone(rawPhone) || "";
          })
          .filter(Boolean);
        const { data: existingByPhone } = await supabase.from("clients").select("phone").in("phone", phones.length > 0 ? phones : ["__none__"]);
        const existingPhones = new Set((existingByPhone || []).map((e) => e.phone).filter(Boolean));

        for (let i = 0; i < csvRows.length; i++) {
          if (errRows.has(i)) { errors++; continue; }
          const row = csvRows[i];
          const email = mapping.email ? row[mapping.email]?.trim().toLowerCase() : "";
          const phone = formatPhone(mapping.phone ? row[mapping.phone]?.trim() : "");

          // Duplicate check: by email first, then by phone if no email
          if (email && existingEmails.has(email)) { skipped++; continue; }
          if (!email && phone && existingPhones.has(phone)) { skipped++; continue; }

          const firstName = mapping.first_name ? row[mapping.first_name]?.trim() : "";
          const lastName = mapping.last_name ? row[mapping.last_name]?.trim() : "";
          const address = getCompositeValue(row, "address_line1", mapping, csvHeaders);
          const city = getCompositeValue(row, "city", mapping, csvHeaders);
          const state = getCompositeValue(row, "state", mapping, csvHeaders);
          const zip = getCompositeValue(row, "zip", mapping, csvHeaders);
          const notes = mapping.notes ? row[mapping.notes]?.trim() || null : null;
          const source = mapping.source ? row[mapping.source]?.trim() || "wix" : "wix";
          const createdAtRaw = mapping.created_at ? row[mapping.created_at]?.trim() : "";
          let createdAt: string | undefined;
          if (createdAtRaw) {
            const d = new Date(createdAtRaw);
            if (!isNaN(d.getTime())) createdAt = d.toISOString();
          }

          const insertData: Record<string, any> = {
            first_name: firstName || null,
            last_name: lastName || null,
            full_name: [firstName, lastName].filter(Boolean).join(" ") || null,
            email: email || null,
            phone: phone || null,
            address_line1: address || null,
            city: city || null,
            state: state || null,
            zip: zip || null,
            notes: notes,
            source: source,
          };
          if (createdAt) insertData.created_at = createdAt;

          const { error } = await supabase.from("clients").insert(insertData);

          if (error) { errors++; console.error("Import row error:", error); }
          else {
            imported++;
            if (email) existingEmails.add(email);
            if (phone) existingPhones.add(phone);
          }
        }
      } else {
        // Bookings import
        const { data: services } = await supabase.from("services").select("id, name, slug").eq("is_active", true);
        const serviceMap = new Map<string, string>();
        (services || []).forEach((s) => {
          serviceMap.set(s.name.toLowerCase(), s.id);
          serviceMap.set(s.slug.toLowerCase(), s.id);
        });
        const fallbackServiceId = services?.[0]?.id;

        for (let i = 0; i < csvRows.length; i++) {
          if (errRows.has(i)) { errors++; continue; }
          const row = csvRows[i];

          const serviceTypeName = mapping.service_type ? row[mapping.service_type]?.trim() : "";
          const serviceId = serviceMap.get(serviceTypeName.toLowerCase()) || fallbackServiceId;
          if (!serviceId) { errors++; continue; }

          const firstName = mapping.guest_name_first ? row[mapping.guest_name_first]?.trim() : "";
          const lastName = mapping.guest_name_last ? row[mapping.guest_name_last]?.trim() : "";
          const guestName = [firstName, lastName].filter(Boolean).join(" ") || "Imported Customer";

          const dateStr = mapping.scheduled_date ? row[mapping.scheduled_date]?.trim() : "";
          const timeStr = mapping.scheduled_time ? row[mapping.scheduled_time]?.trim() : "09:00";

          let parsedDate = dateStr;
          if (dateStr) {
            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) parsedDate = d.toISOString().split("T")[0];
          }

          const totalPrice = mapping.total_price ? parseFloat(row[mapping.total_price]?.replace(/[^0-9.]/g, "") || "0") : null;
          const rawStatus = mapping.status ? row[mapping.status]?.trim().toLowerCase() : "completed";
          const statusMap: Record<string, string> = {
            completed: "completed", done: "completed", finished: "completed",
            cancelled: "cancelled", canceled: "cancelled",
            pending: "pending", confirmed: "confirmed",
            "in progress": "in_progress", "in-progress": "in_progress",
            "no show": "no_show", "no-show": "no_show", noshow: "no_show",
          };
          const status = statusMap[rawStatus] || "completed";

          const paymentMethodRaw = mapping.payment_method ? row[mapping.payment_method]?.trim().toLowerCase() : "in_person";
          const pmMap: Record<string, string> = {
            cash: "in_person", "in person": "in_person", card: "card", stripe: "card",
            online: "card", deposit: "deposit",
          };
          const paymentMethod = pmMap[paymentMethodRaw] || "in_person";

          const { error } = await supabase.from("bookings").insert({
            service_id: serviceId,
            guest_name: guestName,
            guest_email: mapping.guest_email ? row[mapping.guest_email]?.trim() || null : null,
            guest_phone: mapping.guest_phone ? formatPhone(row[mapping.guest_phone]?.trim() || "") : null,
            vehicle_type: mapping.vehicle_type ? row[mapping.vehicle_type]?.trim() || null : null,
            vehicle_make: mapping.vehicle_make ? row[mapping.vehicle_make]?.trim() || null : null,
            vehicle_model: mapping.vehicle_model ? row[mapping.vehicle_model]?.trim() || null : null,
            scheduled_date: parsedDate,
            scheduled_time: timeStr,
            service_address: mapping.service_address ? row[mapping.service_address]?.trim() || null : null,
            service_city: mapping.service_city ? row[mapping.service_city]?.trim() || null : null,
            service_zip: mapping.service_zip ? row[mapping.service_zip]?.trim() || null : null,
            total_price: totalPrice,
            payment_method: paymentMethod,
            payment_status: totalPrice && totalPrice > 0 ? "paid" : "unpaid",
            status,
            customer_notes: mapping.customer_notes ? row[mapping.customer_notes]?.trim() || null : null,
          });

          if (error) { errors++; console.error("Booking import error:", error); }
          else imported++;
        }
      }

      // Log import history
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("import_history").insert({
        import_type: type,
        total_rows: csvRows.length,
        imported_rows: imported,
        skipped_rows: skipped,
        error_rows: errors,
        imported_by: user!.id,
      } as any);

      setResult({ imported, skipped, errors });
      setStep("done");
      toast.success(`Successfully imported ${imported} ${type}`);
    } catch (err) {
      console.error("Import failed:", err);
      toast.error("Import failed");
      setStep("preview");
    } finally {
      setImporting(false);
    }
  };

  /** Get the display value for a field in preview, applying transformations */
  function getPreviewValue(row: Record<string, string>, fieldKey: string): string {
    // For composite address fields, show the resolved value
    if (WIX_COMPOSITE_FIELDS[fieldKey]) {
      return getCompositeValue(row, fieldKey, mapping, csvHeaders);
    }
    if (fieldKey === "phone" || fieldKey === "guest_phone") {
      const col = mapping[fieldKey];
      return col ? formatPhone(row[col] || "") || "" : "";
    }
    const col = mapping[fieldKey];
    return col ? row[col] || "" : "";
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="mr-1 h-4 w-4" />Back
        </Button>
        <h2 className="text-lg font-semibold capitalize">Import {type}</h2>
        <div className="flex gap-1 ml-auto">
          {(["upload", "mapping", "preview", "done"] as Step[]).map((s) => (
            <div key={s} className={`h-1.5 w-8 rounded-full ${step === s || (step === "importing" && s === "preview") ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>
      </div>

      {/* UPLOAD STEP */}
      {step === "upload" && (
        <Card>
          <CardContent className="pt-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
              }`}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium">Drop your CSV file here</p>
              <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              <p className="text-xs text-muted-foreground mt-3">Supports Wix Contacts export format</p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* MAPPING STEP */}
      {step === "mapping" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Map CSV Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {fields.map((f) => (
              <div key={f.key} className="flex items-center gap-3">
                <span className="text-sm w-40 shrink-0">
                  {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
                </span>
                <Select value={mapping[f.key] || "__none__"} onValueChange={(v) => setMapping((p) => ({ ...p, [f.key]: v === "__none__" ? "" : v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select column..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">— Skip —</SelectItem>
                    {csvHeaders.map((h) => (
                      <SelectItem key={h} value={h}>{h}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            <div className="flex justify-end pt-3">
              <Button onClick={() => setStep("preview")}>
                Next: Preview <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* PREVIEW STEP */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Badge variant="outline" className="text-sm py-1 px-3">{csvRows.length} rows found</Badge>
            <Badge variant="secondary" className="text-sm py-1 px-3 text-green-700">{validCount} valid</Badge>
            {errRows.size > 0 && (
              <Badge variant="destructive" className="text-sm py-1 px-3">{errRows.size} with errors</Badge>
            )}
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Preview (first 5 rows)</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">#</TableHead>
                    {fields.filter((f) => mapping[f.key] || WIX_COMPOSITE_FIELDS[f.key]).map((f) => (
                      <TableHead key={f.key} className="text-xs whitespace-nowrap">{f.label}</TableHead>
                    ))}
                    <TableHead className="w-20">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvRows.slice(0, 5).map((row, i) => (
                    <TableRow key={i} className={errRows.has(i) ? "bg-destructive/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{i + 1}</TableCell>
                      {fields.filter((f) => mapping[f.key] || WIX_COMPOSITE_FIELDS[f.key]).map((f) => (
                        <TableCell key={f.key} className="text-xs max-w-[150px] truncate">
                          {getPreviewValue(row, f.key) || <span className="text-muted-foreground italic">—</span>}
                        </TableCell>
                      ))}
                      <TableCell>
                        {errRows.has(i) ? (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        ) : (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {errRows.size > 0 && (
            <Card className="border-destructive/30">
              <CardContent className="pt-4">
                <p className="text-sm font-medium text-destructive mb-2">
                  <AlertTriangle className="inline h-4 w-4 mr-1" />
                  {errRows.size} row(s) have missing required fields and will be skipped:
                </p>
                <ul className="text-xs text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
                  {validationErrors().slice(0, 20).map((e, i) => (
                    <li key={i}>Row {e.row + 1}: missing <strong>{e.field}</strong></li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-3 justify-between">
            <Button variant="outline" onClick={() => setStep("mapping")}>
              <ArrowLeft className="mr-1 h-4 w-4" />Edit Mapping
            </Button>
            <Button onClick={handleImport} disabled={validCount === 0}>
              <Check className="mr-1 h-4 w-4" />
              Confirm Import ({validCount} rows)
            </Button>
          </div>
        </div>
      )}

      {/* IMPORTING STEP */}
      {step === "importing" && (
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-3" />
            <p className="font-medium">Importing {type}...</p>
            <p className="text-sm text-muted-foreground mt-1">Please don't close this page</p>
          </CardContent>
        </Card>
      )}

      {/* DONE STEP */}
      {step === "done" && result && (
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <Check className="h-7 w-7 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">Import Complete!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Successfully imported <strong>{result.imported}</strong> {type}
                {result.skipped > 0 && <>, <strong>{result.skipped}</strong> skipped as duplicates</>}
                {result.errors > 0 && <>, <strong>{result.errors}</strong> errors</>}
              </p>
            </div>
            <Button onClick={onClose}>Done</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
