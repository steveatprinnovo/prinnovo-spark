import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { DollarSign, ChevronUp, ChevronDown } from "lucide-react";

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
  return `${value.toFixed(1)}%`;
};

interface CompanyRowProps {
  company: Company;
  forecast: ForecastType;
  showTargetCashReturnAsPercent: boolean;
  showEquityValueAsPercent: boolean;
  showDataMonetizationAsPercent: boolean;
}

const CompanyRow = ({ 
  company, 
  forecast, 
  showTargetCashReturnAsPercent, 
  showEquityValueAsPercent, 
  showDataMonetizationAsPercent 
}: CompanyRowProps) => {
  const { logoUrl } = useCompanyLogo(company.imgurl);
  const multiplier = FORECAST_MULTIPLIERS[forecast];
  
  const targetIpaReturn = (company["Target IPA Return"] || 0) * multiplier;
  const targetCashReturn = (company["Target Cash Investment Return"] || 0) * multiplier;
  const dataMonetizationForecast = (company["Data Monetization Forecast"] || 0) * multiplier;
  
  const equityValue = company["Current HLV Valuation"] || 0;
  const dataMonetizationDollars = company["Data Monetization Dollars"] || 0;
  const totalEnterpriseValue = equityValue + dataMonetizationDollars;

  return (
    <TableRow>
      <TableCell className="flex items-center gap-3 text-left cell-1 transition-colors">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
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
        <span className="font-medium text-sm truncate">{company["Company Name"]}</span>
      </TableCell>
      <TableCell className="cell-2 transition-colors text-center text-sm">{formatCurrency(targetIpaReturn)}</TableCell>
      <TableCell className="cell-3 transition-colors text-center text-sm">{formatCurrency(company["Invested Amount"])}</TableCell>
      <TableCell className="cell-4 transition-colors text-center text-sm">
        {showTargetCashReturnAsPercent && company["Current Company Valuation"] && targetCashReturn > 0
          ? formatPercentage((company["Current Company Valuation"] / targetCashReturn) * 100)
          : formatCurrency(targetCashReturn)
        }
      </TableCell>
      <TableCell className="cell-5 transition-colors text-center text-sm">
        {showEquityValueAsPercent && targetIpaReturn > 0
          ? formatPercentage((equityValue / targetIpaReturn) * 100)
          : formatCurrency(equityValue)
        }
      </TableCell>
      <TableCell className="cell-6 transition-colors text-center text-sm">{formatCurrency(dataMonetizationDollars)}</TableCell>
      <TableCell className="cell-7 transition-colors text-center text-sm">
        {showDataMonetizationAsPercent && dataMonetizationForecast > 0
          ? formatPercentage((dataMonetizationDollars / dataMonetizationForecast) * 100)
          : formatCurrency(dataMonetizationForecast)
        }
      </TableCell>
      <TableCell className="cell-8 transition-colors text-center text-sm">{formatCurrency(totalEnterpriseValue)}</TableCell>
    </TableRow>
  );
};

const Projections = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { companies, loading } = useCompanies();
  const [forecast, setForecast] = useState<ForecastType>("target");
  const [showTargetCashReturnAsPercent, setShowTargetCashReturnAsPercent] = useState(false);
  const [showEquityValueAsPercent, setShowEquityValueAsPercent] = useState(false);
  const [showDataMonetizationAsPercent, setShowDataMonetizationAsPercent] = useState(false);
  const [sortField, setSortField] = useState<SortField>("company");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Filter and sort companies that have investment tracking data
  const projectionsCompanies = useMemo(() => {
    const filtered = companies.filter(company => company["Target IPA Return"]);
    const multiplier = FORECAST_MULTIPLIERS[forecast];
    
    return filtered.sort((a, b) => {
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
  }, [companies, forecast, sortField, sortDirection]);

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
      className="h-auto p-1 font-medium justify-center hover:bg-transparent hover:text-blue-500 transition-colors whitespace-normal text-center min-h-0 leading-tight"
      onClick={() => handleSort(field)}
    >
      <div className="flex flex-col items-center gap-1">
        <span className="text-xs leading-tight">{children}</span>
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
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-3xl font-bold">Projections</h1>
          
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
        </div>

        <div className="projections-table-wrapper relative overflow-x-auto overflow-y-auto max-h-[70vh]">
          <style>{`
            /* Ensure sticky headers work: neutralize inner shadcn Table wrapper overflow */
            .projections-table-wrapper > div { overflow: visible !important; }

            .table-container:hover .column-1:hover ~ tbody .cell-1,
            .table-container .column-1:hover ~ tbody .cell-1,
            .table-container .column-1:hover,
            .table-container:has(.column-1:hover) .cell-1 { background-color: rgb(239 246 255) !important; }
            
            .table-container:hover .column-2:hover ~ tbody .cell-2,
            .table-container .column-2:hover ~ tbody .cell-2,
            .table-container .column-2:hover,
            .table-container:has(.column-2:hover) .cell-2 { background-color: rgb(239 246 255) !important; }
            
            .table-container:hover .column-3:hover ~ tbody .cell-3,
            .table-container .column-3:hover ~ tbody .cell-3,
            .table-container .column-3:hover,
            .table-container:has(.column-3:hover) .cell-3 { background-color: rgb(239 246 255) !important; }
            
            .table-container:hover .column-4:hover ~ tbody .cell-4,
            .table-container .column-4:hover ~ tbody .cell-4,
            .table-container .column-4:hover,
            .table-container:has(.column-4:hover) .cell-4 { background-color: rgb(239 246 255) !important; }
            
            .table-container:hover .column-5:hover ~ tbody .cell-5,
            .table-container .column-5:hover ~ tbody .cell-5,
            .table-container .column-5:hover,
            .table-container:has(.column-5:hover) .cell-5 { background-color: rgb(239 246 255) !important; }
            
            .table-container:hover .column-6:hover ~ tbody .cell-6,
            .table-container .column-6:hover ~ tbody .cell-6,
            .table-container .column-6:hover,
            .table-container:has(.column-6:hover) .cell-6 { background-color: rgb(239 246 255) !important; }
            
            .table-container:hover .column-7:hover ~ tbody .cell-7,
            .table-container .column-7:hover ~ tbody .cell-7,
            .table-container .column-7:hover,
            .table-container:has(.column-7:hover) .cell-7 { background-color: rgb(239 246 255) !important; }
            
            .table-container:hover .column-8:hover ~ tbody .cell-8,
            .table-container .column-8:hover ~ tbody .cell-8,
            .table-container .column-8:hover,
            .table-container:has(.column-8:hover) .cell-8 { background-color: rgb(239 246 255) !important; }
          `}</style>
          <Table className="min-w-full table-fixed table-container border-separate border-spacing-0">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 z-20 bg-background text-center py-4 w-[200px] column-1 hover:bg-blue-50 transition-colors">
                  <SortButton field="company">Company</SortButton>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-background text-center py-4 w-[150px] column-2 hover:bg-blue-50 transition-colors">
                  <SortButton field="targetIpaReturn">Target IPA Return</SortButton>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-background text-center py-4 w-[120px] column-3 hover:bg-blue-50 transition-colors">
                  <SortButton field="cashInvested">Cash Invested</SortButton>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-background text-center py-6 w-[180px] column-4 hover:bg-blue-50 transition-colors">
                  <div className="space-y-2">
                    <SortButton field="targetCashReturn">Target Cash Investment Return</SortButton>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          !showTargetCashReturnAsPercent 
                            ? "bg-green-100 text-green-700 border border-green-300" 
                            : "hover:bg-green-50 hover:border hover:border-green-300"
                        }`}
                        onClick={() => setShowTargetCashReturnAsPercent(false)}
                      >
                        $
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          showTargetCashReturnAsPercent 
                            ? "bg-green-100 text-green-700 border border-green-300" 
                            : "hover:bg-green-50 hover:border hover:border-green-300"
                        }`}
                        onClick={() => setShowTargetCashReturnAsPercent(true)}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-background text-center py-6 w-[160px] column-5 hover:bg-blue-50 transition-colors">
                  <div className="space-y-2">
                    <SortButton field="equityValue">Equity Value Captured</SortButton>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          !showEquityValueAsPercent 
                            ? "bg-green-100 text-green-700 border border-green-300" 
                            : "hover:bg-green-50 hover:border hover:border-green-300"
                        }`}
                        onClick={() => setShowEquityValueAsPercent(false)}
                      >
                        $
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          showEquityValueAsPercent 
                            ? "bg-green-100 text-green-700 border border-green-300" 
                            : "hover:bg-green-50 hover:border hover:border-green-300"
                        }`}
                        onClick={() => setShowEquityValueAsPercent(true)}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-background text-center py-4 w-[160px] column-6 hover:bg-blue-50 transition-colors">
                  <SortButton field="dataMonetizationDollars">Data Monetization Dollars</SortButton>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-background text-center py-6 w-[170px] column-7 hover:bg-blue-50 transition-colors">
                  <div className="space-y-2">
                    <SortButton field="dataMonetizationForecast">Data Monetization Forecast</SortButton>
                    <div className="flex items-center justify-center gap-1">
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          !showDataMonetizationAsPercent 
                            ? "bg-green-100 text-green-700 border border-green-300" 
                            : "hover:bg-green-50 hover:border hover:border-green-300"
                        }`}
                        onClick={() => setShowDataMonetizationAsPercent(false)}
                      >
                        $
                      </button>
                      <span className="text-muted-foreground">|</span>
                      <button
                        className={`px-2 py-1 text-xs rounded transition-all ${
                          showDataMonetizationAsPercent 
                            ? "bg-green-100 text-green-700 border border-green-300" 
                            : "hover:bg-green-50 hover:border hover:border-green-300"
                        }`}
                        onClick={() => setShowDataMonetizationAsPercent(true)}
                      >
                        %
                      </button>
                    </div>
                  </div>
                </TableHead>
                <TableHead className="sticky top-0 z-20 bg-background text-center py-4 w-[180px] column-8 hover:bg-blue-50 transition-colors">
                  <SortButton field="totalEnterpriseValue">Total Enterprise Value Captured</SortButton>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectionsCompanies.map((company) => (
                <CompanyRow
                  key={company["Company Name"]}
                  company={company}
                  forecast={forecast}
                  showTargetCashReturnAsPercent={showTargetCashReturnAsPercent}
                  showEquityValueAsPercent={showEquityValueAsPercent}
                  showDataMonetizationAsPercent={showDataMonetizationAsPercent}
                />
              ))}
              
              {/* Portfolio Totals Row */}
              <TableRow className="bg-muted/50 font-semibold">
                <TableCell className="text-left cell-1 transition-colors">Portfolio Total</TableCell>
                <TableCell className="text-center cell-2 transition-colors">{formatCurrency(portfolioTotals.targetIpaReturn)}</TableCell>
                <TableCell className="text-center cell-3 transition-colors">{formatCurrency(portfolioTotals.cashInvested)}</TableCell>
                <TableCell className="text-center cell-4 transition-colors">
                  {showTargetCashReturnAsPercent && portfolioTotals.targetCashReturn > 0
                    ? formatPercentage((portfolioTotals.cashInvested / portfolioTotals.targetCashReturn) * 100)
                    : formatCurrency(portfolioTotals.targetCashReturn)
                  }
                </TableCell>
                <TableCell className="text-center cell-5 transition-colors">
                  {showEquityValueAsPercent && portfolioTotals.targetIpaReturn > 0
                    ? formatPercentage((portfolioTotals.equityValue / portfolioTotals.targetIpaReturn) * 100)
                    : formatCurrency(portfolioTotals.equityValue)
                  }
                </TableCell>
                <TableCell className="text-center cell-6 transition-colors">{formatCurrency(portfolioTotals.dataMonetizationDollars)}</TableCell>
                <TableCell className="text-center cell-7 transition-colors">
                  {showDataMonetizationAsPercent && portfolioTotals.dataMonetizationForecast > 0
                    ? formatPercentage((portfolioTotals.dataMonetizationDollars / portfolioTotals.dataMonetizationForecast) * 100)
                    : formatCurrency(portfolioTotals.dataMonetizationForecast)
                  }
                </TableCell>
                <TableCell className="text-center cell-8 transition-colors">{formatCurrency(portfolioTotals.totalEnterpriseValue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Projections;