import { Company } from "@/hooks/useCompanies";
import { FilterState } from "@/components/FilterBar";
import { ChevronRight } from "lucide-react";

interface PipelineStagesProps {
  companies: Company[];
  filters: FilterState;
}

export function PipelineStages({ companies, filters }: PipelineStagesProps) {
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== "");
  
  // Calculate counts from data
  const implementationCount = companies.filter(company => 
    company["Pipeline Stage"] === "Implementation"
  ).length;
  
  const pilotCount = companies.filter(company => 
    company["Pipeline Stage"] === "Pilot"
  ).length;
  
  const portfolioCount = companies.filter(company => 
    company["Pipeline Stage"] === "Portfolio Company"
  ).length;

  const stages = [
    { name: "Qualified Leads", count: hasActiveFilters ? 0 : 54 },
    { name: "Term Sheet Negotiations", count: hasActiveFilters ? 0 : 4 },
    { name: "IPA Negotiations", count: hasActiveFilters ? 0 : 4 },
    { name: "Implementation", count: implementationCount },
    { name: "Pilot", count: pilotCount },
    { name: "Portfolio Company", count: portfolioCount },
  ];

  return (
    <div className="bg-card rounded-lg p-6 border">
      <h3 className="text-lg font-semibold mb-6 text-center">Pipeline Overview</h3>
      
      <div className="flex items-center justify-center gap-4 overflow-x-auto">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-center gap-4">
            {/* Stage Circle */}
            <div className="flex flex-col items-center gap-2 min-w-[120px]">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                stage.name === "Portfolio Company" 
                  ? "bg-green-500/10 border-2 border-green-500" 
                  : "bg-primary/10 border-2 border-primary"
              }`}>
                <span className={`text-xl font-bold ${
                  stage.name === "Portfolio Company" ? "text-green-600" : "text-primary"
                }`}>{stage.count}</span>
              </div>
              <span className="text-sm text-muted-foreground text-center leading-tight">
                {stage.name}
              </span>
            </div>
            
            {/* Arrow (except for last item) */}
            {index < stages.length - 1 && (
              <ChevronRight className="w-6 h-6 text-muted-foreground flex-shrink-0 -mt-4" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}