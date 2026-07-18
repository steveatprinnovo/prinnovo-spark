import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { KPICards } from "@/components/KPICards";
import { FilterBar, FilterState } from "@/components/FilterBar";
import { CompanyGrid } from "@/components/CompanyGrid";
import { CompanyModal } from "@/components/CompanyModal";
import { VentureOfficeSelector } from "@/components/VentureOfficeSelector";
import { PageHeader, PageContainer } from "@/components/layout/PageHeader";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { lazy, Suspense } from "react";
const CountryMap = lazy(() => import("@/components/CountryMap").then(m => ({ default: m.CountryMap })));
import { PipelineStages } from "@/components/PipelineStages";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { PREVIEW } from "@/preview/previewMode";

const Index = () => {
  usePageTitle("Home");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice, loading: authzLoading } = useUserAuth();
  const { selectedVentureOffice, showSelector, selectVentureOffice } = useAdminVentureOffice();
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
    if (!PREVIEW && !authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Companies filtered by venture office only (for FilterBar options)
  const ventureOfficeFilteredCompanies = useMemo(() => {
    return companies.filter(company => {
      // Filter by venture office (if user is not admin)
      if (!isAdmin && ventureOffice && company.venture_office !== ventureOffice) {
        return false;
      }
      // Admin venture office filter
      if (isAdmin && selectedVentureOffice !== "all" && company.venture_office !== selectedVentureOffice) {
        return false;
      }
      return true;
    });
  }, [companies, isAdmin, ventureOffice, selectedVentureOffice]);

  const filteredCompanies = useMemo(() => {
    return ventureOfficeFilteredCompanies.filter(company => {
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
  }, [ventureOfficeFilteredCompanies, filters]);

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
      <PageContainer>
        <div className="space-y-6">
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
      </PageContainer>
    );
  }

  // Don't render dashboard if not authenticated
  if (!PREVIEW && !user) {
    return null;
  }

  return (
    <PageContainer>
      {/* Venture Office Selector Modal for Admins */}
      {isAdmin && <VentureOfficeSelector isOpen={showSelector} ventureOffices={ventureOffices} onSelect={selectVentureOffice} />}

      {/* Page Header */}
      <PageHeader
        title="Portfolio Dashboard"
        subtitle="Companies, pipeline, and portfolio performance at a glance."
      />

      {/* Top Section: KPIs and Map */}
      <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-[300px_1fr]">
        {/* Left: 3 stacked flat KPI cards */}
        <KPICards selectedVentureOffice={isAdmin ? selectedVentureOffice : undefined} />

        {/* Right: Interactive Map */}
        <div className="min-w-0">
          <Suspense fallback={<div className="h-[500px] animate-pulse rounded-lg border border-[#e2e3ec] bg-[#f3f4f8]" />}>
            <CountryMap
              companies={ventureOfficeFilteredCompanies}
              onCountryClick={handleCountryClick}
              selectedCountry={filters.countryOfOrigin}
              selectedVentureOffice={isAdmin ? selectedVentureOffice : ventureOffice || "all"}
            />
          </Suspense>
        </div>
      </div>

      {/* Hairline divider */}
      <div className="my-8 h-px bg-[#e2e3ec]" />

      {/* Pipeline Stages */}
      <PipelineStages companies={filteredCompanies} filters={filters} onFilterChange={setFilters} selectedVentureOffice={isAdmin ? selectedVentureOffice : undefined} dealsOffice={isAdmin ? selectedVentureOffice : ventureOffice} />

      {/* Filters */}
      <div className="mt-6">
        <FilterBar onFiltersChange={setFilters} filters={filters} companies={ventureOfficeFilteredCompanies} />
      </div>

      {/* Company Grid */}
      <div className="mt-5">
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
    </PageContainer>
  );
};

export default Index;
