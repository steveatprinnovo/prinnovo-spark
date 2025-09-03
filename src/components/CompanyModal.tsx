import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, User, Calendar, DollarSign, TrendingUp, Users, FileText, ChevronRight } from "lucide-react";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";

interface Company {
  "Company Name": string;
  "Country of Origin": string | null;
  "High-Level Focus Area": string | null;
  "Specific Focus Area": string | null;
  "Current Company Valuation": number | null;
  "Current HLV Valuation": number | null;
  "Pipeline Stage": string | null;
  "EVP Owner": string | null;
  "IPA Year": number | null;
  "Company Contact": string | null;
  "Champions": string | null;
  "Intro Origin": string | null;
  "HLV Ownership Percentage": string | null;
  "IPA Signature Date": string | null;
  "Term Sheet Signature Date": string | null;
  "Final Portfolio Decision Date": string | null;
  "Implementation Completion Date": string | null;
  imgurl: string | null;
}

interface CompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyModal({ company, isOpen, onClose }: CompanyModalProps) {
  const { logoUrl, loading } = useCompanyLogo(company?.imgurl || null);
  
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
        return 'bg-accent text-accent-foreground';
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
              <div className="flex items-center space-x-2 mt-2">
                {company["Pipeline Stage"] && (
                  <Badge className={getStageColor(company["Pipeline Stage"])}>
                    {company["Pipeline Stage"]}
                  </Badge>
                )}
                {company["IPA Year"] && (
                  <Badge variant="outline">IPA {company["IPA Year"]}</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-6 mt-6">
          {/* Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-primary" />
                Company Overview
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Country of Origin</p>
                  <p>{company["Country of Origin"] || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">High-Level Focus Area</p>
                  <p>{company["High-Level Focus Area"] || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Specific Focus Area</p>
                  <p>{company["Specific Focus Area"] || "N/A"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-primary" />
                Financial Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Valuation</p>
                  <p className="text-lg font-semibold">{formatCurrency(company["Current Company Valuation"])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">HLV Valuation</p>
                  <p className="text-lg font-semibold">{formatCurrency(company["Current HLV Valuation"])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">HLV Ownership</p>
                  <p>{company["HLV Ownership Percentage"] || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contacts & Management */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center">
              <Users className="w-5 h-5 mr-2 text-primary" />
              Contacts & Management
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">EVP Owner</p>
                  <p>{company["EVP Owner"] || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Contact</p>
                  <p>{company["Company Contact"] || "N/A"}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Champions</p>
                  <p>{company["Champions"] || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Intro Origin</p>
                  <p>{company["Intro Origin"] || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Progress Timeline - Full Width */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-primary" />
              Progress Timeline
            </h3>
            <div className="relative py-4 px-8">
              {/* Stage Names Above Arrow - Positioned Above Each Dot */}
              <div className="absolute top-0 left-8 right-8 flex justify-between items-center">
                {getProgressStages().map((stage) => (
                  <div key={stage.name} className="text-center">
                    <p className="text-sm font-medium text-foreground">{stage.name}</p>
                  </div>
                ))}
              </div>

              {/* Progress Arrow Container */}
              <div className="relative flex items-center mt-6 mb-6">
                {/* Arrow Background */}
                <div className="w-full h-8 bg-gradient-to-r from-red-200 via-yellow-200 to-green-200 rounded-l-lg"></div>
                <div className="w-0 h-0 border-l-[32px] border-l-green-200 border-t-[16px] border-t-transparent border-b-[16px] border-b-transparent"></div>
                
                {/* Stage Dots Aligned to Middle */}
                <div className="absolute inset-0 flex justify-between items-center px-4">
                  {getProgressStages().map((stage) => (
                    <div key={`dot-${stage.name}`} className={`w-4 h-4 rounded-full border-2 ${
                      stage.completed 
                        ? 'bg-primary border-primary' 
                        : 'bg-background border-muted-foreground'
                    }`}></div>
                  ))}
                </div>

                {/* Days Between Stages with Arrows */}
                <div className="absolute inset-0 flex items-center px-4">
                  {getProgressStages().slice(0, -1).map((stage, index) => {
                    const nextStage = getProgressStages()[index + 1];
                    const days = calculateDaysBetween(stage.date, nextStage.date);
                    const totalStages = getProgressStages().length;
                    const segmentWidth = `${100 / (totalStages - 1)}%`;
                    const leftOffset = `${(100 / (totalStages - 1)) * index + (50 / (totalStages - 1))}%`;
                    
                    return (
                      <div 
                        key={`days-${index}`} 
                        className="absolute flex justify-center"
                        style={{ 
                          left: leftOffset,
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

              {/* Dates Below Arrow - Positioned Below Each Dot */}
              <div className="absolute bottom-0 left-8 right-8 flex justify-between items-center">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}