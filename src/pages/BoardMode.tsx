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
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
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
      const workbook = XLSX.read(arrayBuffer, { cellStyles: true, cellNF: true });
      
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
        
        // Calculate column widths
        calculateColumnWidths(jsonData as any[][], worksheet);
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
        const workbook = XLSX.read(arrayBuffer, { cellStyles: true, cellNF: true });
        const worksheet = workbook.Sheets[sheetName];
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        setSheetRange(range);
        setExcelCells(worksheet);
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
        setExcelData(jsonData as any[][]);
        
        // Calculate column widths
        calculateColumnWidths(jsonData as any[][], worksheet);
      }
    };
    reader.readAsArrayBuffer(excelFile);
  };

  const calculateColumnWidths = (data: any[][], worksheet: any) => {
    if (!data.length) return;
    
    const maxCols = Math.max(...data.map(row => row.length));
    const widths: number[] = [];
    
    for (let col = 0; col < maxCols; col++) {
      let maxWidth = 80; // Minimum width
      
      for (let row = 0; row < Math.min(data.length, 100); row++) { // Check first 100 rows for performance
        const cellValue = data[row][col];
        if (cellValue != null) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          
          let displayValue = "";
          if (cell) {
            displayValue = formatCellValue(cellValue, row, col);
          } else {
            displayValue = cellValue.toString();
          }
          
          // Estimate width based on character count
          const estimatedWidth = Math.min(Math.max(displayValue.length * 8 + 20, 80), 300);
          maxWidth = Math.max(maxWidth, estimatedWidth);
        }
      }
      
      widths.push(maxWidth);
    }
    
    setColumnWidths(widths);
  };

  const getTableStyle = () => {
    const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const maxViewportWidth = window.innerWidth * 0.9; // 90% of viewport width
    const maxViewportHeight = window.innerHeight * 0.7; // 70% of viewport height
    
    return {
      width: Math.min(totalWidth, maxViewportWidth),
      maxHeight: maxViewportHeight,
      fontSize: totalWidth > maxViewportWidth ? '12px' : '14px'
    };
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
    
    // Check for style information
    if (cell.s) {
      const cellStyle = cell.s;
      
      // Font styling
      if (cellStyle.font) {
        const font = cellStyle.font;
        
        // Font weight (bold)
        if (font.bold) {
          style.fontWeight = 'bold';
        }
        
        // Font style (italic)
        if (font.italic) {
          style.fontStyle = 'italic';
        }
        
        // Underline
        if (font.underline) {
          style.textDecoration = 'underline';
        }
        
        // Font size
        if (font.sz) {
          style.fontSize = `${font.sz}px`;
        }
        
        // Font color
        if (font.color && font.color.rgb) {
          style.color = `#${font.color.rgb}`;
        }
        
        // Font name
        if (font.name) {
          style.fontFamily = font.name;
        }
      }
      
      // Background color
      if (cellStyle.fill && cellStyle.fill.fgColor && cellStyle.fill.fgColor.rgb) {
        style.backgroundColor = `#${cellStyle.fill.fgColor.rgb}`;
      }
      
      // Text alignment
      if (cellStyle.alignment) {
        if (cellStyle.alignment.horizontal) {
          switch (cellStyle.alignment.horizontal) {
            case 'left':
              style.textAlign = 'left';
              break;
            case 'center':
              style.textAlign = 'center';
              break;
            case 'right':
              style.textAlign = 'right';
              break;
            case 'justify':
              style.textAlign = 'justify';
              break;
          }
        }
        
        if (cellStyle.alignment.vertical) {
          switch (cellStyle.alignment.vertical) {
            case 'top':
              style.verticalAlign = 'top';
              break;
            case 'center':
              style.verticalAlign = 'middle';
              break;
            case 'bottom':
              style.verticalAlign = 'bottom';
              break;
          }
        }
        
        // Text wrap
        if (cellStyle.alignment.wrapText) {
          style.whiteSpace = 'pre-wrap';
          style.wordWrap = 'break-word';
        }
      }
      
      // Borders
      if (cellStyle.border) {
        const border = cellStyle.border;
        if (border.top && border.top.style) {
          style.borderTop = `1px solid #000`;
        }
        if (border.bottom && border.bottom.style) {
          style.borderBottom = `1px solid #000`;
        }
        if (border.left && border.left.style) {
          style.borderLeft = `1px solid #000`;
        }
        if (border.right && border.right.style) {
          style.borderRight = `1px solid #000`;
        }
      }
    }
    
    // Fallback styling based on cell type for basic formatting
    if (!style.textAlign) {
      if (cell.t === 'n' && cell.z) {
        const format = cell.z.toLowerCase();
        if (format.includes('$') || format.includes('currency') || format.includes('accounting') || format.includes('#,##0')) {
          style.textAlign = 'right';
          style.fontFamily = style.fontFamily || 'monospace';
        } else if (format.includes('%')) {
          style.textAlign = 'right';
        } else if (format.includes('date') || format.includes('mm') || format.includes('dd')) {
          style.textAlign = 'center';
        }
      } else if (cell.t === 'd') {
        style.textAlign = 'center';
      } else if (cell.t === 'b') {
        style.textAlign = 'center';
        style.fontWeight = style.fontWeight || 'bold';
      }
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

            {/* Additional Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="internal-champions">Internal Champion(s)</Label>
                <Input
                  id="internal-champions"
                  placeholder="Enter internal champion(s)"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value-impact-team">Value and Impact Team</Label>
                <Input
                  id="value-impact-team"
                  placeholder="Enter value and impact team"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ipa-terms">IPA Terms</Label>
                <Input
                  id="ipa-terms"
                  placeholder="Enter IPA terms"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="referral-incentive">Referral Incentive</Label>
                <Input
                  id="referral-incentive"
                  placeholder="Enter referral incentive"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="internal-annual-cost">Internal Annual Cost</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    id="internal-annual-cost"
                    type="number"
                    placeholder="0.00"
                    className="pl-8 w-full"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="key-points">Key Points</Label>
                <Input
                  id="key-points"
                  placeholder="Enter key points"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="validation">Validation</Label>
                <Input
                  id="validation"
                  placeholder="Enter validation"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="it-needs-pilot">IT Needs and Pilot</Label>
                <Input
                  id="it-needs-pilot"
                  placeholder="Enter IT needs and pilot"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="post-pilot">Post-Pilot and Co-Development</Label>
                <Input
                  id="post-pilot"
                  placeholder="Enter post-pilot and co-development"
                  className="w-full"
                />
              </div>
            </div>

            {/* Excel Upload */}
            <div className="space-y-2">
              <Label>Upload Excel Pro-Forma</Label>
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
                        setColumnWidths([]);
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
          <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-4 overflow-hidden">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">Excel Preview{excelFile?.name ? ` - ${excelFile.name}` : ""}</DialogTitle>
              <DialogDescription className="sr-only">
                Preview of the uploaded Excel document
              </DialogDescription>
            </DialogHeader>
            
            {excelSheets.length > 1 && (
              <div className="mb-3 pb-2 border-b">
                <Label htmlFor="sheet-select" className="text-sm font-medium mr-2">
                  Select Sheet:
                </Label>
                <select
                  id="sheet-select"
                  value={selectedSheet}
                  onChange={(e) => handleSheetChange(e.target.value)}
                  className="px-3 py-1 border rounded text-sm"
                >
                  {excelSheets.map((sheetName) => (
                    <option key={sheetName} value={sheetName}>
                      {sheetName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {excelData.length > 0 ? (
                <div style={getTableStyle()}>
                  <table className="border-collapse" style={{ width: '100%', tableLayout: 'fixed' }}>
                    <colgroup>
                      {columnWidths.map((width, index) => (
                        <col key={index} style={{ width: `${width}px` }} />
                      ))}
                    </colgroup>
                    <tbody>
                      {excelData.map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex === 0 ? "bg-muted font-medium" : ""}>
                          {row.map((cell, cellIndex) => {
                            const formattedValue = formatCellValue(cell, rowIndex, cellIndex);
                            const cellStyle = getCellStyle(rowIndex, cellIndex);
                             return (
                               <td
                                 key={cellIndex}
                                 className="border px-2 py-1 text-xs"
                                 style={{
                                   ...cellStyle,
                                   width: `${columnWidths[cellIndex] || 100}px`,
                                   minWidth: `${columnWidths[cellIndex] || 100}px`,
                                   maxWidth: `${columnWidths[cellIndex] || 100}px`,
                                   overflow: 'visible',
                                   whiteSpace: cellStyle.whiteSpace || 'nowrap',
                                   textOverflow: 'ellipsis'
                                 }}
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