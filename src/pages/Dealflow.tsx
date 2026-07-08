import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useDeals, Deal, DEAL_STAGES, DEAL_STATUSES } from "@/hooks/useDeals";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { PREVIEW } from "@/preview/previewMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { OfficeTag } from "@/components/OfficeTag";
import { CompanyLogo } from "@/components/CompanyLogo";
import { AddDealDialog } from "@/components/AddDealDialog";
import { Search, List as ListIcon, Kanban, ChevronLeft, ChevronRight, Plus } from "lucide-react";

const PAGE_SIZE = 100;

function stageBadgeVariant(stage: string | null): "default" | "secondary" | "outline" {
  if (!stage) return "outline";
  if (stage.startsWith("6") || stage.startsWith("7")) return "default";
  return "secondary";
}

function statusColor(status: string | null): string {
  switch (status) {
    case "Active": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "Pass": return "bg-slate-100 text-slate-600 border-slate-200";
    case "On Hold": return "bg-amber-100 text-amber-800 border-amber-200";
    case "IPA Inactive": return "bg-rose-100 text-rose-800 border-rose-200";
    case "Passed to Health System": return "bg-sky-100 text-sky-800 border-sky-200";
    default: return "bg-muted text-muted-foreground";
  }
}

function formatDate(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function Dealflow() {
  usePageTitle("Dealflow");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, ventureOffice } = useUserAuth();
  const { deals, loading, updateDeal, addDeal } = useDeals();

  const [view, setView] = useState<"list" | "kanban">("list");
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [officeFilter, setOfficeFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    if (!PREVIEW && !authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const offices = useMemo(
    () => Array.from(new Set(deals.map(d => d.venture_office).filter(Boolean))) as string[],
    [deals]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return deals.filter(d => {
      if (stageFilter !== "all" && d.stage !== stageFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (officeFilter !== "all" && d.venture_office !== officeFilter) return false;
      if (q) {
        const hay = [d.company_name, d.deal_name, d.description, d.assigned_to, (d.tags || []).join(" ")]
          .filter(Boolean).join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [deals, search, stageFilter, statusFilter, officeFilter]);

  useEffect(() => { setPage(0); }, [search, stageFilter, statusFilter, officeFilter]);

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
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6 space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dealflow</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAdmin ? "All venture offices" : ventureOffice || ""} · {filtered.length} deal{filtered.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2" onClick={() => setShowAdd(true)}>
              <Plus className="h-4 w-4" /> Add Deal
            </Button>
            <Button variant={view === "list" ? "default" : "outline"} size="sm" className="gap-2" onClick={() => setView("list")}>
              <ListIcon className="h-4 w-4" /> List
            </Button>
            <Button variant={view === "kanban" ? "default" : "outline"} size="sm" className="gap-2" onClick={() => setView("kanban")}>
              <Kanban className="h-4 w-4" /> Kanban
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Quick search…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Stage" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All stages</SelectItem>
              {DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {DEAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          {(isAdmin || PREVIEW) && (
            <Select value={officeFilter} onValueChange={setOfficeFilter}>
              <SelectTrigger className="w-64"><SelectValue placeholder="Venture office" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All venture offices</SelectItem>
                {offices.map(o => <SelectItem key={o} value={o}><OfficeTag office={o} /></SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        {view === "list" ? (
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Deals</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {filtered.length > 0 && (
                    <span>
                      {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </span>
                  )}
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-7 w-7" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Deal Name</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Venture Office</TableHead>
                    <TableHead>Date Received</TableHead>
                    <TableHead>Last Interaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageDeals.map(d => (
                    <TableRow
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() => navigate(`/dealflow/${d.id}`)}
                    >
                      <TableCell className="font-medium">
                        <span className="inline-flex items-center gap-2">
                          <CompanyLogo website={d.website} name={d.company_name} size={18} />
                          {d.company_name}
                        </span>
                      </TableCell>
                      <TableCell>{d.deal_name}</TableCell>
                      <TableCell>{d.assigned_to || "—"}</TableCell>
                      <TableCell>
                        {d.stage ? <Badge variant={stageBadgeVariant(d.stage)}>{d.stage}</Badge> : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {d.status ? (
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusColor(d.status)}`}>
                            {d.status}
                          </span>
                        ) : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell><OfficeTag office={d.venture_office} short className="text-muted-foreground" /></TableCell>
                      <TableCell>{formatDate(d.date_received)}</TableCell>
                      <TableCell>{formatDate(d.last_interaction)}</TableCell>
                    </TableRow>
                  ))}
                  {pageDeals.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No deals match the current filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {kanbanCols.cols.map(col => (
              <div
                key={col.stage}
                className="w-72 shrink-0"
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDropStage(col.stage)}
              >
                <Card className="bg-muted/40">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{col.stage}</CardTitle>
                      <Badge variant="secondary">{col.deals.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2 max-h-[60vh] overflow-y-auto">
                    {col.deals.map(d => (
                      <div
                        key={d.id}
                        draggable
                        onDragStart={() => setDragId(d.id)}
                        onClick={() => navigate(`/dealflow/${d.id}`)}
                        className="rounded-md border bg-card p-3 shadow-sm cursor-pointer hover:border-primary/50 transition-colors"
                      >
                        <div className="font-medium text-sm inline-flex items-center gap-1.5">
                          <CompanyLogo website={d.website} name={d.company_name} size={14} />
                          {d.company_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">{d.deal_name}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {d.venture_office && <Badge variant="outline" className="text-[10px]"><OfficeTag office={d.venture_office} short /></Badge>}
                          {d.status && (
                            <span className={`inline-flex items-center rounded-full border px-2 py-0 text-[10px] font-medium ${statusColor(d.status)}`}>
                              {d.status}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {col.deals.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-md">Drop deals here</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
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
    </div>
  );
}
