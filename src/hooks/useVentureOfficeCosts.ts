import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { parse, isValid, addYears, startOfMonth, isBefore, format, endOfMonth } from "date-fns";

export interface VentureOfficeCost {
  cost_id: number;
  venture_office: string | null;
  month: string | null;
  venture_team_services_cost: number | null;
  it_team_services_cost: number | null;
  operating_expenses: number | null;
  legal_costs: number | null;
  rate_adjust: boolean | null;
}

export interface ContractYearOption {
  yearNumber: number;
  label: string;
  startDate: Date;
  endDate: Date;
}

export function useVentureOfficeCosts(
  selectedVentureOffice: string, 
  selectedContractYear: number | null, 
  initiationDate: string | null | undefined,
  onDefaultYearDetected?: (year: number) => void
) {
  const [costs, setCosts] = useState<VentureOfficeCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  // Calculate available contract years based on initiation date
  const contractYearOptions = useMemo((): ContractYearOption[] => {
    if (!initiationDate) return [];
    
    const initDate = parse(initiationDate, "yyyy-MM-dd", new Date());
    if (!isValid(initDate)) return [];
    
    const now = new Date();
    const options: ContractYearOption[] = [];
    
    let yearNum = 1;
    while (true) {
      const yearStart = addYears(startOfMonth(initDate), yearNum - 1);
      // End date is the last day of the month before the next anniversary
      const nextAnniversary = addYears(startOfMonth(initDate), yearNum);
      const lastMonthOfYear = new Date(nextAnniversary);
      lastMonthOfYear.setMonth(lastMonthOfYear.getMonth() - 1);
      const yearEnd = endOfMonth(lastMonthOfYear);
      
      // Only add if the year's start month has passed (anniversary has occurred for this year)
      if (isBefore(yearStart, now)) {
        const startLabel = format(yearStart, "MMMM yyyy");
        const endLabel = format(yearEnd, "MMMM yyyy");
        options.push({
          yearNumber: yearNum,
          label: `Year ${yearNum} (${startLabel} - ${endLabel})`,
          startDate: yearStart,
          endDate: yearEnd,
        });
        yearNum++;
      } else {
        break;
      }
    }
    
    return options;
  }, [initiationDate]);

  useEffect(() => {
    const fetchCosts = async () => {
      setLoading(true);
      try {
        // If no initiation date or no contract years available, just fetch all data for display
        if (!initiationDate || contractYearOptions.length === 0) {
          setCosts([]);
          setLoading(false);
          return;
        }

        // Set default year to most recent if not selected
        if (selectedContractYear === null && contractYearOptions.length > 0 && onDefaultYearDetected) {
          onDefaultYearDetected(contractYearOptions[contractYearOptions.length - 1].yearNumber);
        }

        // Now fetch costs
        let query = supabase
          .from("venture_office_costs")
          .select("*");
        
        if (selectedVentureOffice !== "all") {
          query = query.eq("venture_office", selectedVentureOffice);
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error("Error fetching venture office costs:", error);
          setCosts([]);
        } else {
          setCosts(data || []);
        }
      } catch (error) {
        console.error("Error fetching venture office costs:", error);
        setCosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
  }, [selectedVentureOffice, selectedContractYear, initiationDate, contractYearOptions.length, refreshTrigger]);

  // Filter costs by selected contract year date range
  const filteredCosts = useMemo(() => {
    if (selectedContractYear === null || contractYearOptions.length === 0) return [];
    
    const selectedYear = contractYearOptions.find(y => y.yearNumber === selectedContractYear);
    if (!selectedYear) return [];
    
    return costs.filter(cost => {
      if (!cost.month) return false;
      const costDate = startOfMonth(new Date(cost.month));
      // Check if cost month is >= start and <= end of contract year
      return !isBefore(costDate, startOfMonth(selectedYear.startDate)) && 
             !isBefore(endOfMonth(selectedYear.endDate), costDate);
    });
  }, [costs, selectedContractYear, contractYearOptions]);

  // Aggregate costs by month
  const monthlyCosts = useMemo(() => {
    const monthMap = new Map<string, {
      month: string;
      venture_team_services_cost: number;
      it_team_services_cost: number;
      operating_expenses: number;
      legal_costs: number;
      rate_adjust: boolean;
    }>();

    filteredCosts.forEach(cost => {
      if (!cost.month) return;
      
      const monthKey = cost.month;
      const existing = monthMap.get(monthKey) || {
        month: monthKey,
        venture_team_services_cost: 0,
        it_team_services_cost: 0,
        operating_expenses: 0,
        legal_costs: 0,
        rate_adjust: false,
      };

      monthMap.set(monthKey, {
        month: monthKey,
        venture_team_services_cost: existing.venture_team_services_cost + (cost.venture_team_services_cost || 0),
        it_team_services_cost: existing.it_team_services_cost + (cost.it_team_services_cost || 0),
        operating_expenses: existing.operating_expenses + (cost.operating_expenses || 0),
        legal_costs: existing.legal_costs + (cost.legal_costs || 0),
        rate_adjust: existing.rate_adjust || (cost.rate_adjust === true),
      });
    });

    // Sort by month
    return Array.from(monthMap.values()).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [filteredCosts]);

  // Calculate totals for filtered data (by contract year)
  const totals = useMemo(() => {
    return monthlyCosts.reduce((acc, cost) => ({
      venture_team_services_cost: acc.venture_team_services_cost + cost.venture_team_services_cost,
      it_team_services_cost: acc.it_team_services_cost + cost.it_team_services_cost,
      operating_expenses: acc.operating_expenses + cost.operating_expenses,
      legal_costs: acc.legal_costs + cost.legal_costs,
    }), {
      venture_team_services_cost: 0,
      it_team_services_cost: 0,
      operating_expenses: 0,
      legal_costs: 0,
    });
  }, [monthlyCosts]);

  // Calculate overall totals across ALL data (not filtered by contract year)
  const overallTotals = useMemo(() => {
    return costs.reduce((acc, cost) => ({
      venture_team_services_cost: acc.venture_team_services_cost + (cost.venture_team_services_cost || 0),
      it_team_services_cost: acc.it_team_services_cost + (cost.it_team_services_cost || 0),
      operating_expenses: acc.operating_expenses + (cost.operating_expenses || 0),
      legal_costs: acc.legal_costs + (cost.legal_costs || 0),
    }), {
      venture_team_services_cost: 0,
      it_team_services_cost: 0,
      operating_expenses: 0,
      legal_costs: 0,
    });
  }, [costs]);

  return { costs: filteredCosts, monthlyCosts, totals, overallTotals, loading, contractYearOptions, refetch };
}
