import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KPICards } from "@/components/KPICards";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { CompanyGrid } from "@/components/CompanyGrid";
import { CompanyModal } from "@/components/CompanyModal";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { CountryMap } from "@/components/CountryMap";
import { PipelineStages } from "@/components/PipelineStages";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { companies, loading } = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    ipaYear: "",
    countryOfOrigin: "",
    focusArea: "",
    evpOwner: "",
    pipelineStage: ""
  });

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      if (filters.ipaYear && company["IPA Year"]?.toString() !== filters.ipaYear) {
        return false;
      }
      if (filters.countryOfOrigin && company["Country of Origin"] !== filters.countryOfOrigin) {
        return false;
      }
      if (filters.focusArea && company["High-Level Focus Area"] !== filters.focusArea) {
        return false;
      }
      if (filters.evpOwner && company["EVP Owner"] !== filters.evpOwner) {
        return false;
      }
      if (filters.pipelineStage && company["Pipeline Stage"] !== filters.pipelineStage) {
        return false;
      }
      return true;
    });
  }, [companies, filters]);

  const handleCountryClick = (country: string) => {
    if (filters.countryOfOrigin === country) {
      // If the same country is clicked, clear the filter
      setFilters({...filters, countryOfOrigin: ""});
    } else {
      // Set the country filter
      setFilters({...filters, countryOfOrigin: country});
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-20" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto p-8 2xl:p-12 space-y-8 2xl:space-y-12">
        {/* Top Section: KPIs and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-8 2xl:gap-12">
          {/* Left: KPI Cards - Larger for 4K */}
          <div className="w-auto">
            <KPICards />
          </div>
          
          {/* Right: Interactive Map - Optimized for 4K viewing */}
          <div className="2xl:-ml-[calc(10%-60px)]">{/* Adjusted for 4K spacing */}
            <CountryMap 
              companies={companies}
              onCountryClick={handleCountryClick}
              selectedCountry={filters.countryOfOrigin}
            />
          </div>
        </div>
        
        {/* Separator */}
        <Separator className="my-8 2xl:my-12" />
        
        {/* Pipeline Stages */}
        <PipelineStages companies={filteredCompanies} filters={filters} />
        
        {/* Filters */}
        <FilterBar onFiltersChange={setFilters} filters={filters} companies={companies} />
        
        {/* Company Grid */}
        <CompanyGrid 
          companies={filteredCompanies}
          onCompanyClick={setSelectedCompany}
        />
        
        {/* Company Detail Modal */}
        <CompanyModal
          company={selectedCompany}
          isOpen={!!selectedCompany}
          onClose={() => setSelectedCompany(null)}
        />
      </div>
    </div>
  );
};

export default Index;
