import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface FilterBarProps {
  onFiltersChange: (filters: FilterState) => void;
}

export interface FilterState {
  ipaYear: string;
  countryOfOrigin: string;
  focusArea: string;
  evpOwner: string;
}

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 10 }, (_, i) => (currentYear - i).toString());

const countries = [
  "United States", "Canada", "United Kingdom", "Germany", "France", 
  "Israel", "Australia", "Netherlands", "Switzerland", "Sweden"
];

const focusAreas = [
  "Digital Health", "Medical Devices", "Pharmaceuticals", "Biotechnology",
  "Health IT", "Telehealth", "AI/ML", "Diagnostics", "Therapeutics"
];

const evpOwners = [
  "John Smith", "Sarah Johnson", "Michael Brown", "Emily Davis",
  "Robert Wilson", "Lisa Anderson", "David Martinez", "Jennifer Taylor"
];

export function FilterBar({ onFiltersChange }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterState>({
    ipaYear: "",
    countryOfOrigin: "",
    focusArea: "",
    evpOwner: ""
  });

  const updateFilter = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      ipaYear: "",
      countryOfOrigin: "",
      focusArea: "",
      evpOwner: ""
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== "");

  return (
    <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg border">
      <div className="flex items-center gap-4 flex-1 flex-wrap">
        <Select value={filters.ipaYear} onValueChange={(value) => updateFilter("ipaYear", value)}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue placeholder="IPA Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.countryOfOrigin} onValueChange={(value) => updateFilter("countryOfOrigin", value)}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue placeholder="Country of Origin" />
          </SelectTrigger>
          <SelectContent>
            {countries.map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.focusArea} onValueChange={(value) => updateFilter("focusArea", value)}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue placeholder="Focus Area" />
          </SelectTrigger>
          <SelectContent>
            {focusAreas.map(area => (
              <SelectItem key={area} value={area}>{area}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filters.evpOwner} onValueChange={(value) => updateFilter("evpOwner", value)}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue placeholder="EVP Owner" />
          </SelectTrigger>
          <SelectContent>
            {evpOwners.map(owner => (
              <SelectItem key={owner} value={owner}>{owner}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-2" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}