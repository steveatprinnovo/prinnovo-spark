import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { VentureOfficeSelector } from "@/components/VentureOfficeSelector";
import { VentureOfficeDropdown } from "@/components/VentureOfficeDropdown";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useVentureOfficeLogo } from "@/hooks/useVentureOfficeLogo";
import { useStatusNotes } from "@/hooks/useStatusNotes";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Check, X, Filter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { usePageTitle } from "@/hooks/usePageTitle";

const Implementations = () => {
  usePageTitle("Implementations");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice, loading: authzLoading } = useUserAuth();
  const { selectedVentureOffice, showSelector, selectVentureOffice, changeVentureOffice } = useAdminVentureOffice();
  const { companies, loading, updateCompany } = useCompanies();
  const { statusNotes, loading: statusNotesLoading, saveStatusNote, getStatusNote } = useStatusNotes();
  const { toast } = useToast();
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<{ [key: string]: string }>({});
  const [milestoneFilters, setMilestoneFilters] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Get unique venture offices
  const ventureOffices = useMemo(() => 
    Array.from(new Set(companies.map(c => c.venture_office).filter(Boolean))) as string[],
    [companies]
  );

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Available milestone filters
  const availableMilestones = [
    { id: "term-sheet", label: "Term Sheet Signed" },
    { id: "ipa", label: "IPA Signed" },
    { id: "implementation", label: "Implementation Completed" },
    { id: "pilot", label: "Pilot Completed / Portfolio Company" }
  ];

  // Sort companies by date priority
  const sortedCompanies = useMemo(() => {
    // Filter by venture office first
    const ventureOfficeFiltered = companies.filter(company => {
      if (!isAdmin && ventureOffice) {
        return company.venture_office === ventureOffice;
      }
      if (isAdmin && selectedVentureOffice !== "all") {
        return company.venture_office === selectedVentureOffice;
      }
      return true;
    });

    // Show all companies including those that appear in multiple venture offices
    return [...ventureOfficeFiltered].sort((a, b) => {
      // Helper function to convert date string to Date object, return null if invalid
      const parseDate = (dateStr: string | null) => {
        if (!dateStr) return null;
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
      };

      // Priority order: Pilot Completed -> Implementation Completed -> IPA Signed -> Term Sheet Signed
      const dates = [
        { a: parseDate(a["Final Portfolio Decision Date"]), b: parseDate(b["Final Portfolio Decision Date"]) },
        { a: parseDate(a["Implementation Completion Date"]), b: parseDate(b["Implementation Completion Date"]) },
        { a: parseDate(a["IPA Signature Date"]), b: parseDate(b["IPA Signature Date"]) },
        { a: parseDate(a["Term Sheet Signature Date"]), b: parseDate(b["Term Sheet Signature Date"]) }
      ];

      for (const { a: aDate, b: bDate } of dates) {
        if (aDate && bDate) {
          return aDate.getTime() - bDate.getTime();
        }
        if (aDate && !bDate) return -1;
        if (!aDate && bDate) return 1;
      }

      return 0;
    });
  }, [companies, isAdmin, ventureOffice, selectedVentureOffice]);

  // Filter companies by selected milestones (show companies WITHOUT these milestones - AND logic)
  const filteredCompanies = useMemo(() => {
    if (milestoneFilters.length === 0) return sortedCompanies;
    
    return sortedCompanies.filter(company => {
      return milestoneFilters.every(filter => {
        switch (filter) {
          case "term-sheet":
            return !company["Term Sheet Signature Date"];
          case "ipa":
            return !company["IPA Signature Date"];
          case "implementation":
            return !company["Implementation Completion Date"];
          case "pilot":
            // Combined filter: show companies WITHOUT pilot date AND NOT portfolio companies
            return !company["Final Portfolio Decision Date"] && 
                   company["Pipeline Stage"]?.toLowerCase() !== "portfolio company";
          default:
            return false;
        }
      });
    });
  }, [sortedCompanies, milestoneFilters]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDaysBetween = (date1: string | null, date2: string | null) => {
    if (!date1 || !date2) return null;
    const start = new Date(date1);
    const end = new Date(date2);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressStages = (company: Company) => {
    const stages = [
      {
        name: "Term Sheet Signed",
        date: company["Term Sheet Signature Date"],
        completed: !!company["Term Sheet Signature Date"]
      },
      {
        name: "IPA Signed", 
        date: company["IPA Signature Date"],
        completed: !!company["IPA Signature Date"]
      },
      {
        name: "Implementation Completed",
        date: company["Implementation Completion Date"], 
        completed: !!company["Implementation Completion Date"]
      },
      {
        name: "Pilot Completed",
        date: company["Final Portfolio Decision Date"],
        completed: !!company["Final Portfolio Decision Date"]
      }
    ];

    return stages;
  };

  const handleStatusEditStart = (dealId: number, companyName: string) => {
    const editKey = `${dealId}`;
    setEditingStatus(editKey);
    // Initialize with existing status (check by deal_id first, then by company name)
    setEditingValues({ [editKey]: getStatusNote(dealId, companyName) });
  };

  const handleStatusEditSave = async (dealId: number, companyName: string) => {
    const editKey = `${dealId}`;
    const newStatus = editingValues[editKey] || "";
    const success = await saveStatusNote(dealId, companyName, newStatus);
    
    if (success) {
      setEditingStatus(null);
      setEditingValues({});
      toast({
        title: "Status updated",
        description: `Status note for ${companyName} has been saved.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save status note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusEditCancel = () => {
    setEditingStatus(null);
    setEditingValues({});
  };

  const handleMilestoneFilterChange = (milestoneId: string, checked: boolean) => {
    if (checked) {
      setMilestoneFilters([...milestoneFilters, milestoneId]);
    } else {
      setMilestoneFilters(milestoneFilters.filter(id => id !== milestoneId));
    }
  };

  // Filter companies by venture office for KPIs
  const ventureOfficeFilteredCompanies = useMemo(() => {
    console.log("KPI Filter Debug:", { isAdmin, ventureOffice, selectedVentureOffice, totalCompanies: companies.length });
    
    const filtered = companies.filter(company => {
      if (!isAdmin && ventureOffice) {
        return company.venture_office === ventureOffice;
      }
      if (isAdmin && selectedVentureOffice && selectedVentureOffice !== "all") {
        return company.venture_office === selectedVentureOffice;
      }
      return true;
    });

    // Include all companies including those that appear in multiple venture offices
    console.log("KPI Filtered Companies:", filtered.length);
    return filtered;
  }, [companies, isAdmin, ventureOffice, selectedVentureOffice]);

  // Calculate KPIs
  const kpiData = useMemo(() => {
    // Simple count of all companies in the filtered venture office
    const companyCount = ventureOfficeFilteredCompanies.length;

    // Helper function to calculate average days between two date fields
    const calculateAverageDays = (dateField1: keyof Company, dateField2: keyof Company) => {
      const validDays = ventureOfficeFilteredCompanies
        .map(company => calculateDaysBetween(company[dateField1] as string, company[dateField2] as string))
        .filter(days => days !== null) as number[];
      
      if (validDays.length === 0) return 0;
      return Math.round(validDays.reduce((sum, days) => sum + days, 0) / validDays.length);
    };

    return [
      {
        title: "Total Companies",
        value: companyCount.toString(),
        subtitle: "Companies in venture office",
        gradient: "var(--gradient-primary)"
      },
      {
        title: "Term Sheet Signature to IPA Signature",
        value: `${calculateAverageDays("Term Sheet Signature Date", "IPA Signature Date")} days`,
        monthsValue: `(~${Math.round(calculateAverageDays("Term Sheet Signature Date", "IPA Signature Date") / 30)} months)`,
        subtitle: "Average time between milestones",
        gradient: "var(--gradient-accent)"
      },
      {
        title: "IPA Signature to Implementation Complete",
        value: `${calculateAverageDays("IPA Signature Date", "Implementation Completion Date")} days`,
        monthsValue: `(~${Math.round(calculateAverageDays("IPA Signature Date", "Implementation Completion Date") / 30)} months)`,
        subtitle: "Average time between milestones",
        gradient: "var(--gradient-primary)"
      },
      {
        title: "Implementation Complete to Pilot Complete",
        value: `${calculateAverageDays("Implementation Completion Date", "Final Portfolio Decision Date")} days`,
        monthsValue: `(~${Math.round(calculateAverageDays("Implementation Completion Date", "Final Portfolio Decision Date") / 30)} months)`,
        subtitle: "Average time between milestones",
        gradient: "var(--gradient-accent)"
      }
    ];
  }, [ventureOfficeFilteredCompanies, calculateDaysBetween]);

  // Show loading while checking authentication or loading data
  if (authLoading || authzLoading || loading || statusNotesLoading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-80" />
          <div className="space-y-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="h-8 w-60" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-20 flex-1" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      {/* Venture Office Selector Modal for Admins */}
      {isAdmin && <VentureOfficeSelector isOpen={showSelector} ventureOffices={ventureOffices} onSelect={selectVentureOffice} />}
      
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex justify-between items-start mb-8">
          <h1 className="text-3xl font-bold text-foreground">Implementation Tracker</h1>
          
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
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <Card 
              key={index}
              className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-0 h-32"
              style={{ 
                background: kpi.gradient,
                boxShadow: "var(--shadow-kpi)"
              }}
            >
              <CardContent className="p-4 h-full flex flex-col justify-center text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/90 leading-tight">
                    {kpi.title}
                  </p>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {kpi.value}
                    </p>
                    {kpi.monthsValue && (
                      <p className="text-sm text-white/80 italic">
                        {kpi.monthsValue}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-white/80">
                    {kpi.subtitle}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Separator */}
        <Separator />

        {/* Filter Button */}
        <div className="flex justify-start">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filter Milestones
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4 bg-card border">
            <h3 className="font-semibold mb-3">Remove companies missing these milestones:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {availableMilestones.map((milestone) => (
                <div key={milestone.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={milestone.id}
                    checked={milestoneFilters.includes(milestone.id)}
                    onCheckedChange={(checked) => handleMilestoneFilterChange(milestone.id, checked as boolean)}
                  />
                  <label htmlFor={milestone.id} className="text-sm font-medium">
                    {milestone.label}
                  </label>
                </div>
              ))}
            </div>
            {milestoneFilters.length > 0 && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredCompanies.length} of {sortedCompanies.length} companies
                </p>
              </div>
            )}
          </Card>
        )}
        
        <div className="space-y-8">
          {filteredCompanies.map((company, index) => {
            const editKey = `${company.deal_id}`;
            return (
              <CompanyImplementationItem
                key={company.deal_id}
                company={company}
                index={filteredCompanies.indexOf(company) + 1}
                isEditingStatus={editingStatus === editKey}
                statusValue={editingValues[editKey] || getStatusNote(company.deal_id, company["Company Name"])}
                onStatusEditStart={() => handleStatusEditStart(company.deal_id, company["Company Name"])}
                onStatusEditSave={() => handleStatusEditSave(company.deal_id, company["Company Name"])}
                onStatusEditCancel={handleStatusEditCancel}
                onStatusChange={(value) => setEditingValues({ ...editingValues, [editKey]: value })}
                getProgressStages={getProgressStages}
                formatDate={formatDate}
                calculateDaysBetween={calculateDaysBetween}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface CompanyImplementationItemProps {
  company: Company;
  index: number;
  isEditingStatus: boolean;
  statusValue: string;
  onStatusEditStart: () => void;
  onStatusEditSave: () => void;
  onStatusEditCancel: () => void;
  onStatusChange: (value: string) => void;
  getProgressStages: (company: Company) => any[];
  formatDate: (date: string | null) => string;
  calculateDaysBetween: (date1: string | null, date2: string | null) => number | null;
}

function CompanyImplementationItem({
  company,
  index,
  isEditingStatus,
  statusValue,
  onStatusEditStart,
  onStatusEditSave,
  onStatusEditCancel,
  onStatusChange,
  getProgressStages,
  formatDate,
  calculateDaysBetween
}: CompanyImplementationItemProps) {
  const { logoUrl } = useCompanyLogo(company.imgurl);
  const { logoUrl: ventureOfficeLogoUrl } = useVentureOfficeLogo(company.venture_office);
  const isPortfolio = company["Pipeline Stage"]?.toLowerCase() === "portfolio company";

  return (
    <div className="space-y-4">
      {/* Company Name and Status Update - Side by side */}
      <div className="flex items-start justify-between gap-6">
        <div className="flex items-center gap-3 flex-shrink-0">
          <h2 className="text-xl font-semibold text-foreground">{company["Company Name"]}</h2>
          {ventureOfficeLogoUrl && (
            <img 
              src={ventureOfficeLogoUrl} 
              alt={`${company.venture_office} logo`}
              className="h-8 w-auto object-contain"
            />
          )}
        </div>
        
        {/* Status Update Box - Twice as wide, single line */}
        <div className="flex-1 max-w-2xl">
          {isEditingStatus ? (
            <div className="flex gap-2">
              <Input
                value={statusValue}
                onChange={(e) => onStatusChange(e.target.value)}
                placeholder="Enter status update..."
                className="flex-1 text-sm"
                autoFocus
              />
              <div className="flex gap-1">
                <Button size="sm" onClick={onStatusEditSave}>
                  <Check className="h-3 w-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={onStatusEditCancel}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="h-9 px-3 py-2 border border-dashed border-gray-300 rounded-md bg-gray-50/50 cursor-pointer hover:bg-gray-100/50 transition-colors flex items-center justify-between text-sm"
              onClick={onStatusEditStart}
            >
              <p className="text-xs text-gray-500 italic whitespace-pre-wrap break-words">
                {statusValue || "Add status note..."}
              </p>
              <Pencil className="h-3 w-3 text-gray-400 flex-shrink-0 ml-2" />
            </div>
          )}
        </div>
      </div>

      {/* Number, Logo, and Arrow Diagram */}
      <div className="flex items-center space-x-6">
        {/* Number Circle - Bold font */}
        <div className={`
          w-10 h-10 rounded-full border-4 flex items-center justify-center font-bold text-base
          ${isPortfolio 
            ? 'bg-background text-green-600 border-green-600' 
            : 'bg-background text-foreground border-gray-400'
          }
        `}>
          <span className="font-bold">{index}</span>
        </div>

        {/* Company Logo - No border, 20% wider */}
        <div className="w-20 h-16 rounded-lg overflow-hidden bg-background flex items-center justify-center">
          {logoUrl ? (
            <img 
              src={logoUrl} 
              alt={`${company["Company Name"]} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-xs text-muted-foreground text-center px-1">
              No Logo
            </div>
          )}
        </div>

        {/* Arrow Diagram */}
        <div className="flex-1">
          <div className="space-y-4">
            {/* Stage Names */}
            <div className="grid grid-cols-4 gap-4">
              {getProgressStages(company).map((stage) => (
                <div key={stage.name} className="text-center">
                  <p className="text-sm font-medium text-foreground">{stage.name}</p>
                </div>
              ))}
            </div>

            {/* Progress Arrow Container */}
            <div className="relative flex items-center px-4">
              {/* Arrow Background */}
              <div className="w-full h-8 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-l-lg"></div>
              <div className="w-0 h-0 border-l-[32px] border-l-green-200 border-t-[16px] border-t-transparent border-b-[16px] border-b-transparent"></div>
              
              {/* Stage Dots */}
              <div className="absolute inset-0 flex items-center px-4">
                {getProgressStages(company).map((stage, stageIndex) => {
                  const totalStages = getProgressStages(company).length;
                  const leftPosition = `${(100 / totalStages) * stageIndex + (100 / totalStages / 2)}%`;
                  
                  return (
                    <div 
                      key={`dot-${stage.name}`} 
                      className={`absolute w-4 h-4 rounded-full border-2 ${
                        stage.completed 
                          ? 'bg-primary border-primary' 
                          : 'bg-background border-muted-foreground'
                      }`}
                      style={{
                        left: leftPosition,
                        transform: 'translateX(-50%)'
                      }}
                    />
                  );
                })}
              </div>

              {/* Days Between Stages */}
              <div className="absolute inset-0 flex items-center px-4">
                {getProgressStages(company).slice(0, -1).map((stage, stageIndex) => {
                  const stages = getProgressStages(company);
                  const nextStage = stages[stageIndex + 1];
                  const days = calculateDaysBetween(stage.date, nextStage.date);
                  const totalStages = stages.length;
                  const currentDotPosition = (100 / totalStages) * stageIndex + (100 / totalStages / 2);
                  const nextDotPosition = (100 / totalStages) * (stageIndex + 1) + (100 / totalStages / 2);
                  const midpointPosition = (currentDotPosition + nextDotPosition) / 2;
                  
                  return (
                    <div 
                      key={`days-${stageIndex}`} 
                      className="absolute flex justify-center"
                      style={{ 
                        left: `${midpointPosition}%`,
                        transform: 'translateX(-50%)'
                      }}
                    >
                      {days && (
                        <span className="text-xs text-primary font-medium">
                          ← {days} days →
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-4 gap-4">
              {getProgressStages(company).map((stage) => (
                <div key={`date-${stage.name}`} className="text-center">
                  {stage.date && (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(stage.date)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Separator line */}
      <div className="border-b border-border/30"></div>
    </div>
  );
}

export default Implementations;