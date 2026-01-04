import { useMemo, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface BudgetVarianceCardsProps {
  selectedVentureOffice: string;
  selectedContractYear: number | null;
  servicesTotal: number;
  operatingTotal: number;
}

interface OverallBudgetVarianceCardsProps {
  selectedVentureOffice: string;
  servicesTotal: number;
  operatingTotal: number;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

interface BudgetData {
  services_budget: number;
  operating_costs_budget: number;
}

const renderVarianceCard = (
  title: string,
  budgetValue: number,
  actualValue: number,
  variance: number,
  colorClass: string
) => {
  // Positive variance = under budget (good/green), Negative variance = over budget (bad/red)
  const isOverBudget = variance < 0;
  const varianceColorClass = isOverBudget ? "text-destructive font-bold" : "text-green-600 dark:text-green-400 font-bold";
  
  return (
    <Card className={`bg-card/50 border ${colorClass}`}>
      <CardContent className="p-4">
        <h4 className="text-xs font-semibold text-foreground mb-3">{title}</h4>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Budget:</span>
            <span className="font-medium">{formatCurrency(budgetValue)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground">Actual:</span>
            <span className="font-medium">{formatCurrency(actualValue)}</span>
          </div>
          <div className="border-t border-border pt-1.5 mt-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">Variance:</span>
              <span className={varianceColorClass}>
                {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LoadingCards = () => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {[1, 2, 3].map(i => (
      <Card key={i} className="bg-card/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);

// Overall Budget Variance Cards (across all years)
export function OverallBudgetVarianceCards({ 
  selectedVentureOffice, 
  servicesTotal,
  operatingTotal 
}: OverallBudgetVarianceCardsProps) {
  const [totalBudget, setTotalBudget] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch all budgets for the venture office and sum them
  useEffect(() => {
    const fetchAllBudgets = async () => {
      if (!selectedVentureOffice || selectedVentureOffice === "all") {
        setTotalBudget(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data, error } = await supabase
        .from('venture_office_budgets')
        .select('services_budget, operating_costs_budget')
        .eq('venture_office', selectedVentureOffice);
      
      if (!error && data && data.length > 0) {
        const totals = data.reduce((acc, row) => ({
          services_budget: acc.services_budget + (Number(row.services_budget) || 0),
          operating_costs_budget: acc.operating_costs_budget + (Number(row.operating_costs_budget) || 0),
        }), { services_budget: 0, operating_costs_budget: 0 });
        
        setTotalBudget(totals);
      } else {
        setTotalBudget(null);
      }
      setLoading(false);
    };
    
    fetchAllBudgets();
  }, [selectedVentureOffice]);

  // Calculate variances
  const variances = useMemo(() => {
    const servicesBudget = totalBudget?.services_budget ?? 0;
    const operatingBudget = totalBudget?.operating_costs_budget ?? 0;
    const totalBudgetSum = servicesBudget + operatingBudget;
    const grandTotal = servicesTotal + operatingTotal;

    return {
      services: {
        budget: servicesBudget,
        actual: servicesTotal,
        variance: servicesBudget - servicesTotal,
      },
      operating: {
        budget: operatingBudget,
        actual: operatingTotal,
        variance: operatingBudget - operatingTotal,
      },
      total: {
        budget: totalBudgetSum,
        actual: grandTotal,
        variance: totalBudgetSum - grandTotal,
      },
    };
  }, [totalBudget, servicesTotal, operatingTotal]);

  if (loading) {
    return <LoadingCards />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderVarianceCard(
        "Total Services Budget Variance",
        variances.services.budget,
        variances.services.actual,
        variances.services.variance,
        "border-primary/20"
      )}
      {renderVarianceCard(
        "Total Operating Costs Budget Variance",
        variances.operating.budget,
        variances.operating.actual,
        variances.operating.variance,
        "border-amber-500/20"
      )}
      {renderVarianceCard(
        "Total Budget Variance",
        variances.total.budget,
        variances.total.actual,
        variances.total.variance,
        "border-slate-500/20"
      )}
    </div>
  );
}

// Contract Year Budget Variance Cards
export function BudgetVarianceCards({ 
  selectedVentureOffice, 
  selectedContractYear,
  servicesTotal,
  operatingTotal 
}: BudgetVarianceCardsProps) {
  const [budget, setBudget] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch budget for the selected contract year
  useEffect(() => {
    const fetchBudget = async () => {
      if (!selectedVentureOffice || selectedVentureOffice === "all" || !selectedContractYear) {
        setBudget(null);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      const { data, error } = await supabase
        .from('venture_office_budgets')
        .select('services_budget, operating_costs_budget')
        .eq('venture_office', selectedVentureOffice)
        .eq('year_number', selectedContractYear)
        .maybeSingle();
      
      if (!error && data) {
        setBudget({
          services_budget: Number(data.services_budget) || 0,
          operating_costs_budget: Number(data.operating_costs_budget) || 0,
        });
      } else {
        setBudget(null);
      }
      setLoading(false);
    };
    
    fetchBudget();
  }, [selectedVentureOffice, selectedContractYear]);

  // Calculate variances
  const variances = useMemo(() => {
    const servicesBudget = budget?.services_budget ?? 0;
    const operatingBudget = budget?.operating_costs_budget ?? 0;
    const totalBudget = servicesBudget + operatingBudget;
    const grandTotal = servicesTotal + operatingTotal;

    return {
      services: {
        budget: servicesBudget,
        actual: servicesTotal,
        variance: servicesBudget - servicesTotal,
      },
      operating: {
        budget: operatingBudget,
        actual: operatingTotal,
        variance: operatingBudget - operatingTotal,
      },
      total: {
        budget: totalBudget,
        actual: grandTotal,
        variance: totalBudget - grandTotal,
      },
    };
  }, [budget, servicesTotal, operatingTotal]);

  if (loading) {
    return <LoadingCards />;
  }

  const yearPrefix = selectedContractYear ? `Year ${selectedContractYear} ` : "";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderVarianceCard(
        `${yearPrefix}Services Budget Variance`,
        variances.services.budget,
        variances.services.actual,
        variances.services.variance,
        "border-primary/20"
      )}
      {renderVarianceCard(
        `${yearPrefix}Operating Costs Budget Variance`,
        variances.operating.budget,
        variances.operating.actual,
        variances.operating.variance,
        "border-amber-500/20"
      )}
      {renderVarianceCard(
        `${yearPrefix}Total Budget Variance`,
        variances.total.budget,
        variances.total.actual,
        variances.total.variance,
        "border-slate-500/20"
      )}
    </div>
  );
}
