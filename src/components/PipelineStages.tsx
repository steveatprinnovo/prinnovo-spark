import { Company } from "@/hooks/useCompanies";
import { FilterState } from "@/components/FilterBar";
import { ChevronRight } from "lucide-react";
import { useDealStageCounts } from "@/hooks/useDealStageCounts";

interface PipelineStagesProps {
  companies: Company[];
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  selectedVentureOffice?: string;
  dealsOffice?: string | null;
}

export function PipelineStages({ companies, filters, onFilterChange, selectedVentureOffice, dealsOffice }: PipelineStagesProps) {
  // Live counts from the Dealflow deals table, scoped to the selected office
  const dealCounts = useDealStageCounts(dealsOffice ?? selectedVentureOffice);
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
    { name: "Qualified Leads", count: hasActiveFilters ? 0 : dealCounts.qualifiedLead, isClickable: false },
    { name: "Term Sheet Negotiations", count: hasActiveFilters ? 0 : dealCounts.termSheet, isClickable: false },
    { name: "IPA Negotiations", count: hasActiveFilters ? 0 : dealCounts.ipaNegotiation, isClickable: false },
    { name: "IT Implementation", count: implementationCount, isClickable: true },
    { name: "Pilot", count: pilotCount, isClickable: true },
    { name: "Validated Company", count: portfolioCount, isClickable: true },
  ];

  return (
    <div className="rounded-lg border border-[#e2e3ec] bg-white px-6 pb-7 pt-6">
      <span className="accent-rule mx-auto mb-3" />
      <h3 className="mb-6 text-center text-lg font-bold text-[#171d70]">Pipeline Overview</h3>

      <div className="flex items-start justify-center gap-3.5 overflow-x-auto">
        {stages.map((stage, index) => {
          const isValidated = stage.name === "Validated Company";
          const isActive =
            (stage.name === "IT Implementation" && filters.pipelineStage === "Implementation") ||
            (stage.name === "Validated Company" && filters.pipelineStage === "Portfolio Company") ||
            (stage.name === "Pilot" && filters.pipelineStage === "Pilot");

          return (
            <div key={stage.name} className="flex items-start gap-3.5">
              {/* Stage Circle */}
              <div className="flex min-w-[108px] flex-col items-center gap-[9px]">
                <div
                  className={`flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    isValidated
                      ? "border-[#2e7d5b] bg-[#e9f4ef]"
                      : "border-[#0299aa] bg-[#e6f5f7]"
                  } ${
                    stage.isClickable
                      ? "cursor-pointer hover:scale-105 hover:shadow-md"
                      : ""
                  } ${
                    isActive
                      ? isValidated
                        ? "ring-2 ring-[#2e7d5b] ring-offset-2"
                        : "ring-2 ring-[#0299aa] ring-offset-2"
                      : ""
                  }`}
                  onClick={() => handleStageClick(stage.name)}
                >
                  <span className={`text-[19px] font-bold ${
                    isValidated ? "text-[#2e7d5b]" : "text-[#0299aa]"
                  }`}>{stage.count}</span>
                </div>
                <span className="text-center text-[12.5px] leading-[1.25] text-[#5c6178]">
                  {stage.name}
                </span>
              </div>

              {/* Arrow (except for last item) */}
              {index < stages.length - 1 && (
                <ChevronRight className="mt-[22px] h-[18px] w-[18px] flex-shrink-0 text-[#b9bbd4]" strokeWidth={1.5} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
