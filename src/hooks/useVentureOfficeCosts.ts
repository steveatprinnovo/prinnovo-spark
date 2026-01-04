import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface VentureOfficeCost {
  cost_id: number;
  venture_office: string | null;
  month: string | null;
  venture_team_services_cost: number | null;
  it_team_services_cost: number | null;
  operating_expenses: number | null;
  legal_costs: number | null;
}

export function useVentureOfficeCosts(selectedVentureOffice: string, selectedYear: number | null, onDefaultYearDetected?: (year: number) => void) {
  const [costs, setCosts] = useState<VentureOfficeCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const fetchCosts = async () => {
      setLoading(true);
      try {
        // First, get all unique years from the data
        let yearQuery = supabase
          .from("venture_office_costs")
          .select("month");
        
        if (selectedVentureOffice !== "all") {
          yearQuery = yearQuery.eq("venture_office", selectedVentureOffice);
        }
        
        const { data: yearData } = await yearQuery;
        
        if (yearData) {
          const years = [...new Set(
            yearData
              .map(d => d.month ? new Date(d.month).getFullYear() : null)
              .filter((y): y is number => y !== null)
          )].sort((a, b) => b - a); // Sort descending (newest first)
          
          setAvailableYears(years);
          
          // If no year is selected yet, notify parent of the most recent year
          if (selectedYear === null && years.length > 0 && onDefaultYearDetected) {
            onDefaultYearDetected(years[0]);
          }
        }

        // Now fetch costs for the selected year
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
          // Filter by selected year (only if year is set)
          const filteredData = selectedYear !== null 
            ? (data || []).filter(cost => {
                if (!cost.month) return false;
                const costYear = new Date(cost.month).getFullYear();
                return costYear === selectedYear;
              })
            : [];
          setCosts(filteredData);
        }
      } catch (error) {
        console.error("Error fetching venture office costs:", error);
        setCosts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCosts();
  }, [selectedVentureOffice, selectedYear]);

  // Aggregate costs by month
  const monthlyCosts = useMemo(() => {
    const monthMap = new Map<string, {
      month: string;
      venture_team_services_cost: number;
      it_team_services_cost: number;
      operating_expenses: number;
      legal_costs: number;
    }>();

    costs.forEach(cost => {
      if (!cost.month) return;
      
      const monthKey = cost.month;
      const existing = monthMap.get(monthKey) || {
        month: monthKey,
        venture_team_services_cost: 0,
        it_team_services_cost: 0,
        operating_expenses: 0,
        legal_costs: 0,
      };

      monthMap.set(monthKey, {
        month: monthKey,
        venture_team_services_cost: existing.venture_team_services_cost + (cost.venture_team_services_cost || 0),
        it_team_services_cost: existing.it_team_services_cost + (cost.it_team_services_cost || 0),
        operating_expenses: existing.operating_expenses + (cost.operating_expenses || 0),
        legal_costs: existing.legal_costs + (cost.legal_costs || 0),
      });
    });

    // Sort by month
    return Array.from(monthMap.values()).sort((a, b) => 
      new Date(a.month).getTime() - new Date(b.month).getTime()
    );
  }, [costs]);

  // Calculate totals
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

  return { costs, monthlyCosts, totals, loading, availableYears };
}
