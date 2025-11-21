import { Company } from "@/hooks/useCompanies";
import { FilterState } from "@/components/FilterBar";
import { ChevronRight } from "lucide-react";
import { useVentureOfficeDetails } from "@/hooks/useVentureOfficeDetails";

interface PipelineStagesProps {
  companies: Company[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  selectedVentureOffice?: string;
}

export function PipelineStages({ companies, filters, onFilterChange, selectedVentureOffice }: PipelineStagesProps) {
  const { details } = useVentureOfficeDetails(selectedVentureOffice);
  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value !== "");
  
  // Calculate counts from data
  const implementationCount = companies.filter(company => 
    company["Pipeline Stage"] === "Implementation" || company["Pipeline Stage"] === "IT Implementation"
  ).length;
  
  const pilotCount = companies.filter(company => 
    company["Pipeline Stage"] === "Pilot"
  ).length;
  
  const portfolioCount = companies.filter(company => 
    company["Pipeline Stage"] === "Portfolio Company" || company["Pipeline Stage"] === "Validated Company"
  ).length;

  const handleStageClick = (stageName: string) => {
    // Map display names to database values
    const stageMapping: { [key: string]: string } = {
      "IT Implementation": "Implementation",
      "Validated Company": "Portfolio Company",
      "Pilot": "Pilot"
    };

    // Only make IT Implementation, Pilot, and Validated Company clickable
    if (["IT Implementation", "Pilot", "Validated Company"].includes(stageName)) {
      const newFilters = { ...filters };
      const dbValue = stageMapping[stageName];
      
      // If already filtering by this stage, clear the filter
      if (newFilters.pipelineStage === dbValue) {
        newFilters.pipelineStage = "";
      } else {
        newFilters.pipelineStage = dbValue;
      }
      onFilterChange(newFilters);
    }
  };

  const stages = [
    { name: "Qualified Leads", count: hasActiveFilters ? 0 : (details?.["Qualified Leads"] || 0), isClickable: false },
    { name: "Term Sheet Negotiations", count: hasActiveFilters ? 0 : (details?.["Term Sheet Negotiations"] || 0), isClickable: false },
    { name: "IPA Negotiations", count: hasActiveFilters ? 0 : (details?.["IPA Negotiations"] || 0), isClickable: false },
    { name: "IT Implementation", count: implementationCount, isClickable: true },
    { name: "Pilot", count: pilotCount, isClickable: true },
    { name: "Validated Company", count: portfolioCount, isClickable: true },
  ];

  return (
    <div className="bg-card rounded-lg p-6 border">
      <h3 className="text-lg font-semibold mb-6 text-center">Pipeline Overview</h3>
      
      <div className="flex items-center justify-center gap-4 overflow-x-auto pt-4">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-center gap-4">
            {/* Stage Circle */}
            <div className="flex flex-col items-center gap-2 min-w-[120px] pt-2">
              <div 
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
                  stage.name === "Validated Company" 
                    ? "bg-green-500/10 border-2 border-green-500" 
                    : "bg-primary/10 border-2 border-primary"
                } ${
                  stage.isClickable 
                    ? "cursor-pointer hover:scale-105 hover:shadow-md" 
                    : ""
                } ${
                  (stage.name === "IT Implementation" && filters.pipelineStage === "Implementation") ||
                  (stage.name === "Validated Company" && filters.pipelineStage === "Portfolio Company") ||
                  (stage.name === "Pilot" && filters.pipelineStage === "Pilot")
                    ? stage.name === "Validated Company"
                      ? "ring-2 ring-offset-2 ring-green-500"
                      : "ring-2 ring-offset-2 ring-primary"
                    : ""
                }`}
                onClick={() => handleStageClick(stage.name)}
              >
                <span className={`text-xl font-bold ${
                  stage.name === "Validated Company" ? "text-green-600" : "text-primary"
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