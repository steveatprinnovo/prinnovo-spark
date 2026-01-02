import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { VentureOfficeDropdown } from "@/components/VentureOfficeDropdown";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { useDuplicatedCompanyNames } from "@/hooks/useDuplicatedCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { useVentureOfficeDetails, VentureOfficeDetails } from "@/hooks/useVentureOfficeDetails";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Plus, Save, X, Pencil, Briefcase, HelpCircle, Upload, ImageIcon, TrendingUp, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVentureOfficeLogo } from "@/hooks/useVentureOfficeLogo";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import prinnovoLogo from "@/assets/prinnovo-logo.webp";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice, loading: authzLoading } = useUserAuth();
  const { selectedVentureOffice, changeVentureOffice } = useAdminVentureOffice();
  const { companies, loading, refetch: refetchCompanies } = useCompanies();
  const { details: ventureOfficeDetails } = useVentureOfficeDetails(isAdmin ? selectedVentureOffice : ventureOffice || "");

  // Get unique venture offices
  const ventureOffices = useMemo(() => 
    Array.from(new Set(companies.map(c => c.venture_office).filter(Boolean))) as string[],
    [companies]
  );

  // Filter companies by venture office
  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      if (!isAdmin && ventureOffice && company.venture_office !== ventureOffice) {
        return false;
      }
      if (isAdmin && selectedVentureOffice !== "all" && company.venture_office !== selectedVentureOffice) {
        return false;
      }
      return true;
    }).sort((a, b) => (a["Company Name"] || "").localeCompare(b["Company Name"] || ""));
  }, [companies, isAdmin, ventureOffice, selectedVentureOffice]);

  // Get the most recent updated date from companies or venture office
  const lastUpdated = useMemo(() => {
    const dates: string[] = [];
    
    // Add company updated_at dates
    filteredCompanies.forEach(c => {
      if ((c as any).updated_at) {
        dates.push((c as any).updated_at);
      }
    });
    
    // Add venture office updated_at
    if (ventureOfficeDetails?.updated_at) {
      dates.push(ventureOfficeDetails.updated_at);
    }
    
    if (dates.length === 0) return null;
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [filteredCompanies, ventureOfficeDetails]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Show loading state
  if (authLoading || authzLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage venture office and portfolio company details</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* Admin Venture Office Selector */}
            {isAdmin && (
              <div>
                <VentureOfficeDropdown
                  value={selectedVentureOffice}
                  onChange={changeVentureOffice}
                  ventureOffices={ventureOffices}
                  companyCounts={Object.fromEntries(ventureOffices.map(o => [o, companies.filter(c => c.venture_office === o).length]))}
                  totalCount={companies.length}
                />
              </div>
            )}
            {lastUpdated && (
              <div className="text-sm text-muted-foreground italic">
                Current as of {formatDate(lastUpdated)}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Venture Office Settings */}
          <VentureOfficeSettingsCard 
            selectedVentureOffice={isAdmin ? selectedVentureOffice : ventureOffice || ""} 
            isAdmin={isAdmin}
          />

          {/* Company Settings */}
          <CompanySettingsCard 
            companies={filteredCompanies}
            refetchCompanies={refetchCompanies}
            selectedVentureOffice={isAdmin ? selectedVentureOffice : ventureOffice || ""}
          />
        </div>
      </div>
    </div>
  );
};

// Venture Office Settings Card
interface VentureOfficeSettingsCardProps {
  selectedVentureOffice: string;
  isAdmin: boolean;
}

function VentureOfficeSettingsCard({ selectedVentureOffice, isAdmin }: VentureOfficeSettingsCardProps) {
  const { details, loading } = useVentureOfficeDetails(selectedVentureOffice);
  const { logoUrl: ventureOfficeLogo } = useVentureOfficeLogo(selectedVentureOffice);
  const [isEditing, setIsEditing] = useState(false);
  const [editedDetails, setEditedDetails] = useState<Partial<VentureOfficeDetails>>({});
  const [saving, setSaving] = useState(false);

  // Reset editing state when venture office changes
  useEffect(() => {
    setIsEditing(false);
    setEditedDetails({});
  }, [selectedVentureOffice]);

  // Initialize edited details when entering edit mode
  const handleStartEdit = () => {
    if (details) {
      setEditedDetails({
        "Venture Office Name": details["Venture Office Name"],
        "Companies Evaluated": details["Companies Evaluated"],
        "Qualified Leads": details["Qualified Leads"],
        "Term Sheet Negotiations": details["Term Sheet Negotiations"],
        "IPA Negotiations": details["IPA Negotiations"],
        "Investment Allotment": details["Investment Allotment"],
      });
    }
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedDetails({});
  };

  const handleSave = async () => {
    if (!details || selectedVentureOffice === "all") return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('venture_office_detail')
        .update(editedDetails)
        .eq('Venture Office Name', selectedVentureOffice);

      if (error) throw error;
      
      toast.success("Venture office details updated successfully");
      setIsEditing(false);
      setEditedDetails({});
    } catch (err: any) {
      toast.error(`Failed to update: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof VentureOfficeDetails, value: string | number) => {
    setEditedDetails(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const showAggregateView = selectedVentureOffice === "all";

  const displayLogo = selectedVentureOffice === "all" ? prinnovoLogo : ventureOfficeLogo;

  return (
    <Card className="bg-blue-50 border-2 border-blue-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            {displayLogo ? (
              <img src={displayLogo} alt="Venture Office" className="h-6 w-6 object-contain" />
            ) : (
              <Building2 className="h-5 w-5" />
            )}
            Venture Office Updates
          </CardTitle>
          <CardDescription className="mt-3 text-sm italic">
            {showAggregateView 
              ? "Select a specific venture office to edit details" 
              : `Edit details for ${selectedVentureOffice}`}
          </CardDescription>
        </div>
        {!showAggregateView && !isEditing && (
          <Button variant="outline" size="sm" onClick={handleStartEdit}>
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        )}
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {showAggregateView ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Please select a specific venture office from the dropdown above to edit its details.</p>
          </div>
        ) : details ? (
          <TooltipProvider>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Total Companies Evaluated</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Number of companies the venture office has evaluated since inception</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={editedDetails["Companies Evaluated"] ?? ""} 
                      onChange={(e) => updateField("Companies Evaluated", parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{details["Companies Evaluated"] ?? "—"}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Active Qualified Leads</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Companies in active diligence</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={editedDetails["Qualified Leads"] ?? ""} 
                      onChange={(e) => updateField("Qualified Leads", parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{details["Qualified Leads"] ?? "—"}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Active Term Sheet Negotiations</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Companies with pending active term sheets</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={editedDetails["Term Sheet Negotiations"] ?? ""} 
                      onChange={(e) => updateField("Term Sheet Negotiations", parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{details["Term Sheet Negotiations"] ?? "—"}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Active IPA Negotiations</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Companies with signed term sheets where legal contracts are in process</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={editedDetails["IPA Negotiations"] ?? ""} 
                      onChange={(e) => updateField("IPA Negotiations", parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{details["IPA Negotiations"] ?? "—"}</div>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-1">
                    <Label>Venture Office Investment Allotment</Label>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Dollars provided from health system budget for annual investments (if unknown, leave blank)</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={editedDetails["Investment Allotment"] ?? ""} 
                      onChange={(e) => updateField("Investment Allotment", parseFloat(e.target.value) || 0)}
                    />
                  ) : (
                    <div className="p-2 bg-muted rounded-md">{details["Investment Allotment"] ?? "—"}</div>
                  )}
                </div>
              </div>
            </div>
          </TooltipProvider>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No venture office details found.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Company Settings Card
interface CompanySettingsCardProps {
  companies: Company[];
  refetchCompanies: () => void;
  selectedVentureOffice: string;
}

function CompanySettingsCard({ companies, refetchCompanies, selectedVentureOffice }: CompanySettingsCardProps) {
  // Get set of duplicated company names (appear in multiple venture offices)
  const duplicatedCompanyNames = useDuplicatedCompanyNames(companies);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "new" | null>(null);
  const [editedCompany, setEditedCompany] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Investment details state
  const [investmentSectionOpen, setInvestmentSectionOpen] = useState(false);
  const [selectedRound, setSelectedRound] = useState<string>("1");
  const [investmentStage, setInvestmentStage] = useState<string>("");
  const [roundName, setRoundName] = useState<string>("");
  const [investedAmount, setInvestedAmount] = useState<string>("");
  const [investedAmountDate, setInvestedAmountDate] = useState<string>("");
  const [currentValuation, setCurrentValuation] = useState<string>("");
  const [valuationDate, setValuationDate] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [roundToDelete, setRoundToDelete] = useState<string | null>(null);

  const INVESTMENT_STAGES = [
    "Committed",
    "IPA Obligation", 
    "Term Sheet Proposed",
    "Operational Funding"
  ];

  const selectedCompany = useMemo(() => {
    if (selectedCompanyId === "new" || selectedCompanyId === null) return null;
    return companies.find(c => c.deal_id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // Reset selection when venture office changes
  useEffect(() => {
    setSelectedCompanyId(null);
    setEditedCompany({});
    setLogoFile(null);
    setLogoPreview(null);
    resetInvestmentFields();
  }, [selectedVentureOffice]);

  // Load investment data when selecting existing company or changing round
  useEffect(() => {
    if (selectedCompany) {
      setInvestmentStage(selectedCompany["Investment Tracker Stage"] || "");
      loadRoundData(selectedCompany, selectedRound);
    }
  }, [selectedCompany, selectedRound]);

  const resetInvestmentFields = () => {
    setInvestmentSectionOpen(false);
    setSelectedRound("1");
    setInvestmentStage("");
    setRoundName("");
    setInvestedAmount("");
    setInvestedAmountDate("");
    setCurrentValuation("");
    setValuationDate("");
  };

  const loadRoundData = (company: Company, round: string) => {
    if (round === "1") {
      setRoundName(company["Invested Amount Round"] || "");
      setInvestedAmount(company["Invested Amount"]?.toString() || "");
      setInvestedAmountDate(company["Invested Amount Date"] || "");
      setCurrentValuation(company["Invested Amount Valuation"]?.toString() || "");
      setValuationDate(company["Invested Amount Valuation Date"] || "");
    } else if (round === "2") {
      setRoundName(company["Invested Amount Round 2"] || "");
      setInvestedAmount(company["Invested Amount 2"]?.toString() || "");
      setInvestedAmountDate(company["Invested Amount Date 2"] || "");
      setCurrentValuation(company["Invested Amount Valuation 2"]?.toString() || "");
      setValuationDate(company["Invested Amount Valuation Date 2"] || "");
    } else if (round === "3") {
      setRoundName(company["Invested Amount Round 3"] || "");
      setInvestedAmount(company["Invested Amount 3"]?.toString() || "");
      setInvestedAmountDate(company["Invested Amount Date 3"] || "");
      setCurrentValuation(company["Invested Amount Valuation 3"]?.toString() || "");
      setValuationDate(company["Invested Amount Valuation Date 3"] || "");
    }
  };

  // Get available rounds for the selected company
  const getAvailableRounds = () => {
    if (!selectedCompany) return [{ value: "1", label: "Round 1", canDelete: false }];

    const rounds = [];
    if (selectedCompany["Invested Amount Round"]) rounds.push({ value: "1", label: selectedCompany["Invested Amount Round"], canDelete: true });
    if (selectedCompany["Invested Amount Round 2"]) rounds.push({ value: "2", label: selectedCompany["Invested Amount Round 2"], canDelete: true });
    if (selectedCompany["Invested Amount Round 3"]) rounds.push({ value: "3", label: selectedCompany["Invested Amount Round 3"], canDelete: true });

    // Add option for next available round
    if (rounds.length < 3) {
      rounds.push({ value: String(rounds.length + 1), label: "Add New Round", canDelete: false, isNew: true });
    }

    // If no rounds exist, show Round 1
    if (rounds.length === 0) {
      rounds.push({ value: "1", label: "Round 1", canDelete: false });
    }

    return rounds;
  };

  const handleDeleteRound = async () => {
    if (!selectedCompany || !roundToDelete) return;

    setSaving(true);
    try {
      const updateData: any = {};

      if (roundToDelete === "1") {
        updateData["Invested Amount Round"] = null;
        updateData["Invested Amount"] = null;
        updateData["Invested Amount Date"] = null;
        updateData["Invested Amount Valuation"] = null;
        updateData["Invested Amount Valuation Date"] = null;
      } else if (roundToDelete === "2") {
        updateData["Invested Amount Round 2"] = null;
        updateData["Invested Amount 2"] = null;
        updateData["Invested Amount Date 2"] = null;
        updateData["Invested Amount Valuation 2"] = null;
        updateData["Invested Amount Valuation Date 2"] = null;
      } else if (roundToDelete === "3") {
        updateData["Invested Amount Round 3"] = null;
        updateData["Invested Amount 3"] = null;
        updateData["Invested Amount Date 3"] = null;
        updateData["Invested Amount Valuation 3"] = null;
        updateData["Invested Amount Valuation Date 3"] = null;
      }

      const { error } = await supabase
        .from('company_detail')
        .update(updateData)
        .eq('deal_id', selectedCompany.deal_id);

      if (error) throw error;

      await refetchCompanies();
      toast.success("Investment round deleted successfully");
      
      setSelectedRound("1");
      setDeleteDialogOpen(false);
      setRoundToDelete(null);
    } catch (error: any) {
      toast.error(`Failed to delete round: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo and get signed URL
  const uploadLogo = async (companyName: string): Promise<string | null> => {
    if (!logoFile) return null;
    
    const fileName = `${companyName.toLowerCase().replace(/\s+/g, '-')}.png`;
    
    // Upload to Company Logos bucket (will overwrite if exists)
    const { error: uploadError } = await supabase.storage
      .from('Company Logos')
      .upload(fileName, logoFile, { 
        upsert: true,
        contentType: 'image/png'
      });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload logo: ${uploadError.message}`);
    }
    
    // Create signed URL with 50 years expiration (50 * 365 * 24 * 60 * 60 seconds)
    const fiftyYearsInSeconds = 50 * 365 * 24 * 60 * 60;
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('Company Logos')
      .createSignedUrl(fileName, fiftyYearsInSeconds);
    
    if (signedUrlError || !signedUrlData) {
      console.error('Signed URL error:', signedUrlError);
      throw new Error('Failed to create signed URL for logo');
    }
    
    return signedUrlData.signedUrl;
  };

  const handleSelectCompany = (value: string) => {
    if (value === "new") {
      setSelectedCompanyId("new");
      setEditedCompany({
        venture_office: selectedVentureOffice === "all" ? "" : selectedVentureOffice,
        "Company Name": "",
        "Company Description": "",
        "Country of Origin": "",
        "High-Level Focus Area": "",
        "Specific Focus Area": "",
        "Pipeline Stage": "",
        "EVP Owner": "",
        "Company Contact": "",
        "Champions": "",
        "Intro Origin": "",
      });
      setLogoFile(null);
      setLogoPreview(null);
      resetInvestmentFields();
    } else {
      const dealId = parseInt(value);
      const company = companies.find(c => c.deal_id === dealId);
      if (company) {
        setSelectedCompanyId(dealId);
        setEditedCompany({ ...company });
        setLogoFile(null);
        setLogoPreview(company.imgurl || null);
        setSelectedRound("1");
        setInvestmentSectionOpen(false);
      }
    }
  };

  const handleCancel = () => {
    setSelectedCompanyId(null);
    setEditedCompany({});
    setLogoFile(null);
    setLogoPreview(null);
    resetInvestmentFields();
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Handle logo upload if a new file was selected
      let logoUrl: string | null = null;
      if (logoFile && editedCompany["Company Name"]) {
        logoUrl = await uploadLogo(editedCompany["Company Name"]);
      }

      if (selectedCompanyId === "new") {
        // Generate deal_id based on office_id and sequential company number
        const ventureOfficeName = editedCompany.venture_office;
        
        // Get the office_id for this venture office
        const { data: officeData, error: officeError } = await supabase
          .from('venture_office_detail')
          .select('office_id')
          .eq('Venture Office Name', ventureOfficeName)
          .single();
        
        if (officeError || !officeData) {
          throw new Error('Could not find venture office');
        }
        
        const officeId = officeData.office_id;
        
        // Get the highest existing deal_id for this venture office (companies with deal_id starting with office_id)
        const minDealId = officeId * 1000; // e.g., 103000
        const maxDealId = (officeId + 1) * 1000 - 1; // e.g., 103999
        
        const { data: existingCompanies, error: companiesError } = await supabase
          .from('company_detail')
          .select('deal_id')
          .gte('deal_id', minDealId)
          .lte('deal_id', maxDealId)
          .order('deal_id', { ascending: false })
          .limit(1);
        
        if (companiesError) throw companiesError;
        
        // Calculate next deal_id
        let nextDealId: number;
        if (existingCompanies && existingCompanies.length > 0) {
          nextDealId = existingCompanies[0].deal_id + 1;
        } else {
          // First company for this venture office: office_id * 1000 + 1
          nextDealId = minDealId + 1;
        }
        
        const { deal_id: _, ...insertData } = editedCompany as Company;
        const insertPayload = {
          ...insertData,
          deal_id: nextDealId,
          ...(logoUrl && { imgurl: logoUrl })
        };
        
        const { error } = await supabase
          .from('company_detail')
          .insert(insertPayload as any);
        
        if (error) throw error;
        toast.success("Company created successfully");
      } else if (selectedCompanyId) {
        // Update existing company
        const updatePayload = {
          ...editedCompany,
          ...(logoUrl && { imgurl: logoUrl })
        };
        
        const { error } = await supabase
          .from('company_detail')
          .update(updatePayload)
          .eq('deal_id', selectedCompanyId);
        
        if (error) throw error;
        toast.success("Company updated successfully");
      }
      
      refetchCompanies();
      setSelectedCompanyId(null);
      setEditedCompany({});
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err: any) {
      toast.error(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof Company, value: any) => {
    setEditedCompany(prev => ({ ...prev, [field]: value }));
  };

  const isEditing = selectedCompanyId !== null;

  return (
    <Card className="bg-green-50 border-2 border-green-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Portfolio Company Updates
          </CardTitle>
          <CardDescription className="mt-3 text-sm italic">
            Select a company to edit or add a new one
          </CardDescription>
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Company Selector */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Select value={selectedCompanyId?.toString() ?? ""} onValueChange={handleSelectCompany}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a company to edit..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Add New Company
                    </span>
                  </SelectItem>
                  {companies.map((company) => {
                    const isDuplicated = duplicatedCompanyNames.has(company["Company Name"] || "");
                    const displayName = isDuplicated && company.venture_office
                      ? `${company["Company Name"]} (${company.venture_office})`
                      : company["Company Name"];
                    return (
                      <SelectItem key={company.deal_id} value={company.deal_id.toString()}>
                        {displayName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Company Name *</Label>
                  <Input 
                    value={editedCompany["Company Name"] ?? ""} 
                    onChange={(e) => updateField("Company Name", e.target.value)}
                  />
                </div>
                
                <div className="space-y-2 sm:col-span-2">
                  <Label>Company Description</Label>
                  <Textarea 
                    value={editedCompany["Company Description"] ?? ""} 
                    onChange={(e) => updateField("Company Description", e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Company Logo Upload */}
                <div className="space-y-2 sm:col-span-2">
                  <Label>Company Logo</Label>
                  <div className="flex items-center gap-4">
                    {/* Logo Preview */}
                    <div className="h-16 w-16 rounded-md border border-border bg-muted flex items-center justify-center overflow-hidden">
                      {logoPreview ? (
                        <img 
                          src={logoPreview} 
                          alt="Logo preview" 
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex flex-col gap-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {logoPreview ? "Change Logo" : "Upload Logo"}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {logoFile ? logoFile.name : "PNG, JPG up to 5MB"}
                      </span>
                    </div>
                  </div>
                </div>

                {selectedVentureOffice === "all" && (
                  <div className="space-y-2">
                    <Label>Venture Office</Label>
                    <Input 
                      value={editedCompany.venture_office ?? ""} 
                      onChange={(e) => updateField("venture_office", e.target.value)}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Country of Origin</Label>
                  <Input 
                    value={editedCompany["Country of Origin"] ?? ""} 
                    onChange={(e) => updateField("Country of Origin", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>High-Level Focus Area</Label>
                  <Select 
                    value={editedCompany["High-Level Focus Area"] ?? ""} 
                    onValueChange={(v) => updateField("High-Level Focus Area", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select focus area..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Clinical">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                          Clinical
                        </div>
                      </SelectItem>
                      <SelectItem value="Financial">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-orange-500"></div>
                          Financial
                        </div>
                      </SelectItem>
                      <SelectItem value="Operational">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                          Operational
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Specific Focus Area</Label>
                  <Input 
                    value={editedCompany["Specific Focus Area"] ?? ""} 
                    onChange={(e) => updateField("Specific Focus Area", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pipeline Stage</Label>
                  <Select 
                    value={editedCompany["Pipeline Stage"] ?? ""} 
                    onValueChange={(v) => updateField("Pipeline Stage", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Implementation">Implementation</SelectItem>
                      <SelectItem value="Pilot">Pilot</SelectItem>
                      <SelectItem value="Portfolio Company">Portfolio Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Executive Owner</Label>
                  <Input 
                    value={editedCompany["EVP Owner"] ?? ""} 
                    onChange={(e) => updateField("EVP Owner", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Company Contact</Label>
                  <Input 
                    value={editedCompany["Company Contact"] ?? ""} 
                    onChange={(e) => updateField("Company Contact", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Champions</Label>
                  <Input 
                    value={editedCompany["Champions"] ?? ""} 
                    onChange={(e) => updateField("Champions", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Intro Origin</Label>
                  <Input 
                    value={editedCompany["Intro Origin"] ?? ""} 
                    onChange={(e) => updateField("Intro Origin", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>IPA Year</Label>
                  <Input 
                    type="number"
                    value={editedCompany["IPA Year"] ?? ""} 
                    onChange={(e) => updateField("IPA Year", e.target.value ? parseInt(e.target.value) : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Current Company Valuation</Label>
                  <Input 
                    type="number"
                    value={editedCompany["Current Company Valuation"] ?? ""} 
                    onChange={(e) => updateField("Current Company Valuation", e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Current Venture Office Valuation</Label>
                  <Input 
                    type="number"
                    value={editedCompany["Current HLV Valuation"] ?? ""} 
                    onChange={(e) => updateField("Current HLV Valuation", e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Venture Office Ownership Percentage</Label>
                  <Input 
                    value={editedCompany["HLV Ownership Percentage"] ?? ""} 
                    onChange={(e) => updateField("HLV Ownership Percentage", e.target.value)}
                  />
                </div>
              </div>

              {/* Investment Details Section (Optional) - Only for existing companies */}
              {selectedCompanyId !== "new" && (
                <Collapsible open={investmentSectionOpen} onOpenChange={setInvestmentSectionOpen} className="mt-6">
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Investment Details (Optional)
                      </div>
                      {investmentSectionOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4">
                    <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg space-y-4">
                      <div className="flex items-center gap-2 text-amber-700 mb-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="text-sm font-medium">Investment details are saved separately from company details</span>
                      </div>
                      {/* Investment Stage */}
                      <div className="space-y-2">
                        <Label>Investment Tracker Stage</Label>
                        <Select value={investmentStage} onValueChange={setInvestmentStage}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select investment stage..." />
                          </SelectTrigger>
                          <SelectContent className="bg-popover z-50">
                            <SelectItem value="none">No Investment Stage</SelectItem>
                            {INVESTMENT_STAGES.map((stage) => (
                              <SelectItem key={stage} value={stage}>
                                {stage}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Investment Round */}
                      <div className="space-y-2">
                        <Label>Investment Round</Label>
                        <div className="flex gap-2">
                          <Select value={selectedRound} onValueChange={setSelectedRound}>
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Select investment round" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {getAvailableRounds().map((round) => (
                                <SelectItem key={round.value} value={round.value}>
                                  <div className="flex items-center gap-2">
                                    {round.isNew && <Plus className="h-4 w-4 text-primary" />}
                                    <span>{round.label}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {getAvailableRounds().find(r => r.value === selectedRound)?.canDelete && (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => {
                                setRoundToDelete(selectedRound);
                                setDeleteDialogOpen(true);
                              }}
                              className="shrink-0"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Round Name (for new rounds) */}
                      {getAvailableRounds().find(r => r.value === selectedRound)?.isNew && (
                        <div className="space-y-2">
                          <Label>Round Name</Label>
                          <Input
                            value={roundName}
                            onChange={(e) => setRoundName(e.target.value)}
                            placeholder="e.g., Series A, Seed, etc."
                          />
                        </div>
                      )}

                      {/* Investment Fields */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Invested Amount</Label>
                          <Input
                            type="number"
                            value={investedAmount}
                            onChange={(e) => setInvestedAmount(e.target.value)}
                            placeholder="Enter amount..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Invested Amount Date</Label>
                          <Input
                            type="date"
                            value={investedAmountDate}
                            onChange={(e) => setInvestedAmountDate(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Current Valuation</Label>
                          <Input
                            type="number"
                            value={currentValuation}
                            onChange={(e) => setCurrentValuation(e.target.value)}
                            placeholder="Enter valuation..."
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>Valuation Date</Label>
                          <Input
                            type="date"
                            value={valuationDate}
                            onChange={(e) => setValuationDate(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Save Investment Button */}
                      <Button
                        type="button"
                        onClick={async () => {
                          if (!selectedCompany) return;
                          
                          setSaving(true);
                          try {
                            const updateData: any = {
                              "Investment Tracker Stage": investmentStage === "none" ? null : (investmentStage || null)
                            };

                            if (selectedRound === "1") {
                              updateData["Invested Amount Round"] = roundName || selectedCompany["Invested Amount Round"] || null;
                              updateData["Invested Amount"] = investedAmount ? parseFloat(investedAmount) : null;
                              updateData["Invested Amount Date"] = investedAmountDate || null;
                              updateData["Invested Amount Valuation"] = currentValuation ? parseFloat(currentValuation) : null;
                              updateData["Invested Amount Valuation Date"] = valuationDate || null;
                            } else if (selectedRound === "2") {
                              updateData["Invested Amount Round 2"] = roundName || selectedCompany["Invested Amount Round 2"] || null;
                              updateData["Invested Amount 2"] = investedAmount ? parseFloat(investedAmount) : null;
                              updateData["Invested Amount Date 2"] = investedAmountDate || null;
                              updateData["Invested Amount Valuation 2"] = currentValuation ? parseFloat(currentValuation) : null;
                              updateData["Invested Amount Valuation Date 2"] = valuationDate || null;
                            } else if (selectedRound === "3") {
                              updateData["Invested Amount Round 3"] = roundName || selectedCompany["Invested Amount Round 3"] || null;
                              updateData["Invested Amount 3"] = investedAmount ? parseFloat(investedAmount) : null;
                              updateData["Invested Amount Date 3"] = investedAmountDate || null;
                              updateData["Invested Amount Valuation 3"] = currentValuation ? parseFloat(currentValuation) : null;
                              updateData["Invested Amount Valuation Date 3"] = valuationDate || null;
                            }

                            const { error } = await supabase
                              .from('company_detail')
                              .update(updateData)
                              .eq('deal_id', selectedCompany.deal_id);

                            if (error) throw error;

                            await refetchCompanies();
                            toast.success("Investment details updated successfully");
                          } catch (error: any) {
                            toast.error(`Failed to update: ${error.message}`);
                          } finally {
                            setSaving(false);
                          }
                        }}
                        disabled={saving}
                        className="w-full"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Save Investment Details
                      </Button>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          )}

          {!isEditing && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a company from the dropdown above or add a new one.</p>
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Round Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Investment Round</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this investment round? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRound} disabled={saving}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default Settings;
