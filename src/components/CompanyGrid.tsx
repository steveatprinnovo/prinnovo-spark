import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2 } from "lucide-react";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { Company } from "@/hooks/useCompanies";

interface CompanyGridProps {
  companies: Company[];
  onCompanyClick: (company: Company) => void;
}

function CompanyCard({ company, onClick }: { company: Company; onClick: () => void }) {
  const { logoUrl, loading } = useCompanyLogo(company.imgurl);

  const formatValuation = (value: number | null) => {
    if (!value) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
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

  const getFocusAreaColor = (focusArea: string | null) => {
    switch (focusArea?.toLowerCase()) {
      case 'operational':
        return 'border-l-blue-500';
      case 'clinical':
        return 'border-l-green-500';
      case 'financial':
        return 'border-l-orange-500';
      default:
        return 'border-l-blue-500'; // Default to blue
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 border-l-4 ${getFocusAreaColor(company["High-Level Focus Area"])}`}
      onClick={onClick}
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center justify-center w-24 h-12 rounded-lg overflow-hidden">
            {!loading && logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${company["Company Name"]} logo`}
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Building2 
              className={`h-6 w-6 text-primary ${!loading && logoUrl ? 'hidden' : ''}`} 
            />
          </div>
          {company["Pipeline Stage"] && (
            <Badge className={`${getStageColor(company["Pipeline Stage"])} ${
              company["Pipeline Stage"] === "Portfolio Company" ? "!text-green-600" : ""
            }`}>
              {company["Pipeline Stage"]}
            </Badge>
          )}
        </div>
        
        <h3 className="font-semibold text-base mb-2 line-clamp-2">
          {company["Company Name"]}
        </h3>
        
        <div className="space-y-2 text-xs text-muted-foreground">
          {company["High-Level Focus Area"] && (
            <p>{company["High-Level Focus Area"]}</p>
          )}
          {company["Country of Origin"] && (
            <p>{company["Country of Origin"]}</p>
          )}
          <p>
            <span className="italic text-muted-foreground">Current Company Valuation:</span>{" "}
            <span className="font-medium text-foreground">{formatValuation(company["Current Company Valuation"])}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function CompanyGrid({ companies, onCompanyClick }: CompanyGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {companies.map((company, index) => (
        <CompanyCard
          key={index}
          company={company}
          onClick={() => onCompanyClick(company)}
        />
      ))}
    </div>
  );
}