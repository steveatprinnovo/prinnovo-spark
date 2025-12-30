import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { VentureOfficeDropdown } from "@/components/VentureOfficeDropdown";
import { useCompanies, Company } from "@/hooks/useCompanies";
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
import { Building2, Plus, Save, X, Pencil, Briefcase } from "lucide-react";
import { useVentureOfficeLogo } from "@/hooks/useVentureOfficeLogo";
import prinnovoLogo from "@/assets/prinnovo-logo.webp";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice, loading: authzLoading } = useUserAuth();
  const { selectedVentureOffice, changeVentureOffice } = useAdminVentureOffice();
  const { companies, loading, refetch: refetchCompanies } = useCompanies();

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

  // Get the most recent updated date from companies
  const lastUpdated = useMemo(() => {
    const dates = filteredCompanies
      .flatMap(c => [
        c["Invested Amount Valuation Date"],
        c["Invested Amount Valuation Date 2"],
        c["Invested Amount Valuation Date 3"]
      ])
      .filter((date): date is string => date !== null && date !== undefined);
    
    if (dates.length === 0) return null;
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
  }, [filteredCompanies]);

  const formatISODate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    const [yearStr, monthStr, dayStr] = parts;
    const year = Number(yearStr);
    const month = Number(monthStr);
    const day = Number(dayStr);
    if (!year || !month || !day) return dateString;
    const date = new Date(year, month - 1, day);
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
        <div className="flex justify-between items-end mb-8">
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
                Current as of {formatISODate(lastUpdated)}
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
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Companies Evaluated</Label>
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
                <Label>Qualified Leads</Label>
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
                <Label>Term Sheet Negotiations</Label>
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
                <Label>IPA Negotiations</Label>
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
                <Label>Investment Allotment</Label>
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
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "new" | null>(null);
  const [editedCompany, setEditedCompany] = useState<Partial<Company>>({});
  const [saving, setSaving] = useState(false);

  const selectedCompany = useMemo(() => {
    if (selectedCompanyId === "new" || selectedCompanyId === null) return null;
    return companies.find(c => c.deal_id === selectedCompanyId) || null;
  }, [companies, selectedCompanyId]);

  // Reset selection when venture office changes
  useEffect(() => {
    setSelectedCompanyId(null);
    setEditedCompany({});
  }, [selectedVentureOffice]);

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
    } else {
      const dealId = parseInt(value);
      const company = companies.find(c => c.deal_id === dealId);
      if (company) {
        setSelectedCompanyId(dealId);
        setEditedCompany({ ...company });
      }
    }
  };

  const handleCancel = () => {
    setSelectedCompanyId(null);
    setEditedCompany({});
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedCompanyId === "new") {
        // Insert new company - exclude deal_id as it's auto-generated
        const { deal_id: _, ...insertData } = editedCompany as Company;
        const { error } = await supabase
          .from('company_detail')
          .insert(insertData as any);
        
        if (error) throw error;
        toast.success("Company created successfully");
      } else if (selectedCompanyId) {
        // Update existing company
        const { error } = await supabase
          .from('company_detail')
          .update(editedCompany)
          .eq('deal_id', selectedCompanyId);
        
        if (error) throw error;
        toast.success("Company updated successfully");
      }
      
      refetchCompanies();
      setSelectedCompanyId(null);
      setEditedCompany({});
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
                  {companies.map((company) => (
                    <SelectItem key={company.deal_id} value={company.deal_id.toString()}>
                      {company["Company Name"]}
                    </SelectItem>
                  ))}
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
                  <Input 
                    value={editedCompany["High-Level Focus Area"] ?? ""} 
                    onChange={(e) => updateField("High-Level Focus Area", e.target.value)}
                  />
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
                      <SelectItem value="Qualified Lead">Qualified Lead</SelectItem>
                      <SelectItem value="Term Sheet Negotiation">Term Sheet Negotiation</SelectItem>
                      <SelectItem value="IPA Negotiation">IPA Negotiation</SelectItem>
                      <SelectItem value="Implementation">Implementation</SelectItem>
                      <SelectItem value="Pilot">Pilot</SelectItem>
                      <SelectItem value="In Portfolio">In Portfolio</SelectItem>
                      <SelectItem value="Declined/Churned">Declined/Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>EVP Owner</Label>
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
                  <Label>Current HLV Valuation</Label>
                  <Input 
                    type="number"
                    value={editedCompany["Current HLV Valuation"] ?? ""} 
                    onChange={(e) => updateField("Current HLV Valuation", e.target.value ? parseFloat(e.target.value) : null)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>HLV Ownership Percentage</Label>
                  <Input 
                    value={editedCompany["HLV Ownership Percentage"] ?? ""} 
                    onChange={(e) => updateField("HLV Ownership Percentage", e.target.value)}
                  />
                </div>
              </div>
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
    </Card>
  );
}

export default Settings;
