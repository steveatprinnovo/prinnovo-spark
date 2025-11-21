import { DashboardHeader } from "@/components/DashboardHeader";
import { VentureOfficeSelector } from "@/components/VentureOfficeSelector";
import { useCompanies } from "@/hooks/useCompanies";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { useVentureOfficeDetails } from "@/hooks/useVentureOfficeDetails";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { UpdateValuationModal } from "@/components/UpdateValuationModal";
import { useMemo, useState } from "react";
import { TrendingUp, ChevronRight, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

function formatISODate(dateString: string | null | undefined, locale: string = "en-US", options?: Intl.DateTimeFormatOptions) {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  const [yearStr, monthStr, dayStr] = parts;
  const year = Number(yearStr);
  const month = Number(monthStr);
  const day = Number(dayStr);
  if (!year || !month || !day) return dateString;
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(locale, options ?? { month: "short", day: "numeric", year: "numeric" });
}

export default function Investments() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice, loading: authzLoading } = useUserAuth();
  const { selectedVentureOffice, showSelector, selectVentureOffice, changeVentureOffice } = useAdminVentureOffice();
  const { details: ventureOfficeDetails } = useVentureOfficeDetails(isAdmin ? selectedVentureOffice : undefined);
  const { companies, loading, updateCompany, refetch } = useCompanies();
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);

  // Get unique venture offices
  const ventureOffices = useMemo(() => 
    Array.from(new Set(companies.filter(c => c["Investment Tracker Stage"]).map(c => c.venture_office).filter(Boolean))) as string[],
    [companies]
  );

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Helper functions defined before useMemo
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePercentageIncrease = (invested: number | null, valuation: number | null) => {
    if (!invested || !valuation || invested === 0) return "N/A";
    const increase = ((valuation - invested) / invested) * 100;
    return `${increase > 0 ? '+' : ''}${increase.toFixed(1)}%`;
  };

  const { groupedCompanies, kpiData, lastUpdated } = useMemo(() => {
    if (!companies.length) return { groupedCompanies: {}, kpiData: [], lastUpdated: null };

    // Filter out companies with null Investment Tracker Stage and apply venture office filter
    const validCompanies = companies.filter(company => {
      if (company["Investment Tracker Stage"] === null) return false;
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

    // Find the most recent Invested Amount Valuation Date across all rounds
    const valuationDates = validCompanies
      .flatMap(c => [
        c["Invested Amount Valuation Date"],
        c["Invested Amount Valuation Date 2"],
        c["Invested Amount Valuation Date 3"]
      ])
      .filter((date): date is string => date !== null && date !== undefined);
    
    const lastUpdated = valuationDates.length > 0 
      ? valuationDates.reduce((latest, current) => {
          return new Date(current) > new Date(latest) ? current : latest;
        })
      : null;

    // Group companies by Investment Tracker Stage and sort
    const grouped = validCompanies.reduce((acc, company) => {
      const stage = company["Investment Tracker Stage"]!;
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(company);
      return acc;
    }, {} as Record<string, typeof companies>);

    // Helper to get most recent round for a company
    const getMostRecentRound = (company: any) => {
      const rounds = [
        { amount: company["Invested Amount"], valuation: company["Invested Amount Valuation"], date: company["Invested Amount Valuation Date"] },
        { amount: company["Invested Amount 2"], valuation: company["Invested Amount Valuation 2"], date: company["Invested Amount Valuation Date 2"] },
        { amount: company["Invested Amount 3"], valuation: company["Invested Amount Valuation 3"], date: company["Invested Amount Valuation Date 3"] }
      ].filter(r => r.amount || r.valuation);
      
      return rounds.reduce((latest, current) => {
        if (!latest.date) return current;
        if (!current.date) return latest;
        return new Date(current.date) > new Date(latest.date) ? current : latest;
      }, rounds[0] || { amount: null, valuation: null, date: null });
    };

    // Sort each group by % Gain (highest to lowest), then by Invested Amount (high to low)
    Object.keys(grouped).forEach(stage => {
      grouped[stage].sort((a, b) => {
        const aMostRecent = getMostRecentRound(a);
        const bMostRecent = getMostRecentRound(b);
        
        const aGain = calculatePercentageIncrease(aMostRecent.amount, aMostRecent.valuation);
        const bGain = calculatePercentageIncrease(bMostRecent.amount, bMostRecent.valuation);
        
        // Convert percentage strings to numbers for sorting
        const aGainNum = aGain === "N/A" ? -Infinity : parseFloat(aGain.replace(/[+%]/g, ''));
        const bGainNum = bGain === "N/A" ? -Infinity : parseFloat(bGain.replace(/[+%]/g, ''));
        
        if (bGainNum !== aGainNum) {
          return bGainNum - aGainNum; // Sort by gain descending
        }
        
        // If gains are equal, sort by total invested amount descending
        const aTotalInvested = (a["Invested Amount"] || 0) + (a["Invested Amount 2"] || 0) + (a["Invested Amount 3"] || 0);
        const bTotalInvested = (b["Invested Amount"] || 0) + (b["Invested Amount 2"] || 0) + (b["Invested Amount 3"] || 0);
        return bTotalInvested - aTotalInvested;
      });
    });

    // Calculate KPIs
    const totalAllocated = ventureOfficeDetails?.["Investment Allotment"] || 10000000;
    
    // Helper to sum all rounds for a company
    const getTotalInvestedForCompany = (company: any) => {
      return (company["Invested Amount"] || 0) + 
             (company["Invested Amount 2"] || 0) + 
             (company["Invested Amount 3"] || 0);
    };

    const committedSum = validCompanies
      .filter(c => c["Investment Tracker Stage"] === "Committed")
      .reduce((sum, c) => sum + getTotalInvestedForCompany(c), 0);

    const ipaObligationSum = validCompanies
      .filter(c => c["Investment Tracker Stage"] === "IPA Obligation")
      .reduce((sum, c) => sum + getTotalInvestedForCompany(c), 0);

    const termSheetSum = validCompanies
      .filter(c => c["Investment Tracker Stage"] === "Term Sheet Proposed")
      .reduce((sum, c) => sum + getTotalInvestedForCompany(c), 0);

    const operationalSum = validCompanies
      .filter(c => c["Investment Tracker Stage"] === "Operational Funding")
      .reduce((sum, c) => sum + getTotalInvestedForCompany(c), 0);

    // Calculate portfolio value (sum of most recent valuations)
    const portfolioValue = validCompanies
      .reduce((sum, c) => {
        const rounds = [
          { valuation: c["Invested Amount Valuation"], date: c["Invested Amount Valuation Date"] },
          { valuation: c["Invested Amount Valuation 2"], date: c["Invested Amount Valuation Date 2"] },
          { valuation: c["Invested Amount Valuation 3"], date: c["Invested Amount Valuation Date 3"] }
        ].filter(r => r.valuation);
        
        if (rounds.length === 0) return sum;
        
        const mostRecent = rounds.reduce((latest, current) => {
          if (!latest.date) return current;
          if (!current.date) return latest;
          return new Date(current.date) > new Date(latest.date) ? current : latest;
        });
        
        return sum + (mostRecent.valuation || 0);
      }, 0);

    const totalInvested = validCompanies
      .reduce((sum, c) => sum + getTotalInvestedForCompany(c), 0);

    const portfolioGain = totalInvested > 0 ? ((portfolioValue - totalInvested) / totalInvested) * 100 : 0;

    const kpis = [
      {
        title: "Portfolio Value",
        value: portfolioValue,
        subtitle: `${portfolioGain > 0 ? '+' : ''}${portfolioGain.toFixed(1)}% gain`,
        gradient: "var(--gradient-primary)"
      },
      {
        title: "Total After Currently Invested Through 2025",
        value: totalAllocated - committedSum,
        subtitle: `out of ${formatCurrency(totalAllocated)} allocated`,
        gradient: "var(--gradient-accent)"
      },
      {
        title: "Total After IPA Commitments Through 2025",
        value: totalAllocated - committedSum - ipaObligationSum,
        subtitle: `out of ${formatCurrency(totalAllocated)} allocated`,
        gradient: "var(--gradient-primary)"
      },
      {
        title: "Total After Term Sheets Proposed Through 2025",
        value: totalAllocated - committedSum - ipaObligationSum - termSheetSum,
        subtitle: `out of ${formatCurrency(totalAllocated)} allocated`,
        gradient: "var(--gradient-accent)"
      },
      {
        title: "Total Operational Funding",
        value: operationalSum,
        subtitle: "loans, investments as payments",
        gradient: "var(--gradient-primary)"
      }
    ];

    return { groupedCompanies: grouped, kpiData: kpis, lastUpdated };
  }, [companies, isAdmin, ventureOffice, ventureOfficeDetails, selectedVentureOffice]);

  if (authLoading || authzLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <DashboardHeader />
        <div className="flex items-center justify-center h-96">
          <div className="text-lg text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <DashboardHeader />
      
      {/* Venture Office Selector Modal for Admins */}
      {isAdmin && <VentureOfficeSelector isOpen={showSelector} ventureOffices={ventureOffices} onSelect={selectVentureOffice} />}
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold mb-2">Hard Dollar Investment Tracker</h1>
            <p className="text-muted-foreground">Track and monitor hard dollar investment allocations and performance</p>
          </div>
          <div className="flex items-end gap-4">
            {/* Admin Venture Office Selector */}
            {isAdmin && (
              <div className="w-64">
                <Select value={selectedVentureOffice} onValueChange={changeVentureOffice}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Select Venture Office" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All ({companies.filter(c => c["Investment Tracker Stage"]).length})</SelectItem>
                    {Array.from(new Set(companies.filter(c => c["Investment Tracker Stage"]).map(c => c.venture_office).filter(Boolean))).map((office) => (
                      <SelectItem key={office} value={office!}>
                        <div className="flex items-center gap-2">
                          {office === "Healthliant Ventures" && (
                            <img 
                              src="/lovable-uploads/eca45e5a-5531-4df2-9100-f1abdac3ca74.png" 
                              alt="Healthliant Ventures" 
                              className="w-4 h-4 object-contain"
                            />
                          )}
                          <span>{office} ({companies.filter(c => c["Investment Tracker Stage"] && c.venture_office === office).length})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex flex-col items-end gap-3">
              <Button
                onClick={() => setIsUpdateModalOpen(true)}
                className="flex items-center gap-2"
              >
                <TrendingUp className="h-4 w-4" />
                Update Valuation
              </Button>
              {lastUpdated && (
                <div className="text-sm text-muted-foreground italic">
                  Current as of {formatISODate(lastUpdated)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <Card 
              key={index}
              className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-0 h-40"
              style={{ 
                background: kpi.gradient,
                boxShadow: "var(--shadow-kpi)"
              }}
            >
              <CardContent className="p-6 h-full flex flex-col justify-end text-center">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-white/90 leading-tight text-center pt-2">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold text-white text-center">
                    {formatCurrency(kpi.value)}
                  </p>
                  {kpi.subtitle && (
                    <p className={`text-xs text-center ${
                      kpi.title === "Portfolio Value" 
                        ? "text-green-300 font-bold" 
                        : "text-white/80"
                    }`}>
                      {kpi.subtitle}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Investment Tables by Stage */}
        <div className="space-y-8">
          {["Committed", "IPA Obligation", "Term Sheet Proposed", "Operational Funding"].map((stage) => {
            const stageCompanies = groupedCompanies[stage];
            if (!stageCompanies || stageCompanies.length === 0) return null;
            
            return (
              <Card key={stage} className="overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">{stage}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Company</TableHead>
                        <TableHead className="text-right">Invested Amount</TableHead>
                        <TableHead className="text-right">Invested Amount Date</TableHead>
                        <TableHead className="text-right">Invested Amount Round</TableHead>
                        <TableHead className="text-right">Current Valuation</TableHead>
                        <TableHead className="text-right">% Gain</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {stageCompanies.map((company) => (
                        <CompanyRow key={company["Company Name"]} company={company} />
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>

      <UpdateValuationModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        companies={companies}
        updateCompany={updateCompany}
        refetch={refetch}
      />
    </div>
  );
}

function CompanyRow({ company }: { company: any }) {
  const { logoUrl } = useCompanyLogo(company.imgurl);
  const [isOpen, setIsOpen] = useState(false);

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const calculatePercentageIncrease = (invested: number | null, valuation: number | null) => {
    if (!invested || !valuation || invested === 0) return "N/A";
    const increase = ((valuation - invested) / invested) * 100;
    return `${increase > 0 ? '+' : ''}${increase.toFixed(1)}%`;
  };

  // Collect all rounds with data
  const rounds = [
    {
      round: 1,
      name: company["Invested Amount Round"],
      amount: company["Invested Amount"],
      date: company["Invested Amount Date"],
      valuation: company["Invested Amount Valuation"],
      valuationDate: company["Invested Amount Valuation Date"]
    },
    {
      round: 2,
      name: company["Invested Amount Round 2"],
      amount: company["Invested Amount 2"],
      date: company["Invested Amount Date 2"],
      valuation: company["Invested Amount Valuation 2"],
      valuationDate: company["Invested Amount Valuation Date 2"]
    },
    {
      round: 3,
      name: company["Invested Amount Round 3"],
      amount: company["Invested Amount 3"],
      date: company["Invested Amount Date 3"],
      valuation: company["Invested Amount Valuation 3"],
      valuationDate: company["Invested Amount Valuation Date 3"]
    }
  ].filter(r => r.amount || r.valuation);

  const hasMultipleRounds = rounds.length > 1;

  // Calculate aggregated data
  const totalInvestedAmount = rounds.reduce((sum, r) => sum + (r.amount || 0), 0);
  
  // Find the most recent round (by valuation date)
  const mostRecentRound = rounds.reduce((latest, current) => {
    if (!latest.valuationDate) return current;
    if (!current.valuationDate) return latest;
    return new Date(current.valuationDate) > new Date(latest.valuationDate) ? current : latest;
  }, rounds[0]);

  const displayInvestedAmount = hasMultipleRounds ? totalInvestedAmount : (rounds[0]?.amount || null);
  const displayDate = hasMultipleRounds ? "Multiple" : rounds[0]?.date;
  const displayRound = hasMultipleRounds ? "Multiple" : rounds[0]?.name;
  const displayValuation = mostRecentRound?.valuation || null;
  const displayValuationDate = mostRecentRound?.valuationDate;

  const percentageIncrease = calculatePercentageIncrease(
    mostRecentRound?.amount || null,
    mostRecentRound?.valuation || null
  );

  const isPositive = percentageIncrease !== "N/A" && percentageIncrease.startsWith('+');
  const isNegative = percentageIncrease !== "N/A" && percentageIncrease.startsWith('-');

  return (
    <>
      <TableRow className="hover:bg-muted/50">
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="w-4 flex items-center justify-center shrink-0">
              {hasMultipleRounds && (
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={`${company["Company Name"]} logo`}
                className="w-10 h-10 rounded object-contain bg-white p-1"
              />
            ) : (
              <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  {company["Company Name"]?.charAt(0)}
                </span>
              </div>
            )}
            <span className="font-medium">{company["Company Name"]}</span>
          </div>
        </TableCell>
        <TableCell className="text-right font-medium">
          {formatCurrency(displayInvestedAmount)}
        </TableCell>
        <TableCell className="text-right">
          {displayDate === "Multiple" ? (
            <span className="text-muted-foreground italic">Multiple</span>
          ) : displayDate ? (
            new Date(displayDate).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })
          ) : "N/A"}
        </TableCell>
        <TableCell className="text-right">
          {displayRound === "Multiple" ? (
            <span className="text-muted-foreground italic">Multiple</span>
          ) : displayRound || "N/A"}
        </TableCell>
        <TableCell className="text-right font-medium">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help">
                  {formatCurrency(displayValuation)}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {displayValuationDate
                    ? `As of ${formatISODate(displayValuationDate)}`
                    : "No valuation date available"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
        <TableCell className="text-right font-medium">
          <span className={`${
            isPositive ? 'text-green-600' : 
            isNegative ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {percentageIncrease}
          </span>
        </TableCell>
      </TableRow>
      
      {/* Expandable Details for Multiple Rounds */}
      {hasMultipleRounds && isOpen && (
        <TableRow>
          <TableCell colSpan={6} className="bg-muted/50 p-0">
            <div className="px-6 py-4">
              <h4 className="text-sm font-semibold mb-3 text-foreground">
                {company["Company Name"]} Investment Round Details ({rounds.length})
              </h4>
              <div className="space-y-2">
                {rounds.map((round) => (
                  <div 
                    key={round.round}
                    className="flex items-center p-3 bg-background/80 rounded-md border border-border"
                  >
                    {/* Round name - matches Company column width */}
                    <div className="flex items-center gap-3 pl-8" style={{ width: '300px' }}>
                      <span className="font-medium">{round.name || `Round ${round.round}`}</span>
                    </div>
                    {/* Invested Amount - matches table column */}
                    <div className="text-right font-medium" style={{ width: '180px' }}>
                      {formatCurrency(round.amount)}
                    </div>
                    {/* Invested Amount Date - matches table column */}
                    <div className="text-right" style={{ width: '180px' }}>
                      {round.date 
                        ? new Date(round.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })
                        : "N/A"}
                    </div>
                    {/* Current Valuation - matches table column, skip the "Round" column */}
                    <div className="text-right font-medium ml-auto" style={{ width: '180px' }}>
                      {formatCurrency(round.valuation)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}