import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useVentureOfficeCosts } from "@/hooks/useVentureOfficeCosts";
import { format } from "date-fns";

interface CostsTableProps {
  selectedVentureOffice: string;
  selectedYear: number;
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
    selectedYear
  );

  // Get month labels for the selected year
  const monthLabels = useMemo(() => {
    return monthlyCosts.map(cost => format(new Date(cost.month), "MMM"));
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
        <span className="text-sm font-medium text-foreground">Year:</span>
        <Select 
          value={selectedYear.toString()} 
          onValueChange={(value) => onYearChange(parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableYears.map(year => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {monthlyCosts.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">
          No cost data available for {selectedYear}.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-10 bg-muted min-w-[200px]">Cost Category</TableHead>
                {monthLabels.map((month, index) => (
                  <TableHead key={index} className="text-center min-w-[100px]">
                    {month}
                  </TableHead>
                ))}
                <TableHead className="text-center min-w-[120px] bg-muted/50 font-bold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COST_CATEGORIES.map(({ key, label }) => {
                const rowTotal = totals[key];
                return (
                  <TableRow key={key}>
                    <TableCell className="sticky left-0 z-10 bg-background font-medium">
                      {label}
                    </TableCell>
                    {monthlyCosts.map((cost, index) => (
                      <TableCell key={index} className="text-center">
                        {formatCurrency(cost[key as CostKey])}
                      </TableCell>
                    ))}
                    <TableCell className="text-center bg-muted/50 font-semibold">
                      {formatCurrency(rowTotal)}
                    </TableCell>
                  </TableRow>
                );
              })}
              {/* Grand Total Row */}
              <TableRow className="bg-muted/30 font-semibold">
                <TableCell className="sticky left-0 z-10 bg-muted/30 font-bold">
                  Total
                </TableCell>
                {monthlyCosts.map((cost, index) => {
                  const monthTotal = 
                    cost.venture_team_services_cost + 
                    cost.it_team_services_cost + 
                    cost.operating_expenses + 
                    cost.legal_costs;
                  return (
                    <TableCell key={index} className="text-center font-semibold">
                      {formatCurrency(monthTotal)}
                    </TableCell>
                  );
                })}
                <TableCell className="text-center bg-muted font-bold">
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
