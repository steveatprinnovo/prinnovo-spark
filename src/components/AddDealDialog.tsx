import { useState } from "react";
import { Deal, DEAL_STAGES, DEAL_STATUSES, OFFICE_NAMES } from "@/hooks/useDeals";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OfficeTag } from "@/components/OfficeTag";

const CLINICAL = ["Clinical use", "Pre-clinical", "N/A"];
const REIMB = ["Yes - Current", "Yes - Future", "No"];
const TECH = ["Software", "Software - AI", "Hardware", "Service", "Short-term revenue"];

function L({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{children}</div>;
}

export function AddDealDialog({ open, onClose, onCreate, defaultOffice, isAdmin }: {
  open: boolean;
  onClose: () => void;
  onCreate: (fields: Partial<Deal>) => Promise<void>;
  defaultOffice: string | null;
  isAdmin: boolean;
}) {
  const empty = {
    company_name: "", deal_name: "", website: "", description: "", venture_office: defaultOffice || "",
    stage: "0 - Prospect", status: "Active", assigned_to: "", location: "", employee_count: "",
    source: "", tags: "", department: "", technology_type: [] as string[], clinical_status: "",
    reimbursement_status: "", ipa_structure: "", ipa_details: "", next_step: "", system_champion: "", phase: "",
  };
  const [f, setF] = useState(empty);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => setF(prev => ({ ...prev, [k]: v }));
  const canSave = f.company_name.trim() && f.deal_name.trim() && f.venture_office;

  const submit = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    const codeOf = (name: string) => Object.entries(OFFICE_NAMES).find(([, n]) => n === name)?.[0] || null;
    await onCreate({
      company_name: f.company_name.trim(),
      deal_name: f.deal_name.trim(),
      website: f.website.trim() || null,
      description: f.description.trim() || null,
      venture_office: f.venture_office || null,
      office_code: codeOf(f.venture_office),
      stage: f.stage || null,
      status: f.status || null,
      assigned_to: f.assigned_to.trim() || null,
      location: f.location.trim() || null,
      employee_count: f.employee_count.trim() ? Number(f.employee_count) : null,
      source: f.source.trim() || null,
      tags: f.tags.trim() ? f.tags.split(",").map(s => s.trim()).filter(Boolean) : null,
      department: f.department.trim() ? f.department.split(";").map(s => s.trim()).filter(Boolean) : null,
      technology_type: f.technology_type.length ? f.technology_type : null,
      clinical_status: f.clinical_status || null,
      reimbursement_status: f.reimbursement_status || null,
      ipa_structure: f.ipa_structure.trim() || null,
      ipa_details: f.ipa_details.trim() || null,
      next_step: f.next_step.trim() || null,
      system_champion: f.system_champion.trim() || null,
      phase: f.phase.trim() || null,
      date_received: new Date().toISOString().slice(0, 10),
    });
    setSaving(false);
    setF(empty);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Add Deal</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><L>Company *</L><Input value={f.company_name} onChange={e => set("company_name", e.target.value)} placeholder="Company name" /></div>
          <div><L>Deal name *</L><Input value={f.deal_name} onChange={e => set("deal_name", e.target.value)} placeholder="e.g. Acme Health - SVHV" /></div>
          <div><L>Website</L><Input value={f.website} onChange={e => set("website", e.target.value)} placeholder="acmehealth.com — drives logo + enrichment" /></div>
          <div>
            <L>Venture office *</L>
            <Select value={f.venture_office} onValueChange={v => set("venture_office", v)} disabled={!isAdmin && !!defaultOffice}>
              <SelectTrigger><SelectValue placeholder="Select office" /></SelectTrigger>
              <SelectContent>
                {Object.values(OFFICE_NAMES).map(n => <SelectItem key={n} value={n}><OfficeTag office={n} /></SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><L>Description</L>
            <Textarea rows={2} value={f.description} onChange={e => set("description", e.target.value)} placeholder="What the company does" /></div>
          <div>
            <L>Stage</L>
            <Select value={f.stage} onValueChange={v => set("stage", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <L>Status</L>
            <Select value={f.status} onValueChange={v => set("status", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DEAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><L>Assigned to</L><Input value={f.assigned_to} onChange={e => set("assigned_to", e.target.value)} /></div>
          <div><L>Location</L><Input value={f.location} onChange={e => set("location", e.target.value)} placeholder="City, State" /></div>
          <div><L>Employee count</L><Input type="number" value={f.employee_count} onChange={e => set("employee_count", e.target.value)} /></div>
          <div><L>Source</L><Input value={f.source} onChange={e => set("source", e.target.value)} placeholder="Referral / event / person" /></div>
          <div>
            <L>Clinical status</L>
            <Select value={f.clinical_status || "none"} onValueChange={v => set("clinical_status", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent><SelectItem value="none">—</SelectItem>{CLINICAL.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <L>Reimbursement status</L>
            <Select value={f.reimbursement_status || "none"} onValueChange={v => set("reimbursement_status", v === "none" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent><SelectItem value="none">—</SelectItem>{REIMB.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <L>Technology type</L>
            <div className="flex flex-wrap gap-2">
              {TECH.map(t => (
                <Button key={t} type="button" size="sm"
                  variant={f.technology_type.includes(t) ? "default" : "outline"}
                  onClick={() => set("technology_type", f.technology_type.includes(t)
                    ? f.technology_type.filter(x => x !== t) : [...f.technology_type, t])}>
                  {t}
                </Button>
              ))}
            </div>
          </div>
          <div><L>Tags (comma-separated)</L><Input value={f.tags} onChange={e => set("tags", e.target.value)} placeholder="AI, Prior Auth" /></div>
          <div><L>Department (semicolon-separated)</L><Input value={f.department} onChange={e => set("department", e.target.value)} placeholder="Radiology;Revenue-Cycle" /></div>
          <div><L>IPA structure</L><Input value={f.ipa_structure} onChange={e => set("ipa_structure", e.target.value)} /></div>
          <div><L>System champion</L><Input value={f.system_champion} onChange={e => set("system_champion", e.target.value)} /></div>
          <div className="md:col-span-2"><L>IPA details</L><Input value={f.ipa_details} onChange={e => set("ipa_details", e.target.value)} /></div>
          <div className="md:col-span-2"><L>Next step</L>
            <Textarea rows={2} value={f.next_step} onChange={e => set("next_step", e.target.value)} /></div>
        </div>
        <div className="flex justify-between items-center pt-2">
          <p className="text-xs text-muted-foreground max-w-sm">
            On save this company jumps the nightly PitchBook enrichment queue; its logo resolves immediately from the website domain.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={submit} disabled={!canSave || saving}>{saving ? "Saving…" : "Create Deal"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
