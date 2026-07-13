import { useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useDeal, useDealContacts, DEAL_STAGES, DEAL_STATUSES } from "@/hooks/useDeals";
import { useAuth } from "@/hooks/useAuth";
import { PREVIEW } from "@/preview/previewMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { usePageTitle } from "@/hooks/usePageTitle";
import { EnrichmentPanel } from "@/components/EnrichmentPanel";
import { DealDocuments } from "@/components/DealDocuments";
import { OfficeTag } from "@/components/OfficeTag";
import { CompanyLogo } from "@/components/CompanyLogo";
import { ArrowLeft, Globe, MapPin, Users, Building2, Mail, Phone } from "lucide-react";

function formatDate(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2 border-b last:border-b-0 grid grid-cols-[200px_1fr] gap-4 items-start">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm text-foreground">{value ?? "—"}</div>
    </div>
  );
}


// IPA Details renderer: each provision line gets a bold lead-in label
// (text before the first colon) and a half-line gap between provisions,
// so dense contract terms scan without losing density.
function IpaDetails({ text }: { text: string | null }) {
  if (!text) return null;
  const lines = text.split(/\n+/).map(s => s.trim()).filter(Boolean);
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const m = line.match(/^([^:]{2,60}?):\s*(.*)$/);
        return (
          <p key={i} className="text-sm leading-relaxed text-foreground">
            {m ? (
              <>
                <span className="font-semibold">{m[1]}:</span> {m[2]}
              </>
            ) : (
              line
            )}
          </p>
        );
      })}
    </div>
  );
}

export default function DealDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { deal, loading, updateDeal } = useDeal(id ?? null);

  useEffect(() => {
    if (!PREVIEW && !authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const contacts = useDealContacts(deal);
  usePageTitle(deal ? deal.deal_name : "Deal");

  if ((loading || authLoading) && !PREVIEW) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6"><Skeleton className="h-96" /></div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <div className="container mx-auto p-6">
          <p className="text-muted-foreground">Deal not found.</p>
          <Link to="/dealflow" className="text-primary text-sm">Back to Dealflow</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto p-6 space-y-6">
        <button
          onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/dealflow"))}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dealflow CRM
        </button>

        {/* Header card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <CompanyLogo website={deal.website} name={deal.company_name} size={36} />
                  <h1 className="text-3xl font-bold text-foreground">{deal.deal_name}</h1>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Building2 className="h-4 w-4" />{deal.company_name}</span>
                  {deal.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{deal.location}</span>}
                  {deal.website && (
                    <a href={`https://${deal.website.replace(/^https?:\/\//, "")}`} target="_blank" rel="noreferrer"
                       className="inline-flex items-center gap-1 text-primary hover:underline">
                      <Globe className="h-4 w-4" />{deal.website}
                    </a>
                  )}
                  {deal.employee_count != null && (
                    <span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />~{deal.employee_count} employees</span>
                  )}
                </div>
                {deal.description && <p className="text-sm text-foreground max-w-3xl mt-2">{deal.description}</p>}
                {(deal.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {deal.tags!.map(t => <Badge key={t} variant="secondary">{t}</Badge>)}
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-3 min-w-56">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Stage</div>
                  <Select value={deal.stage ?? ""} onValueChange={v => updateDeal(deal.id, { stage: v })}>
                    <SelectTrigger><SelectValue placeholder="No stage" /></SelectTrigger>
                    <SelectContent>
                      {DEAL_STAGES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Status</div>
                  <Select value={deal.status ?? ""} onValueChange={v => updateDeal(deal.id, { status: v })}>
                    <SelectTrigger><SelectValue placeholder="No status" /></SelectTrigger>
                    <SelectContent>
                      {DEAL_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Venture Office</div>
                  <div className="text-sm font-medium"><OfficeTag office={deal.venture_office} /></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Deal details */}
          <div className="lg:col-span-2 space-y-6">
            {deal.next_step && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Next Step</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{deal.next_step}</p>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Deal Details</CardTitle></CardHeader>
              <CardContent>
                <Field label="Assigned To" value={deal.assigned_to} />
                <Field label="IPA Structure" value={deal.ipa_structure} />
                <Field label="Clinical Status" value={deal.clinical_status} />
                <Field label="Reimbursement Status" value={deal.reimbursement_status} />
                <Field label="Technology Type" value={(deal.technology_type || []).join(", ") || null} />
                <Field label="IPA Details" value={<IpaDetails text={deal.ipa_details} />} />
                <Field label="Source" value={deal.source} />
                <Field label="Date Received" value={formatDate(deal.date_received)} />
                <Field label="Last Interaction" value={formatDate(deal.last_interaction)} />
                <Field label="System Champion" value={deal.system_champion} />
                <Field label="Department" value={(deal.department || []).join(", ") || null} />
                <Field label="Phase" value={deal.phase} />
                <Field label="Portfolio Update" value={deal.portfolio_update} />
                {deal.fourd_id && <Field label="4Degrees ID" value={String(deal.fourd_id)} />}
              </CardContent>
            </Card>
          </div>

          {/* Right rail */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Associated Contacts {contacts.length > 0 && <Badge variant="secondary" className="ml-2">{contacts.length}</Badge>}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contacts.length === 0 && <p className="text-sm text-muted-foreground">No contacts recorded.</p>}
                {contacts.map(c => (
                  <div key={c.id} className="border rounded-md p-3 space-y-1">
                    <div className="font-medium text-sm">{c.name}</div>
                    {c.company && <div className="text-xs text-muted-foreground">{c.company}</div>}
                    {c.email && (
                      <a href={`mailto:${encodeURIComponent(c.email)}`} className="text-xs text-primary inline-flex items-center gap-1 hover:underline">
                        <Mail className="h-3 w-3" />{c.email}
                      </a>
                    )}
                    {c.phone && (
                      <div className="text-xs text-muted-foreground inline-flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            <DealDocuments dealId={deal.id} officeName={deal.venture_office} />
            <EnrichmentPanel companyName={deal.company_name} />
          </div>
        </div>
      </div>
    </div>
  );
}
