import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useKanban, KanbanCard, KANBAN_COLUMNS, ColumnKey, isOverdue, formatDue, VENTURE_OFFICES, officeCode } from "@/hooks/useTaskboard";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { PREVIEW } from "@/preview/previewMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePageTitle } from "@/hooks/usePageTitle";
import { Plus, Archive, ArchiveRestore, Trash2, CalendarDays, User, ArrowLeft, ArrowDownToLine } from "lucide-react";
import { OfficeTag } from "@/components/OfficeTag";

function CardFace({ c, onOpen, onDragStart }: { c: KanbanCard; onOpen: () => void; onDragStart: () => void }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onOpen}
      className="rounded-md border bg-card p-3 shadow-sm cursor-pointer hover:border-primary/50 transition-colors space-y-1.5"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-medium leading-snug">{c.title}</div>
        {c.venture_office && <Badge variant="outline" className="text-[10px] shrink-0"><OfficeTag office={c.venture_office} short /></Badge>}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        {c.assignee && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{c.assignee}</span>}
        {c.intake_date && (
          <span className="inline-flex items-center gap-1" title="Intake date">
            <ArrowDownToLine className="h-3 w-3" />{formatDue(c.intake_date)}
          </span>
        )}
        {c.due && (
          <span className={`inline-flex items-center gap-1 ${isOverdue(c.due) ? "text-rose-600 font-medium" : ""}`} title="Due date">
            <CalendarDays className="h-3 w-3" />{formatDue(c.due)}
          </span>
        )}
      </div>
    </div>
  );
}

function CardModal({ c, api, onClose }: { c: KanbanCard; api: ReturnType<typeof useKanban>; onClose: () => void }) {
  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Edit card</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Title</div>
            <Input defaultValue={c.title} onBlur={e => e.target.value !== c.title && api.updateCard(c.id, { title: e.target.value })} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Notes</div>
            <Textarea
              defaultValue={c.notes || ""}
              rows={4}
              placeholder="Notes…"
              onBlur={e => e.target.value !== (c.notes || "") && api.updateCard(c.id, { notes: e.target.value || null })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Assignee</div>
              <Input defaultValue={c.assignee || ""} placeholder="Name"
                onBlur={e => e.target.value !== (c.assignee || "") && api.updateCard(c.id, { assignee: e.target.value || null })} />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Venture office</div>
              <Select value={c.venture_office ?? "none"}
                onValueChange={v => api.updateCard(c.id, { venture_office: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {VENTURE_OFFICES.map(o => <SelectItem key={o.code} value={o.name}><OfficeTag office={o.name} /></SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Intake date</div>
              <input type="date" defaultValue={c.intake_date || ""}
                onChange={e => api.updateCard(c.id, { intake_date: e.target.value || null })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Due date</div>
              <input type="date" defaultValue={c.due || ""}
                onChange={e => api.updateCard(c.id, { due: e.target.value || null })}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm" />
            </div>
          </div>
          <div className="flex justify-between pt-2">
            <Button variant="ghost" size="sm" className="gap-2 text-rose-600 hover:text-rose-700"
              onClick={() => { api.removeCard(c.id); onClose(); }}>
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
            {c.board_column === "done" && !c.archived && (
              <Button variant="outline" size="sm" className="gap-2"
                onClick={() => { api.archiveCard(c.id); onClose(); }}>
                <Archive className="h-4 w-4" /> Archive
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Taskboard() {
  const location = useLocation();
  const isArchive = location.pathname.endsWith("/archive");
  usePageTitle(isArchive ? "Taskboard Archive" : "Taskboard");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: authzLoading } = useUserAuth();
  const api = useKanban();
  const { cards, loading } = api;
  const [openCard, setOpenCard] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => {
    if (!PREVIEW && !authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const open = useMemo(() => cards.filter(c => !c.archived), [cards]);
  const archived = useMemo(
    () => cards.filter(c => c.archived).sort((a, b) => (b.archived_at || "").localeCompare(a.archived_at || "")),
    [cards]
  );
  const byColumn = (k: ColumnKey) => open.filter(c => c.board_column === k).sort((a, b) => a.sort_order - b.sort_order);

  const onDropColumn = (k: ColumnKey) => {
    if (!dragId) return;
    const maxSort = Math.max(0, ...byColumn(k).map(c => c.sort_order));
    api.updateCard(dragId, { board_column: k, sort_order: maxSort + 1 });
    setDragId(null);
  };

  const modalCard = cards.find(c => c.id === openCard) || null;

  if ((authLoading || authzLoading || loading) && !PREVIEW) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6"><Skeleton className="h-96" /></div>
      </div>
    );
  }

  if (!PREVIEW && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6">
          <h1 className="text-2xl font-bold mb-2">Taskboard</h1>
          <p className="text-muted-foreground">The taskboard is currently limited to administrators.</p>
        </div>
      </div>
    );
  }

  if (isArchive) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6 space-y-6">
          <Link to="/taskboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to board
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Archive</h1>
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Venture Office</TableHead>
                    <TableHead>Archived</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archived.map(c => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{c.assignee || "—"}</TableCell>
                      <TableCell><OfficeTag office={c.venture_office} short /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.archived_at ? new Date(c.archived_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" className="gap-2" onClick={() => api.restoreCard(c.id)}>
                          <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {archived.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-10">Nothing archived yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
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
            <h1 className="text-3xl font-bold text-foreground">Taskboard</h1>
            <p className="text-sm text-muted-foreground mt-1">{open.length} open card{open.length === 1 ? "" : "s"}</p>
          </div>
          <Link to="/taskboard/archive">
            <Button variant="outline" size="sm" className="gap-2">
              <Archive className="h-4 w-4" /> Archive {archived.length > 0 && <Badge variant="secondary">{archived.length}</Badge>}
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 items-start">
          {KANBAN_COLUMNS.map(col => {
            const colCards = byColumn(col.key);
            return (
              <div key={col.key} onDragOver={e => e.preventDefault()} onDrop={() => onDropColumn(col.key)}>
                <Card className="bg-muted/40">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">{col.label}</CardTitle>
                      <div className="flex items-center gap-1">
                        <Badge variant="secondary">{colCards.length}</Badge>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground"
                          title="Add card"
                          onClick={() => {
                            const id = api.addCard(col.key, Math.max(0, ...colCards.map(c => c.sort_order)) + 1);
                            setOpenCard(id);
                          }}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-3 pb-3 space-y-2 min-h-24">
                    {colCards.map(c => (
                      <CardFace key={c.id} c={c} onOpen={() => setOpenCard(c.id)} onDragStart={() => setDragId(c.id)} />
                    ))}
                    {colCards.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-md">Drop cards here</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
      {modalCard && <CardModal c={modalCard} api={api} onClose={() => setOpenCard(null)} />}
    </div>
  );
}
