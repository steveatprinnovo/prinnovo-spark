import { useState, useMemo, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDeals, Deal, DEAL_STAGES, DEAL_STATUSES } from "@/hooks/useDeals";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { PREVIEW } from "@/preview/previewMode";
import { PageHeader, PageContainer } from "@/components/layout/PageHeader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { OfficeTag } from "@/components/OfficeTag";
import { CompanyLogo } from "@/components/CompanyLogo";
import { AddDealDialog } from "@/components/AddDealDialog";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const PAGE_SIZE = 100;

/** Status pill palette (UX redesign 2026-07-18). */
function statusPillClasses(status: string | null): string {
  switch (status) {
    case "Active": return "bg-[#e9f4ef] text-[#2e7d5b]";
    case "Pass": return "bg-[#eceef5] text-[#5c6178]";
    case "On Hold": return "bg-[#f7efe0] text-[#8a6b2d]";
    case "IPA Inactive": return "bg-[#fbf0ef] text-[#b3413f]";
    case "Passed to Health System": return "bg-[#e6f5f7] text-[#027e8c]";
    default: return "bg-[#eceef5] text-[#5c6178]";
  }
}

function StatusPill({ status, small = false }: { status: string | null; small?: boolean }) {
  if (!status) return <span className="text-[#8b8fa3]">—</span>;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${small ? "px-[7px] py-[2px] text-[10px]" : "px-[9px] py-[3px] text-[11px]"} ${statusPillClasses(status)}`}>
      {status}
    </span>
  );
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Dealflow() {
  usePageTitle("Dealflow CRM");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice } = useUserAuth();
  // Office scoping now comes from the PageHeader office dropdown (admins);
  // the page-local office select was removed in the UX redesign.
  const { selectedVentureOffice } = useAdminVentureOffice();
  const { deals, loading, updateDeal, addDeal } = useDeals();

  // Toolbar state lives in the URL so browser back/forward restores the exact
  // view (filters, search, page, list/kanban) when returning from a deal.
  const [params, setParams] = useSearchParams();
  const view = (params.get("view") === "kanban" ? "kanban" : "list") as "list" | "kanban";
  const search = params.get("q") ?? "";
  const stageFilter = params.get("stage") ?? "all";
  const statusFilter = params.get("status") ?? "all";
  const page = Math.max(0, parseInt(params.get("page") ?? "0", 10) || 0);
  const setParam = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "" || v === "all" || (k === "page" && v === "0") || (k === "view" && v === "list")) next.delete(k);
      else next.set(k, v);
    }
    setParams(next, { replace: true });
  };
  const setView = (v: "list" | "kanban") => setParam({ view: v });
  const setSearch = (v: string) => setParam({ q: v, page: null });
  const setStageFilter = (v: string) => setParam({ stage: v, page: null });
  const setStatusFilter = (v: string) => setParam({ status: v, page: null });
  const setPage = (updater: number | ((p: number) => number)) => {
    const v = typeof updater === "function" ? updater(page) : updater;
    setParam({ page: String(v) });
  };
  const [dragId, setDragId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!PREVIEW && !authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Admins scope by the header office selection; office-bound roles are
  // already scoped server-side (RLS).
  const officeScope = isAdmin && selectedVentureOffice !== "all" ? selectedVentureOffice : null;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter(d => {
      if (stageFilter !== "all" && d.stage !== stageFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (officeScope && d.venture_office !== officeScope) return false;
      if (q) {
        const hay = [d.company_name, d.deal_name, d.description, d.assigned_to, (d.tags || []).join(" ")]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [deals, search, stageFilter, statusFilter, officeScope]);

  const pageDeals = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  const kanbanCols = useMemo(() => {
    const cols: { stage: string; deals: Deal[] }[] = DEAL_STAGES.map(s => ({ stage: s, deals: [] }));
    const unstaged: Deal[] = [];
    filtered.forEach(d => {
      const col = cols.find(c => c.stage === d.stage);
      if (col) col.deals.push(d); else unstaged.push(d);
    });
    return { cols, unstaged };
  }, [filtered]);

  const onDropStage = (stage: string) => {
    if (!dragId) return;
    updateDeal(dragId, { stage });
    setDragId(null);
  };

  if ((authLoading || loading) && !PREVIEW) {
    return (
      <PageContainer>
        <PageHeader title="Dealflow CRM" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </PageContainer>
    );
  }

  const segmentClasses = (active: boolean) =>
    `px-3.5 py-2 text-[13px] font-semibold transition-colors ${active ? "bg-[#171d70] text-white" : "bg-[#f3f4f8] text-[#5c6178] hover:text-[#171d70]"}`;

  return (
    <PageContainer>
      <PageHeader
        title="Dealflow CRM"
        subtitle={`${filtered.length} deal${filtered.length === 1 ? "" : "s"} in the pipeline`}
      />

      {/* Toolbar */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b8fa3]" />
          <Input
            placeholder="Quick search…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-9 w-56 rounded border-[#e2e3ec] pl-9 text-[13.5px] text-[#232842] placeholder:text-[#8b8fa3]"
          />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="h-9 w-56 rounded border-[#e2e3ec] text-[13.5px] text-[#5c6178]"><SelectValue placeholder="Stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stages</SelectItem>
            {DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-9 w-44 rounded border-[#e2e3ec] text-[13.5px] text-[#5c6178]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {DEAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button
          onClick={() => setShowAdd(true)}
          className="h-9 gap-1.5 rounded bg-[#171d70] px-4 text-[13.5px] font-semibold text-white hover:bg-[#10154f]"
        >
          <Plus className="h-4 w-4" /> Add Deal
        </Button>
        <div className="flex overflow-hidden rounded border border-[#e2e3ec]">
          <button type="button" className={segmentClasses(view === "list")} onClick={() => setView("list")}>List</button>
          <button type="button" className={`border-l border-[#e2e3ec] ${segmentClasses(view === "kanban")}`} onClick={() => setView("kanban")}>Kanban</button>
        </div>
      </div>

      {view === "list" ? (
        <div className="overflow-hidden rounded-lg border border-[#e2e3ec] bg-white">
          <div className="flex items-center justify-between border-b border-[#e2e3ec] px-4 py-2">
            <span className="section-label">Deals</span>
            <div className="flex items-center gap-2 text-xs text-[#8b8fa3]">
              {filtered.length > 0 && (
                <span>
                  {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                </span>
              )}
              <Button variant="outline" size="icon" className="h-7 w-7 rounded border-[#e2e3ec] text-[#5c6178] hover:bg-[#f3f4f8]" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7 rounded border-[#e2e3ec] text-[#5c6178] hover:bg-[#f3f4f8]" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[1080px]">
              <TableHeader>
                <TableRow className="border-b border-[#e2e3ec] bg-[#f7f8fb] hover:bg-[#f7f8fb]">
                  <TableHead className="table-header-label h-auto px-3.5 py-[11px]">Company</TableHead>
                  <TableHead className="table-header-label h-auto px-3.5 py-[11px]">Deal Name</TableHead>
                  <TableHead className="table-header-label h-auto px-3.5 py-[11px]">Assigned To</TableHead>
                  <TableHead className="table-header-label h-auto px-3.5 py-[11px]">Stage</TableHead>
                  <TableHead className="table-header-label h-auto px-3.5 py-[11px]">Status</TableHead>
                  <TableHead className="table-header-label h-auto px-3.5 py-[11px]">Venture Office</TableHead>
                  <TableHead className="table-header-label h-auto px-3.5 py-[11px]">Date Received</TableHead>
                  <TableHead className="table-header-label h-auto px-3.5 py-[11px]">Last Interaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageDeals.map(d => (
                  <TableRow
                    key={d.id}
                    className="cursor-pointer border-b border-[#f0f1f6] transition-colors hover:bg-[#f7f8fb]"
                    onClick={() => navigate(`/dealflow/${d.id}`)}
                  >
                    <TableCell className="px-3.5 py-2.5 text-[13.5px] font-semibold text-[#171d70]">
                      <span className="inline-flex items-center gap-2">
                        <CompanyLogo website={d.website} name={d.company_name} size={18} />
                        {d.company_name}
                      </span>
                    </TableCell>
                    <TableCell className="px-3.5 py-2.5 text-[13px] text-[#232842]">{d.deal_name}</TableCell>
                    <TableCell className="px-3.5 py-2.5 text-[13px] text-[#232842]">{d.assigned_to || "—"}</TableCell>
                    <TableCell className="px-3.5 py-2.5">
                      {d.stage ? (
                        <span className="inline-flex items-center whitespace-nowrap rounded bg-[#e8e9f1] px-2 py-[3px] text-[11px] font-semibold text-[#5a5f9c]">
                          {d.stage}
                        </span>
                      ) : <span className="text-[#8b8fa3]">—</span>}
                    </TableCell>
                    <TableCell className="px-3.5 py-2.5"><StatusPill status={d.status} /></TableCell>
                    <TableCell className="px-3.5 py-2.5"><OfficeTag office={d.venture_office} short className="text-[12.5px] text-[#5c6178]" /></TableCell>
                    <TableCell className="px-3.5 py-2.5 text-[13px] text-[#5c6178]">{formatDate(d.date_received)}</TableCell>
                    <TableCell className="px-3.5 py-2.5 text-[13px] text-[#5c6178]">{formatDate(d.last_interaction)}</TableCell>
                  </TableRow>
                ))}
                {pageDeals.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="py-10 text-center text-[#8b8fa3]">No deals match the current filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3.5 overflow-x-auto pb-3">
          {kanbanCols.cols.map(col => (
            <div
              key={col.stage}
              className="w-[250px] flex-none rounded-lg bg-[#f3f4f8]"
              onDragOver={e => e.preventDefault()}
              onDrop={() => onDropStage(col.stage)}
            >
              <div className="flex items-center justify-between px-3.5 py-3">
                <div className="text-[12.5px] font-bold text-[#171d70]">{col.stage}</div>
                <span className="rounded-full bg-[#e8e9f1] px-2 py-0.5 text-[11px] font-semibold text-[#5a5f9c]">{col.deals.length}</span>
              </div>
              <div className="flex min-h-[60px] max-h-[60vh] flex-col gap-2 overflow-y-auto px-2.5 pb-2.5">
                {col.deals.map(d => (
                  <div
                    key={d.id}
                    draggable
                    onDragStart={() => setDragId(d.id)}
                    onClick={() => navigate(`/dealflow/${d.id}`)}
                    className="cursor-pointer rounded-md border border-[#e2e3ec] bg-white px-3 py-[11px] transition-colors hover:border-[#0299aa]"
                  >
                    <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#171d70]">
                      <CompanyLogo website={d.website} name={d.company_name} size={14} />
                      {d.company_name}
                    </div>
                    <div className="mb-1.5 mt-0.5 truncate text-[11.5px] text-[#8b8fa3]">{d.deal_name}</div>
                    <div className="flex items-center gap-1.5">
                      {d.venture_office && (
                        <span className="inline-flex items-center rounded bg-[#e6f5f7] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.06em] text-[#0299aa]">
                          <OfficeTag office={d.venture_office} short />
                        </span>
                      )}
                      <StatusPill status={d.status} small />
                    </div>
                  </div>
                ))}
                {col.deals.length === 0 && (
                  <div className="rounded-md border border-dashed border-[#d9dbe7] py-4 text-center text-[11.5px] text-[#8b8fa3]">Drop deals here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddDealDialog
        open={showAdd}
        onClose={() => setShowAdd(false)}
        defaultOffice={isAdmin ? null : ventureOffice}
        isAdmin={isAdmin || PREVIEW}
        onCreate={async fields => {
          const id = await addDeal(fields);
          if (id) navigate(`/dealflow/${id}`);
        }}
      />
    </PageContainer>
  );
}
