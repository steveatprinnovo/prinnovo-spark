import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, MapPin, User, Calendar, DollarSign, TrendingUp, Users, FileText } from "lucide-react";
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
}

interface CompanyModalProps {
  company: Company | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CompanyModal({ company, isOpen, onClose }: CompanyModalProps) {
  const { logoUrl, loading } = useCompanyLogo(company?.["Company Name"] || "");
  
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
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
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Contacts & Management
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">EVP Owner</p>
                  <p>{company["EVP Owner"] || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Company Contact</p>
                  <p>{company["Company Contact"] || "N/A"}</p>
                </div>
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

            <div className="space-y-4">
              <h3 className="font-semibold text-lg flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                Important Dates
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IPA Signature Date</p>
                  <p>{formatDate(company["IPA Signature Date"])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Term Sheet Signature</p>
                  <p>{formatDate(company["Term Sheet Signature Date"])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Portfolio Decision Date</p>
                  <p>{formatDate(company["Final Portfolio Decision Date"])}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Implementation Completion</p>
                  <p>{formatDate(company["Implementation Completion Date"])}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}