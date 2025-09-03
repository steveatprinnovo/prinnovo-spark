import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, User, Calendar, DollarSign, TrendingUp, Users, FileText, ChevronRight, Pencil, Check, X } from "lucide-react";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { Company, useCompanies } from "@/hooks/useCompanies";

interface CompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyModal({ company, isOpen, onClose }: CompanyModalProps) {
  const { logoUrl, loading } = useCompanyLogo(company?.imgurl || null);
  const { updateCompany } = useCompanies();
  
  // Edit state management
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Company>>({});
  
  if (!company) return null;

  const formatCurrency = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStageColor = (stage: string | null) => {
    switch (stage?.toLowerCase()) {
      case 'portfolio':
        return 'bg-background text-green-600 border border-green-600';
      case 'due diligence':
        return 'bg-primary text-primary-foreground';
      case 'term sheet':
        return 'bg-chart-3 text-white';
      case 'evaluation':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  const calculateDaysBetween = (date1: string | null, date2: string | null) => {
    if (!date1 || !date2) return null;
    const start = new Date(date1);
    const end = new Date(date2);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getProgressStages = () => {
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

    return stages.map((stage, index) => ({
      ...stage,
      daysToNext: index < stages.length - 1 ? 
        calculateDaysBetween(stage.date, stages[index + 1].date) : null
    }));
  };

  const handleEditStart = (fieldName: string, currentValue: any) => {
    setEditingField(fieldName);
    setEditValues({ [fieldName]: currentValue });
  };

  const handleEditSave = async () => {
    if (!editingField || !company) return;
    
    const success = await updateCompany(company["Company Name"], editValues);
    if (success) {
      setEditingField(null);
      setEditValues({});
    }
  };

  const handleEditCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const handleEditChange = (fieldName: string, value: string) => {
    setEditValues(prev => ({ ...prev, [fieldName]: value }));
  };

  const renderEditableField = (
    label: string,
    fieldName: keyof Company,
    currentValue: any,
    formatter?: (value: any) => string,
    isNumeric?: boolean
  ) => {
    const isEditing = editingField === fieldName;
    const displayValue = formatter ? formatter(currentValue) : (currentValue || "N/A");
    const editValue = editValues[fieldName] ?? currentValue ?? "";

    return (
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          {!isEditing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleEditStart(fieldName, currentValue)}
            >
              <Pencil className="h-3 w-3 text-gray-400" />
            </Button>
          )}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              value={editValue}
              onChange={(e) => handleEditChange(fieldName, e.target.value)}
              type={isNumeric ? "number" : "text"}
              className="h-8"
            />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleEditSave}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleEditCancel}>
              <X className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        ) : (
          <p className={formatter && currentValue ? "text-lg font-semibold" : ""}>
            {displayValue}
          </p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-lg overflow-hidden">
              {!loading && logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={`${company["Company Name"]} logo`}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <Building2 className={`h-8 w-8 text-primary ${!loading && logoUrl ? 'hidden' : ''}`} />
            </div>
            <div>
              <DialogTitle className="text-2xl">{company["Company Name"]}</DialogTitle>
              {company["Company Description"] && (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {company["Company Description"]}
                </p>
              )}
              <div className="flex items-center space-x-2 mt-2">
                {company["Pipeline Stage"] && (
                  <Badge className={getStageColor(company["Pipeline Stage"])}>
                    {company["Pipeline Stage"]}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 mt-6">
          {/* Progress Timeline - Moved to top */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Progress Timeline
            </h3>
            <div className="space-y-4">
              {/* Stage Names - Independent from arrow */}
              <div className="grid grid-cols-4 gap-4">
                {getProgressStages().map((stage) => (
                  <div key={stage.name} className="text-center">
                    <p className="text-sm font-medium text-foreground">{stage.name}</p>
                  </div>
                ))}
              </div>

              {/* Progress Arrow Container - Independent positioning */}
              <div className="relative flex items-center px-4">
                {/* Arrow Background */}
                <div className="w-full h-8 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-l-lg"></div>
                <div className="w-0 h-0 border-l-[32px] border-l-green-200 border-t-[16px] border-t-transparent border-b-[16px] border-b-transparent"></div>
                
                {/* Stage Dots Aligned to Center of Text Boxes */}
                <div className="absolute inset-0 flex items-center px-4">
                  {getProgressStages().map((stage, index) => {
                    const totalStages = getProgressStages().length;
                    const leftPosition = `${(100 / totalStages) * index + (100 / totalStages / 2)}%`;
                    
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

                {/* Days Between Stages - Centered between dots */}
                <div className="absolute inset-0 flex items-center px-4">
                  {getProgressStages().slice(0, -1).map((stage, index) => {
                    const nextStage = getProgressStages()[index + 1];
                    const days = calculateDaysBetween(stage.date, nextStage.date);
                    const totalStages = getProgressStages().length;
                    // Position at midpoint between current and next dot
                    const currentDotPosition = (100 / totalStages) * index + (100 / totalStages / 2);
                    const nextDotPosition = (100 / totalStages) * (index + 1) + (100 / totalStages / 2);
                    const midpointPosition = (currentDotPosition + nextDotPosition) / 2;
                    
                    return (
                      <div 
                        key={`days-${index}`} 
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

              {/* Dates - Independent from arrow */}
              <div className="grid grid-cols-4 gap-4">
                {getProgressStages().map((stage) => (
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

          <Separator />

          {/* Horizontal layout for three sections */}
          <div className="grid gap-6 md:grid-cols-3 divide-x divide-border">
            {/* Company Overview */}
            <div className="space-y-4 md:pr-6">
              <h3 className="font-semibold text-lg flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Company Overview
              </h3>
              <div className="space-y-3">
                {renderEditableField(
                  "Country of Origin",
                  "Country of Origin",
                  company["Country of Origin"]
                )}
                {renderEditableField(
                  "High-Level Focus Area",
                  "High-Level Focus Area",
                  company["High-Level Focus Area"]
                )}
                {renderEditableField(
                  "Specific Focus Area",
                  "Specific Focus Area",
                  company["Specific Focus Area"]
                )}
                {renderEditableField(
                  "Company Contact",
                  "Company Contact",
                  company["Company Contact"]
                )}
              </div>
            </div>

            {/* Financial Information */}
            <div className="space-y-4 md:px-6">
              <h3 className="font-semibold text-lg flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                Financial Information
              </h3>
              <div className="space-y-3">
                {renderEditableField(
                  "Company Valuation",
                  "Current Company Valuation",
                  company["Current Company Valuation"],
                  formatCurrency,
                  true
                )}
                {renderEditableField(
                  "HLV Valuation",
                  "Current HLV Valuation",
                  company["Current HLV Valuation"],
                  formatCurrency,
                  true
                )}
                {renderEditableField(
                  "HLV Ownership",
                  "HLV Ownership Percentage",
                  company["HLV Ownership Percentage"]
                )}
                {renderEditableField(
                  "Intro Origin",
                  "Intro Origin",
                  company["Intro Origin"]
                )}
              </div>
            </div>

            {/* Tanner Stakeholders */}
            <div className="space-y-4 md:pl-6">
              <h3 className="font-semibold text-lg flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Tanner Stakeholders
              </h3>
              <div className="space-y-3">
                {renderEditableField(
                  "EVP Owner",
                  "EVP Owner",
                  company["EVP Owner"]
                )}
                {renderEditableField(
                  "Champions",
                  "Champions",
                  company["Champions"]
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}