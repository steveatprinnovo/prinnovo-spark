import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterBarProps {
  onFiltersChange: (filters: FilterState) => void;
  filters: FilterState;
  companies: Array<{
    "Company Name": string;
    "Country of Origin": string | null;
    "High-Level Focus Area": string | null;
    "EVP Owner": string | null;
    "IPA Year": number | null;
    [key: string]: any;
  }>;
}

export interface FilterState {
  ipaYear: string;
  countryOfOrigin: string;
  focusArea: string;
  evpOwner: string;
}


export function FilterBar({ onFiltersChange, filters, companies }: FilterBarProps) {
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

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      ipaYear: "",
      countryOfOrigin: "",
      focusArea: "",
      evpOwner: ""
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
              EVP Owner: {filters.evpOwner}
              <button 
                onClick={() => clearSingleFilter("evpOwner")}
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
        <div className="w-40">
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

        <div className="w-40">
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

        <div className="w-40">
          <Select value={filters.focusArea} onValueChange={(value) => updateFilter("focusArea", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by Focus Area" />
            </SelectTrigger>
            <SelectContent>
              {focusAreas.map((area) => (
                <SelectItem key={area} value={area}>
                  {area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Select value={filters.evpOwner} onValueChange={(value) => updateFilter("evpOwner", value)}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by EVP Owner" />
            </SelectTrigger>
            <SelectContent>
              {evpOwners.map((owner) => (
                <SelectItem key={owner} value={owner}>
                  {owner}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}