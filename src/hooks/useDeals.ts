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

export interface DealDocument {
  id: string;
  deal_id: string;
  doc_type: "term_sheet" | "ipa" | "other";
  title: string;
  drive_url: string;
  added_by: string | null;
  created_at: string;
}

export const DOC_TYPES = [
  { key: "term_sheet", label: "Signed Term Sheet" },
  { key: "ipa", label: "Signed IPA" },
  { key: "other", label: "Other" },
] as const;

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

// Columns the Dealflow list, kanban, and quick-search actually use.
// Long-form fields (ipa_details, next_step, portfolio_update, ...) are
// fetched per-deal by useDeal() on the detail page instead of shipping
// them for all rows on every list load.
const LIST_COLUMNS =
  "id, fourd_id, company_name, deal_name, assigned_to, description, stage, status, venture_office, office_code, tags, date_received, last_interaction, website, employee_count";

// Module-level cache: back/forward navigation between list and detail
// reuses the last fetched list instead of re-downloading it. A background
// refresh still runs on mount so data stays current.
let dealsCache: Deal[] | null = null;

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
  const [deals, setDeals] = useState<Deal[]>(dealsCache ?? []);
  const [loading, setLoading] = useState(dealsCache === null);

  const fetchDeals = useCallback(async () => {
    if (PREVIEW) {
      setDeals(previewDealList());
      setLoading(false);
      return;
    }
    try {
      // Page through in 1000-row chunks: Supabase's API caps single responses
      // at 1000 rows, and the pipeline exceeds that.
      const PAGE = 1000;
      let all: Deal[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await supabase
          .from("deals" as any)
          .select(LIST_COLUMNS)
          .order("company_name", { ascending: true })
          .order("id", { ascending: true })
          .range(from, from + PAGE - 1);
        if (error) throw error;
        const page = (data as unknown as Deal[]) || [];
        all = all.concat(page);
        if (page.length < PAGE) break;
      }
      dealsCache = all;
      setDeals(all);
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
    // .select() so an RLS-filtered write (0 rows) surfaces as an error
    // instead of silently no-oping — root cause of the pre-RBAC edit bug.
    const { data, error } = await supabase.from("deals" as any).update(patch as any).eq("id", id).select("id");
    if (error || !data || (data as any[]).length === 0) {
      console.error("Error updating deal:", error);
      toast.error(error ? "Update failed" : "You don't have permission to edit this deal");
      fetchDeals();
    }
  }, [fetchDeals]);

  const addDeal = useCallback(async (fields: Partial<Deal>): Promise<string | null> => {
    if (PREVIEW) {
      const d = { ...fields, id: `preview-new-${Date.now()}` } as Deal;
      setDeals(prev => [d, ...prev]);
      return d.id;
    }
    const { data, error } = await supabase
      .from("deals" as any)
      .insert(fields as any)
      .select("id")
      .single();
    if (error) {
      console.error("Error creating deal:", error);
      toast.error("Failed to create deal");
      return null;
    }
    // Jump the PitchBook enrichment queue for this company (worker processes
    // priority-pending rows first; company logo resolves instantly from the
    // website domain, no queue involved).
    if (fields.company_name) {
      const { error: e2 } = await supabase.from("pitchbook_enrichment" as any).insert({
        company_name: fields.company_name,
        domain: fields.website ? fields.website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].toLowerCase() : null,
        status: "pending",
        priority: true,
      } as any);
      if (e2 && !`${e2.code}`.startsWith("23")) console.warn("Enrichment request skipped:", e2.message);
    }
    toast.success("Deal created");
    fetchDeals();
    return (data as any).id as string;
  }, [fetchDeals]);

  return { deals, loading, updateDeal, addDeal, refetch: fetchDeals };
}

// Full record for one deal (detail page): fetches a single row with all
// columns instead of the whole table.
export function useDeal(id: string | null) {
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDeal = useCallback(async () => {
    if (!id) { setDeal(null); setLoading(false); return; }
    if (PREVIEW) {
      setDeal(previewDealList().find(d => d.id === id) || null);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("deals" as any)
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      setDeal((data as unknown as Deal) || null);
    } catch (e) {
      console.error("Error fetching deal:", e);
      toast.error("Failed to load deal");
      setDeal(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { setLoading(true); fetchDeal(); }, [fetchDeal]);

  const updateDeal = useCallback(async (dealId: string, patch: Partial<Deal>) => {
    setDeal(prev => (prev && prev.id === dealId ? { ...prev, ...patch } : prev));
    if (dealsCache) dealsCache = dealsCache.map(d => (d.id === dealId ? { ...d, ...patch } : d));
    if (PREVIEW) return;
    // .select() so an RLS-filtered write (0 rows) surfaces as an error.
    const { data, error } = await supabase.from("deals" as any).update(patch as any).eq("id", dealId).select("id");
    if (error || !data || (data as any[]).length === 0) {
      console.error("Error updating deal:", error);
      toast.error(error ? "Update failed" : "You don't have permission to edit this deal");
      fetchDeal();
    }
  }, [fetchDeal]);

  return { deal, loading, updateDeal };
}

export function useDealDocuments(dealId: string | null) {
  const [documents, setDocuments] = useState<DealDocument[]>([]);

  const fetchDocs = useCallback(async () => {
    if (!dealId) { setDocuments([]); return; }
    if (PREVIEW) {
      setDocuments(dealId === "preview-0" ? [
        { id: "pd1", deal_id: dealId, doc_type: "term_sheet", title: "Assort Health — Executed Term Sheet (SVHV)", drive_url: "https://drive.google.com/file/d/sample1", added_by: "steve@prinnovo.com", created_at: "2026-07-01T12:00:00Z" },
        { id: "pd2", deal_id: dealId, doc_type: "ipa", title: "Assort Health — Signed IPA v3 (SVHV)", drive_url: "https://drive.google.com/file/d/sample2", added_by: "steve@prinnovo.com", created_at: "2026-07-03T12:00:00Z" },
      ] as DealDocument[] : []);
      return;
    }
    const { data, error } = await supabase
      .from("deal_documents" as any).select("*").eq("deal_id", dealId).order("created_at");
    if (error) console.error(error);
    setDocuments((data as unknown as DealDocument[]) || []);
  }, [dealId]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const addDocument = useCallback(async (doc: { doc_type: string; title: string; drive_url: string; added_by: string | null }) => {
    if (!dealId) return;
    if (PREVIEW) {
      setDocuments(prev => [...prev, { ...doc, id: `pd-${Date.now()}`, deal_id: dealId, created_at: new Date().toISOString() } as DealDocument]);
      return;
    }
    const { error } = await supabase.from("deal_documents" as any).insert({ ...doc, deal_id: dealId } as any);
    if (error) { console.error(error); toast.error("Failed to add document link"); return; }
    fetchDocs();
  }, [dealId, fetchDocs]);

  const removeDocument = useCallback(async (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (PREVIEW) return;
    const { error } = await supabase.from("deal_documents" as any).delete().eq("id", id);
    if (error) { console.error(error); fetchDocs(); }
  }, [fetchDocs]);

  return { documents, addDocument, removeDocument };
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
