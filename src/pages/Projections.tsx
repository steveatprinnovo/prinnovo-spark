import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { VentureOfficeSelector } from "@/components/VentureOfficeSelector";
import { PageHeader, PageContainer } from "@/components/layout/PageHeader";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useVentureOfficeDetails } from "@/hooks/useVentureOfficeDetails";
import { useDuplicatedCompanyNames } from "@/hooks/useDuplicatedCompanies";
import { useAllVentureOfficeLogos } from "@/hooks/useVentureOfficeLogo";
import { useAllVentureOffices } from "@/hooks/useAllVentureOffices";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, ChevronUp, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePageTitle } from "@/hooks/usePageTitle";

type ForecastType = "target" | "very-conservative" | "conservative" | "aggressive" | "very-aggressive";
type SortField = "company" | "targetIpaReturn" | "cashInvested" | "targetCashReturn" | "equityValue" | "dataMonetizationDollars" | "dataMonetizationForecast" | "totalEnterpriseValue";
type SortDirection = "asc" | "desc";

const FORECAST_MULTIPLIERS: Record<ForecastType, number> = {
  "target": 1,
  "very-conservative": 0.5,
  "conservative": 0.75,
  "aggressive": 1.25,
  "very-aggressive": 1.5,
};

const formatCurrency = (value: number | null) => {
  if (value === null) return "$0";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number) => {
  return `${value.toFixed(2)}%`;
};

interface CompanyRowProps {
  company: Company;
  forecast: ForecastType;
  showTargetCashReturnAsPercent: boolean;
  showEquityValueAsPercent: boolean;
  showDataMonetizationAsPercent: boolean;
  showVentureOfficeLogo?: boolean;
  ventureOfficeLogos?: { name: string; logoUrl: string | null }[];
}

const formatDate = (dateString: string | null) => {
  if (!dateString) return "No date available";
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const CompanyRow = ({
  company,
  forecast,
  showTargetCashReturnAsPercent,
  showEquityValueAsPercent,
  showDataMonetizationAsPercent,
  showVentureOfficeLogo,
  ventureOfficeLogos
}: CompanyRowProps) => {
  const isPrinnovoHealth = company["Company Name"] === "Prinnovo Health";
  const { logoUrl: regularLogoUrl } = useCompanyLogo(company.imgurl);
  const [prinnovoLogoUrl, setPrinnovoLogoUrl] = useState<string | null>(null);

  const ventureOfficeLogo = showVentureOfficeLogo
    ? ventureOfficeLogos?.find(l => l.name === company.venture_office)?.logoUrl
    : null;

  useEffect(() => {
    if (isPrinnovoHealth) {
      const fetchPrinnovoLogo = async () => {
        const { data, error } = await supabase.storage
          .from('Company Logos')
          .createSignedUrl('prinnovo-logo.png', 60 * 60 * 24); // 24 hour expiry

        if (data?.signedUrl && !error) {
          setPrinnovoLogoUrl(data.signedUrl);
        }
      };

      fetchPrinnovoLogo();
    }
  }, [isPrinnovoHealth]);

  const logoUrl = isPrinnovoHealth ? prinnovoLogoUrl : regularLogoUrl;
  const multiplier = FORECAST_MULTIPLIERS[forecast];

  const targetIpaReturn = (company["Target IPA Return"] || 0) * multiplier;
  const targetCashReturn = (company["Target Cash Investment Return"] || 0) * multiplier;
  const dataMonetizationForecast = (company["Data Monetization Forecast"] || 0) * multiplier;

  const equityValue = company["Current HLV Valuation"] || 0;
  const dataMonetizationDollars = company["Data Monetization Dollars"] || 0;
  const totalEnterpriseValue = equityValue + dataMonetizationDollars;

  return (
    <TableRow>
      <TableCell className="flex items-center gap-2 text-left cell-1 px-2 py-2.5 transition-colors">
        <div className="w-6 h-6 rounded-md overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${company["Company Name"]} logo`}
              className="w-full h-full object-contain"
            />
          ) : (
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <span className="font-medium text-[12.5px] truncate text-[#171d70]">{company["Company Name"]}</span>
        {ventureOfficeLogo && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <img
                  src={ventureOfficeLogo}
                  alt={`${company.venture_office} logo`}
                  className="w-5 h-5 rounded object-contain cursor-help"
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{company.venture_office}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </TableCell>
      <TableCell className="cell-2 transition-colors text-center text-[12.5px] px-2 py-2.5 text-[#232842]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{formatCurrency(targetIpaReturn)}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">IPA Signed: {formatDate(company["IPA Signature Date"])}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="cell-3 transition-colors text-center text-[12.5px] px-2 py-2.5 text-[#232842]">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{formatCurrency(company["Invested Amount"])}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Invested: {formatDate(company["Invested Amount Date"])}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="cell-4 transition-colors text-center text-[12.5px] px-2 py-2.5 text-[#232842]">
        {(company["Invested Amount"] || 0) === 0
          ? "N/A"
          : showTargetCashReturnAsPercent
            ? targetCashReturn > 0
              ? formatPercentage(((company["Invested Amount"] || 0) / targetCashReturn) * 100)
              : "0.00%"
            : formatCurrency(targetCashReturn)
        }
      </TableCell>
      <TableCell className="cell-5 transition-colors text-center text-[12.5px] px-2 py-2.5 text-[#232842]">
        {showEquityValueAsPercent && targetIpaReturn > 0
          ? formatPercentage((equityValue / targetIpaReturn) * 100)
          : formatCurrency(equityValue)
        }
      </TableCell>
      <TableCell className="cell-6 transition-colors text-center text-[12.5px] px-2 py-2.5 text-[#232842]">
        {dataMonetizationForecast === 0 ? "N/A" : formatCurrency(dataMonetizationDollars)}
      </TableCell>
      <TableCell className="cell-7 transition-colors text-center text-[12.5px] px-2 py-2.5 text-[#232842]">
        {dataMonetizationForecast === 0
          ? "N/A"
          : showDataMonetizationAsPercent
            ? dataMonetizationForecast > 0
              ? formatPercentage((dataMonetizationDollars / dataMonetizationForecast) * 100)
              : "0.00%"
            : formatCurrency(dataMonetizationForecast)
        }
      </TableCell>
      <TableCell className="cell-8 transition-colors text-center text-[12.5px] px-2 py-2.5 font-semibold text-[#171d70]">{formatCurrency(totalEnterpriseValue)}</TableCell>
    </TableRow>
  );
};

const Projections = () => {
  usePageTitle("Revenue Projections");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice, loading: authzLoading } = useUserAuth();
  const { selectedVentureOffice, showSelector, selectVentureOffice } = useAdminVentureOffice();
  const { companies, loading } = useCompanies();
  const [forecast, setForecast] = useState<ForecastType>("target");
  const [showTargetCashReturnAsPercent, setShowTargetCashReturnAsPercent] = useState(false);
  const [showEquityValueAsPercent, setShowEquityValueAsPercent] = useState(false);
  const [showDataMonetizationAsPercent, setShowDataMonetizationAsPercent] = useState(false);
  const [sortField, setSortField] = useState<SortField>("company");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [prinnovoLogoUrl, setPrinnovoLogoUrl] = useState<string | null>(null);

  const { details: ventureOfficeDetails } = useVentureOfficeDetails(isAdmin ? selectedVentureOffice : ventureOffice || "");
  const duplicatedCompanyNames = useDuplicatedCompanyNames(companies);
  const { logos: ventureOfficeLogos } = useAllVentureOfficeLogos();
  const { ventureOffices: allVentureOffices } = useAllVentureOffices();

  // Use all venture offices from the database (so offices without companies still appear)
  const ventureOffices = allVentureOffices;

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch Prinnovo Health logo
  useEffect(() => {
    const fetchPrinnovoLogo = async () => {
      const { data } = await supabase.storage
        .from('Company Logos')
        .getPublicUrl('prinnovo-logo.png');

      if (data?.publicUrl) {
        setPrinnovoLogoUrl(data.publicUrl);
      }
    };

    fetchPrinnovoLogo();
  }, []);

  // Filter and sort companies that have investment tracking data
  const projectionsCompanies = useMemo(() => {
    const filtered = companies.filter(company => {
      if (!company["Target IPA Return"]) return false;
      // Filter by venture office (if user is not admin)
      if (!isAdmin && ventureOffice && company.venture_office !== ventureOffice) {
        return false;
      }
      if (selectedVentureOffice === "all") return true;
      return company.venture_office === selectedVentureOffice;
    });

    // Check if we need to add Prinnovo Health
    const shouldAddPrinnovo = ventureOfficeDetails?.["Prinnovo Health Ownership"] === "Yes";

    let companiesWithPrinnovo = [...filtered];

    if (shouldAddPrinnovo && filtered.length > 0) {
      // Calculate sum of all values × 0.02
      const prinnovoData: Company = {
        deal_id: -1, // Synthetic company, not in database
        "Company Name": "Prinnovo Health",
        "Target IPA Return": filtered.reduce((sum, c) => sum + (c["Target IPA Return"] || 0), 0) * 0.02,
        "Invested Amount": filtered.reduce((sum, c) => sum + (c["Invested Amount"] || 0), 0) * 0.02,
        "Target Cash Investment Return": filtered.reduce((sum, c) => sum + (c["Target Cash Investment Return"] || 0), 0) * 0.02,
        "Current HLV Valuation": filtered.reduce((sum, c) => sum + (c["Current HLV Valuation"] || 0), 0) * 0.02,
        "Current Company Valuation": filtered.reduce((sum, c) => sum + (c["Current Company Valuation"] || 0), 0) * 0.02,
        "Data Monetization Dollars": filtered.reduce((sum, c) => sum + (c["Data Monetization Dollars"] || 0), 0) * 0.02,
        "Data Monetization Forecast": filtered.reduce((sum, c) => sum + (c["Data Monetization Forecast"] || 0), 0) * 0.02,
        "Total Enterprise Value Captured": filtered.reduce((sum, c) => sum + (c["Total Enterprise Value Captured"] || 0), 0) * 0.02,
        imgurl: "prinnovo-logo.png",
        venture_office: selectedVentureOffice,
        "Company Description": null,
        "HLV Ownership Percentage": null,
        "Intro Origin": null,
        Champions: null,
        "EVP Owner": null,
        "Company Contact": null,
        "Specific Focus Area": null,
        "High-Level Focus Area": null,
        "Country of Origin": null,
        "Pipeline Stage": null,
        "Investment Tracker Stage": null,
        "Final Portfolio Decision Date": null,
        "Implementation Completion Date": null,
        "IPA Signature Date": null,
        "Term Sheet Signature Date": null,
        "IPA Year": null,
        "Invested Amount Valuation Date": null,
        "Invested Amount Date": null,
        "Invested Amount Valuation": null,
        "Invested Amount Round": null,
        "Invested Amount Round 2": null,
        "Invested Amount 2": null,
        "Invested Amount Date 2": null,
        "Invested Amount Valuation 2": null,
        "Invested Amount Valuation Date 2": null,
        "Invested Amount Round 3": null,
        "Invested Amount 3": null,
        "Invested Amount Date 3": null,
        "Invested Amount Valuation 3": null,
        "Invested Amount Valuation Date 3": null,
      };

      companiesWithPrinnovo.push(prinnovoData);
    }

    const multiplier = FORECAST_MULTIPLIERS[forecast];

    return companiesWithPrinnovo.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "company":
          aValue = a["Company Name"];
          bValue = b["Company Name"];
          break;
        case "targetIpaReturn":
          aValue = (a["Target IPA Return"] || 0) * multiplier;
          bValue = (b["Target IPA Return"] || 0) * multiplier;
          break;
        case "cashInvested":
          aValue = a["Invested Amount"] || 0;
          bValue = b["Invested Amount"] || 0;
          break;
        case "targetCashReturn":
          aValue = (a["Target Cash Investment Return"] || 0) * multiplier;
          bValue = (b["Target Cash Investment Return"] || 0) * multiplier;
          break;
        case "equityValue":
          aValue = a["Current HLV Valuation"] || 0;
          bValue = b["Current HLV Valuation"] || 0;
          break;
        case "dataMonetizationDollars":
          aValue = a["Data Monetization Dollars"] || 0;
          bValue = b["Data Monetization Dollars"] || 0;
          break;
        case "dataMonetizationForecast":
          aValue = (a["Data Monetization Forecast"] || 0) * multiplier;
          bValue = (b["Data Monetization Forecast"] || 0) * multiplier;
          break;
        case "totalEnterpriseValue":
          aValue = (a["Current HLV Valuation"] || 0) + (a["Data Monetization Dollars"] || 0);
          bValue = (b["Current HLV Valuation"] || 0) + (b["Data Monetization Dollars"] || 0);
          break;
        default:
          return 0;
      }

      if (sortField === "company") {
        // String comparison
        const result = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? result : -result;
      } else {
        // Numeric comparison
        const result = aValue - bValue;
        return sortDirection === "asc" ? result : -result;
      }
    });
  }, [companies, forecast, sortField, sortDirection, selectedVentureOffice, isAdmin, ventureOffice, ventureOfficeDetails]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection(field === "company" ? "asc" : "desc"); // Default to desc for numbers, asc for text
    }
  };

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="h-auto p-1 justify-center hover:bg-transparent hover:text-[#0299aa] transition-colors whitespace-normal text-center min-h-0 leading-tight"
      onClick={() => handleSort(field)}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8b8fa3] leading-tight">{children}</span>
        {sortField === field && (
          sortDirection === "asc" ?
            <ChevronUp className="h-3 w-3" /> :
            <ChevronDown className="h-3 w-3" />
        )}
      </div>
    </Button>
  );

  // Calculate portfolio totals
  const portfolioTotals = useMemo(() => {
    const multiplier = FORECAST_MULTIPLIERS[forecast];

    return projectionsCompanies.reduce((totals, company) => {
      const targetIpaReturn = (company["Target IPA Return"] || 0) * multiplier;
      const targetCashReturn = (company["Target Cash Investment Return"] || 0) * multiplier;
      const dataMonetizationForecast = (company["Data Monetization Forecast"] || 0) * multiplier;
      const equityValue = company["Current HLV Valuation"] || 0;
      const dataMonetizationDollars = company["Data Monetization Dollars"] || 0;

      return {
        targetIpaReturn: totals.targetIpaReturn + targetIpaReturn,
        cashInvested: totals.cashInvested + (company["Invested Amount"] || 0),
        targetCashReturn: totals.targetCashReturn + targetCashReturn,
        equityValue: totals.equityValue + equityValue,
        dataMonetizationDollars: totals.dataMonetizationDollars + dataMonetizationDollars,
        dataMonetizationForecast: totals.dataMonetizationForecast + dataMonetizationForecast,
        totalEnterpriseValue: totals.totalEnterpriseValue + equityValue + dataMonetizationDollars,
      };
    }, {
      targetIpaReturn: 0,
      cashInvested: 0,
      targetCashReturn: 0,
      equityValue: 0,
      dataMonetizationDollars: 0,
      dataMonetizationForecast: 0,
      totalEnterpriseValue: 0,
    });
  }, [projectionsCompanies, forecast]);

  // Show loading while checking authentication or loading data
  if (authLoading || authzLoading || loading) {
    return (
      <PageContainer>
        <div className="space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </PageContainer>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <PageContainer>
      {/* Venture Office Selector Modal for Admins */}
      {isAdmin && <VentureOfficeSelector isOpen={showSelector} ventureOffices={ventureOffices} onSelect={selectVentureOffice} />}

      <PageHeader
        title="Revenue Projections"
        subtitle="Target returns, equity value, and short-term revenue by company"
        actions={
          <div className="w-64">
            <Select value={forecast} onValueChange={(value: ForecastType) => setForecast(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="target">Target Forecast</SelectItem>
                <SelectItem value="very-conservative">Very Conservative</SelectItem>
                <SelectItem value="conservative">Conservative</SelectItem>
                <SelectItem value="aggressive">Aggressive</SelectItem>
                <SelectItem value="very-aggressive">Very Aggressive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#e2e3ec]">
        <div className="border-b border-[#e2e3ec] px-5 pb-3.5 pt-[18px]">
          <span className="accent-rule mb-2.5" />
          <div className="text-base font-bold text-[#171d70]">Revenue Capture by Company</div>
        </div>
        <div className="projections-table-wrapper relative overflow-x-hidden overflow-y-auto h-[calc(100vh-330px)]">
          <style>{`
            /* Ensure sticky headers work: neutralize inner shadcn Table wrapper overflow */
            .projections-table-wrapper > div { overflow: visible !important; }

            /* Row rules (redesign token #f0f1f6) */
            .projections-table-wrapper .table-container tbody td { border-bottom: 1px solid #f0f1f6; }

            .table-container:hover .column-1:hover ~ tbody .cell-1,
            .table-container .column-1:hover ~ tbody .cell-1,
            .table-container .column-1:hover,
            .table-container:has(.column-1:hover) .cell-1 { background-color: #e6f5f7 !important; }

            .table-container:hover .column-2:hover ~ tbody .cell-2,
            .table-container .column-2:hover ~ tbody .cell-2,
            .table-container .column-2:hover,
            .table-container:has(.column-2:hover) .cell-2 { background-color: #e6f5f7 !important; }

            .table-container:hover .column-3:hover ~ tbody .cell-3,
            .table-container .column-3:hover ~ tbody .cell-3,
            .table-container .column-3:hover,
            .table-container:has(.column-3:hover) .cell-3 { background-color: #e6f5f7 !important; }

            .table-container:hover .column-4:hover ~ tbody .cell-4,
            .table-container .column-4:hover ~ tbody .cell-4,
            .table-container .column-4:hover,
            .table-container:has(.column-4:hover) .cell-4 { background-color: #e6f5f7 !important; }

            .table-container:hover .column-5:hover ~ tbody .cell-5,
            .table-container .column-5:hover ~ tbody .cell-5,
            .table-container .column-5:hover,
            .table-container:has(.column-5:hover) .cell-5 { background-color: #e6f5f7 !important; }

            .table-container:hover .column-6:hover ~ tbody .cell-6,
            .table-container .column-6:hover ~ tbody .cell-6,
            .table-container .column-6:hover,
            .table-container:has(.column-6:hover) .cell-6 { background-color: #e6f5f7 !important; }

            .table-container:hover .column-7:hover ~ tbody .cell-7,
            .table-container .column-7:hover ~ tbody .cell-7,
            .table-container .column-7:hover,
            .table-container:has(.column-7:hover) .cell-7 { background-color: #e6f5f7 !important; }

            .table-container:hover .column-8:hover ~ tbody .cell-8,
            .table-container .column-8:hover ~ tbody .cell-8,
            .table-container .column-8:hover,
            .table-container:has(.column-8:hover) .cell-8 { background-color: #e6f5f7 !important; }
          `}</style>
          <Table className="w-full table-fixed table-container border-separate border-spacing-0">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-20 bg-[#f7f8fb] border-b border-[#e2e3ec] text-center px-1 py-3 w-[15%] column-1 hover:bg-[#e6f5f7] transition-colors">
                  <SortButton field="company">Company</SortButton>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-[#f7f8fb] border-b border-[#e2e3ec] text-center px-1 py-3 w-[11.5%] column-2 hover:bg-[#e6f5f7] transition-colors">
                  <SortButton field="targetIpaReturn">Target IPA Return</SortButton>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-[#f7f8fb] border-b border-[#e2e3ec] text-center px-1 py-3 w-[9.5%] column-3 hover:bg-[#e6f5f7] transition-colors">
                  <SortButton field="cashInvested">Cash Invested</SortButton>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-[#f7f8fb] border-b border-[#e2e3ec] text-center px-1 py-3 w-[13.5%] column-4 hover:bg-[#e6f5f7] transition-colors">
                  <div className="space-y-2">
                    <SortButton field="targetCashReturn">Target Cash Investment Return</SortButton>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          !showTargetCashReturnAsPercent
                            ? "bg-[#e6f5f7] text-[#027e8c] border border-[#80ccd5]"
                            : "hover:bg-[#e6f5f7] hover:border hover:border-[#80ccd5]"
                        }`}
                        onClick={() => setShowTargetCashReturnAsPercent(false)}
                      >
                        $
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          showTargetCashReturnAsPercent
                            ? "bg-[#e6f5f7] text-[#027e8c] border border-[#80ccd5]"
                            : "hover:bg-[#e6f5f7] hover:border hover:border-[#80ccd5]"
                        }`}
                        onClick={() => setShowTargetCashReturnAsPercent(true)}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-[#f7f8fb] border-b border-[#e2e3ec] text-center px-1 py-3 w-[12.5%] column-5 hover:bg-[#e6f5f7] transition-colors">
                  <div className="space-y-2">
                    <SortButton field="equityValue">Equity Value Captured</SortButton>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          !showEquityValueAsPercent
                            ? "bg-[#e6f5f7] text-[#027e8c] border border-[#80ccd5]"
                            : "hover:bg-[#e6f5f7] hover:border hover:border-[#80ccd5]"
                        }`}
                        onClick={() => setShowEquityValueAsPercent(false)}
                      >
                        $
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          showEquityValueAsPercent
                            ? "bg-[#e6f5f7] text-[#027e8c] border border-[#80ccd5]"
                            : "hover:bg-[#e6f5f7] hover:border hover:border-[#80ccd5]"
                        }`}
                        onClick={() => setShowEquityValueAsPercent(true)}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-[#f7f8fb] border-b border-[#e2e3ec] text-center px-1 py-3 w-[12%] column-6 hover:bg-[#e6f5f7] transition-colors">
                  <SortButton field="dataMonetizationDollars">Short Term Revenue Dollars Earned</SortButton>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-[#f7f8fb] border-b border-[#e2e3ec] text-center px-1 py-3 w-[13%] column-7 hover:bg-[#e6f5f7] transition-colors">
                  <div className="space-y-2">
                    <SortButton field="dataMonetizationForecast">Short Term Revenue Forecast</SortButton>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          !showDataMonetizationAsPercent
                            ? "bg-[#e6f5f7] text-[#027e8c] border border-[#80ccd5]"
                            : "hover:bg-[#e6f5f7] hover:border hover:border-[#80ccd5]"
                        }`}
                        onClick={() => setShowDataMonetizationAsPercent(false)}
                      >
                        $
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          showDataMonetizationAsPercent
                            ? "bg-[#e6f5f7] text-[#027e8c] border border-[#80ccd5]"
                            : "hover:bg-[#e6f5f7] hover:border hover:border-[#80ccd5]"
                        }`}
                        onClick={() => setShowDataMonetizationAsPercent(true)}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-[#f7f8fb] border-b border-[#e2e3ec] text-center px-1 py-3 w-[13%] column-8 hover:bg-[#e6f5f7] transition-colors">
                  <SortButton field="totalEnterpriseValue">Total Enterprise Value Captured</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectionsCompanies.map((company) => (
                <CompanyRow
                  key={`${company["Company Name"]}-${company.venture_office}`}
                  company={company}
                  forecast={forecast}
                  showTargetCashReturnAsPercent={showTargetCashReturnAsPercent}
                  showEquityValueAsPercent={showEquityValueAsPercent}
                  showDataMonetizationAsPercent={showDataMonetizationAsPercent}
                  showVentureOfficeLogo={selectedVentureOffice === "all" && duplicatedCompanyNames.has(company["Company Name"] || "")}
                  ventureOfficeLogos={ventureOfficeLogos}
                />
              ))}

              {/* Portfolio Totals Row */}
              <TableRow className="bg-[#f3f4f8] font-bold text-[#171d70]">
                <TableCell className="text-left cell-1 px-2 py-2.5 text-[12.5px] transition-colors">Portfolio Total</TableCell>
                <TableCell className="text-center cell-2 px-2 py-2.5 text-[12.5px] transition-colors">{formatCurrency(portfolioTotals.targetIpaReturn)}</TableCell>
                <TableCell className="text-center cell-3 px-2 py-2.5 text-[12.5px] transition-colors">{formatCurrency(portfolioTotals.cashInvested)}</TableCell>
                <TableCell className="text-center cell-4 px-2 py-2.5 text-[12.5px] transition-colors">
                  {portfolioTotals.cashInvested === 0
                    ? "N/A"
                    : showTargetCashReturnAsPercent
                      ? portfolioTotals.targetCashReturn > 0
                        ? formatPercentage((portfolioTotals.cashInvested / portfolioTotals.targetCashReturn) * 100)
                        : "0.00%"
                      : formatCurrency(portfolioTotals.targetCashReturn)
                  }
                </TableCell>
                <TableCell className="text-center cell-5 px-2 py-2.5 text-[12.5px] transition-colors">
                  {showEquityValueAsPercent && portfolioTotals.targetIpaReturn > 0
                    ? formatPercentage((portfolioTotals.equityValue / portfolioTotals.targetIpaReturn) * 100)
                    : formatCurrency(portfolioTotals.equityValue)
                  }
                </TableCell>
                <TableCell className="text-center cell-6 px-2 py-2.5 text-[12.5px] transition-colors">
                  {portfolioTotals.dataMonetizationForecast === 0 ? "N/A" : formatCurrency(portfolioTotals.dataMonetizationDollars)}
                </TableCell>
                <TableCell className="text-center cell-7 px-2 py-2.5 text-[12.5px] transition-colors">
                  {portfolioTotals.dataMonetizationForecast === 0
                    ? "N/A"
                    : showDataMonetizationAsPercent
                      ? portfolioTotals.dataMonetizationForecast > 0
                        ? formatPercentage((portfolioTotals.dataMonetizationDollars / portfolioTotals.dataMonetizationForecast) * 100)
                        : "0.00%"
                      : formatCurrency(portfolioTotals.dataMonetizationForecast)
                  }
                </TableCell>
                <TableCell className="text-center cell-8 px-2 py-2.5 text-[12.5px] transition-colors">{formatCurrency(portfolioTotals.totalEnterpriseValue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </PageContainer>
  );
};

export default Projections;
