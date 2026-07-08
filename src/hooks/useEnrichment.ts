import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PREVIEW } from "@/preview/previewMode";
import previewEnrichment from "@/preview/preview-enrichment.json";

// Company-level PitchBook enrichment, written by the nightly Claude worker
// (see docs/enrichment-worker.md). The app only reads this table; the one
// write path exposed in the UI is admin candidate confirmation.

export interface FundingRound {
  date: string | null;
  type: string | null;
  amount_usd: number | null;
  investors: string[];
  synopsis: string | null;
}

export interface PbCandidate {
  pbid: string;
  name: string;
  description: string | null;
  location: string | null;
}

export interface Enrichment {
  id: string;
  company_name: string;
  pbid: string | null;
  status: "pending" | "matched" | "ambiguous" | "not_found";
  candidates: PbCandidate[] | null;
  description: string | null;
  year_founded: number | null;
  employees: number | null;
  employees_as_of: string | null;
  hq_location: string | null;
  business_status: string | null;
  ownership_status: string | null;
  total_raised_usd: number | null;
  last_round_type: string | null;
  last_round_date: string | null;
  last_round_amount_usd: number | null;
  post_valuation_usd: number | null;
  investors: string[] | null;
  funding_rounds: FundingRound[] | null;
  team: { name: string; title: string }[] | null;
  fetched_at: string | null;
}

export function useEnrichment(companyName: string | null) {
  const [enrichment, setEnrichment] = useState<Enrichment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyName) { setEnrichment(null); setLoading(false); return; }
    if (PREVIEW) {
      const rows = (previewEnrichment as any).rows as Enrichment[];
      setEnrichment(rows.find(r => r.company_name.toLowerCase() === companyName.toLowerCase()) || null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("pitchbook_enrichment" as any)
      .select("*")
      .eq("company_key", companyName.toLowerCase())
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Enrichment load failed:", error);
        setEnrichment((data as unknown as Enrichment) || null);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [companyName]);

  const confirmCandidate = async (candidate: PbCandidate) => {
    if (!enrichment) return;
    setEnrichment({ ...enrichment, pbid: candidate.pbid, status: "pending", candidates: null });
    if (PREVIEW) return;
    const { error } = await supabase
      .from("pitchbook_enrichment" as any)
      .update({ pbid: candidate.pbid, status: "pending", candidates: null } as any)
      .eq("id", enrichment.id);
    if (error) console.error("Candidate confirmation failed:", error);
  };

  return { enrichment, loading, confirmCandidate };
}

export function fmtUsd(n: number | null): string {
  if (n == null) return "—";
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}
