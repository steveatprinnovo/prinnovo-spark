import { useEffect, useRef, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import { useAllVentureOfficeLogos } from "@/hooks/useVentureOfficeLogo";

interface FilterBarProps {
  onFiltersChange: (filters: FilterState) => void;
  filters: FilterState;
  companies: Array<{
    "Company Name": string;
    "Country of Origin": string | null;
    "High-Level Focus Area": string | null;
    "EVP Owner": string | null;
    "IPA Year": number | null;
    "Pipeline Stage": string | null;
    venture_office?: string | null;
    [key: string]: any;
  }>;
}

export interface FilterState {
  ipaYear: string;
  countryOfOrigin: string;
  focusArea: string;
  evpOwner: string;
  pipelineStage: string;
}

/** Spec input style shared by every filter control. */
const triggerClasses =
  "h-auto w-full rounded border border-[#e2e3ec] bg-white px-2.5 py-[7px] text-[13.5px] text-[#5c6178] shadow-none transition-colors hover:border-[#b9bbd4] focus:ring-1 focus:ring-[#0299aa]/40 focus:ring-offset-0 data-[placeholder]:text-[#5c6178]";

/** High-Level Focus Area swatch colors (Prinnovo Spark design system). */
const getFocusAreaColor = (focusArea: string): string => {
  switch (focusArea.toLowerCase()) {
    case "clinical":
      return "#0299aa";
    case "financial":
      return "#171d70";
    case "operational":
      return "#8b8fa3";
    default:
      return "#8b8fa3";
  }
};

export function FilterBar({ onFiltersChange, filters, companies }: FilterBarProps) {
  const { logos } = useAllVentureOfficeLogos();
  const [focusAreaOpen, setFocusAreaOpen] = useState(false);
  const focusAreaRef = useRef<HTMLDivElement>(null);

  // Close the focus-area dropdown when clicking outside of it
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (focusAreaRef.current && !focusAreaRef.current.contains(event.target as Node)) {
        setFocusAreaOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getLogoForOffice = (officeName: string): string | null => {
    const officeData = logos.find((l) => l.name === officeName);
    return officeData?.logoUrl || null;
  };

  // Get venture office for an EVP owner
  const getVentureOfficeForOwner = (owner: string): string | null => {
    const company = companies.find(c => c["EVP Owner"] === owner && c.venture_office);
    return company?.venture_office || null;
  };
  // Generate dynamic filter options from actual data
  const years = Array.from(new Set(
    companies
      .map(company => company["IPA Year"])
      .filter((year): year is number => year !== null)
      .map(year => year.toString())
  )).sort();

  const countries = Array.from(new Set(
    companies
      .map(company => company["Country of Origin"])
      .filter((country): country is string => country !== null)
  )).sort();

  const focusAreas = Array.from(new Set(
    companies
      .map(company => company["High-Level Focus Area"])
      .filter((area): area is string => area !== null)
  )).sort();

  const evpOwners = Array.from(new Set(
    companies
      .map(company => company["EVP Owner"])
      .filter((owner): owner is string => owner !== null)
  )).sort();

  const getEvpOwnerCount = (owner: string) => {
    return companies.filter(company => company["EVP Owner"] === owner).length;
  };

  const pipelineStages = Array.from(new Set(
    companies
      .map(company => company["Pipeline Stage"])
      .filter((stage): stage is string => stage !== null)
  )).sort();

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      ipaYear: "",
      countryOfOrigin: "",
      focusArea: "",
      evpOwner: "",
      pipelineStage: ""
    };
    onFiltersChange(clearedFilters);
  };

  const clearSingleFilter = (key: keyof FilterState) => {
    const newFilters = { ...filters, [key]: "" };
    onFiltersChange(newFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  const activeFilterChips: Array<{ key: keyof FilterState; label: string }> = [
    ...(filters.ipaYear ? [{ key: "ipaYear" as const, label: `IPA Year: ${filters.ipaYear}` }] : []),
    ...(filters.countryOfOrigin ? [{ key: "countryOfOrigin" as const, label: `Country: ${filters.countryOfOrigin}` }] : []),
    ...(filters.focusArea ? [{ key: "focusArea" as const, label: `Focus Area: ${filters.focusArea}` }] : []),
    ...(filters.evpOwner ? [{ key: "evpOwner" as const, label: `Executive Owner: ${filters.evpOwner}` }] : []),
    ...(filters.pipelineStage ? [{ key: "pipelineStage" as const, label: `Pipeline Stage: ${filters.pipelineStage}` }] : []),
  ];

  return (
    <div className="space-y-3">
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="table-header-label">Active filters</span>
          {activeFilterChips.map(chip => (
            <span
              key={chip.key}
              className="flex items-center gap-1 rounded-full bg-[#e8e9f1] px-2.5 py-[3px] text-xs font-semibold text-[#5a5f9c]"
            >
              {chip.label}
              <button
                onClick={() => clearSingleFilter(chip.key)}
                className="ml-0.5 rounded-full px-1 leading-none hover:bg-[#b9bbd4]/40"
                aria-label={`Clear ${chip.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-[#e2e3ec] bg-white p-4">
        <div className="min-w-[130px] flex-1">
          <Select value={filters.ipaYear} onValueChange={(value) => updateFilter("ipaYear", value)}>
            <SelectTrigger className={triggerClasses}>
              <SelectValue placeholder="Filter by IPA Year" />
            </SelectTrigger>
            <SelectContent className="border-[#e2e3ec] shadow-dropdown">
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px] flex-1">
          <Select value={filters.countryOfOrigin} onValueChange={(value) => updateFilter("countryOfOrigin", value)}>
            <SelectTrigger className={triggerClasses}>
              <SelectValue placeholder="Filter by Country" />
            </SelectTrigger>
            <SelectContent className="border-[#e2e3ec] shadow-dropdown">
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Focus Area: custom dropdown with color swatches */}
        <div className="relative min-w-[150px] flex-1" ref={focusAreaRef}>
          <button
            type="button"
            onClick={() => setFocusAreaOpen(open => !open)}
            aria-haspopup="listbox"
            aria-expanded={focusAreaOpen}
            className="flex w-full items-center justify-between gap-2 rounded border border-[#e2e3ec] bg-white px-2.5 py-[7px] text-[13.5px] text-[#5c6178] transition-colors hover:border-[#b9bbd4]"
          >
            <span className="flex items-center gap-[7px] truncate">
              {filters.focusArea && (
                <span
                  className="h-2.5 w-2.5 flex-none rounded-[2px]"
                  style={{ background: getFocusAreaColor(filters.focusArea) }}
                />
              )}
              {filters.focusArea || "Filter by Focus Area"}
            </span>
            <ChevronDown className="h-3 w-3 flex-none text-[#8b8fa3]" strokeWidth={1.5} />
          </button>
          {focusAreaOpen && (
            <div
              role="listbox"
              className="absolute left-0 right-0 top-[calc(100%+4px)] z-[60] rounded-md border border-[#e2e3ec] bg-white p-1 shadow-dropdown"
            >
              {focusAreas.map((area) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={filters.focusArea === area}
                  key={area}
                  onClick={() => {
                    updateFilter("focusArea", area);
                    setFocusAreaOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded px-2.5 py-2 text-left text-[13.5px] text-[#232842] hover:bg-[#f3f4f8] ${
                    filters.focusArea === area ? "bg-[#e6f5f7]" : ""
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 flex-none rounded-[2px]"
                    style={{ background: getFocusAreaColor(area) }}
                  />
                  {area}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="min-w-[130px] flex-1">
          <Select value={filters.evpOwner} onValueChange={(value) => updateFilter("evpOwner", value)}>
            <SelectTrigger className={triggerClasses}>
              <SelectValue placeholder="Filter by Executive Owner" />
            </SelectTrigger>
            <SelectContent className="border-[#e2e3ec] shadow-dropdown">
              {evpOwners.map((owner) => {
                const ventureOffice = getVentureOfficeForOwner(owner);
                const logoUrl = ventureOffice ? getLogoForOffice(ventureOffice) : null;
                return (
                  <SelectItem key={owner} value={owner}>
                    <div className="flex items-center gap-2">
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt={ventureOffice || ''}
                          className="h-4 w-4 object-contain"
                        />
                      )}
                      <span>{owner} ({getEvpOwnerCount(owner)})</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[130px] flex-1">
          <Select value={filters.pipelineStage} onValueChange={(value) => updateFilter("pipelineStage", value)}>
            <SelectTrigger className={triggerClasses}>
              <SelectValue placeholder="Filter by Pipeline Stage" />
            </SelectTrigger>
            <SelectContent className="border-[#e2e3ec] shadow-dropdown">
              {pipelineStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          className="whitespace-nowrap px-1 text-[13.5px] font-semibold text-[#0299aa] transition-colors hover:text-[#027e8c]"
        >
          Clear all
        </button>
      </div>
    </div>
  );
}
