import { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

interface AgendaItem {
  id: string;
  item: string;
  presenter: string;
  time: string;
}

export default function BoardMode() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [agendaDate, setAgendaDate] = useState(format(new Date(), "MMMM, dd, yyyy"));
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { id: "1", item: "", presenter: "", time: "" },
    { id: "2", item: "", presenter: "", time: "" },
    { id: "3", item: "", presenter: "", time: "" }
  ]);
  const [companyTitle, setCompanyTitle] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [excelCells, setExcelCells] = useState<any>({});
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [sheetRange, setSheetRange] = useState<any>(null);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const addAgendaItem = () => {
    const newItem: AgendaItem = {
      id: Date.now().toString(),
      item: "",
      presenter: "",
      time: ""
    };
    setAgendaItems([...agendaItems, newItem]);
  };

  const updateAgendaItem = (id: string, field: keyof Omit<AgendaItem, 'id'>, value: string) => {
    setAgendaItems(items => 
      items.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeAgendaItem = (id: string) => {
    if (agendaItems.length > 1) {
      setAgendaItems(items => items.filter(item => item.id !== id));
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !companyTitle.trim()) {
      toast.error("Please enter a company title first");
      return;
    }

    setLogoFile(file);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${companyTitle.toLowerCase().replace(/\s+/g, '-')}-logo.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Company Logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedLogo, error: signedErr } = await supabase.storage
        .from('Company Logos')
        .createSignedUrl(filePath, 3600);

      if (signedErr) throw signedErr;

      setLogoUrl(signedLogo?.signedUrl || null);
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an Excel file
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel.sheet.macroEnabled.12',
      'text/csv'
    ];
    
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Please select a valid Excel file (.xlsx, .xls, .csv)");
      return;
    }

    setExcelFile(file);
    setUploading(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      
      // Get sheet names
      const sheetNames = workbook.SheetNames;
      setExcelSheets(sheetNames);
      
      // Set first sheet as default
      if (sheetNames.length > 0) {
        const firstSheet = sheetNames[0];
        setSelectedSheet(firstSheet);
        
        // Get worksheet and its range
        const worksheet = workbook.Sheets[firstSheet];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        setSheetRange(range);
        
        // Store the raw worksheet cells for formatting
        setExcelCells(worksheet);
        
        // Convert sheet to JSON but preserve cell info
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        setExcelData(jsonData as any[][]);
      }
      
      setShowExcelModal(true);
      toast.success("Excel file loaded successfully!");
    } catch (error) {
      console.error('Error reading Excel file:', error);
      toast.error("Failed to read Excel file");
    } finally {
      setUploading(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    if (!excelFile) return;
    
    setSelectedSheet(sheetName);
    
    // Re-read the file and extract data for the selected sheet
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target?.result;
      if (arrayBuffer) {
        const workbook = XLSX.read(arrayBuffer);
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        setSheetRange(range);
        setExcelCells(worksheet);
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        setExcelData(jsonData as any[][]);
      }
    };
    reader.readAsArrayBuffer(excelFile);
  };

  const formatCellValue = (value: any, rowIndex: number, cellIndex: number) => {
    if (!excelCells || !sheetRange) return value?.toString() || "";
    
    // Calculate the Excel cell address
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: cellIndex });
    const cell = excelCells[cellAddress];
    
    if (!cell) return value?.toString() || "";
    
    // Handle different cell types
    switch (cell.t) {
      case 'n': // Number
        if (cell.z) {
          // Apply number format
          try {
            return XLSX.SSF.format(cell.z, cell.v);
          } catch {
            return cell.w || cell.v?.toString() || "";
          }
        }
        return cell.w || cell.v?.toString() || "";
      case 'd': // Date
        if (cell.w) return cell.w;
        return new Date(cell.v).toLocaleDateString();
      case 's': // String
        return cell.v?.toString() || "";
      case 'b': // Boolean
        return cell.v ? 'TRUE' : 'FALSE';
      case 'e': // Error
        return cell.w || '#ERROR';
      default:
        return cell.w || cell.v?.toString() || "";
    }
  };

  const getCellStyle = (rowIndex: number, cellIndex: number) => {
    if (!excelCells || !sheetRange) return {};
    
    const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: cellIndex });
    const cell = excelCells[cellAddress];
    
    if (!cell) return {};
    
    let style: React.CSSProperties = {};
    
    // Check cell type for basic styling
    if (cell.t === 'n' && cell.z) {
      // Number formatting hints
      const format = cell.z.toLowerCase();
      if (format.includes('$') || format.includes('currency')) {
        style.textAlign = 'right';
        style.fontFamily = 'monospace';
      } else if (format.includes('%')) {
        style.textAlign = 'right';
      } else if (format.includes('date') || format.includes('mm') || format.includes('dd')) {
        style.textAlign = 'center';
      } else if (format.includes('accounting') || format.includes('#,##0')) {
        style.textAlign = 'right';
        style.fontFamily = 'monospace';
      }
    }
    
    // Date cells
    if (cell.t === 'd') {
      style.textAlign = 'center';
    }
    
    // Boolean cells
    if (cell.t === 'b') {
      style.textAlign = 'center';
      style.fontWeight = 'bold';
    }
    
    return style;
  };

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto p-6 space-y-8">
        {/* Agenda Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Agenda</h1>
            <div className="flex items-center gap-2">
              <Label htmlFor="agenda-date" className="text-sm font-medium">
                Date:
              </Label>
              <Input
                id="agenda-date"
                value={agendaDate}
                onChange={(e) => setAgendaDate(e.target.value)}
                className="w-48"
                placeholder="MMMM, DD, YYYY"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            {/* Table Headers */}
            <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground mb-2">
              <div className="col-span-5">Agenda Item</div>
              <div className="col-span-4">Agenda Presenter(s)</div>
              <div className="col-span-2">Agenda Time</div>
              <div className="col-span-1"></div>
            </div>
            
            {/* Table Rows */}
            {agendaItems.map((item) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <Input
                    value={item.item}
                    onChange={(e) => updateAgendaItem(item.id, 'item', e.target.value)}
                    placeholder="Enter agenda item"
                    className="border-0 shadow-none focus-visible:ring-0 p-2"
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    value={item.presenter}
                    onChange={(e) => updateAgendaItem(item.id, 'presenter', e.target.value)}
                    placeholder="Enter presenter(s)"
                    className="border-0 shadow-none focus-visible:ring-0 p-2"
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={item.time}
                    onChange={(e) => updateAgendaItem(item.id, 'time', e.target.value)}
                    placeholder="Time"
                    className="border-0 shadow-none focus-visible:ring-0 p-2"
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {agendaItems.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAgendaItem(item.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            
            <Button
              variant="outline"
              onClick={addAgendaItem}
              className="mt-4"
            >
              Add Agenda Item
            </Button>
          </div>
        </div>

        {/* Separator */}
        <Separator className="my-8" />

        {/* New Board Approvals Section */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">New Board Approvals</h1>
          
          <div className="space-y-6">
            {/* Company Title */}
            <div className="space-y-2">
              <Label htmlFor="company-title">Company Title</Label>
              <Input
                id="company-title"
                value={companyTitle}
                onChange={(e) => setCompanyTitle(e.target.value)}
                placeholder="Enter company title"
                className="max-w-md"
              />
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Company Logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl ? (
                  <div className="flex items-center gap-4">
                    <img 
                      src={logoUrl} 
                      alt="Company logo" 
                      className="h-16 w-16 object-contain border rounded"
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLogoUrl(null);
                        setLogoFile(null);
                      }}
                    >
                      Remove Logo
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <Button variant="outline" asChild disabled={uploading || !companyTitle.trim()}>
                        <span>
                          {uploading ? "Uploading..." : "Upload Logo"}
                        </span>
                      </Button>
                      <Input
                        id="logo-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploading || !companyTitle.trim()}
                      />
                    </Label>
                  </div>
                )}
              </div>
              {!companyTitle.trim() && (
                <p className="text-sm text-muted-foreground">Please enter a company title first</p>
              )}
            </div>

            {/* Excel Upload */}
            <div className="space-y-2">
              <Label>Excel Document</Label>
              <div className="flex items-center gap-4">
                {excelFile ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 p-2 border rounded">
                      <FileSpreadsheet className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{excelFile.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowExcelModal(true)}
                        className="h-6 w-6 p-0"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setExcelFile(null);
                        setExcelData([]);
                        setExcelCells({});
                        setExcelSheets([]);
                        setSelectedSheet("");
                        setSheetRange(null);
                      }}
                    >
                      Remove Excel
                    </Button>
                  </div>
                ) : (
                  <Label htmlFor="excel-upload" className="cursor-pointer">
                    <Button variant="outline" asChild disabled={uploading}>
                      <span>
                        {uploading ? "Loading..." : "Upload Excel"}
                      </span>
                    </Button>
                    <Input
                      id="excel-upload"
                      type="file"
                      accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                      onChange={handleExcelUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </Label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Excel Preview Modal */}
        <Dialog open={showExcelModal} onOpenChange={setShowExcelModal}>
          <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-4">
            <DialogHeader>
              <DialogTitle>Excel Preview{excelFile?.name ? ` - ${excelFile.name}` : ""}</DialogTitle>
              <DialogDescription className="sr-only">
                Preview of the uploaded Excel document
              </DialogDescription>
            </DialogHeader>
            
            {excelSheets.length > 1 && (
              <div className="mb-4">
                <Label htmlFor="sheet-select" className="text-sm font-medium">
                  Select Sheet:
                </Label>
                <select
                  id="sheet-select"
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="ml-2 px-3 py-1 border rounded text-sm"
                >
                  {excelSheets.map((sheetName) => (
                    <option key={sheetName} value={sheetName}>
                      {sheetName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex-1 overflow-auto border rounded">
              {excelData.length > 0 ? (
                <div className="min-w-full">
                  <table className="w-full border-collapse">
                    <tbody>
                      {excelData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex === 0 ? "bg-muted font-medium" : ""}>
                          {row.map((cell, cellIndex) => {
                            const formattedValue = formatCellValue(cell, rowIndex, cellIndex);
                            const cellStyle = getCellStyle(rowIndex, cellIndex);
                            return (
                              <td
                                key={cellIndex}
                                className="border px-2 py-1 text-sm min-w-[100px] max-w-[200px] truncate"
                                style={cellStyle}
                                title={formattedValue}
                              >
                                {formattedValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  No data available to display.
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}