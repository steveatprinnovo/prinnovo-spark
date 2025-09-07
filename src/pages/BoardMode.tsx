import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useAuth } from "@/hooks/useAuth";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileSpreadsheet, Presentation, Users, Target, FileText, Gift, DollarSign, CheckCircle, Cog, GitBranch, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface AgendaItem {
  id: string;
  item: string;
  presenter: string;
  time: string;
}

interface CompanyData {
  id: string;
  companyTitle: string;
  logoFile: File | null;
  logoUrl: string | null;
  internalChampions: string;
  valueImpactTeam: string;
  ipaTerms: string;
  referralIncentive: string;
  internalAnnualCost: string;
  keyPoints: string;
  validation: string;
  itNeedsPilot: string;
  postPilot: string;
  excelFile: File | null;
}

export default function BoardMode() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [agendaDate, setAgendaDate] = useState(format(new Date(), "MMMM dd yyyy"));
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { id: "1", item: "", presenter: "", time: "" },
    { id: "2", item: "", presenter: "", time: "" },
    { id: "3", item: "", presenter: "", time: "" }
  ]);
  const [companies, setCompanies] = useState<CompanyData[]>([
    {
      id: "1",
      companyTitle: "Sample Healthcare Company",
      logoFile: null,
      logoUrl: "https://via.placeholder.com/150x150/4F46E5/FFFFFF?text=LOGO",
      internalChampions: "Dr. Smith, Jane Doe",
      valueImpactTeam: "Value engineering team assigned with 3 clinical specialists",
      ipaTerms: "24-month term with quarterly review milestones",
      referralIncentive: "Tiered commission structure: 2% Year 1, 1.5% Year 2",
      internalAnnualCost: "125000",
      keyPoints: "Strong clinical outcomes, proven ROI, scalable platform",
      validation: "Pilot completed successfully with 95% provider satisfaction",
      itNeedsPilot: "Integration with Epic EHR required, 6-month implementation timeline",
      postPilot: "Expand to 3 additional locations, develop custom reporting dashboard",
      excelFile: new File(["sample,data\n1,2\n3,4"], "sample.xlsx", { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    }
  ]);
  const [activeCompanyId, setActiveCompanyId] = useState("1");
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [excelCells, setExcelCells] = useState<any>({});
  const [excelSheets, setExcelSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>("");
  const [sheetRange, setSheetRange] = useState<any>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [presentationMode, setPresentationMode] = useState(true);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState(false);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load saved companies from localStorage on mount
  useEffect(() => {
    const savedCompanies = localStorage.getItem('boardModeCompanies');
    if (savedCompanies) {
      try {
        const parsedCompanies = JSON.parse(savedCompanies);
        if (Array.isArray(parsedCompanies) && parsedCompanies.length > 0) {
          setCompanies(parsedCompanies);
          setActiveCompanyId(parsedCompanies[0].id);
        }
      } catch (error) {
        console.error('Error loading saved companies:', error);
      }
    }
  }, []);

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

  const updateCompanyField = (companyId: string, field: keyof CompanyData, value: any) => {
    setCompanies(companies => 
      companies.map(company => 
        company.id === companyId ? { ...company, [field]: value } : company
      )
    );
  };

  const addNewCompany = () => {
    const newCompany: CompanyData = {
      id: Date.now().toString(),
      companyTitle: "",
      logoFile: null,
      logoUrl: null,
      internalChampions: "",
      valueImpactTeam: "",
      ipaTerms: "",
      referralIncentive: "",
      internalAnnualCost: "",
      keyPoints: "",
      validation: "",
      itNeedsPilot: "",
      postPilot: "",
      excelFile: null,
    };
    setCompanies([...companies, newCompany]);
    setActiveCompanyId(newCompany.id);
  };

  const saveCompanyData = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;
    
    // Save to localStorage for persistence
    const savedCompanies = companies.map(c => ({
      ...c,
      logoFile: null, // Don't save file objects to localStorage
      excelFile: null // Don't save file objects to localStorage
    }));
    localStorage.setItem('boardModeCompanies', JSON.stringify(savedCompanies));
    
    toast.success(`${company.companyTitle || 'Company'} data saved successfully!`);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, companyId: string) => {
    const file = event.target.files?.[0];
    const company = companies.find(c => c.id === companyId);
    if (!file || !company?.companyTitle.trim()) {
      toast.error("Please enter a company title first");
      return;
    }

    updateCompanyField(companyId, 'logoFile', file);
    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${company.companyTitle.toLowerCase().replace(/\s+/g, '-')}-logo.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('Company Logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedLogo, error: signedErr } = await supabase.storage
        .from('Company Logos')
        .createSignedUrl(filePath, 3600);

      if (signedErr) throw signedErr;

      updateCompanyField(companyId, 'logoUrl', signedLogo?.signedUrl || null);
      toast.success("Logo uploaded successfully!");
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error("Failed to upload logo");
    } finally {
      setUploading(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>, companyId: string) => {
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

    updateCompanyField(companyId, 'excelFile', file);
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
      setActiveCompanyId(companyId);
      toast.success("Excel file loaded successfully!");
    } catch (error) {
      console.error('Error reading Excel file:', error);
      toast.error("Failed to read Excel file");
    } finally {
      setUploading(false);
    }
  };

  const handleSheetChange = (sheetName: string) => {
    const activeCompany = companies.find(c => c.id === activeCompanyId);
    if (!activeCompany?.excelFile) return;
    
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
    reader.readAsArrayBuffer(activeCompany.excelFile);
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
      
      {/* Presentation Mode Toggle */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-6 py-3">
          <div className="flex justify-end items-center gap-3">
            <Presentation className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="presentation-mode" className="text-sm font-medium">
              Presentation Mode
            </Label>
            <Switch
              id="presentation-mode"
              checked={presentationMode}
              onCheckedChange={setPresentationMode}
            />
          </div>
        </div>
      </div>
      
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
                placeholder="MMMM DD YYYY"
                disabled={presentationMode}
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
                    disabled={presentationMode}
                  />
                </div>
                <div className="col-span-4">
                  <Input
                    value={item.presenter}
                    onChange={(e) => updateAgendaItem(item.id, 'presenter', e.target.value)}
                    placeholder="Enter presenter(s)"
                    className="border-0 shadow-none focus-visible:ring-0 p-2"
                    disabled={presentationMode}
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    value={item.time}
                    onChange={(e) => updateAgendaItem(item.id, 'time', e.target.value)}
                    placeholder="Time"
                    className="border-0 shadow-none focus-visible:ring-0 p-2"
                    disabled={presentationMode}
                  />
                </div>
                <div className="col-span-1 flex justify-center">
                  {agendaItems.length > 1 && !presentationMode && (
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
            
            {!presentationMode && (
              <Button
                variant="outline"
                onClick={addAgendaItem}
                className="mt-4"
              >
                Add Agenda Item
              </Button>
            )}
          </div>
        </div>

        {/* Separator */}
        <Separator className="my-8" />

        {/* New Board Approvals Section */}
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">New Board Approvals</h1>
          
          {presentationMode ? (
            // Presentation Mode - Professional Layout
            <div className="space-y-12">
              {companies.filter(company => company.companyTitle.trim()).map((company, index) => (
                <div key={company.id} className="bg-white shadow-lg rounded-lg overflow-hidden min-h-[600px]">
                  {/* Header with logos */}
                  <div className="bg-gradient-to-r from-blue-50 to-gray-50 p-6 border-b">
                    <div className="flex justify-between items-start">
                       <div className="flex items-start gap-6">
                         <div className="flex flex-col items-center gap-3">
                           {(company.logoUrl || company.logoFile) && (
                             <img 
                               src={company.logoUrl || (company.logoFile ? URL.createObjectURL(company.logoFile) : '')} 
                               alt="Company logo" 
                               className="h-14 w-14 object-contain"
                             />
                           )}
                           {company.excelFile && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => {
                                 setActiveCompanyId(company.id);
                                 setShowExcelModal(true);
                               }}
                               className="flex items-center gap-2 text-xs"
                             >
                               <FileSpreadsheet className="h-3 w-3" />
                               View Financial Pro-Forma
                             </Button>
                           )}
                         </div>
                         <div className="flex-1">
                           <h2 className="text-2xl font-bold text-gray-900">
                             Partnership Review – {company.companyTitle}
                           </h2>
                           <p className="text-sm text-gray-600 mt-1">Internal Champion(s): {company.internalChampions}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <img 
                          src="/lovable-uploads/eca45e5a-5531-4df2-9100-f1abdac3ca74.png"
                          alt="Healthliant Ventures"
                          className="h-8 w-auto object-contain"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content Grid */}
                  <div className="p-6 grid grid-cols-2 gap-8">
                    {/* Left Column */}
                    <div className="space-y-6">
                       <div className="bg-green-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <Users className="h-4 w-4" />
                           Value & Impact Team:
                         </h3>
                        <p className="text-sm text-gray-700">
                          {company.valueImpactTeam || "Team details to be provided"}
                        </p>
                      </div>

                       <div className="bg-blue-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <Target className="h-4 w-4" />
                           Key Points:
                         </h3>
                         <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.keyPoints || "Key points to be documented"}</ReactMarkdown>
                         </div>
                      </div>

                       <div className="bg-yellow-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <FileText className="h-4 w-4" />
                           IPA Terms:
                         </h3>
                         <div className="text-sm text-gray-700 prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.ipaTerms || "IPA terms to be defined"}</ReactMarkdown>
                         </div>
                      </div>

                       <div className="bg-orange-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <Gift className="h-4 w-4" />
                           Referral Incentive:
                         </h3>
                        <p className="text-sm text-gray-700">
                          {company.referralIncentive || "Incentive structure to be defined"}
                        </p>
                      </div>

                       <div className="bg-red-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <DollarSign className="h-4 w-4" />
                           Internal Annual Cost:
                         </h3>
                        <p className="text-lg font-bold text-gray-900">
                          {company.internalAnnualCost ? `$${parseFloat(company.internalAnnualCost).toLocaleString()}` : "$0"}
                        </p>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                       <div className="bg-gray-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <CheckCircle className="h-4 w-4" />
                           Validation:
                         </h3>
                         <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.validation || "Validation details to be provided"}</ReactMarkdown>
                         </div>
                      </div>

                       <div className="bg-purple-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <GitBranch className="h-4 w-4" />
                           Post-Pilot / Co-Development:
                         </h3>
                         <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.postPilot || "Post-pilot strategy to be developed"}</ReactMarkdown>
                         </div>
                      </div>

                       <div className="bg-indigo-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <Cog className="h-4 w-4" />
                           IT Needs and Pilot:
                         </h3>
                         <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.itNeedsPilot || "IT requirements and pilot details"}</ReactMarkdown>
                         </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-100 px-6 py-3 text-right">
                    <p className="text-xs text-gray-500">Proprietary and Confidential</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Edit Mode - Original Form Layout
            <div className="space-y-6">
              {companies.map((company, index) => (
                <div key={company.id} className="border rounded-lg p-6 space-y-6">
                  <h2 className="text-xl font-semibold">Company {index + 1}</h2>
                  
                  <div className="space-y-6">
                    {/* Company Title */}
                    <div className="space-y-2">
                      <Label htmlFor={`company-title-${company.id}`}>Company Title</Label>
                      <Input
                        id={`company-title-${company.id}`}
                        value={company.companyTitle}
                        onChange={(e) => updateCompanyField(company.id, 'companyTitle', e.target.value)}
                        placeholder="Enter company title"
                        className="max-w-md"
                      />
                    </div>

                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <Label>Company Logo</Label>
                      <div className="flex items-center gap-4">
                        {company.logoUrl ? (
                          <div className="flex items-center gap-4">
                            <img 
                              src={company.logoUrl} 
                              alt="Company logo" 
                              className="h-16 w-16 object-contain border rounded"
                            />
                            <Button
                              variant="outline"
                              onClick={() => {
                                updateCompanyField(company.id, 'logoUrl', null);
                                updateCompanyField(company.id, 'logoFile', null);
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
                            <Button 
                              variant="outline" 
                              onClick={() => document.getElementById(`logo-upload-${company.id}`)?.click()}
                              disabled={uploading || !company.companyTitle.trim()}
                            >
                              {uploading ? "Uploading..." : "Upload Logo"}
                            </Button>
                            <Input
                              id={`logo-upload-${company.id}`}
                              type="file"
                              accept="image/*"
                              onChange={(e) => handleLogoUpload(e, company.id)}
                              className="hidden"
                              disabled={uploading || !company.companyTitle.trim()}
                            />
                          </div>
                        )}
                      </div>
                      {!company.companyTitle.trim() && (
                        <p className="text-sm text-muted-foreground">Please enter a company title first</p>
                      )}
                    </div>

                    {/* Additional Input Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor={`internal-champions-${company.id}`}>Internal Champion(s)</Label>
                        <Input
                          id={`internal-champions-${company.id}`}
                          value={company.internalChampions}
                          onChange={(e) => updateCompanyField(company.id, 'internalChampions', e.target.value)}
                          placeholder="Enter internal champion(s)"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`value-impact-team-${company.id}`}>Value and Impact Team</Label>
                        <Input
                          id={`value-impact-team-${company.id}`}
                          value={company.valueImpactTeam}
                          onChange={(e) => updateCompanyField(company.id, 'valueImpactTeam', e.target.value)}
                          placeholder="Enter value and impact team"
                          className="w-full"
                        />
                      </div>
                      
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Label htmlFor={`ipa-terms-${company.id}`}>IPA Terms</Label>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setShowMarkdownHelp(true)}
                             className="h-6 w-6 p-0 rounded-full border"
                           >
                             <HelpCircle className="h-3 w-3" />
                           </Button>
                         </div>
                         <Textarea
                           id={`ipa-terms-${company.id}`}
                           value={company.ipaTerms}
                           onChange={(e) => updateCompanyField(company.id, 'ipaTerms', e.target.value)}
                           placeholder="Enter IPA terms (Markdown supported)"
                           className="w-full min-h-[100px] resize-y"
                         />
                       </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`referral-incentive-${company.id}`}>Referral Incentive</Label>
                        <Input
                          id={`referral-incentive-${company.id}`}
                          value={company.referralIncentive}
                          onChange={(e) => updateCompanyField(company.id, 'referralIncentive', e.target.value)}
                          placeholder="Enter referral incentive"
                          className="w-full"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor={`internal-annual-cost-${company.id}`}>Internal Annual Cost</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input
                            id={`internal-annual-cost-${company.id}`}
                            type="number"
                            value={company.internalAnnualCost}
                            onChange={(e) => updateCompanyField(company.id, 'internalAnnualCost', e.target.value)}
                            placeholder="0.00"
                            className="pl-8 w-full"
                          />
                        </div>
                      </div>
                      
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Label htmlFor={`key-points-${company.id}`}>Key Points</Label>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setShowMarkdownHelp(true)}
                             className="h-6 w-6 p-0 rounded-full border"
                           >
                             <HelpCircle className="h-3 w-3" />
                           </Button>
                         </div>
                         <Textarea
                           id={`key-points-${company.id}`}
                           value={company.keyPoints}
                           onChange={(e) => updateCompanyField(company.id, 'keyPoints', e.target.value)}
                           placeholder="Enter key points (Markdown supported)"
                           className="w-full min-h-[100px] resize-y"
                         />
                       </div>
                      
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Label htmlFor={`validation-${company.id}`}>Validation</Label>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setShowMarkdownHelp(true)}
                             className="h-6 w-6 p-0 rounded-full border"
                           >
                             <HelpCircle className="h-3 w-3" />
                           </Button>
                         </div>
                         <Textarea
                           id={`validation-${company.id}`}
                           value={company.validation}
                           onChange={(e) => updateCompanyField(company.id, 'validation', e.target.value)}
                           placeholder="Enter validation (Markdown supported)"
                           className="w-full min-h-[100px] resize-y"
                         />
                       </div>
                      
                       <div className="space-y-2">
                         <div className="flex items-center gap-2">
                           <Label htmlFor={`it-needs-pilot-${company.id}`}>IT Needs and Pilot</Label>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setShowMarkdownHelp(true)}
                             className="h-6 w-6 p-0 rounded-full border"
                           >
                             <HelpCircle className="h-3 w-3" />
                           </Button>
                         </div>
                         <Textarea
                           id={`it-needs-pilot-${company.id}`}
                           value={company.itNeedsPilot}
                           onChange={(e) => updateCompanyField(company.id, 'itNeedsPilot', e.target.value)}
                           placeholder="Enter IT needs and pilot (Markdown supported)"
                           className="w-full min-h-[100px] resize-y"
                         />
                       </div>
                      
                       <div className="space-y-2 md:col-span-2">
                         <div className="flex items-center gap-2">
                           <Label htmlFor={`post-pilot-${company.id}`}>Post-Pilot and Co-Development</Label>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setShowMarkdownHelp(true)}
                             className="h-6 w-6 p-0 rounded-full border"
                           >
                             <HelpCircle className="h-3 w-3" />
                           </Button>
                         </div>
                         <Textarea
                           id={`post-pilot-${company.id}`}
                           value={company.postPilot}
                           onChange={(e) => updateCompanyField(company.id, 'postPilot', e.target.value)}
                           placeholder="Enter post-pilot and co-development (Markdown supported)"
                           className="w-full min-h-[100px] resize-y"
                         />
                       </div>
                    </div>

                    {/* Excel Upload */}
                    <div className="space-y-2">
                      <Label>Upload Excel Pro-Forma</Label>
                      <div className="flex items-center gap-4">
                        {company.excelFile ? (
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 p-2 border rounded">
                              <FileSpreadsheet className="h-4 w-4 text-green-600" />
                              <span className="text-sm">{company.excelFile.name}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setShowExcelModal(true);
                                  setActiveCompanyId(company.id);
                                }}
                                className="h-6 w-6 p-0"
                              >
                                <FileSpreadsheet className="h-4 w-4" />
                              </Button>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => {
                                updateCompanyField(company.id, 'excelFile', null);
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
                          <Label htmlFor={`excel-upload-${company.id}`} className="cursor-pointer">
                            <Button variant="outline" asChild disabled={uploading}>
                              <span>
                                {uploading ? "Loading..." : "Upload Excel"}
                              </span>
                            </Button>
                            <Input
                              id={`excel-upload-${company.id}`}
                              type="file"
                              accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                              onChange={(e) => handleExcelUpload(e, company.id)}
                              className="hidden"
                              disabled={uploading}
                            />
                          </Label>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Save/Update Button */}
                  <div className="flex justify-end pt-4">
                    <Button 
                      onClick={() => saveCompanyData(company.id)}
                      className="w-32"
                    >
                      Save Changes
                    </Button>
                  </div>
                  
                  {/* Separator line below Save button */}
                  <Separator />
                </div>
              ))}
              
              {/* Add New Company Button */}
              <Button
                variant="outline"
                onClick={addNewCompany}
                className="w-full mt-4"
              >
                Add New Company
              </Button>
            </div>
          )}
        </div>

        {/* Excel Preview Modal */}
        <Dialog open={showExcelModal} onOpenChange={setShowExcelModal}>
          <DialogContent className="max-w-[95vw] w-[95vw] h-[95vh] p-4 overflow-hidden">
            <DialogHeader className="pb-2">
              <DialogTitle className="text-lg">Excel Preview{companies.find(c => c.id === activeCompanyId)?.excelFile?.name ? ` - ${companies.find(c => c.id === activeCompanyId)?.excelFile?.name}` : ""}</DialogTitle>
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
        
        {/* Markdown Help Modal */}
        <Dialog open={showMarkdownHelp} onOpenChange={setShowMarkdownHelp}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Markdown Syntax Guide</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Headers</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    # Header 1<br/>
                    ## Header 2<br/>
                    ### Header 3
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Text Formatting</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    **Bold text**<br/>
                    *Italic text*<br/>
                    ~~Strikethrough~~<br/>
                    `Inline code`
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Lists</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    • Unordered list item<br/>
                    • Another item<br/>
                    <br/>
                    1. Ordered list item<br/>
                    2. Another item
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Links & Images</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    [Link text](https://example.com)<br/>
                    ![Image alt text](image-url.jpg)
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Code Blocks</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    ```<br/>
                    Code block<br/>
                    Multiple lines<br/>
                    ```
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Tables</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    | Header 1 | Header 2 |<br/>
                    |----------|----------|<br/>
                    | Cell 1   | Cell 2   |
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Quotes</h4>
                  <div className="bg-muted p-3 rounded text-sm font-mono">
                    &gt; This is a quote<br/>
                    &gt; Continued quote
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}