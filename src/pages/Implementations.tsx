import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Check, X } from "lucide-react";

const Implementations = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { companies, loading, updateCompany } = useCompanies();
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ [key: string]: string }>({});

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Sort companies by date priority
  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
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
  }, [companies]);

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

  const handleEditStart = (companyName: string) => {
    setEditingTitle(companyName);
    setEditValues({ [companyName]: companyName });
  };

  const handleEditSave = async (oldName: string) => {
    const newName = editValues[oldName];
    if (newName && newName !== oldName) {
      const success = await updateCompany(oldName, { "Company Name": newName });
      if (success) {
        setEditingTitle(null);
        setEditValues({});
      }
    } else {
      handleEditCancel();
    }
  };

  const handleEditCancel = () => {
    setEditingTitle(null);
    setEditValues({});
  };

  // Show loading while checking authentication or loading data
  if (authLoading || loading) {
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
      
      <div className="container mx-auto p-6 space-y-8">
        <h1 className="text-3xl font-bold text-foreground">Implementation Tracker</h1>
        
        <div className="space-y-8">
          {sortedCompanies.map((company, index) => (
            <CompanyImplementationItem
              key={company["Company Name"]}
              company={company}
              index={index + 1}
              isEditing={editingTitle === company["Company Name"]}
              editValue={editValues[company["Company Name"]] || company["Company Name"]}
              onEditStart={() => handleEditStart(company["Company Name"])}
              onEditSave={() => handleEditSave(company["Company Name"])}
              onEditCancel={handleEditCancel}
              onEditChange={(value) => setEditValues({ ...editValues, [company["Company Name"]]: value })}
              getProgressStages={getProgressStages}
              formatDate={formatDate}
              calculateDaysBetween={calculateDaysBetween}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface CompanyImplementationItemProps {
  company: Company;
  index: number;
  isEditing: boolean;
  editValue: string;
  onEditStart: () => void;
  onEditSave: () => void;
  onEditCancel: () => void;
  onEditChange: (value: string) => void;
  getProgressStages: (company: Company) => any[];
  formatDate: (date: string | null) => string;
  calculateDaysBetween: (date1: string | null, date2: string | null) => number | null;
}

function CompanyImplementationItem({
  company,
  index,
  isEditing,
  editValue,
  onEditStart,
  onEditSave,
  onEditCancel,
  onEditChange,
  getProgressStages,
  formatDate,
  calculateDaysBetween
}: CompanyImplementationItemProps) {
  const { logoUrl } = useCompanyLogo(company.imgurl);
  const isPortfolio = company["Pipeline Stage"]?.toLowerCase() === "portfolio company";

  return (
    <div className="space-y-4">
      {/* Editable Title */}
      <div className="flex items-center space-x-2">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <Input
              value={editValue}
              onChange={(e) => onEditChange(e.target.value)}
              className="text-xl font-semibold"
              autoFocus
            />
            <Button size="sm" onClick={onEditSave}>
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={onEditCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-foreground">{company["Company Name"]}</h2>
            <Button size="sm" variant="ghost" onClick={onEditStart}>
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Number, Logo, and Arrow Diagram */}
      <div className="flex items-center space-x-6">
        {/* Number Circle */}
        <div className={`
          w-12 h-12 rounded-full border-2 flex items-center justify-center font-semibold text-lg
          ${isPortfolio 
            ? 'bg-background text-green-600 border-green-600' 
            : 'bg-background text-foreground border-border'
          }
        `}>
          {index}
        </div>

        {/* Company Logo */}
        <div className="w-16 h-16 rounded-lg border border-border overflow-hidden bg-background flex items-center justify-center">
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