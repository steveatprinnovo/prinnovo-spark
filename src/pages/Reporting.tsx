import { useMemo, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { useUserAuth, AppRole } from "@/hooks/useUserAuth";
import { usePageTitle } from "@/hooks/usePageTitle";
import { supabase } from "@/integrations/supabase/client";
import { FIELDS, METRICS, fieldById, type Agg, type CatalogField } from "@/reporting/catalog";
import type { ReportRequest, ReportFilter, AggregateRequest, MetricRequest } from "@/reporting/compiler";
import { isMetricRequest } from "@/reporting/compiler";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, Play, Plus, X, BarChart3, LineChart as LineIcon, Table as TableIcon, Loader2 } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip as ChartTooltip, CartesianGrid, Legend,
} from "recharts";

const SERIES_COLORS = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];
const AGG_LABELS: Record<Agg, string> = { count: "Count", sum: "Sum", avg: "Average", min: "Min", max: "Max" };

interface Footer { definition: string; exclusions: string; roleNotes: string[] }
type Row = Record<string, string | number | null>;

function visibleFields(role: AppRole | null): CatalogField[] {
  if (!role) return [];
  return FIELDS.filter(f => f.roles.includes(role));
}

/** Column key the server returns for a dimension (unquoted identifier). */
function dimKey(fieldId: string): string {
  const col = fieldById.get(fieldId)?.column ?? fieldId;
  return col.replace(/"/g, "");
}

export default function Reporting() {
  usePageTitle("Reporting");
  const { role, loading: authzLoading } = useUserAuth();

  // ── NL bar ──
  const [question, setQuestion] = useState("");

  // ── Builder state ──
  const [mode, setMode] = useState<"metric" | "custom">("metric");
  const [metricId, setMetricId] = useState<string>("");
  const [table, setTable] = useState<string>("");
  const [measures, setMeasures] = useState<{ field: string; agg: Agg }[]>([]);
  const [dimensions, setDimensions] = useState<string[]>([]);
  const [filters, setFilters] = useState<ReportFilter[]>([]);

  // ── Results ──
  const [rows, setRows] = useState<Row[] | null>(null);
  const [footer, setFooter] = useState<Footer | null>(null);
  const [lastRequest, setLastRequest] = useState<ReportRequest | null>(null);
  const [view, setView] = useState<"bar" | "line" | "table">("bar");
  const [loading, setLoading] = useState(false);

  const fields = useMemo(() => visibleFields(role), [role]);
  const metrics = useMemo(() => METRICS.filter(m => role && m.roles.includes(role)), [role]);
  const tables = useMemo(() => [...new Set(fields.map(f => f.table))], [fields]);
  const tableFields = useMemo(() => fields.filter(f => f.table === table), [fields, table]);
  const selectedMetric = metrics.find(m => m.id === metricId);
  const dimOptions: CatalogField[] = mode === "metric"
    ? (selectedMetric?.allowedDims ?? []).map(d => fieldById.get(d)!).filter(f => f && role && f.roles.includes(role))
    : tableFields;
  const filterFieldOptions = mode === "metric"
    ? fields.filter(f => (selectedMetric?.allowedDims ?? []).some(d => fieldById.get(d)?.table === f.table))
    : tableFields;

  const buildRequest = (): ReportRequest | null => {
    if (mode === "metric") {
      if (!metricId) { toast.error("Pick a metric"); return null; }
      return { metric: metricId, dimensions, filters } as MetricRequest;
    }
    if (measures.length === 0) { toast.error("Add at least one measure"); return null; }
    return { measures, dimensions, filters } as AggregateRequest;
  };

  /** Populate builder controls from a request (NL results land here too). */
  const loadRequestIntoBuilder = (req: ReportRequest) => {
    if (isMetricRequest(req)) {
      setMode("metric");
      setMetricId(req.metric);
    } else {
      setMode("custom");
      setMeasures(req.measures);
      const t = fieldById.get(req.measures[0]?.field)?.table;
      if (t) setTable(t);
    }
    setDimensions(req.dimensions ?? []);
    setFilters(req.filters ?? []);
  };

  const invoke = async (body: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("run-report", { body });
      if (error) {
        // supabase-js wraps non-2xx; try to surface the function's message
        let msg = error.message;
        try {
          const ctx = await (error as any).context?.json?.();
          if (ctx?.error) msg = ctx.error;
        } catch { /* keep default */ }
        toast.error(msg);
        return;
      }
      setRows(data.rows as Row[]);
      setFooter(data.footer as Footer);
      setLastRequest(data.request as ReportRequest);
      loadRequestIntoBuilder(data.request as ReportRequest);
      const dims = (data.request.dimensions ?? []) as string[];
      const firstDimType = dims[0] ? fieldById.get(dims[0])?.type : undefined;
      setView(firstDimType === "date" ? "line" : "bar");
    } finally {
      setLoading(false);
    }
  };

  const runBuilder = () => {
    const req = buildRequest();
    if (req) invoke({ mode: "run", request: req });
  };
  const runNL = () => {
    if (!question.trim()) return;
    invoke({ mode: "nl", text: question.trim() });
  };

  // ── Chart shaping: dim1 = x axis; numeric columns = series ──
  const chart = useMemo(() => {
    if (!rows || rows.length === 0 || !lastRequest) return null;
    const dims = (lastRequest.dimensions ?? []).map(dimKey);
    const numericKeys = Object.keys(rows[0]).filter(k => !dims.includes(k) && rows.some(r => typeof r[k] === "number" || (typeof r[k] === "string" && r[k] !== null && !isNaN(Number(r[k])))));
    if (dims.length === 0) return null; // single-row summary → metric cards
    const xKey = dims[0];
    if (dims.length === 2 && numericKeys.length >= 1) {
      // pivot second dimension into series on the first numeric measure
      const seriesKey = dims[1];
      const measure = numericKeys[0];
      const seriesValues = [...new Set(rows.map(r => String(r[seriesKey] ?? "—")))];
      const byX = new Map<string, Row>();
      for (const r of rows) {
        const x = String(r[xKey] ?? "—");
        const acc = byX.get(x) ?? { [xKey]: x };
        acc[String(r[seriesKey] ?? "—")] = Number(r[measure] ?? 0);
        byX.set(x, acc);
      }
      return { data: [...byX.values()], xKey, seriesKeys: seriesValues };
    }
    const data = rows.map(r => {
      const out: Row = { [xKey]: r[xKey] ?? "—" };
      for (const k of numericKeys) out[k] = Number(r[k] ?? 0);
      return out;
    });
    return { data, xKey, seriesKeys: numericKeys };
  }, [rows, lastRequest]);

  const summaryCards = useMemo(() => {
    if (!rows || rows.length !== 1 || !lastRequest || (lastRequest.dimensions ?? []).length > 0) return null;
    return Object.entries(rows[0]).map(([k, v]) => ({ label: k.replace(/_/g, " "), value: v === null ? "—" : typeof v === "number" ? v.toLocaleString() : String(v) }));
  }, [rows, lastRequest]);

  if (authzLoading) {
    return <div className="min-h-screen bg-background"><DashboardHeader /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <div className="container mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reporting</h1>
          <p className="text-sm text-muted-foreground mt-1">Ask a question, or build a chart from groupings, filters, and aggregations. Every answer includes its definition and exclusions.</p>
        </div>

        {/* Natural-language bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              <Input
                placeholder='e.g. "Average days from term sheet to IPA by office" or "Sum of legal costs by office for 2024"'
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runNL()}
              />
              <Button onClick={runNL} disabled={loading} className="gap-2 shrink-0">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Ask
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Builder */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Report builder</CardTitle>
              <Tabs value={mode} onValueChange={v => { setMode(v as "metric" | "custom"); setDimensions([]); setFilters([]); }}>
                <TabsList>
                  <TabsTrigger value="metric">Curated metrics</TabsTrigger>
                  <TabsTrigger value="custom">Custom pivot</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {mode === "metric" ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-96">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Metric</div>
                  <Select value={metricId} onValueChange={v => { setMetricId(v); setDimensions([]); setFilters([]); }}>
                    <SelectTrigger><SelectValue placeholder="Choose a metric" /></SelectTrigger>
                    <SelectContent>
                      {metrics.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="w-64">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">Data</div>
                    <Select value={table} onValueChange={v => { setTable(v); setMeasures([]); setDimensions([]); setFilters([]); }}>
                      <SelectTrigger><SelectValue placeholder="Choose data" /></SelectTrigger>
                      <SelectContent>
                        {tables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {table && (
                  <div className="space-y-2">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Measures</div>
                    {measures.map((m, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Select value={m.agg} onValueChange={v => setMeasures(prev => prev.map((x, j) => j === i ? { ...x, agg: v as Agg } : x))}>
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(fieldById.get(m.field)?.aggs ?? ["count"]).map(a => <SelectItem key={a} value={a}>{AGG_LABELS[a as Agg]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <span className="text-sm text-muted-foreground">of</span>
                        <Select value={m.field} onValueChange={v => setMeasures(prev => prev.map((x, j) => j === i ? { field: v, agg: (fieldById.get(v)?.aggs ?? ["count"])[0] as Agg } : x))}>
                          <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {tableFields.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setMeasures(prev => prev.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="gap-1"
                      onClick={() => tableFields[0] && setMeasures(prev => [...prev, { field: tableFields[0].id, agg: (tableFields[0].aggs[0] ?? "count") as Agg }])}>
                      <Plus className="h-4 w-4" /> Add measure
                    </Button>
                  </div>
                )}
              </div>
            )}

            {(mode === "custom" ? !!table : !!metricId) && (
              <>
                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Group by (up to 2)</div>
                  <div className="flex flex-wrap gap-2">
                    {dimOptions.map(f => {
                      const active = dimensions.includes(f.id);
                      return (
                        <Badge key={f.id} variant={active ? "default" : "outline"} className="cursor-pointer select-none"
                          onClick={() => setDimensions(prev => active ? prev.filter(d => d !== f.id) : prev.length < 2 ? [...prev, f.id] : prev)}>
                          {f.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Filters</div>
                  {filters.map((flt, i) => {
                    const f = fieldById.get(flt.field);
                    const needsValue = flt.op !== "is_null" && flt.op !== "not_null";
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <Select value={flt.field} onValueChange={v => setFilters(prev => prev.map((x, j) => j === i ? { ...x, field: v } : x))}>
                          <SelectTrigger className="w-64"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {filterFieldOptions.map(ff => <SelectItem key={ff.id} value={ff.id}>{ff.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Select value={flt.op} onValueChange={v => setFilters(prev => prev.map((x, j) => j === i ? { ...x, op: v as ReportFilter["op"] } : x))}>
                          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="eq">equals</SelectItem>
                            <SelectItem value="neq">not equals</SelectItem>
                            <SelectItem value="gte">≥</SelectItem>
                            <SelectItem value="lte">≤</SelectItem>
                            <SelectItem value="is_null">is empty</SelectItem>
                            <SelectItem value="not_null">is not empty</SelectItem>
                          </SelectContent>
                        </Select>
                        {needsValue && (
                          <Input
                            className="w-64"
                            type={f?.type === "date" ? "date" : f?.type === "numeric" ? "number" : "text"}
                            value={String(flt.value ?? "")}
                            onChange={e => {
                              const raw = e.target.value;
                              const value = f?.type === "numeric" && raw !== "" ? Number(raw) : raw;
                              setFilters(prev => prev.map((x, j) => j === i ? { ...x, value } : x));
                            }}
                          />
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setFilters(prev => prev.filter((_, j) => j !== i))}><X className="h-4 w-4" /></Button>
                      </div>
                    );
                  })}
                  <Button variant="outline" size="sm" className="gap-1"
                    onClick={() => filterFieldOptions[0] && setFilters(prev => [...prev, { field: filterFieldOptions[0].id, op: "eq", value: "" }])}>
                    <Plus className="h-4 w-4" /> Add filter
                  </Button>
                </div>

                <div className="pt-1">
                  <Button onClick={runBuilder} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run report
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {rows && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Results</CardTitle>
                <div className="flex items-center gap-1">
                  <Button variant={view === "bar" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setView("bar")}><BarChart3 className="h-4 w-4" /> Bar</Button>
                  <Button variant={view === "line" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setView("line")}><LineIcon className="h-4 w-4" /> Line</Button>
                  <Button variant={view === "table" ? "default" : "outline"} size="sm" className="gap-1" onClick={() => setView("table")}><TableIcon className="h-4 w-4" /> Table</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {summaryCards && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {summaryCards.map(c => (
                    <div key={c.label} className="rounded-lg bg-muted/40 p-4">
                      <div className="text-xs text-muted-foreground capitalize">{c.label}</div>
                      <div className="text-2xl font-semibold">{c.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {view !== "table" && chart && (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {view === "bar" ? (
                      <BarChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={chart.xKey} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip />
                        {chart.seriesKeys.length > 1 && <Legend />}
                        {chart.seriesKeys.map((k, i) => (
                          <Bar key={k} dataKey={k} fill={SERIES_COLORS[i % SERIES_COLORS.length]} radius={[4, 4, 0, 0]} maxBarSize={48} />
                        ))}
                      </BarChart>
                    ) : (
                      <LineChart data={chart.data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey={chart.xKey} tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <ChartTooltip />
                        {chart.seriesKeys.length > 1 && <Legend />}
                        {chart.seriesKeys.map((k, i) => (
                          <Line key={k} type="monotone" dataKey={k} stroke={SERIES_COLORS[i % SERIES_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                        ))}
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
              {view !== "table" && !chart && !summaryCards && (
                <p className="text-sm text-muted-foreground">This result has no grouping to chart — see the table view.</p>
              )}

              {(view === "table" || !chart) && rows.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {Object.keys(rows[0]).map(k => <TableHead key={k} className="capitalize">{k.replace(/_/g, " ")}</TableHead>)}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r, i) => (
                        <TableRow key={i}>
                          {Object.values(r).map((v, j) => <TableCell key={j}>{v === null ? "—" : typeof v === "number" ? v.toLocaleString() : String(v)}</TableCell>)}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {rows.length === 0 && <p className="text-sm text-muted-foreground">No rows matched.</p>}

              {footer && (
                <div className="border-t pt-3 text-xs text-muted-foreground space-y-1">
                  <p><span className="font-medium text-foreground">Definition:</span> {footer.definition}</p>
                  <p><span className="font-medium text-foreground">Excluded:</span> {footer.exclusions}</p>
                  {footer.roleNotes.map((n, i) => <p key={i} className="text-amber-700 dark:text-amber-500">{n}</p>)}
                  <p>{rows.length.toLocaleString()} row{rows.length === 1 ? "" : "s"} returned.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
