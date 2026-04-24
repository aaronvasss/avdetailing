import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileSpreadsheet, Check, AlertCircle, Users, ArrowRight, Loader2, List, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClientsListView } from "./ClientsListView";

interface CsvRow {
  [key: string]: string;
}

interface FieldMapping {
  [csvColumn: string]: string;
}

const CLIENT_FIELDS = [
  { value: "", label: "— Skip —" },
  { value: "first_name", label: "First Name" },
  { value: "last_name", label: "Last Name" },
  { value: "full_name", label: "Full Name" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "address_line1", label: "Address Line 1" },
  { value: "address_line2", label: "Address Line 2" },
  { value: "city", label: "City" },
  { value: "state", label: "State" },
  { value: "zip", label: "ZIP Code" },
  { value: "notes", label: "Notes" },
];

// Common Wix CSV header mappings
const AUTO_MAPPINGS: { [key: string]: string } = {
  "first name": "first_name",
  "firstname": "first_name",
  "last name": "last_name",
  "lastname": "last_name",
  "name": "full_name",
  "full name": "full_name",
  "fullname": "full_name",
  "email": "email",
  "email address": "email",
  "phone": "phone",
  "phone number": "phone",
  "mobile": "phone",
  "mobile phone": "phone",
  "address": "address_line1",
  "street address": "address_line1",
  "address line 1": "address_line1",
  "address line 2": "address_line2",
  "city": "city",
  "state": "state",
  "zip": "zip",
  "zip code": "zip",
  "postal code": "zip",
  "zipcode": "zip",
  "notes": "notes",
  "note": "notes",
  "comments": "notes",
};

interface ImportResult {
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
}

export function AdminClientsTab() {
  const [activeTab, setActiveTab] = useState("list");
  const [step, setStep] = useState<"upload" | "mapping" | "preview" | "importing" | "complete">("upload");
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<FieldMapping>({});
  const [importing, setImporting] = useState(false);
  const [exportingContacts, setExportingContacts] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [fileName, setFileName] = useState<string>("");

  const parseCSV = useCallback((text: string): { headers: string[]; rows: CsvRow[] } => {
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    // Parse headers
    const headers = parseCSVLine(lines[0]);
    
    // Parse rows
    const rows: CsvRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      if (values.length > 0) {
        const row: CsvRow = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || "";
        });
        rows.push(row);
      }
    }

    return { headers, rows };
  }, []);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  const autoMapFields = (headers: string[]) => {
    const mapping: FieldMapping = {};
    headers.forEach(header => {
      const normalizedHeader = header.toLowerCase().trim();
      if (AUTO_MAPPINGS[normalizedHeader]) {
        mapping[header] = AUTO_MAPPINGS[normalizedHeader];
      }
    });
    return mapping;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error("Please upload a CSV file");
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      
      if (headers.length === 0 || rows.length === 0) {
        toast.error("CSV file appears to be empty or invalid");
        return;
      }

      setCsvHeaders(headers);
      setCsvData(rows);
      setFieldMapping(autoMapFields(headers));
      setStep("mapping");
    };
    reader.readAsText(file);
  };

  const handleMappingChange = (csvColumn: string, targetField: string) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvColumn]: targetField
    }));
  };

  const getMappedPreviewData = () => {
    return csvData.slice(0, 10).map(row => {
      const mapped: { [key: string]: string } = {};
      Object.entries(fieldMapping).forEach(([csvCol, targetField]) => {
        if (targetField) {
          mapped[targetField] = row[csvCol] || "";
        }
      });
      return mapped;
    });
  };

  const normalizePhone = (phone: string): string => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '');
    // Format as needed
    if (digits.length === 10) {
      return `+1${digits}`;
    }
    if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`;
    }
    return digits ? `+${digits}` : '';
  };

  const handleImport = async () => {
    setStep("importing");
    setImporting(true);
    setImportProgress(0);

    const result: ImportResult = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: []
    };

    const totalRows = csvData.length;

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      
      try {
        // Build the client record from mapped fields
        const clientData: { [key: string]: string } = {
          source: 'wix'
        };

        Object.entries(fieldMapping).forEach(([csvCol, targetField]) => {
          if (targetField && row[csvCol]) {
            let value = row[csvCol].trim();
            if (targetField === 'phone') {
              value = normalizePhone(value);
            }
            clientData[targetField] = value;
          }
        });

        // Generate full_name if not provided but first/last are
        if (!clientData.full_name && (clientData.first_name || clientData.last_name)) {
          clientData.full_name = [clientData.first_name, clientData.last_name].filter(Boolean).join(' ');
        }

        // Need at least email or phone to create a client
        if (!clientData.email && !clientData.phone) {
          result.skipped++;
          continue;
        }

        // Try to find existing client by email first, then phone
        let existingClient = null;
        
        if (clientData.email) {
          const { data } = await supabase
            .from('clients')
            .select('id')
            .eq('email', clientData.email)
            .maybeSingle();
          existingClient = data;
        }

        if (!existingClient && clientData.phone) {
          const { data } = await supabase
            .from('clients')
            .select('id')
            .eq('phone', clientData.phone)
            .maybeSingle();
          existingClient = data;
        }

        if (existingClient) {
          // Update existing client
          const { error } = await supabase
            .from('clients')
            .update(clientData)
            .eq('id', existingClient.id);

          if (error) throw error;
          result.updated++;
        } else {
          // Insert new client
          const { error } = await supabase
            .from('clients')
            .insert(clientData);

          if (error) throw error;
          result.created++;
        }
      } catch (err: any) {
        console.error('Import error:', err);
        result.errors.push(`Row ${i + 2}: ${err.message}`);
      }

      setImportProgress(Math.round(((i + 1) / totalRows) * 100));
    }

    setImportResult(result);
    setImporting(false);
    setStep("complete");
  };

  const resetImport = () => {
    setStep("upload");
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMapping({});
    setImportProgress(0);
    setImportResult(null);
    setFileName("");
  };

  const escapeCsvValue = (value: string | null | undefined) => {
    const stringValue = value ?? "";
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const handleExportContacts = async () => {
    setExportingContacts(true);

    try {
      const allContacts: Array<{ name: string | null; email: string | null; phone: string | null }> = [];
      const pageSize = 1000;

      for (let from = 0; ; from += pageSize) {
        const { data, error } = await (supabase as any)
          .from("contacts")
          .select("name,email,phone")
          .order("created_at", { ascending: false })
          .range(from, from + pageSize - 1);

        if (error) throw error;

        allContacts.push(...(data ?? []));
        if (!data || data.length < pageSize) break;
      }

      const csvRows = [
        "Name,Email,Phone",
        ...allContacts.map((contact) => [
          escapeCsvValue(contact.name),
          escapeCsvValue(contact.email),
          escapeCsvValue(contact.phone),
        ].join(",")),
      ];

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "av-detailing-contacts.csv";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Contacts exported successfully");
    } catch (error) {
      console.error("Contact export error:", error);
      toast.error("Failed to export contacts");
    } finally {
      setExportingContacts(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="list" className="flex items-center gap-2">
          <List className="h-4 w-4" />
          View All
        </TabsTrigger>
        <TabsTrigger value="import" className="flex items-center gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExportContacts} disabled={exportingContacts}>
              {exportingContacts ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Export Contacts
            </Button>
          </div>
          <ClientsListView />
        </div>
      </TabsContent>

      <TabsContent value="import">
        <div className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {["upload", "mapping", "preview", "complete"].map((s, i) => (
              <div key={s} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === s || (step === "importing" && s === "preview")
                    ? "bg-primary text-primary-foreground" 
                    : ["mapping", "preview", "importing", "complete"].indexOf(step) > ["upload", "mapping", "preview", "complete"].indexOf(s)
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {i + 1}
                </div>
                {i < 3 && <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />}
              </div>
            ))}
          </div>

          {/* Upload Step */}
          {step === "upload" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Import Clients from CSV
                </CardTitle>
                <CardDescription>
                  Upload your Wix export CSV file to import clients into your database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <Label htmlFor="csv-upload" className="cursor-pointer">
                    <span className="text-lg font-medium text-primary hover:underline">
                      Click to upload CSV
                    </span>
                    <Input
                      id="csv-upload"
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    Supports Wix contact exports and standard CSV formats
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Mapping Step */}
          {step === "mapping" && (
            <Card>
              <CardHeader>
                <CardTitle>Map CSV Columns</CardTitle>
                <CardDescription>
                  Match your CSV columns to client fields. Found {csvData.length} rows in {fileName}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  {csvHeaders.map(header => (
                    <div key={header} className="flex items-center gap-4">
                      <div className="w-1/3 font-mono text-sm bg-muted px-3 py-2 rounded">
                        {header}
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <Select
                        value={fieldMapping[header] || ""}
                        onValueChange={(value) => handleMappingChange(header, value)}
                      >
                        <SelectTrigger className="w-1/3">
                          <SelectValue placeholder="Select field..." />
                        </SelectTrigger>
                        <SelectContent>
                          {CLIENT_FIELDS.map(field => (
                            <SelectItem key={field.value} value={field.value || "skip"}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldMapping[header] && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={resetImport}>
                    Cancel
                  </Button>
                  <Button onClick={() => setStep("preview")}>
                    Preview Import
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview Step */}
          {step === "preview" && (
            <Card>
              <CardHeader>
                <CardTitle>Preview Import</CardTitle>
                <CardDescription>
                  Review the first 10 rows before importing all {csvData.length} records
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.values(fieldMapping).filter(Boolean).map(field => (
                          <TableHead key={field} className="capitalize">
                            {field.replace(/_/g, ' ')}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getMappedPreviewData().map((row, i) => (
                        <TableRow key={i}>
                          {Object.values(fieldMapping).filter(Boolean).map(field => (
                            <TableCell key={field} className="max-w-[200px] truncate">
                              {row[field] || "—"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setStep("mapping")}>
                    Back to Mapping
                  </Button>
                  <Button onClick={handleImport}>
                    Import {csvData.length} Clients
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Importing Step */}
          {step === "importing" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Importing Clients...
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={importProgress} className="h-3" />
                <p className="text-center text-muted-foreground">
                  Processing {csvData.length} records... {importProgress}%
                </p>
              </CardContent>
            </Card>
          )}

          {/* Complete Step */}
          {step === "complete" && importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <Check className="h-5 w-5" />
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-500/10 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-green-600">{importResult.created}</div>
                    <div className="text-sm text-muted-foreground">New Clients</div>
                  </div>
                  <div className="bg-blue-500/10 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-blue-600">{importResult.updated}</div>
                    <div className="text-sm text-muted-foreground">Updated</div>
                  </div>
                  <div className="bg-yellow-500/10 p-4 rounded-lg text-center">
                    <div className="text-3xl font-bold text-yellow-600">{importResult.skipped}</div>
                    <div className="text-sm text-muted-foreground">Skipped</div>
                  </div>
                </div>

                {importResult.errors.length > 0 && (
                  <div className="bg-destructive/10 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                      <AlertCircle className="h-4 w-4" />
                      {importResult.errors.length} Errors
                    </div>
                    <ul className="text-sm text-muted-foreground space-y-1 max-h-32 overflow-y-auto">
                      {importResult.errors.slice(0, 10).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li>...and {importResult.errors.length - 10} more</li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={resetImport} variant="outline" className="flex-1">
                    Import More
                  </Button>
                  <Button onClick={() => setActiveTab("list")} className="flex-1">
                    View Clients
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}
