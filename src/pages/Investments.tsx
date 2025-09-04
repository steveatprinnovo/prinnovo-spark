import { DashboardHeader } from "@/components/DashboardHeader";
import { useCompanies } from "@/hooks/useCompanies";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMemo } from "react";

export default function Investments() {
  const { companies, loading } = useCompanies();

  const calculatePercentageIncrease = (invested: number | null, valuation: number | null) => {
    if (!invested || !valuation || invested === 0) return "N/A";
    const increase = ((valuation - invested) / invested) * 100;
    return `${increase > 0 ? '+' : ''}${increase.toFixed(1)}%`;
  };

  const { groupedCompanies, kpiData, lastUpdated } = useMemo(() => {
    if (!companies.length) return { groupedCompanies: {}, kpiData: [], lastUpdated: null };

    // Filter out companies with null Investment Tracker Stage
    const validCompanies = companies.filter(
      company => company["Investment Tracker Stage"] !== null
    );

    // Find last updated timestamp from Invested Amount Valuation
    const lastUpdated = companies.some(c => c["Invested Amount Valuation"]) ? new Date() : null;

    // Group companies by Investment Tracker Stage and sort
    const grouped = validCompanies.reduce((acc, company) => {
      const stage = company["Investment Tracker Stage"]!;
      if (!acc[stage]) acc[stage] = [];
      acc[stage].push(company);
      return acc;
    }, {} as Record<string, typeof companies>);

    // Sort each group by % Gain (highest to lowest), then by Invested Amount (high to low)
    Object.keys(grouped).forEach(stage => {
      grouped[stage].sort((a, b) => {
        const aGain = calculatePercentageIncrease(a["Invested Amount"], a["Invested Amount Valuation"]);
        const bGain = calculatePercentageIncrease(b["Invested Amount"], b["Invested Amount Valuation"]);
        
        // Convert percentage strings to numbers for sorting
        const aGainNum = aGain === "N/A" ? -Infinity : parseFloat(aGain.replace(/[+%]/g, ''));
        const bGainNum = bGain === "N/A" ? -Infinity : parseFloat(bGain.replace(/[+%]/g, ''));
        
        if (bGainNum !== aGainNum) {
          return bGainNum - aGainNum; // Sort by gain descending
        }
        
        // If gains are equal, sort by invested amount descending
        return (b["Invested Amount"] || 0) - (a["Invested Amount"] || 0);
      });
    });

    // Calculate KPIs
    const totalAllocated = 10000000;
    
    const committedSum = validCompanies
      .filter(c => c["Investment Tracker Stage"] === "Committed")
      .reduce((sum, c) => sum + (c["Invested Amount"] || 0), 0);

    const ipaObligationSum = validCompanies
      .filter(c => c["Investment Tracker Stage"] === "IPA Obligation")
      .reduce((sum, c) => sum + (c["Invested Amount"] || 0), 0);

    const termSheetSum = validCompanies
      .filter(c => c["Investment Tracker Stage"] === "Term Sheet Proposed")
      .reduce((sum, c) => sum + (c["Invested Amount"] || 0), 0);

    const operationalSum = validCompanies
      .filter(c => c["Investment Tracker Stage"] === "Operational Funding")
      .reduce((sum, c) => sum + (c["Invested Amount"] || 0), 0);

    // Calculate portfolio value (sum of all Invested Amount Valuations)
    const portfolioValue = validCompanies
      .reduce((sum, c) => sum + (c["Invested Amount Valuation"] || 0), 0);

    const totalInvested = validCompanies
      .reduce((sum, c) => sum + (c["Invested Amount"] || 0), 0);

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
        subtitle: "out of $10,000,000 allocated",
        gradient: "var(--gradient-accent)"
      },
      {
        title: "Total After IPA Commitments Through 2025",
        value: totalAllocated - committedSum - ipaObligationSum,
        subtitle: "out of $10,000,000 allocated",
        gradient: "var(--gradient-primary)"
      },
      {
        title: "Total After Term Sheets Proposed Through 2025",
        value: totalAllocated - committedSum - ipaObligationSum - termSheetSum,
        subtitle: "out of $10,000,000 allocated",
        gradient: "var(--gradient-accent)"
      },
      {
        title: "Total Operational Funding",
        value: operationalSum,
        subtitle: "",
        gradient: "var(--gradient-primary)"
      }
    ];

    return { groupedCompanies: grouped, kpiData: kpis, lastUpdated };
  }, [companies]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
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
      
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold mb-2">Hard Dollar Investment Tracker</h1>
            <p className="text-muted-foreground">Track and monitor hard dollar investment allocations and performance</p>
          </div>
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Current as of {lastUpdated.toLocaleDateString()}
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {kpiData.map((kpi, index) => (
            <Card 
              key={index}
              className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-0"
              style={{ 
                background: kpi.gradient,
                boxShadow: "var(--shadow-kpi)"
              }}
            >
              <CardContent className="p-6 text-center">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/90">
                    {kpi.title}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {formatCurrency(kpi.value)}
                  </p>
                  {kpi.subtitle && (
                    <p className="text-xs text-white/80">
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
          {Object.entries(groupedCompanies).map(([stage, stageCompanies]) => (
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
          ))}
        </div>
      </main>
    </div>
  );
}

function CompanyRow({ company }: { company: any }) {
  const { logoUrl } = useCompanyLogo(company.imgurl);

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

  const percentageIncrease = calculatePercentageIncrease(
    company["Invested Amount"],
    company["Invested Amount Valuation"]
  );

  const isPositive = percentageIncrease !== "N/A" && percentageIncrease.startsWith('+');
  const isNegative = percentageIncrease !== "N/A" && percentageIncrease.startsWith('-');

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div className="flex items-center gap-3">
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
        {formatCurrency(company["Invested Amount"])}
      </TableCell>
      <TableCell className="text-right font-medium">
        {formatCurrency(company["Invested Amount Valuation"])}
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
  );
}