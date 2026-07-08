import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEnrichment, fmtUsd, PbCandidate } from "@/hooks/useEnrichment";
import { useUserAuth } from "@/hooks/useUserAuth";
import { PREVIEW } from "@/preview/previewMode";
import { Database, Users, CalendarDays, Building2 } from "lucide-react";

function fmtDate(d: string | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-").map(Number);
  if (!y) return d;
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

export function EnrichmentPanel({ companyName }: { companyName: string }) {
  const { enrichment: e, loading, confirmCandidate } = useEnrichment(companyName);
  const { isAdmin } = useUserAuth();

  const header = (
    <CardHeader className="pb-2">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Database className="h-4 w-4 text-muted-foreground" /> PitchBook
        </CardTitle>
        {e?.fetched_at && (
          <span className="text-xs text-muted-foreground">
            Updated {fmtDate(e.fetched_at.slice(0, 10))}
          </span>
        )}
      </div>
    </CardHeader>
  );

  if (loading) {
    return <Card>{header}<CardContent><Skeleton className="h-32" /></CardContent></Card>;
  }

  if (!e || e.status === "pending") {
    return (
      <Card>{header}
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Enrichment queued. The nightly worker resolves this company against PitchBook
            and fills funding history, investors, and team data here.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (e.status === "not_found") {
    return (
      <Card>{header}
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No PitchBook profile found for “{companyName}”. Common for very early or
            renamed companies; the worker retries monthly.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (e.status === "ambiguous") {
    return (
      <Card>{header}
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            PitchBook returned multiple name matches. {isAdmin || PREVIEW ? "Confirm the right one:" : "An administrator needs to confirm the match."}
          </p>
          {(e.candidates || []).map((c: PbCandidate) => (
            <div key={c.pbid} className="border rounded-md p-3 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{c.name}</span>
                {(isAdmin || PREVIEW) && (
                  <Button size="sm" variant="outline" onClick={() => confirmCandidate(c)}>This one</Button>
                )}
              </div>
              {c.location && <div className="text-xs text-muted-foreground">{c.location}</div>}
              {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>{header}
      <CardContent className="space-y-4">
        {e.description && <p className="text-sm">{e.description}</p>}

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Total raised" value={fmtUsd(e.total_raised_usd)} />
          <Stat label="Last round" value={e.last_round_type ? `${e.last_round_type} · ${fmtUsd(e.last_round_amount_usd)}` : "—"} />
          <Stat label="Post-money" value={fmtUsd(e.post_valuation_usd)} />
          <Stat label="Founded" value={e.year_founded ? String(e.year_founded) : "—"} />
        </div>

        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {e.employees != null && (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />{e.employees} employees{e.employees_as_of ? ` (as of ${fmtDate(e.employees_as_of)})` : ""}
            </span>
          )}
          {e.hq_location && <span className="inline-flex items-center gap-1"><Building2 className="h-3 w-3" />{e.hq_location}</span>}
          {e.business_status && <Badge variant="outline" className="text-[10px]">{e.business_status}</Badge>}
        </div>

        {(e.funding_rounds || []).length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Funding history</div>
            <div className="space-y-3">
              {e.funding_rounds!.map((r, i) => (
                <div key={i} className="border-l-2 border-primary/30 pl-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium">{r.type || "Round"}</span>
                    <span className="font-semibold">{fmtUsd(r.amount_usd)}</span>
                    <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />{fmtDate(r.date)}
                    </span>
                  </div>
                  {r.investors?.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">{r.investors.join(", ")}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {(e.investors || []).length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Investors</div>
            <div className="flex flex-wrap gap-1.5">
              {e.investors!.map(inv => <Badge key={inv} variant="secondary" className="text-[11px]">{inv}</Badge>)}
            </div>
          </div>
        )}

        {(e.team || []).length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1.5">Team</div>
            {e.team!.map((t, i) => (
              <div key={i} className="text-sm">{t.name} <span className="text-xs text-muted-foreground">— {t.title}</span></div>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground border-t pt-2">
          Source: PitchBook via nightly enrichment worker. Licensed data — excluded from exports.
        </p>
      </CardContent>
    </Card>
  );
}
