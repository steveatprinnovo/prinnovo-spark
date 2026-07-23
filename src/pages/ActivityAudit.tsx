import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageContainer } from "@/components/layout/PageHeader";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAllVentureOffices } from "@/hooks/useAllVentureOffices";
import { OfficeTag } from "@/components/OfficeTag";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Eye } from "lucide-react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** Technical Services · Activity Audit (2026-07-21).
 *  High-level log of technical-team work per office / portfolio company so
 *  VO leaders can show their health system the value delivered — distinct
 *  from the day-to-day kanban board. Access (enforced by RLS): admin +
 *  technical full read/write across offices; VO leaders read-only for
 *  their office; base users none (route-gated too). */

interface AuditRow {
  id: string;
  week_of: string;
  venture_office: string;
  portfolio_company: string | null;
  item: string;
  description: string | null;
  internal_notes: string | null;
}

interface Draft {
  id?: string;
  week_of: string;
  venture_office: string;
  portfolio_company: string;
  item: string;
  description: string;
  internal_notes: string;
}

const emptyDraft = (office: string): Draft => ({
  week_of: new Date().toISOString().slice(0, 10),
  venture_office: office,
  portfolio_company: "",
  item: "",
  description: "",
  internal_notes: "",
});

function fmtWeek(d: string): string {
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ActivityAudit() {
  const { role } = useUserAuth();
  const { ventureOffices } = useAllVentureOffices();
  const canEdit = role === "admin" || role === "technical";
  const canFilterOffices = role === "admin" || role === "technical";

  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [officeFilter, setOfficeFilter] = useState("all");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("technical_activity_audit")
      .select("*")
      .order("week_of", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Activity audit load failed:", error);
      toast.error("Could not load activity audit");
    } else {
      setRows((data ?? []) as AuditRow[]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => (officeFilter === "all" ? rows : rows.filter(r => r.venture_office === officeFilter)),
    [rows, officeFilter],
  );

  const save = async () => {
    if (!draft) return;
    if (!draft.item.trim() || !draft.venture_office || !draft.week_of) {
      toast.error("Week, venture office, and item are required.");
      return;
    }
    setSaving(true);
    const payload = {
      week_of: draft.week_of,
      venture_office: draft.venture_office,
      portfolio_company: draft.portfolio_company.trim() || null,
      item: draft.item.trim(),
      description: draft.description.trim() || null,
      internal_notes: draft.internal_notes.trim() || null,
    };
    const q = draft.id
      ? supabase.from("technical_activity_audit").update(payload).eq("id", draft.id)
      : supabase.from("technical_activity_audit").insert(payload);
    const { error } = await q;
    setSaving(false);
    if (error) {
      console.error("Activity audit save failed:", error);
      toast.error("Save failed — check your access.");
      return;
    }
    setDraft(null);
    toast.success(draft.id ? "Activity updated" : "Activity added");
    load();
  };

  const remove = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("technical_activity_audit").delete().eq("id", deleteId);
    setDeleteId(null);
    if (error) {
      console.error("Activity audit delete failed:", error);
      toast.error("Delete failed — check your access.");
      return;
    }
    toast.success("Activity deleted");
    load();
  };

  return (
    <PageContainer>
      <PageHeader
        title="Activity Audit"
        subtitle="What the technical team delivered for each health system, week by week — the value story behind the board."
        office={{ show: canFilterOffices, value: officeFilter, onChange: setOfficeFilter }}
        actions={
          canEdit ? (
            <Button
              size="sm"
              className="gap-1.5 rounded bg-[#171d70] text-white hover:bg-[#10154f]"
              onClick={() => setDraft(emptyDraft(officeFilter !== "all" ? officeFilter : ventureOffices[0] ?? ""))}
            >
              <Plus className="h-4 w-4" /> Add Activity
            </Button>
          ) : (
            <Badge variant="secondary" className="gap-1"><Eye className="h-3 w-3" /> View only</Badge>
          )
        }
      />

      <div className="overflow-hidden rounded-lg border border-[#e2e3ec] shadow-card">
        {loading ? (
          <div className="space-y-2 p-6">
            <Skeleton className="h-8" /><Skeleton className="h-8" /><Skeleton className="h-8" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-[#8b8fa3]">
            No activity recorded{officeFilter !== "all" ? " for this office" : ""} yet.
          </div>
        ) : (
          <table className="w-full table-fixed border-collapse">
            <thead>
              <tr className="bg-[#f7f8fb]">
                <th className="table-header-label w-[9%] border-b border-[#e2e3ec] px-3 py-3 text-left">Week of</th>
                <th className="table-header-label w-[13%] border-b border-[#e2e3ec] px-3 py-3 text-left">Venture office</th>
                <th className="table-header-label w-[12%] border-b border-[#e2e3ec] px-3 py-3 text-left">Company</th>
                <th className="table-header-label w-[18%] border-b border-[#e2e3ec] px-3 py-3 text-left">Item</th>
                <th className="table-header-label border-b border-[#e2e3ec] px-3 py-3 text-left">Description</th>
                <th className="table-header-label w-[18%] border-b border-[#e2e3ec] px-3 py-3 text-left">Internal notes</th>
                {canEdit && <th className="w-[76px] border-b border-[#e2e3ec]" />}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-[#f0f1f6] align-top transition-colors hover:bg-[#f7f8fb]">
                  <td className="px-3 py-3 text-[12.5px] font-semibold text-[#171d70]">{fmtWeek(r.week_of)}</td>
                  <td className="px-3 py-3 text-[12.5px]"><OfficeTag office={r.venture_office} short /></td>
                  <td className="px-3 py-3 text-[12.5px] text-[#232842]">
                    {r.portfolio_company
                      ? <span className="rounded-full bg-[#e8e9f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#5a5f9c]">{r.portfolio_company}</span>
                      : <span className="text-[#b9bbd4]">—</span>}
                  </td>
                  <td className="px-3 py-3 text-[12.5px] font-semibold text-[#171d70]">{r.item}</td>
                  <td className="px-3 py-3 text-[12.5px] leading-[1.5] text-[#232842]">{r.description ?? ""}</td>
                  <td className="px-3 py-3 text-[12px] italic leading-[1.5] text-[#5c6178]">{r.internal_notes ?? ""}</td>
                  {canEdit && (
                    <td className="px-2 py-3">
                      <div className="flex gap-1">
                        <button
                          type="button" title="Edit" aria-label="Edit activity"
                          className="flex h-7 w-7 items-center justify-center rounded text-[#8b8fa3] hover:bg-[#eceef5] hover:text-[#171d70]"
                          onClick={() => setDraft({
                            id: r.id, week_of: r.week_of, venture_office: r.venture_office,
                            portfolio_company: r.portfolio_company ?? "", item: r.item,
                            description: r.description ?? "", internal_notes: r.internal_notes ?? "",
                          })}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button" title="Delete" aria-label="Delete activity"
                          className="flex h-7 w-7 items-center justify-center rounded text-[#8b8fa3] hover:bg-[#fbf0ef] hover:text-[#b3413f]"
                          onClick={() => setDeleteId(r.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / edit dialog */}
      <Dialog open={draft !== null} onOpenChange={open => !open && setDraft(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit Activity" : "Add Activity"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="field-label mb-1.5">Week of</div>
                  <Input type="date" value={draft.week_of} onChange={e => setDraft({ ...draft, week_of: e.target.value })} />
                </div>
                <div>
                  <div className="field-label mb-1.5">Venture office</div>
                  <Select value={draft.venture_office} onValueChange={v => setDraft({ ...draft, venture_office: v })}>
                    <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
                    <SelectContent>
                      {ventureOffices.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <div className="field-label mb-1.5">Portfolio company (optional)</div>
                <Input value={draft.portfolio_company} onChange={e => setDraft({ ...draft, portfolio_company: e.target.value })} placeholder="e.g. Gradient Health" />
              </div>
              <div>
                <div className="field-label mb-1.5">Item</div>
                <Input value={draft.item} onChange={e => setDraft({ ...draft, item: e.target.value })} placeholder="Short title of the work delivered" />
              </div>
              <div>
                <div className="field-label mb-1.5">Description</div>
                <Textarea rows={3} value={draft.description} onChange={e => setDraft({ ...draft, description: e.target.value })} placeholder="What was delivered, for whom" />
              </div>
              <div>
                <div className="field-label mb-1.5">Internal notes</div>
                <Textarea rows={2} value={draft.internal_notes} onChange={e => setDraft({ ...draft, internal_notes: e.target.value })} placeholder="Context for the team (visible to VO leaders too)" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" className="rounded border-[1.5px] border-[#171d70] text-[#171d70]" onClick={() => setDraft(null)}>Cancel</Button>
            <Button className="rounded bg-[#171d70] text-white hover:bg-[#10154f]" onClick={save} disabled={saving}>
              {saving ? "Saving…" : draft?.id ? "Save changes" : "Add activity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this activity?</AlertDialogTitle>
            <AlertDialogDescription>This removes the entry from the audit for all roles. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[#b3413f] hover:bg-[#9a3735]" onClick={remove}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageContainer>
  );
}
