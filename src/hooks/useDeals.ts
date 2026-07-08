import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PREVIEW } from "@/preview/previewMode";
import previewDeals from "@/preview/preview-deals.json";

export interface Deal {
  id: string;
  fourd_id: number | null;
  company_name: string;
  deal_name: string;
  assigned_to: string | null;
  description: string | null;
  stage: string | null;
  ipa_structure: string | null;
  status: string | null;
  next_step: string | null;
  venture_office: string | null;
  office_code: string | null;
  clinical_status: string | null;
  reimbursement_status: string | null;
  technology_type: string[] | null;
  ipa_details: string | null;
  location: string | null;
  tags: string[] | null;
  source: string | null;
  date_received: string | null;
  last_interaction: string | null;
  website: string | null;
  employee_count: number | null;
  system_champion: string | null;
  department: string[] | null;
  phase: string | null;
  portfolio_update: string | null;
}

export interface DealContact {
  id: string;
  deal_id: string;
  name: string | null;
  email: string | null;
  company: string | null;
  phone: string | null;
}

export const DEAL_STAGES = [
  "0 - Prospect",
  "0 - Concept",
  "1 - Lead",
  "2 - Qualified Lead",
  "3 - Due Diligence",
  "4 - Term Sheet Negotiation",
  "5 - IPA Negotiation",
  "6 - Portfolio IPA",
  "7 - Portfolio Fund",
] as const;

export const DEAL_STATUSES = ["Active", "Pass", "On Hold", "Passed to Health System", "IPA Inactive"] as const;

export const OFFICE_NAMES: Record<string, string> = {
  CHV: "Cone Health Ventures",
  HLV: "Healthliant Ventures",
  NGHV: "Northeast Georgia Health Ventures",
  SVHV: "Salinas Valley Health Ventures",
};

// --- Preview data conversion (CSV row shape -> Deal) ---
function fromCsvRow(r: Record<string, string>, i: number): Deal {
  const norm = (s: string) => s.replace("Negogiation", "Negotiation");
  const parseDate = (s: string) => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
  };
  const code = (r["Venture Office"] || "").split(",")[0].trim();
  return {
    id: `preview-${i}`,
    fourd_id: Number(r["ID"]) || null,
    company_name: r["Company"],
    deal_name: r["Deal Name"],
    assigned_to: r["Assigned To"] || null,
    description: r["Description"] || null,
    stage: r["Stage"] ? norm(r["Stage"]) : null,
    ipa_structure: r["IPA Structure"] || null,
    status: r["Status"] || null,
    next_step: r["Next Step"] || null,
    venture_office: OFFICE_NAMES[code] || null,
    office_code: code || null,
    clinical_status: r["Clinical Status"] || null,
    reimbursement_status: r["Reimbursement Status"] || null,
    technology_type: r["Technology Type"] ? r["Technology Type"].split(",").map(s => s.trim()) : null,
    ipa_details: r["IPA Details"] || null,
    location: r["Location"] || null,
    tags: r["Tags"] ? r["Tags"].split(",").map(s => s.trim()) : null,
    source: r["Source"] || null,
    date_received: parseDate(r["Date Received"]),
    last_interaction: parseDate(r["Last Interaction"]),
    website: r["Website"] || null,
    employee_count: r["Employee Count"] ? Number(r["Employee Count"]) : null,
    system_champion: r["System Champion"] || null,
    department: r["Department"] ? r["Department"].split(";").map(s => s.trim()) : null,
    phase: r["Phase"] || null,
    portfolio_update: r["Portfolio Update"] || null,
  };
}

function previewDealList(): Deal[] {
  return (previewDeals as any).deals.map((r: Record<string, string>, i: number) => fromCsvRow(r, i));
}

export function previewContactsFor(deal: Deal): DealContact[] {
  const byCompany = (previewDeals as any).contacts[deal.company_name] || [];
  return byCompany.map((c: any, i: number) => ({
    id: `pc-${i}`, deal_id: deal.id, name: c.name || null, email: c.email || null,
    company: c.company || null, phone: c.phone || null,
  }));
}

export function useDeals() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    if (PREVIEW) {
      setDeals(previewDealList());
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("deals" as any)
        .select("*")
        .order("company_name", { ascending: true });
      if (error) throw error;
      setDeals((data as unknown as Deal[]) || []);
    } catch (e) {
      console.error("Error fetching deals:", e);
      toast.error("Failed to load deals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  const updateDeal = useCallback(async (id: string, patch: Partial<Deal>) => {
    setDeals(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
    if (PREVIEW) return;
    const { error } = await supabase.from("deals" as any).update(patch as any).eq("id", id);
    if (error) {
      console.error("Error updating deal:", error);
      toast.error("Update failed");
      fetchDeals();
    }
  }, [fetchDeals]);

  return { deals, loading, updateDeal, refetch: fetchDeals };
}

export function useDealContacts(deal: Deal | null) {
  const [contacts, setContacts] = useState<DealContact[]>([]);
  useEffect(() => {
    if (!deal) { setContacts([]); return; }
    if (PREVIEW) { setContacts(previewContactsFor(deal)); return; }
    supabase
      .from("deal_contacts" as any)
      .select("*")
      .eq("deal_id", deal.id)
      .then(({ data, error }) => {
        if (error) console.error(error);
        setContacts((data as unknown as DealContact[]) || []);
      });
  }, [deal]);
  return contacts;
}
