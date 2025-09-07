import { useState, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as XLSX from 'xlsx';
import { useBoardApprovals, type CompanyData } from "@/hooks/useBoardApprovals";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { Upload, X, FileSpreadsheet, Presentation, Users, Target, FileText, Gift, DollarSign, CheckCircle, Cog, GitBranch, HelpCircle } from "lucide-react";
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
  const { 
    companies, 
    loading: companiesLoading, 
    saving, 
    addNewCompany, 
    updateCompanyField, 
    saveCompany, 
    removeCompany 
  } = useBoardApprovals();
  
  const [agendaDate, setAgendaDate] = useState(format(new Date(), "MMMM dd yyyy"));
  const [agendaItems, setAgendaItems] = useState<AgendaItem[]>([
    { id: "1", item: "", presenter: "", time: "" },
    { id: "2", item: "", presenter: "", time: "" },
    { id: "3", item: "", presenter: "", time: "" }
  ]);
  const [activeCompanyId, setActiveCompanyId] = useState("");
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
  const [selectedPresentationCompany, setSelectedPresentationCompany] = useState<string>("");

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Set first company as active when companies load
  useEffect(() => {
    if (companies.length > 0 && !activeCompanyId) {
      setActiveCompanyId(companies[0].id);
    }
  }, [companies, activeCompanyId]);

  // Load Excel data when modal opens
  useEffect(() => {
    console.log('Excel modal useEffect triggered:', showExcelModal, activeCompanyId);
    if (!showExcelModal || !activeCompanyId) return;
    
    const activeCompany = companies.find(c => c.id === activeCompanyId);
    if (!activeCompany) return;

    const loadExcelData = async () => {
      try {
        let arrayBuffer: ArrayBuffer;
        
        if (activeCompany.excelFile) {
          // Load from local file
          arrayBuffer = await activeCompany.excelFile.arrayBuffer();
        } else if (activeCompany.excelUrl) {
          // Load from URL
          const response = await fetch(activeCompany.excelUrl);
          arrayBuffer = await response.arrayBuffer();
        } else {
          return;
        }

        const workbook = XLSX.read(arrayBuffer);
        const sheetNames = workbook.SheetNames;
        
        setExcelSheets(sheetNames);
        
        if (sheetNames.length > 0) {
          const firstSheet = workbook.Sheets[sheetNames[0]];
          const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1:A1');
          setSheetRange(range);
          
          const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          setExcelData(data as any[][]);
          setSelectedSheet(sheetNames[0]);
          
          // Calculate column widths
          const widths = [];
          for (let col = range.s.c; col <= range.e.c; col++) {
            let maxWidth = 100;
            for (let row = range.s.r; row <= Math.min(range.e.r, 100); row++) {
              const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
              const cellValue = firstSheet[cellAddress]?.v || '';
              const textWidth = String(cellValue).length * 8;
              maxWidth = Math.max(maxWidth, Math.min(textWidth, 300));
            }
            widths.push(maxWidth);
          }
          setColumnWidths(widths);
          setExcelCells(firstSheet);
        }
      } catch (error) {
        console.error('Error loading Excel data:', error);
        toast.error('Failed to load Excel file');
      }
    };

    loadExcelData();
  }, [showExcelModal, activeCompanyId, companies]);

  const addAgendaItem = () => {
    const newItem: AgendaItem = {
      id: Date.now().toString(),
      item: "",
      presenter: "",
      time: ""
    };
    setAgendaItems([...agendaItems, newItem]);
  };

  const updateAgendaItem = (id: string, field: keyof AgendaItem, value: string) => {
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

  const handleAddNewCompany = () => {
    const newCompany = addNewCompany();
    setActiveCompanyId(newCompany.id);
  };

  const handleSaveCompany = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company || !company.companyTitle.trim()) {
      toast.error("Please enter a company title first");
      return;
    }
    
    await saveCompany(company);
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>, companyId: string) => {
    const file = event.target.files?.[0];
    const company = companies.find(c => c.id === companyId);
    if (!file || !company?.companyTitle.trim()) {
      toast.error("Please enter a company title first");
      return;
    }

    setUploading(true);
    try {
      // Update the company with the new logo file
      updateCompanyField(companyId, 'logoFile', file);
      
      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      updateCompanyField(companyId, 'logoUrl', previewUrl);
      
      toast.success("Logo uploaded successfully! Remember to save your changes.");
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>, companyId: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);
      const sheetNames = workbook.SheetNames;
      
      setExcelSheets(sheetNames);
      
      if (sheetNames.length > 0) {
        const firstSheet = workbook.Sheets[sheetNames[0]];
        const range = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1:A1');
        setSheetRange(range);
        
        const data = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        setExcelData(data as any[][]);
        setSelectedSheet(sheetNames[0]);
        
        // Calculate column widths based on content
        const widths = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          let maxWidth = 100;
          for (let row = range.s.r; row <= Math.min(range.e.r, 100); row++) {
            const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
            const cellValue = firstSheet[cellAddress]?.v || '';
            const textWidth = String(cellValue).length * 8;
            maxWidth = Math.max(maxWidth, Math.min(textWidth, 300));
          }
          widths.push(maxWidth);
        }
        setColumnWidths(widths);
        
        // Store cells data for styling
        setExcelCells(firstSheet);
      }
      
      // Update the company with the new Excel file
      updateCompanyField(companyId, 'excelFile', file);
      
      toast.success("Excel file uploaded successfully! Remember to save your changes.");
    } catch (error: any) {
      console.error('Error uploading Excel:', error);
      toast.error('Failed to upload Excel file');
    } finally {
      setUploading(false);
    }
  };

  const handleSheetChange = async (sheetName: string) => {
    const activeCompany = companies.find(c => c.id === activeCompanyId);
    if (!activeCompany || (!activeCompany.excelFile && !activeCompany.excelUrl)) return;

    setSelectedSheet(sheetName);
    
    try {
      let arrayBuffer: ArrayBuffer;
      
      if (activeCompany.excelFile) {
        arrayBuffer = await activeCompany.excelFile.arrayBuffer();
      } else if (activeCompany.excelUrl) {
        const response = await fetch(activeCompany.excelUrl);
        arrayBuffer = await response.arrayBuffer();
      } else {
        return;
      }

      const workbook = XLSX.read(arrayBuffer);
      const sheet = workbook.Sheets[sheetName];
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
      setSheetRange(range);
      
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      setExcelData(data as any[][]);
      
      const widths = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        let maxWidth = 100;
        for (let row = range.s.r; row <= Math.min(range.e.r, 100); row++) {
          const cellAddress = XLSX.utils.encode_cell({ c: col, r: row });
          const cellValue = sheet[cellAddress]?.v || '';
          const textWidth = String(cellValue).length * 8;
          maxWidth = Math.max(maxWidth, Math.min(textWidth, 300));
        }
        widths.push(maxWidth);
      }
      setColumnWidths(widths);
      setExcelCells(sheet);
    } catch (error) {
      console.error('Error loading sheet:', error);
      toast.error('Failed to load sheet data');
    }
  };

  const loading = authLoading || companiesLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Board Mode</h1>
            <p className="text-gray-600 mt-1">{currentDate}</p>
          </div>
          
          {/* Presentation Mode Toggle */}
          <div className="flex items-center gap-3">
            <Label htmlFor="presentation-mode" className="text-sm font-medium">
              Presentation Mode
            </Label>
            <Switch
              id="presentation-mode"
              checked={presentationMode}
              onCheckedChange={setPresentationMode}
            />
            <Presentation className="h-5 w-5 text-gray-600" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {/* Agenda Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">
              {presentationMode ? `${agendaDate} Board Agenda` : "Meeting Agenda"}
            </h2>
            
            {!presentationMode && (
              <div className="mb-4">
                <Label htmlFor="agenda-date">Date</Label>
                <Input
                  id="agenda-date"
                  value={agendaDate}
                  onChange={(e) => setAgendaDate(e.target.value)}
                  className="max-w-md mt-1"
                />
              </div>
            )}

            <div className="space-y-4">
              {agendaItems.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1">
                    <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                  </div>
                   <div className="col-span-5">
                     {presentationMode ? (
                       <div className="text-black font-bold py-2 px-3">
                         {item.item || "Agenda item"}
                       </div>
                     ) : (
                       <Input
                         value={item.item}
                         onChange={(e) => updateAgendaItem(item.id, 'item', e.target.value)}
                         placeholder="Agenda item"
                       />
                     )}
                   </div>
                   <div className="col-span-3">
                     {presentationMode ? (
                       <div className="text-black font-bold py-2 px-3">
                         {item.presenter || "Presenter"}
                       </div>
                     ) : (
                       <Input
                         value={item.presenter}
                         onChange={(e) => updateAgendaItem(item.id, 'presenter', e.target.value)}
                         placeholder="Presenter"
                       />
                     )}
                   </div>
                   <div className="col-span-2">
                     {presentationMode ? (
                       <div className="text-black font-bold py-2 px-3">
                         {item.time || "Time"}
                       </div>
                     ) : (
                       <Input
                         value={item.time}
                         onChange={(e) => updateAgendaItem(item.id, 'time', e.target.value)}
                         placeholder="Time"
                       />
                     )}
                   </div>
                  <div className="col-span-1">
                    {!presentationMode && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAgendaItem(item.id)}
                        disabled={agendaItems.length <= 1}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!presentationMode && (
              <Button
                onClick={addAgendaItem}
                variant="outline"
                className="mt-4"
              >
                Add Agenda Item
              </Button>
            )}
          </div>

          <Separator />

          {/* New Board Approvals Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">New Board Approvals</h2>
              {presentationMode ? (
                <div className="flex items-center gap-3">
                  <Select value={selectedPresentationCompany} onValueChange={setSelectedPresentationCompany}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Select company to present..." />
                    </SelectTrigger>
                    <SelectContent className="bg-white z-50">
                      <SelectItem value="all">All companies</SelectItem>
                      {companies
                        .filter(c => c.readyToPresent && c.companyTitle.trim())
                        .map((company) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.companyTitle}
                          </SelectItem>
                      ))}
                      {companies.filter(c => c.readyToPresent && c.companyTitle.trim()).length === 0 && (
                        <SelectItem value="none" disabled>
                          No companies ready to present
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500">
                    ({companies.filter(c => c.readyToPresent && c.companyTitle.trim()).length} ready)
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  {companies.length > 0 && (
                    <select
                      value={activeCompanyId}
                      onChange={(e) => setActiveCompanyId(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select a company to edit...</option>
                      {companies.map((company) => (
                        <option key={company.id} value={company.id}>
                          {company.companyTitle || 'Untitled Company'}
                        </option>
                      ))}
                    </select>
                  )}
                  <Button onClick={handleAddNewCompany} className="flex items-center gap-2">
                    <span>Add New Company</span>
                  </Button>
                </div>
              )}
            </div>

          {presentationMode ? (
            // Presentation Mode - Professional Slide Format
            <div className="space-y-8">
              {companies
                .filter(company => 
                  company.companyTitle.trim() && 
                  company.readyToPresent &&
                  (selectedPresentationCompany === "all" || 
                   (selectedPresentationCompany !== "" && selectedPresentationCompany === company.id))
                )
                .map((company) => (
                <div key={company.id} className="bg-white border-2 border-gray-300 rounded-lg overflow-hidden shadow-lg">
                  {/* Header */}
                  <div className="bg-white border-b border-gray-200 p-6">
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
                           {(company.excelFile || company.excelUrl) && (
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
                       {/* Value & Impact Team */}
                       <div className="bg-green-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <Users className="h-4 w-4" />
                           Value & Impact Team:
                         </h3>
                         <p className="text-sm text-gray-700">
                           {company.valueImpactTeam || "Team details to be provided"}
                         </p>
                       </div>

                        {/* Key Points Section */}
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                            <Target className="h-4 w-4" />
                            Key Points:
                          </h3>
                         <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.keyPoints || "Key points to be documented"}</ReactMarkdown>
                         </div>
                       </div>

                       {/* IPA Terms */}
                       <div className="bg-yellow-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <FileText className="h-4 w-4" />
                           IPA Terms:
                         </h3>
                         <div className="text-sm text-gray-700 prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.ipaTerms || "IPA terms to be defined"}</ReactMarkdown>
                         </div>
                       </div>

                       {/* Referral Incentive */}
                       <div className="bg-orange-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <Gift className="h-4 w-4" />
                           External Venture Office Referral Incentive:
                         </h3>
                         <p className="text-sm text-gray-700">
                           {company.referralIncentive || "Incentive structure to be defined"}
                         </p>
                       </div>

                       {/* Financial Information */}
                       <div className="bg-red-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <DollarSign className="h-4 w-4" />
                           Health System Cost:
                         </h3>
                         <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-gray-600">One-Time Implementation / Training:</span>
                             <span className="text-sm font-semibold text-gray-900">
                               {company.oneTimeImplementationCost ? `$${parseFloat(company.oneTimeImplementationCost).toLocaleString()}` : "$0"}
                             </span>
                           </div>
                           <div className="flex justify-between items-center">
                             <span className="text-sm text-gray-600">Annual Subscription:</span>
                             <span className="text-sm font-semibold text-gray-900">
                               {company.annualSubscriptionCost ? `$${parseFloat(company.annualSubscriptionCost).toLocaleString()}` : "$0"}
                             </span>
                           </div>
                            <div className="border-t pt-2 flex justify-between items-center">
                              <span className="text-sm font-bold text-gray-900">First Year Cost:</span>
                              <span className="text-lg font-bold text-gray-900">
                                {company.firstYearCost ? `$${parseFloat(company.firstYearCost).toLocaleString()}` : "$0"}
                              </span>
                            </div>
                         </div>
                       </div>
                     </div>

                     {/* Right Column */}
                     <div className="space-y-6">
                       {/* Validation Section */}
                       <div className="bg-gray-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <CheckCircle className="h-4 w-4" />
                           Validation:
                         </h3>
                         <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.validation || "Validation details to be provided"}</ReactMarkdown>
                         </div>
                       </div>

                       {/* Post-Pilot / Co-Development */}
                       <div className="bg-purple-50 p-4 rounded-lg">
                         <h3 className="font-bold text-gray-900 mb-3 text-sm uppercase tracking-wide flex items-center gap-2">
                           <GitBranch className="h-4 w-4" />
                           Post-Pilot / Co-Development:
                         </h3>
                         <div className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-4 [&_ul]:ml-4 [&_ol]:pl-2 [&_ul]:pl-2 whitespace-pre-wrap">
                           <ReactMarkdown remarkPlugins={[remarkGfm]}>{company.postPilot || "Post-pilot strategy to be developed"}</ReactMarkdown>
                         </div>
                       </div>

                       {/* IT Needs and Pilot */}
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
               {companies.length === 0 ? (
                 <div className="text-center py-8 text-gray-500">
                   <p>No companies yet. Click "Add New Company" to get started.</p>
                 </div>
               ) : !activeCompanyId ? (
                 <div className="text-center py-8 text-gray-500">
                   <p>Select a company from the dropdown above to edit.</p>
                 </div>
               ) : companies.filter(company => company.id === activeCompanyId).map((company, index) => (
                 <div key={company.id} className="border rounded-lg p-6 space-y-6">
                   <div className="flex justify-between items-center">
                     <h2 className="text-xl font-semibold">Company {index + 1}</h2>
                     <div className="flex gap-2">
                       <Button
                         onClick={() => handleSaveCompany(company.id)}
                         disabled={saving || !company.companyTitle.trim()}
                         className="flex items-center gap-2"
                       >
                         {saving ? "Saving..." : "Save"}
                       </Button>
                       {companies.length > 1 && (
                         <Button
                           onClick={() => removeCompany(company.id)}
                           variant="destructive"
                           size="sm"
                         >
                           Remove
                         </Button>
                       )}
                     </div>
                   </div>

                   {/* Ready to Present Toggle */}
                   <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                     <div className="space-y-1">
                       <Label htmlFor={`ready-to-present-${company.id}`} className="text-sm font-medium">
                         Ready to Present
                       </Label>
                       <p className="text-xs text-gray-600">
                         Enable to show this company in Presentation Mode
                       </p>
                     </div>
                     <Switch
                       id={`ready-to-present-${company.id}`}
                       checked={company.readyToPresent}
                       onCheckedChange={(checked) => updateCompanyField(company.id, 'readyToPresent', checked)}
                     />
                   </div>
                    
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
                         <Label htmlFor={`referral-incentive-${company.id}`}>External Venture Office Referral Incentive</Label>
                         <Input
                           id={`referral-incentive-${company.id}`}
                           value={company.referralIncentive}
                           onChange={(e) => updateCompanyField(company.id, 'referralIncentive', e.target.value)}
                           placeholder="Enter referral incentive"
                           className="w-full"
                         />
                       </div>
                       
                       <div className="space-y-4 md:col-span-2">
                         <Label className="text-base font-semibold">Health System Cost</Label>
                         
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <div className="space-y-2">
                             <Label htmlFor={`one-time-implementation-cost-${company.id}`}>One-Time Implementation / Training Costs</Label>
                             <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                               <Input
                                 id={`one-time-implementation-cost-${company.id}`}
                                 type="number"
                                 value={company.oneTimeImplementationCost}
                                 onChange={(e) => updateCompanyField(company.id, 'oneTimeImplementationCost', e.target.value)}
                                 placeholder="0.00"
                                 className="pl-8 w-full"
                               />
                             </div>
                           </div>
                           
                           <div className="space-y-2">
                             <Label htmlFor={`annual-subscription-cost-${company.id}`}>Annual Subscription Cost</Label>
                             <div className="relative">
                               <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                               <Input
                                 id={`annual-subscription-cost-${company.id}`}
                                 type="number"
                                 value={company.annualSubscriptionCost}
                                 onChange={(e) => updateCompanyField(company.id, 'annualSubscriptionCost', e.target.value)}
                                 placeholder="0.00"
                                 className="pl-8 w-full"
                               />
                             </div>
                           </div>
                           
                            <div className="space-y-2">
                              <Label htmlFor={`first-year-cost-${company.id}`}>First Year Cost</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                <Input
                                  id={`first-year-cost-${company.id}`}
                                  type="number"
                                  value={company.firstYearCost}
                                  onChange={(e) => updateCompanyField(company.id, 'firstYearCost', e.target.value)}
                                  placeholder="0.00"
                                  className="pl-8 w-full"
                                />
                             </div>
                           </div>
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
                          {(company.excelFile || company.excelUrl) ? (
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 p-2 border rounded">
                                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                                <span className="text-sm">
                                  {company.excelFile?.name || "Uploaded Excel File"}
                                </span>
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
                                  updateCompanyField(company.id, 'excelUrl', null);
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
                 </div>
                ))
                }
               </div>
           )}
          </div>
        </div>

        {/* Excel Preview Modal */}
        <Dialog open={showExcelModal} onOpenChange={setShowExcelModal}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>Excel Preview</DialogTitle>
              <DialogDescription>
                Preview of the uploaded Excel file data
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col h-[70vh]">
              {excelSheets.length > 1 && (
                <div className="mb-4 flex gap-2 flex-wrap">
                  {excelSheets.map((sheetName) => (
                    <Button
                      key={sheetName}
                      variant={selectedSheet === sheetName ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleSheetChange(sheetName)}
                    >
                      {sheetName}
                    </Button>
                  ))}
                </div>
              )}
              
              {excelData.length > 0 ? (
                <div className="flex-1 overflow-auto border rounded">
                  <table className="w-full text-sm">
                    <tbody>
                      {excelData.map((row: any[], rowIndex: number) => (
                        <tr key={rowIndex} className="border-b">
                          {row.map((cell: any, cellIndex: number) => {
                            const cellAddress = XLSX.utils.encode_cell({ c: cellIndex, r: rowIndex });
                            const cellData = excelCells[cellAddress];
                            const cellStyle = cellData?.s || {};
                            
                            let formattedValue = cell;
                            if (cellData?.t === 'n' && cellData?.z) {
                              try {
                                formattedValue = XLSX.SSF.format(cellData.z, cell);
                              } catch (e) {
                                formattedValue = String(cell || '');
                              }
                            } else {
                              formattedValue = String(cell || '');
                            }

                            return (
                              <td
                                key={cellIndex}
                                className="border-r p-2 text-left"
                                style={{
                                  width: `${columnWidths[cellIndex] || 100}px`,
                                  minWidth: `${columnWidths[cellIndex] || 100}px`,
                                  maxWidth: `${columnWidths[cellIndex] || 100}px`,
                                  overflow: 'hidden',
                                  whiteSpace: 'normal',
                                  wordWrap: 'break-word',
                                  wordBreak: 'break-word',
                                  textOverflow: 'clip',
                                  verticalAlign: 'top'
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