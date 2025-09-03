import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KPICards } from "@/components/KPICards";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { CompanyGrid } from "@/components/CompanyGrid";
import { CompanyModal } from "@/components/CompanyModal";
import { PortfolioChart } from "@/components/PortfolioChart";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const { companies, loading } = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    ipaYear: "",
    countryOfOrigin: "",
    focusArea: "",
    evpOwner: ""
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
      return true;
    });
  }, [companies, filters]);

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
      
      <div className="container mx-auto p-6 space-y-6">
        {/* KPI Cards */}
        <KPICards />
        
        {/* Filters */}
        <FilterBar onFiltersChange={setFilters} />
        
        {/* Portfolio Chart */}
        <PortfolioChart companies={filteredCompanies} />
        
        {/* Company Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Portfolio Companies</h2>
            <span className="text-muted-foreground">
              {filteredCompanies.length} of {companies.length} companies
            </span>
          </div>
          <CompanyGrid 
            companies={filteredCompanies}
            onCompanyClick={setSelectedCompany}
          />
        </div>
        
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
