import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PREVIEW } from "@/preview/previewMode";

// Live pipeline counts from the Dealflow deals table for the home dashboard.
// Counts exactly what the Dealflow tab shows when filtered to each stage
// (all statuses included), scoped to a venture office or "all".

export interface DealStageCounts {
  qualifiedLead: number;
  termSheet: number;
  ipaNegotiation: number;
}

const STAGES = ["2 - Qualified Lead", "4 - Term Sheet Negotiation", "5 - IPA Negotiation"];

export function useDealStageCounts(office?: string | null): DealStageCounts {
  const [counts, setCounts] = useState<DealStageCounts>({ qualifiedLead: 0, termSheet: 0, ipaNegotiation: 0 });

  useEffect(() => {
    if (PREVIEW) { setCounts({ qualifiedLead: 12, termSheet: 5, ipaNegotiation: 3 }); return; }
    let cancelled = false;
    let q = supabase.from("deals" as any).select("stage, venture_office").in("stage", STAGES);
    if (office && office !== "all") q = q.eq("venture_office", office);
    q.then(({ data, error }) => {
      if (cancelled) return;
      if (error) { console.error("Stage counts failed:", error); return; }
      const rows = (data as any[]) || [];
      setCounts({
        qualifiedLead: rows.filter(r => r.stage === STAGES[0]).length,
        termSheet: rows.filter(r => r.stage === STAGES[1]).length,
        ipaNegotiation: rows.filter(r => r.stage === STAGES[2]).length,
      });
    });
    return () => { cancelled = true; };
  }, [office]);

  return counts;
}
