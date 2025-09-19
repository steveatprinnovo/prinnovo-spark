import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useCompanies, Company } from "@/hooks/useCompanies";
import { useAuth } from "@/hooks/useAuth";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toggle } from "@/components/ui/toggle";
import { DollarSign, Percent } from "lucide-react";

type ForecastType = "target" | "very-conservative" | "conservative" | "aggressive" | "very-aggressive";

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
      <TableCell className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={`${company["Company Name"]} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
        <span className="font-medium">{company["Company Name"]}</span>
      </TableCell>
      <TableCell>{formatCurrency(targetIpaReturn)}</TableCell>
      <TableCell>{formatCurrency(company["Invested Amount"])}</TableCell>
      <TableCell>
        {showTargetCashReturnAsPercent && company["Current Company Valuation"] && targetCashReturn > 0
          ? formatPercentage((company["Current Company Valuation"] / targetCashReturn) * 100)
          : formatCurrency(targetCashReturn)
        }
      </TableCell>
      <TableCell>
        {showEquityValueAsPercent && targetIpaReturn > 0
          ? formatPercentage((equityValue / targetIpaReturn) * 100)
          : formatCurrency(equityValue)
        }
      </TableCell>
      <TableCell>{formatCurrency(dataMonetizationDollars)}</TableCell>
      <TableCell>
        {showDataMonetizationAsPercent && dataMonetizationForecast > 0
          ? formatPercentage((dataMonetizationDollars / dataMonetizationForecast) * 100)
          : formatCurrency(dataMonetizationForecast)
        }
      </TableCell>
      <TableCell>{formatCurrency(totalEnterpriseValue)}</TableCell>
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

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Filter companies that have investment tracking data
  const projectionsCompanies = useMemo(() => {
    return companies.filter(company => company["Investment Tracker Stage"]);
  }, [companies]);

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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Target IPA Return</TableHead>
                <TableHead>Cash Invested</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Target Cash Investment Return
                    <Toggle
                      pressed={showTargetCashReturnAsPercent}
                      onPressedChange={setShowTargetCashReturnAsPercent}
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      {showTargetCashReturnAsPercent ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                    </Toggle>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Equity Value Captured
                    <Toggle
                      pressed={showEquityValueAsPercent}
                      onPressedChange={setShowEquityValueAsPercent}
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      {showEquityValueAsPercent ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                    </Toggle>
                  </div>
                </TableHead>
                <TableHead>Data Monetization Dollars</TableHead>
                <TableHead>
                  <div className="flex items-center gap-2">
                    Data Monetization Forecast
                    <Toggle
                      pressed={showDataMonetizationAsPercent}
                      onPressedChange={setShowDataMonetizationAsPercent}
                      size="sm"
                      className="h-6 w-6 p-0"
                    >
                      {showDataMonetizationAsPercent ? <Percent className="h-3 w-3" /> : <DollarSign className="h-3 w-3" />}
                    </Toggle>
                  </div>
                </TableHead>
                <TableHead>Total Enterprise Value Captured</TableHead>
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
                <TableCell>Portfolio Total</TableCell>
                <TableCell>{formatCurrency(portfolioTotals.targetIpaReturn)}</TableCell>
                <TableCell>{formatCurrency(portfolioTotals.cashInvested)}</TableCell>
                <TableCell>
                  {showTargetCashReturnAsPercent && portfolioTotals.targetCashReturn > 0
                    ? formatPercentage((portfolioTotals.cashInvested / portfolioTotals.targetCashReturn) * 100)
                    : formatCurrency(portfolioTotals.targetCashReturn)
                  }
                </TableCell>
                <TableCell>
                  {showEquityValueAsPercent && portfolioTotals.targetIpaReturn > 0
                    ? formatPercentage((portfolioTotals.equityValue / portfolioTotals.targetIpaReturn) * 100)
                    : formatCurrency(portfolioTotals.equityValue)
                  }
                </TableCell>
                <TableCell>{formatCurrency(portfolioTotals.dataMonetizationDollars)}</TableCell>
                <TableCell>
                  {showDataMonetizationAsPercent && portfolioTotals.dataMonetizationForecast > 0
                    ? formatPercentage((portfolioTotals.dataMonetizationDollars / portfolioTotals.dataMonetizationForecast) * 100)
                    : formatCurrency(portfolioTotals.dataMonetizationForecast)
                  }
                </TableCell>
                <TableCell>{formatCurrency(portfolioTotals.totalEnterpriseValue)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Projections;