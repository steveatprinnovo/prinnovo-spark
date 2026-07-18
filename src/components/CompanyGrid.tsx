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

  // Stage pill: portfolio / validated companies get the success treatment,
  // everything else the neutral navy-tint chip.
  const getStageColor = (stage: string | null) => {
    switch (stage?.toLowerCase()) {
      case 'portfolio':
      case 'portfolio company':
      case 'validated company':
        return 'bg-[#e9f4ef] text-[#2e7d5b]';
      default:
        return 'bg-[#e8e9f1] text-[#5a5f9c]';
    }
  };

  // 4px left border colored by High-Level Focus Area
  const getFocusAreaColor = (focusArea: string | null) => {
    switch (focusArea?.toLowerCase()) {
      case 'clinical':
        return 'border-l-[#0299aa]';
      case 'financial':
        return 'border-l-[#171d70]';
      case 'operational':
        return 'border-l-[#8b8fa3]';
      default:
        return 'border-l-[#8b8fa3]';
    }
  };

  return (
    <div
      className={`card-lift cursor-pointer rounded-lg border border-[#e2e3ec] border-l-4 bg-white shadow-card ${getFocusAreaColor(company["High-Level Focus Area"])}`}
      onClick={onClick}
    >
      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="flex h-10 w-[84px] items-center justify-start overflow-hidden">
            {!loading && logoUrl ? (
              <img
                src={logoUrl}
                alt={`${company["Company Name"]} logo`}
                className="h-full w-full object-contain"
                onError={(e) => {
                  // Fallback to icon if image fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <Building2
              className={`h-6 w-6 text-[#171d70] ${!loading && logoUrl ? 'hidden' : ''}`}
            />
          </div>
          {company["Pipeline Stage"] && (
            <span className={`whitespace-nowrap rounded-full px-[9px] py-[3px] text-[10.5px] font-semibold tracking-[0.06em] ${getStageColor(company["Pipeline Stage"])}`}>
              {company["Pipeline Stage"]}
            </span>
          )}
        </div>

        <h3 className="mb-2 line-clamp-2 text-[15px] font-bold leading-[1.3] text-[#171d70]">
          {company["Company Name"]}
        </h3>

        <div className="flex flex-col gap-1 text-xs text-[#5c6178]">
          {company["High-Level Focus Area"] && (
            <span>{company["High-Level Focus Area"]}</span>
          )}
          {company["Country of Origin"] && (
            <span className="text-[#8b8fa3]">{company["Country of Origin"]}</span>
          )}
          <span>
            <span className="italic text-[#8b8fa3]">Current Company Valuation:</span>{" "}
            <span className="font-semibold text-[#232842]">{formatValuation(company["Current Company Valuation"])}</span>
          </span>
        </div>
      </div>
    </div>
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
