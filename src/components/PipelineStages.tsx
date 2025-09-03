import { Company } from "@/hooks/useCompanies";
import { ChevronRight } from "lucide-react";

interface PipelineStagesProps {
  companies: Company[];
}

export function PipelineStages({ companies }: PipelineStagesProps) {
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
    { name: "Qualified Leads", count: 54 },
    { name: "Term Sheet Negotiations", count: 4 },
    { name: "IPA Negotiations", count: 4 },
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
              <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                <span className="text-xl font-bold text-primary">{stage.count}</span>
              </div>
              <span className="text-sm text-muted-foreground text-center leading-tight">
                {stage.name}
              </span>
            </div>
            
            {/* Arrow (except for last item) */}
            {index < stages.length - 1 && (
              <ChevronRight className="w-6 h-6 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}