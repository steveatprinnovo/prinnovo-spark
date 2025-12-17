import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { KPICards } from "@/components/KPICards";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { CompanyGrid } from "@/components/CompanyGrid";
import { CompanyModal } from "@/components/CompanyModal";
import { VentureOfficeSelector } from "@/components/VentureOfficeSelector";
import { VentureOfficeDropdown } from "@/components/VentureOfficeDropdown";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { CountryMap } from "@/components/CountryMap";
import { PipelineStages } from "@/components/PipelineStages";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice, loading: authzLoading } = useUserAuth();
  const { selectedVentureOffice, showSelector, selectVentureOffice, changeVentureOffice } = useAdminVentureOffice();
  const { companies, loading } = useCompanies();
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    ipaYear: "",
    countryOfOrigin: "",
    focusArea: "",
    evpOwner: "",
    pipelineStage: ""
  });

  // Get unique venture offices
  const ventureOffices = useMemo(() => 
    Array.from(new Set(companies.map(c => c.venture_office).filter(Boolean))) as string[],
    [companies]
  );

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Filter by venture office (if user is not admin)
      if (!isAdmin && ventureOffice && company.venture_office !== ventureOffice) {
        return false;
      }
      // Admin venture office filter
      if (isAdmin && selectedVentureOffice !== "all" && company.venture_office !== selectedVentureOffice) {
        return false;
      }
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
    }).sort((a, b) => a["Company Name"].localeCompare(b["Company Name"]));
  }, [companies, filters, isAdmin, ventureOffice, selectedVentureOffice]);

  const handleCountryClick = (country: string) => {
    if (filters.countryOfOrigin === country) {
      // If the same country is clicked, clear the filter
      setFilters({...filters, countryOfOrigin: ""});
    } else {
      // Set the country filter
      setFilters({...filters, countryOfOrigin: country});
    }
  };

  // Show loading while checking authentication or loading data
  if (authLoading || authzLoading || loading) {
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

  // Don't render dashboard if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      {/* Venture Office Selector Modal for Admins */}
      {isAdmin && <VentureOfficeSelector isOpen={showSelector} ventureOffices={ventureOffices} onSelect={selectVentureOffice} />}
      
      <div className="container mx-auto p-6 space-y-6">
        {/* Admin Venture Office Selector */}
        {isAdmin && (
          <div className="flex justify-end">
            <div className="w-64">
              <VentureOfficeDropdown
                value={selectedVentureOffice}
                onChange={changeVentureOffice}
                ventureOffices={ventureOffices}
                companyCounts={Object.fromEntries(ventureOffices.map(o => [o, companies.filter(c => c.venture_office === o).length]))}
                totalCount={companies.length}
              />
            </div>
          </div>
        )}
        
        {/* Top Section: KPIs and Map */}
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-6">
          {/* Left: KPI Cards - Smaller and vertically distributed */}
          <div className="w-auto">
            <KPICards selectedVentureOffice={isAdmin ? selectedVentureOffice : undefined} />
          </div>
          
          {/* Right: Interactive Map - Expanded 10% to the left */}
          <div className="-ml-[calc(10%-40px)]">{/* Narrowed by 40px total from the left */}
            <CountryMap 
              companies={companies}
              onCountryClick={handleCountryClick}
              selectedCountry={filters.countryOfOrigin}
              selectedVentureOffice={isAdmin ? selectedVentureOffice : ventureOffice || "all"}
            />
          </div>
        </div>
        
        {/* Separator */}
        <Separator className="my-6" />
        
        {/* Pipeline Stages */}
        <PipelineStages companies={filteredCompanies} filters={filters} onFilterChange={setFilters} selectedVentureOffice={isAdmin ? selectedVentureOffice : undefined} />
        
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
