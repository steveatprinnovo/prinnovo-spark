import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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


export function FilterBar({ onFiltersChange, filters, companies }: FilterBarProps) {
  const { logos } = useAllVentureOfficeLogos();

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

  const getFocusAreaColor = (focusArea: string) => {
    switch (focusArea.toLowerCase()) {
      case 'operational':
        return 'bg-blue-500';
      case 'clinical':
        return 'bg-green-500';
      case 'financial':
        return 'bg-orange-500';
      default:
        return 'bg-blue-500';
    }
  };

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

  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
          {filters.ipaYear && (
            <Badge variant="secondary" className="flex items-center gap-1">
              IPA Year: {filters.ipaYear}
              <button 
                onClick={() => clearSingleFilter("ipaYear")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.countryOfOrigin && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Country: {filters.countryOfOrigin}
              <button 
                onClick={() => clearSingleFilter("countryOfOrigin")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.focusArea && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Focus Area: {filters.focusArea}
              <button 
                onClick={() => clearSingleFilter("focusArea")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
           {filters.evpOwner && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Executive Owner: {filters.evpOwner}
              <button 
                onClick={() => clearSingleFilter("evpOwner")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          {filters.pipelineStage && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Pipeline Stage: {filters.pipelineStage}
              <button 
                onClick={() => clearSingleFilter("pipelineStage")}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                ×
              </button>
            </Badge>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={clearFilters}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
      )}

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="w-50">
          <Select value={filters.ipaYear} onValueChange={(value) => updateFilter("ipaYear", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by IPA Year" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-50">
          <Select value={filters.countryOfOrigin} onValueChange={(value) => updateFilter("countryOfOrigin", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Country" />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country} value={country}>
                  {country}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-50">
          <Select value={filters.focusArea} onValueChange={(value) => updateFilter("focusArea", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Focus Area" />
            </SelectTrigger>
            <SelectContent>
              {focusAreas.map((area) => (
                <SelectItem key={area} value={area}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-sm ${getFocusAreaColor(area)}`}></div>
                    {area}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-50">
          <Select value={filters.evpOwner} onValueChange={(value) => updateFilter("evpOwner", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Executive Owner" />
            </SelectTrigger>
            <SelectContent>
              {evpOwners.map((owner) => {
                const ventureOffice = getVentureOfficeForOwner(owner);
                const logoUrl = ventureOffice ? getLogoForOffice(ventureOffice) : null;
                return (
                  <SelectItem key={owner} value={owner}>
                    <div className="flex items-center gap-2">
                      <span>{owner} ({getEvpOwnerCount(owner)})</span>
                      {logoUrl && (
                        <img 
                          src={logoUrl} 
                          alt={ventureOffice || ''} 
                          className="w-4 h-4 object-contain"
                        />
                      )}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>

        <div className="w-50">
          <Select value={filters.pipelineStage} onValueChange={(value) => updateFilter("pipelineStage", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Pipeline Stage" />
            </SelectTrigger>
            <SelectContent>
              {pipelineStages.map((stage) => (
                <SelectItem key={stage} value={stage}>
                  {stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}