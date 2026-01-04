import { useMemo, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useVentureOfficeCosts, ContractYearOption } from "@/hooks/useVentureOfficeCosts";
import { BudgetVarianceCards, OverallBudgetVarianceCards } from "@/components/BudgetVarianceCards";
import { format } from "date-fns";

interface CostsTableProps {
  selectedVentureOffice: string;
  selectedContractYear: number | null;
  onContractYearChange: (year: number) => void;
  initiationDate: string | null | undefined;
  officeId: number | undefined;
  refreshKey?: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const SERVICES_COSTS = [
  { key: "venture_team_services_cost", label: "Venture Team Services Cost" },
  { key: "it_team_services_cost", label: "IT Team Services Cost" },
] as const;

const OPERATING_COSTS = [
  { key: "operating_expenses", label: "Operating Expenses" },
  { key: "legal_costs", label: "Legal Costs" },
] as const;

type CostKey = "venture_team_services_cost" | "it_team_services_cost" | "operating_expenses" | "legal_costs";

export function CostsTable({ selectedVentureOffice, selectedContractYear, onContractYearChange, initiationDate, officeId, refreshKey }: CostsTableProps) {
  const { monthlyCosts, totals, overallTotals, loading, contractYearOptions, refetch } = useVentureOfficeCosts(
    selectedVentureOffice,
    selectedContractYear,
    initiationDate,
    onContractYearChange // Pass callback to set default year when detected
  );

  // Refetch when refreshKey changes
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0) {
      refetch();
    }
  }, [refreshKey, refetch]);

  // Calculate overall subtotals for KPI cards (across all data)
  const overallServicesTotal = overallTotals.venture_team_services_cost + overallTotals.it_team_services_cost;
  const overallOperatingTotal = overallTotals.operating_expenses + overallTotals.legal_costs;

  // Get month labels for the selected year with rate_adjust indicator
  const monthLabels = useMemo(() => {
    return monthlyCosts.map(cost => ({
      label: format(new Date(cost.month), "MMM"),
      rateAdjust: cost.rate_adjust,
    }));
  }, [monthlyCosts]);

  // Calculate subtotals for each section
  const servicesSubtotals = useMemo(() => {
    return {
      monthly: monthlyCosts.map(cost => 
        cost.venture_team_services_cost + cost.it_team_services_cost
      ),
      total: totals.venture_team_services_cost + totals.it_team_services_cost,
    };
  }, [monthlyCosts, totals]);

  const operatingSubtotals = useMemo(() => {
    return {
      monthly: monthlyCosts.map(cost => 
        cost.operating_expenses + cost.legal_costs
      ),
      total: totals.operating_expenses + totals.legal_costs,
    };
  }, [monthlyCosts, totals]);

  if (!selectedVentureOffice || selectedVentureOffice === "all") {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Please select a venture office to view cost detail.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!initiationDate) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No Venture Office Initiation Date has been set. Please configure it in Settings to view costs by Contract Year.
      </div>
    );
  }

  if (contractYearOptions.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        No completed contract years available yet based on the initiation date.
      </div>
    );
  }

  // Calculate subtotals for KPI cards
  const servicesTotal = servicesSubtotals.total;
  const operatingTotal = operatingSubtotals.total;

  return (
    <div className="space-y-6">
      {/* Overall Budget Variance KPIs */}
      <OverallBudgetVarianceCards
        selectedVentureOffice={selectedVentureOffice}
        servicesTotal={overallServicesTotal}
        operatingTotal={overallOperatingTotal}
      />

      {/* Separator and Sub-header */}
      <div className="space-y-4">
        <Separator />
        <h3 className="text-sm font-semibold text-foreground">Contract Costs Details</h3>
      </div>

      {/* Contract Year Selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-foreground">Contract Year:</span>
        <Select 
          value={selectedContractYear?.toString() ?? ""} 
          onValueChange={(value) => onContractYearChange(parseInt(value))}
        >
          <SelectTrigger className="w-auto min-w-[280px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {contractYearOptions.map(option => (
              <SelectItem key={option.yearNumber} value={option.yearNumber.toString()} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Contract Year Budget Variance KPIs */}
      <BudgetVarianceCards
        selectedVentureOffice={selectedVentureOffice}
        selectedContractYear={selectedContractYear}
        servicesTotal={servicesTotal}
        operatingTotal={operatingTotal}
      />

      {monthlyCosts.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">
          No cost data available for Contract Year {selectedContractYear}.
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
              {/* Services Costs Section */}
              <TableRow className="bg-primary/10">
                <TableCell 
                  colSpan={monthLabels.length + 2} 
                  className="sticky left-0 z-10 font-bold text-xs py-1.5 text-primary"
                >
                  Services Costs
                </TableCell>
              </TableRow>
              {SERVICES_COSTS.map(({ key, label }) => {
                const rowTotal = totals[key];
                return (
                  <TableRow key={key}>
                    <TableCell className="sticky left-0 z-10 bg-background font-medium text-xs py-2 pl-4">
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
              {/* Services Costs Subtotal */}
              <TableRow className="bg-primary/5 font-semibold">
                <TableCell className="sticky left-0 z-10 bg-primary/5 font-bold text-xs py-2 pl-4">
                  Services Costs Total
                </TableCell>
                {servicesSubtotals.monthly.map((subtotal, index) => (
                  <TableCell key={index} className="text-center font-semibold text-xs py-2">
                    {formatCurrency(subtotal)}
                  </TableCell>
                ))}
                <TableCell className="text-center bg-primary/10 font-bold text-xs py-2">
                  {formatCurrency(servicesSubtotals.total)}
                </TableCell>
              </TableRow>

              {/* Spacer row */}
              <TableRow>
                <TableCell colSpan={monthLabels.length + 2} className="py-1.5 bg-transparent border-0" />
              </TableRow>

              {/* Operating Costs Section */}
              <TableRow className="bg-amber-500/10">
                <TableCell 
                  colSpan={monthLabels.length + 2} 
                  className="sticky left-0 z-10 font-bold text-xs py-1.5 text-amber-700 dark:text-amber-400"
                >
                  Operating Costs
                </TableCell>
              </TableRow>
              {OPERATING_COSTS.map(({ key, label }) => {
                const rowTotal = totals[key];
                return (
                  <TableRow key={key}>
                    <TableCell className="sticky left-0 z-10 bg-background font-medium text-xs py-2 pl-4">
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
              {/* Operating Costs Subtotal */}
              <TableRow className="bg-amber-500/5 font-semibold">
                <TableCell className="sticky left-0 z-10 bg-amber-500/5 font-bold text-xs py-2 pl-4">
                  Operating Costs Total
                </TableCell>
                {operatingSubtotals.monthly.map((subtotal, index) => (
                  <TableCell key={index} className="text-center font-semibold text-xs py-2">
                    {formatCurrency(subtotal)}
                  </TableCell>
                ))}
                <TableCell className="text-center bg-amber-500/10 font-bold text-xs py-2">
                  {formatCurrency(operatingSubtotals.total)}
                </TableCell>
              </TableRow>

              {/* Spacer row */}
              <TableRow>
                <TableCell colSpan={monthLabels.length + 2} className="py-1.5 bg-transparent border-0" />
              </TableRow>

              {/* Grand Total Row */}
              <TableRow className="bg-slate-700/10 dark:bg-slate-300/10 font-semibold">
                <TableCell className="sticky left-0 z-10 bg-slate-700/10 dark:bg-slate-300/10 font-bold text-xs py-2">
                  Grand Total
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
                <TableCell className="text-center bg-slate-700/20 dark:bg-slate-300/20 font-bold text-xs py-2">
                  {formatCurrency(servicesSubtotals.total + operatingSubtotals.total)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
