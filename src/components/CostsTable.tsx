import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useVentureOfficeCosts } from "@/hooks/useVentureOfficeCosts";
import { format } from "date-fns";

interface CostsTableProps {
  selectedVentureOffice: string;
  selectedYear: number | null;
  onYearChange: (year: number) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const COST_CATEGORIES = [
  { key: "venture_team_services_cost", label: "Venture Team Services Cost" },
  { key: "it_team_services_cost", label: "IT Team Services Cost" },
  { key: "operating_expenses", label: "Operating Expenses" },
  { key: "legal_costs", label: "Legal Costs" },
] as const;

type CostKey = typeof COST_CATEGORIES[number]["key"];

export function CostsTable({ selectedVentureOffice, selectedYear, onYearChange }: CostsTableProps) {
  const { monthlyCosts, totals, loading, availableYears } = useVentureOfficeCosts(
    selectedVentureOffice,
    selectedYear,
    onYearChange // Pass callback to set default year when detected
  );

  // Get month labels for the selected year with rate_adjust indicator
  const monthLabels = useMemo(() => {
    return monthlyCosts.map(cost => ({
      label: format(new Date(cost.month), "MMM"),
      rateAdjust: cost.rate_adjust,
    }));
  }, [monthlyCosts]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (availableYears.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No cost data available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground">Year:</span>
        <Select 
          value={selectedYear?.toString() ?? ""} 
          onValueChange={(value) => onYearChange(parseInt(value))}
        >
          <SelectTrigger className="w-24 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()} className="text-xs">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {monthlyCosts.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No cost data available for {selectedYear}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-full text-xs">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-muted min-w-[160px] text-xs py-2">Cost Category</TableHead>
                {monthLabels.map((month, index) => (
                  <TableHead key={index} className="text-center min-w-[70px] text-xs py-2">
                    {month.rateAdjust ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help">
                              {month.label}<span className="text-destructive">*</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Rate Adjust</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      month.label
                    )}
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-[90px] bg-muted/50 font-bold text-xs py-2">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COST_CATEGORIES.map(({ key, label }) => {
                const rowTotal = totals[key];
                return (
                  <TableRow key={key}>
                    <TableCell className="sticky left-0 z-10 bg-background font-medium text-xs py-2">
                      {label}
                    </TableCell>
                    {monthlyCosts.map((cost, index) => (
                      <TableCell key={index} className="text-center text-xs py-2">
                        {formatCurrency(cost[key as CostKey])}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-muted/50 font-semibold text-xs py-2">
                      {formatCurrency(rowTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Grand Total Row */}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell className="sticky left-0 z-10 bg-muted/30 font-bold text-xs py-2">
                  Total
                </TableCell>
                {monthlyCosts.map((cost, index) => {
                  const monthTotal = 
                    cost.venture_team_services_cost + 
                    cost.it_team_services_cost + 
                    cost.operating_expenses + 
                    cost.legal_costs;
                  return (
                    <TableCell key={index} className="text-center font-semibold text-xs py-2">
                      {formatCurrency(monthTotal)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center bg-muted font-bold text-xs py-2">
                  {formatCurrency(
                    totals.venture_team_services_cost +
                    totals.it_team_services_cost +
                    totals.operating_expenses +
                    totals.legal_costs
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
