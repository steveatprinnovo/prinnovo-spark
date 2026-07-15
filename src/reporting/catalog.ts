/**
 * Reporting semantic catalog — the single source of truth for the ad-hoc
 * reporting platform (design: Reporting_Semantic_Layer_Design.md, 2026-07-15).
 *
 * The NL model may ONLY reference ids defined here. The compiler builds SQL
 * exclusively from these definitions; no model-authored SQL ever executes.
 * Queries run as the asking user (RLS applies), so role tags here are a UX
 * pre-filter — the database remains the enforcement layer.
 */

export type Role = "admin" | "user" | "vo_leader" | "technical";
export type Agg = "count" | "sum" | "avg" | "min" | "max";
export type FieldType = "text" | "numeric" | "date" | "boolean" | "text[]";

export type MetricCategory =
  | "Milestone intervals"
  | "Pipeline & funnel"
  | "Dealflow timing"
  | "IPA terms"
  | "Investment economics"
  | "Office costs"
  | "IT taskboard";

export const METRIC_CATEGORIES: MetricCategory[] = [
  "Milestone intervals",
  "Pipeline & funnel",
  "Dealflow timing",
  "IPA terms",
  "Investment economics",
  "Office costs",
  "IT taskboard",
];

export interface CatalogField {
  id: string;
  table: string;
  /** Quoted SQL identifier, exactly as the column exists. */
  column: string;
  label: string;
  type: FieldType;
  tab: string;
  roles: Role[];
  /** True when RLS limits non-admins to their own office's rows. */
  officeScoped: boolean;
  aggs: Agg[];
}

export interface DerivedMetric {
  id: string;
  label: string;
  category: MetricCategory;
  /** Human-readable definition — echoed verbatim in every validation footer. */
  definition: string;
  /** Fields permitted as GROUP BY dimensions for this metric. */
  allowedDims: string[];
  roles: Role[];
  officeScoped: boolean;
  /**
   * Summary-statistic choice. When present, the SQL template contains an
   * {agg} placeholder and the request may carry `agg` (validated against
   * this list); absent means the metric's statistics are fixed.
   */
  aggChoices?: Agg[];
  defaultAgg?: Agg;
  /**
   * Column aliases (post-{agg} substitution) the chart should plot. All other
   * returned columns are context/validation and appear only in the table.
   */
  chartColumns: string[];
  /**
   * SQL template. Placeholders: {dims} (select-list dimension columns,
   * comma-suffixed), {dimGroup} (GROUP BY clause or empty), {where}
   * (compiled filters AND-ed into the base predicate, or 'true'),
   * {agg} (chosen summary statistic, metrics with aggChoices only).
   */
  sql: string;
  /** What the validation footer must report was excluded, and why. */
  exclusions: string;
}

const DEALFLOW_ROLES: Role[] = ["admin", "user", "vo_leader"];

export const FIELDS: CatalogField[] = [
  // ── Dealflow CRM (deals) — office-scoped for user/vo_leader ──
  { id: "deals.company_name", table: "deals", column: "company_name", label: "Company", type: "text", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.deal_name", table: "deals", column: "deal_name", label: "Deal name", type: "text", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.assigned_to", table: "deals", column: "assigned_to", label: "Assigned to", type: "text", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.stage", table: "deals", column: "stage", label: "Stage", type: "text", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.status", table: "deals", column: "status", label: "Status", type: "text", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.venture_office", table: "deals", column: "venture_office", label: "Venture office", type: "text", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.date_received", table: "deals", column: "date_received", label: "Date received", type: "date", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["min", "max", "count"] },
  { id: "deals.last_interaction", table: "deals", column: "last_interaction", label: "Last interaction", type: "date", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["min", "max", "count"] },
  { id: "deals.ipa_structure", table: "deals", column: "ipa_structure", label: "IPA structure", type: "text", tab: "Deal detail", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.external_equity", table: "deals", column: "external_equity", label: "External affiliate equity", type: "boolean", tab: "Deal detail", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.source", table: "deals", column: "source", label: "Deal source", type: "text", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },
  { id: "deals.employee_count", table: "deals", column: "employee_count", label: "Employee count", type: "numeric", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["avg", "min", "max", "sum", "count"] },

  // ── Portfolio / company detail — all-office read for Dealflow roles ──
  { id: "company_detail.company_name", table: "company_detail", column: "\"Company Name\"", label: "Portfolio company", type: "text", tab: "Implementations", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["count"] },
  { id: "company_detail.venture_office", table: "company_detail", column: "venture_office", label: "Venture office", type: "text", tab: "Implementations", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["count"] },
  { id: "company_detail.pipeline_stage", table: "company_detail", column: "\"Pipeline Stage\"", label: "Pipeline stage", type: "text", tab: "Implementations", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["count"] },
  { id: "company_detail.term_sheet_date", table: "company_detail", column: "\"Term Sheet Signature Date\"", label: "Term sheet signature date", type: "date", tab: "Implementations", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["min", "max", "count"] },
  { id: "company_detail.ipa_signature_date", table: "company_detail", column: "\"IPA Signature Date\"", label: "IPA signature date", type: "date", tab: "Implementations", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["min", "max", "count"] },
  { id: "company_detail.implementation_date", table: "company_detail", column: "\"Implementation Completion Date\"", label: "Implementation completion date", type: "date", tab: "Implementations", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["min", "max", "count"] },
  { id: "company_detail.decision_date", table: "company_detail", column: "\"Final Portfolio Decision Date\"", label: "Final portfolio decision date", type: "date", tab: "Implementations", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["min", "max", "count"] },
  { id: "company_detail.tracker_stage", table: "company_detail", column: "\"Investment Tracker Stage\"", label: "Investment tracker stage", type: "text", tab: "Investments", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["count"] },
  { id: "company_detail.current_hlv_valuation", table: "company_detail", column: "\"Current HLV Valuation\"", label: "Current HLV valuation", type: "numeric", tab: "Projections", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["sum", "avg", "min", "max", "count"] },
  { id: "company_detail.ipa_year", table: "company_detail", column: "\"IPA Year\"", label: "IPA year", type: "numeric", tab: "Projections", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["count", "min", "max"] },
  { id: "company_detail.focus_area", table: "company_detail", column: "\"High-Level Focus Area\"", label: "High-level focus area", type: "text", tab: "Projections", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["count"] },
  { id: "company_detail.country", table: "company_detail", column: "\"Country of Origin\"", label: "Country of origin", type: "text", tab: "Home", roles: DEALFLOW_ROLES, officeScoped: false, aggs: ["count"] },

  // ── Office financials — costs admin + vo_leader(own office) ──
  { id: "costs.venture_office", table: "venture_office_costs", column: "venture_office", label: "Venture office", type: "text", tab: "Projections·Costs", roles: ["admin", "vo_leader"], officeScoped: true, aggs: ["count"] },
  { id: "costs.month", table: "venture_office_costs", column: "month", label: "Cost month", type: "date", tab: "Projections·Costs", roles: ["admin", "vo_leader"], officeScoped: true, aggs: ["min", "max", "count"] },
  { id: "costs.venture_team", table: "venture_office_costs", column: "venture_team_services_cost", label: "Venture team services cost", type: "numeric", tab: "Projections·Costs", roles: ["admin", "vo_leader"], officeScoped: true, aggs: ["sum", "avg", "count"] },
  { id: "costs.it_team", table: "venture_office_costs", column: "it_team_services_cost", label: "IT team services cost", type: "numeric", tab: "Projections·Costs", roles: ["admin", "vo_leader"], officeScoped: true, aggs: ["sum", "avg", "count"] },
  { id: "costs.operating", table: "venture_office_costs", column: "operating_expenses", label: "Operating expenses", type: "numeric", tab: "Projections·Costs", roles: ["admin", "vo_leader"], officeScoped: true, aggs: ["sum", "avg", "count"] },
  { id: "costs.legal", table: "venture_office_costs", column: "legal_costs", label: "Legal costs", type: "numeric", tab: "Projections·Costs", roles: ["admin", "vo_leader"], officeScoped: true, aggs: ["sum", "avg", "count"] },

  // ── Stage history (capture began 2026-07-15) ──
  { id: "history.stage", table: "deal_stage_history", column: "to_stage", label: "Stage (history)", type: "text", tab: "Dealflow", roles: DEALFLOW_ROLES, officeScoped: true, aggs: ["count"] },

  // ── Taskboard — the technical role's one reporting surface ──
  { id: "kanban.board_column", table: "kanban_cards", column: "board_column", label: "Board column", type: "text", tab: "Taskboard", roles: ["admin", "user", "vo_leader", "technical"], officeScoped: true, aggs: ["count"] },
  { id: "kanban.assignee", table: "kanban_cards", column: "assignee", label: "Assignee", type: "text", tab: "Taskboard", roles: ["admin", "user", "vo_leader", "technical"], officeScoped: true, aggs: ["count"] },
  { id: "kanban.venture_office", table: "kanban_cards", column: "venture_office", label: "Venture office", type: "text", tab: "Taskboard", roles: ["admin", "user", "vo_leader", "technical"], officeScoped: true, aggs: ["count"] },
  { id: "kanban.intake_date", table: "kanban_cards", column: "intake_date", label: "Intake date", type: "date", tab: "Taskboard", roles: ["admin", "user", "vo_leader", "technical"], officeScoped: true, aggs: ["min", "max", "count"] },
  { id: "kanban.due", table: "kanban_cards", column: "due", label: "Due date", type: "date", tab: "Taskboard", roles: ["admin", "user", "vo_leader", "technical"], officeScoped: true, aggs: ["min", "max", "count"] },
];

/** Shared shape for the four milestone-interval metrics. */
function intervalMetric(id: string, label: string, fromCol: string, toCol: string, fromName: string, toName: string): DerivedMetric {
  const both = `"${fromCol}" IS NOT NULL AND "${toCol}" IS NOT NULL`;
  const delta = `"${toCol}" - "${fromCol}"`;
  return {
    id,
    label,
    category: "Milestone intervals",
    definition: `${toName} minus ${fromName}, calendar days, summarized by your chosen statistic (default: average). Companies missing either date are excluded; negative intervals are flagged, not dropped.`,
    allowedDims: ["company_detail.venture_office", "company_detail.pipeline_stage", "company_detail.focus_area", "company_detail.ipa_year"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    aggChoices: ["avg", "min", "max", "sum", "count"],
    defaultAgg: "avg",
    chartColumns: ["{agg}_days"],
    exclusions: `rows with a missing ${fromName.toLowerCase()} or ${toName.toLowerCase()}`,
    sql: `SELECT {dims}
  count(*) AS companies_total,
  count(*) FILTER (WHERE ${both}) AS measurable,
  round(({agg}(${delta}) FILTER (WHERE ${both}))::numeric, 1) AS {agg}_days,
  count(*) FILTER (WHERE "${toCol}" < "${fromCol}") AS negative_intervals
FROM public.company_detail
WHERE {where}
{dimGroup}`,
  };
}

export const METRICS: DerivedMetric[] = [
  // ── Milestone intervals ──
  intervalMetric("ts_to_ipa_days", "Days from term sheet to IPA signature", "Term Sheet Signature Date", "IPA Signature Date", "Term Sheet Signature Date", "IPA Signature Date"),
  intervalMetric("ipa_to_impl_days", "Days from IPA signature to implementation complete", "IPA Signature Date", "Implementation Completion Date", "IPA Signature Date", "Implementation Completion Date"),
  intervalMetric("impl_to_decision_days", "Days from implementation complete to final portfolio decision", "Implementation Completion Date", "Final Portfolio Decision Date", "Implementation Completion Date", "Final Portfolio Decision Date"),
  intervalMetric("ts_to_decision_days", "Days from term sheet to final portfolio decision (end to end)", "Term Sheet Signature Date", "Final Portfolio Decision Date", "Term Sheet Signature Date", "Final Portfolio Decision Date"),

  // ── Pipeline & funnel ──
  {
    id: "milestone_funnel",
    label: "Implementation milestone funnel",
    category: "Pipeline & funnel",
    definition: "Of portfolio companies, how many have reached each dated milestone: term sheet signed, IPA signed, implementation complete, final portfolio decision. A company counts for a milestone when that date is populated.",
    allowedDims: ["company_detail.venture_office", "company_detail.focus_area", "company_detail.ipa_year"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    chartColumns: ["term_sheet_signed", "ipa_signed", "implementation_complete", "portfolio_decision_made"],
    exclusions: "none (missing dates simply don't count toward that milestone)",
    sql: `SELECT {dims}
  count(*) AS companies,
  count("Term Sheet Signature Date") AS term_sheet_signed,
  count("IPA Signature Date") AS ipa_signed,
  count("Implementation Completion Date") AS implementation_complete,
  count("Final Portfolio Decision Date") AS portfolio_decision_made
FROM public.company_detail
WHERE {where}
{dimGroup}`,
  },
  {
    id: "stage_count",
    label: "Deal count by stage",
    category: "Pipeline & funnel",
    definition: "Count of deals grouped by pipeline stage (office-scoped for non-admins).",
    allowedDims: ["deals.stage", "deals.venture_office", "deals.status", "deals.assigned_to", "deals.source"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    chartColumns: ["deals"],
    exclusions: "none",
    sql: `SELECT {dims}
  count(*) AS deals
FROM public.deals
WHERE {where}
{dimGroup}`,
  },
  {
    id: "stage_dwell_days",
    label: "Time in stage (dealflow)",
    category: "Pipeline & funnel",
    definition: "Days a deal spends in each stage, from deal_stage_history, summarized by your chosen statistic (default: average). IMPORTANT: history capture began 2026-07-15 — the baseline was seeded at that moment and earlier dwell time is unknowable, so figures are provisional until several weeks of transitions accrue. Open (current) stage entries are measured to now; completed entries are also reported separately.",
    allowedDims: ["history.stage"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    aggChoices: ["avg", "min", "max", "sum", "count"],
    defaultAgg: "avg",
    chartColumns: ["{agg}_days_in_stage"],
    exclusions: "dwell time before 2026-07-15 (pre-history) is not represented",
    sql: `SELECT {dims}
  count(*) AS stage_entries,
  count(*) FILTER (WHERE next_at IS NOT NULL) AS completed_entries,
  round(({agg}(EXTRACT(epoch FROM (coalesce(next_at, now()) - changed_at)) / 86400))::numeric, 1) AS {agg}_days_in_stage,
  round(({agg}(EXTRACT(epoch FROM (next_at - changed_at)) / 86400) FILTER (WHERE next_at IS NOT NULL))::numeric, 1) AS {agg}_days_completed_only
FROM (
  SELECT h.to_stage, h.changed_at,
         lead(h.changed_at) OVER (PARTITION BY h.deal_id ORDER BY h.changed_at) AS next_at
  FROM public.deal_stage_history h
) x
WHERE {where}
{dimGroup}`,
  },

  // ── Dealflow timing ──
  {
    id: "deal_age_days",
    label: "Deal age (days since received)",
    category: "Dealflow timing",
    definition: "Days from date_received to today, per deal, summarized by your chosen statistic (default: average); the median is always reported alongside. Deals with no received date are excluded.",
    allowedDims: ["deals.stage", "deals.venture_office", "deals.status", "deals.assigned_to", "deals.source"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    aggChoices: ["avg", "min", "max", "sum", "count"],
    defaultAgg: "avg",
    chartColumns: ["{agg}_days"],
    exclusions: "deals with no date_received",
    sql: `SELECT {dims}
  count(*) FILTER (WHERE date_received IS NOT NULL) AS measurable,
  round(({agg}(CURRENT_DATE - date_received) FILTER (WHERE date_received IS NOT NULL))::numeric, 1) AS {agg}_days,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY (CURRENT_DATE - date_received)) FILTER (WHERE date_received IS NOT NULL))::numeric, 1) AS median_days
FROM public.deals
WHERE {where}
{dimGroup}`,
  },
  {
    id: "deal_staleness",
    label: "Deal staleness (days since last interaction)",
    category: "Dealflow timing",
    definition: "Days from last_interaction to today, per deal, summarized by your chosen statistic (default: average), plus counts of deals untouched for over 30 and over 90 days. Deals with no recorded interaction are counted separately, not mixed into the statistics.",
    allowedDims: ["deals.stage", "deals.venture_office", "deals.status", "deals.assigned_to"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    aggChoices: ["avg", "min", "max", "count"],
    defaultAgg: "avg",
    chartColumns: ["{agg}_days_stale"],
    exclusions: "deals with no last_interaction (reported as never_contacted)",
    sql: `SELECT {dims}
  count(*) FILTER (WHERE last_interaction IS NOT NULL) AS measurable,
  round(({agg}(CURRENT_DATE - last_interaction) FILTER (WHERE last_interaction IS NOT NULL))::numeric, 1) AS {agg}_days_stale,
  count(*) FILTER (WHERE CURRENT_DATE - last_interaction > 30) AS stale_over_30d,
  count(*) FILTER (WHERE CURRENT_DATE - last_interaction > 90) AS stale_over_90d,
  count(*) FILTER (WHERE last_interaction IS NULL) AS never_contacted
FROM public.deals
WHERE {where}
{dimGroup}`,
  },

  // ── IPA terms ──
  {
    id: "external_equity_share",
    label: "Deals granting external economics to other affiliate health systems",
    category: "IPA terms",
    definition: "Count and share of executed-IPA deals whose provisions grant OTHER Prinnovo affiliates ANY external economics — equity (warrants/shares), revenue credits, or affiliate transfer rights — per deals.external_equity (definition broadened 2026-07-15 per Steve; includes Gradient Health credits and Ansana transfer rights). Denominator = adjudicated deals (external_equity not null); unadjudicated deals (Cone register-sourced pending source docs) are reported separately, never silently included.",
    allowedDims: ["deals.venture_office", "deals.ipa_structure", "deals.assigned_to"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    chartColumns: ["pct_of_adjudicated"],
    exclusions: "deals without executed IPA detail; unadjudicated (null) rows counted separately",
    sql: `SELECT {dims}
  count(*) FILTER (WHERE external_equity) AS external_equity_deals,
  count(*) FILTER (WHERE external_equity IS NOT NULL) AS adjudicated,
  round(100.0 * count(*) FILTER (WHERE external_equity)
        / NULLIF(count(*) FILTER (WHERE external_equity IS NOT NULL), 0), 1) AS pct_of_adjudicated,
  count(*) FILTER (WHERE external_equity IS NULL) AS unadjudicated
FROM public.deals
WHERE stage IN ('6 - Portfolio IPA','7 - Portfolio Fund') AND ipa_details IS NOT NULL AND {where}
{dimGroup}`,
  },
  {
    id: "ipa_facet_count",
    label: "Executed IPA counts by facet",
    category: "IPA terms",
    definition: "Count of executed-IPA deals (portfolio stage with IPA detail populated), groupable by structure taxonomy, external-economics flag, office, or owner. Base population identical to the external-economics metric.",
    allowedDims: ["deals.ipa_structure", "deals.external_equity", "deals.venture_office", "deals.assigned_to"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    chartColumns: ["executed_ipas"],
    exclusions: "deals without executed IPA detail",
    sql: `SELECT {dims}
  count(*) AS executed_ipas
FROM public.deals
WHERE stage IN ('6 - Portfolio IPA','7 - Portfolio Fund') AND ipa_details IS NOT NULL AND {where}
{dimGroup}`,
  },

  // ── Investment economics ──
  {
    id: "portfolio_value",
    label: "Portfolio value (most recent round valuations)",
    category: "Investment economics",
    definition: "Each invested company's most recent round valuation — dated valuations beat undated, newest date wins, later round breaks ties — summarized by your chosen statistic (default: sum, matching the Investments page). Population: companies with an Investment Tracker Stage. Companies with no round valuation are reported as unvalued.",
    allowedDims: ["company_detail.venture_office", "company_detail.tracker_stage"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    aggChoices: ["sum", "avg", "min", "max"],
    defaultAgg: "sum",
    chartColumns: ["{agg}_portfolio_value"],
    exclusions: "companies without an Investment Tracker Stage; invested companies with no round valuation (counted as unvalued)",
    sql: `SELECT {dims}
  count(DISTINCT cd.deal_id) AS invested_companies,
  count(DISTINCT cd.deal_id) FILTER (WHERE x.v IS NULL) AS unvalued_companies,
  {agg}(x.v) AS {agg}_portfolio_value
FROM public.company_detail cd
LEFT JOIN LATERAL (
  SELECT r.v FROM (VALUES
    (cd."Invested Amount Valuation",   cd."Invested Amount Valuation Date",   1),
    (cd."Invested Amount Valuation 2", cd."Invested Amount Valuation Date 2", 2),
    (cd."Invested Amount Valuation 3", cd."Invested Amount Valuation Date 3", 3)
  ) r(v, d, i)
  WHERE r.v IS NOT NULL
  ORDER BY r.d DESC NULLS LAST, r.i DESC
  LIMIT 1
) x ON true
WHERE cd."Investment Tracker Stage" IS NOT NULL AND {where}
{dimGroup}`,
  },
  {
    id: "invested_total",
    label: "Invested capital (all rounds)",
    category: "Investment economics",
    definition: "Per-company invested capital (Invested Amount + 2 + 3, NULLs as zero) over companies with an Investment Tracker Stage, summarized by your chosen statistic (default: sum) — same population as the Investments page.",
    allowedDims: ["company_detail.venture_office", "company_detail.tracker_stage"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    aggChoices: ["sum", "avg", "min", "max"],
    defaultAgg: "sum",
    chartColumns: ["{agg}_invested"],
    exclusions: "companies without an Investment Tracker Stage",
    sql: `SELECT {dims}
  count(*) AS companies,
  count(*) FILTER (WHERE coalesce("Invested Amount",0)+coalesce("Invested Amount 2",0)+coalesce("Invested Amount 3",0) > 0) AS companies_with_investment,
  {agg}(coalesce("Invested Amount",0)+coalesce("Invested Amount 2",0)+coalesce("Invested Amount 3",0)) AS {agg}_invested
FROM public.company_detail
WHERE "Investment Tracker Stage" IS NOT NULL AND {where}
{dimGroup}`,
  },
  {
    id: "moic",
    label: "Portfolio multiple (MOIC)",
    category: "Investment economics",
    definition: "Portfolio value (most recent round valuation per company, same rule as the portfolio-value metric) divided by total invested (all rounds, NULLs as zero), over companies with an Investment Tracker Stage. A ratio has one correct aggregation, so no statistic choice applies.",
    allowedDims: ["company_detail.venture_office", "company_detail.tracker_stage"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    chartColumns: ["moic"],
    exclusions: "companies without an Investment Tracker Stage; ratio undefined where invested is zero",
    sql: `SELECT {dims}
  count(*) AS companies,
  sum(inv.total) AS invested_total,
  sum(x.v) AS portfolio_value,
  round((sum(x.v) / NULLIF(sum(inv.total), 0))::numeric, 2) AS moic
FROM public.company_detail cd
LEFT JOIN LATERAL (
  SELECT coalesce(cd."Invested Amount",0)+coalesce(cd."Invested Amount 2",0)+coalesce(cd."Invested Amount 3",0) AS total
) inv ON true
LEFT JOIN LATERAL (
  SELECT r.v FROM (VALUES
    (cd."Invested Amount Valuation",   cd."Invested Amount Valuation Date",   1),
    (cd."Invested Amount Valuation 2", cd."Invested Amount Valuation Date 2", 2),
    (cd."Invested Amount Valuation 3", cd."Invested Amount Valuation Date 3", 3)
  ) r(v, d, i)
  WHERE r.v IS NOT NULL
  ORDER BY r.d DESC NULLS LAST, r.i DESC
  LIMIT 1
) x ON true
WHERE cd."Investment Tracker Stage" IS NOT NULL AND {where}
{dimGroup}`,
  },

  // ── Office costs ──
  {
    id: "legal_cost_total",
    label: "Legal costs",
    category: "Office costs",
    definition: "venture_office_costs.legal_costs over the filtered month range, summarized by your chosen statistic (default: sum). Coverage is reported (months present, months carrying a legal value) so partial-year data cannot masquerade as a full-year total.",
    allowedDims: ["costs.venture_office", "costs.month"],
    roles: ["admin", "vo_leader"],
    officeScoped: true,
    aggChoices: ["sum", "avg", "min", "max", "count"],
    defaultAgg: "sum",
    chartColumns: ["{agg}_legal"],
    exclusions: "months with no cost row (reported via coverage counts)",
    sql: `SELECT {dims}
  {agg}(legal_costs) AS {agg}_legal,
  count(*) AS cost_months,
  count(*) FILTER (WHERE legal_costs IS NOT NULL) AS months_with_legal,
  min(month) AS first_month,
  max(month) AS last_month
FROM public.venture_office_costs
WHERE {where}
{dimGroup}`,
  },
  {
    id: "monthly_burn",
    label: "Office cost burn",
    category: "Office costs",
    definition: "Cost components (venture team services, IT team services, operating expenses, legal, NULLs as zero) and their combined total, summarized by your chosen statistic (default: sum). Group by cost month for a time series; average with an office grouping gives mean monthly burn.",
    allowedDims: ["costs.venture_office", "costs.month"],
    roles: ["admin", "vo_leader"],
    officeScoped: true,
    aggChoices: ["sum", "avg", "min", "max"],
    defaultAgg: "sum",
    chartColumns: ["venture_team", "it_team", "operating", "legal"],
    exclusions: "months with no cost row simply have no data point",
    sql: `SELECT {dims}
  {agg}(coalesce(venture_team_services_cost,0)) AS venture_team,
  {agg}(coalesce(it_team_services_cost,0)) AS it_team,
  {agg}(coalesce(operating_expenses,0)) AS operating,
  {agg}(coalesce(legal_costs,0)) AS legal,
  {agg}(coalesce(venture_team_services_cost,0)+coalesce(it_team_services_cost,0)+coalesce(operating_expenses,0)+coalesce(legal_costs,0)) AS total_cost
FROM public.venture_office_costs
WHERE {where}
{dimGroup}`,
  },
  {
    id: "budget_vs_actual",
    label: "Budget vs actual by contract year",
    category: "Office costs",
    definition: "Actual costs rolled up to contract years (year 1 starts at the office's initiation date) against venture_office_budgets. Mapping confirmed by Steve 2026-07-15: services actual = venture team + IT team services; operating actual = operating expenses + legal. Returns one row per office × contract year; offices/years without a budget row show null budgets. Filterable by office only; fixed statistics (variances are sums by construction).",
    allowedDims: [],
    roles: ["admin", "vo_leader"],
    officeScoped: true,
    chartColumns: ["services_actual", "services_budget", "operating_actual", "operating_costs_budget"],
    exclusions: "cost months for offices missing an initiation date cannot be assigned a contract year",
    sql: `SELECT * FROM (
  SELECT
    cy.venture_office,
    cy.contract_year,
    cy.services_actual,
    b.services_budget,
    round((cy.services_actual - b.services_budget)::numeric, 2) AS services_variance,
    cy.operating_actual,
    b.operating_costs_budget,
    round((cy.operating_actual - b.operating_costs_budget)::numeric, 2) AS operating_variance
  FROM (
    SELECT c.venture_office,
           (EXTRACT(YEAR FROM age(c.month, v.venture_office_initiation_date)))::int + 1 AS contract_year,
           sum(coalesce(c.venture_team_services_cost,0)+coalesce(c.it_team_services_cost,0)) AS services_actual,
           sum(coalesce(c.operating_expenses,0)+coalesce(c.legal_costs,0)) AS operating_actual
    FROM public.venture_office_costs c
    JOIN public.venture_office_detail v ON v."Venture Office Name" = c.venture_office
    WHERE v.venture_office_initiation_date IS NOT NULL
    GROUP BY c.venture_office, 2
  ) cy
  LEFT JOIN public.venture_office_budgets b
    ON b.venture_office = cy.venture_office AND b.year_number = cy.contract_year
) t
WHERE {where}
ORDER BY venture_office, contract_year`,
  },

  // ── IT taskboard ──
  {
    id: "kanban_cycle_days",
    label: "Taskboard cycle time",
    category: "IT taskboard",
    definition: "archived_at minus intake_date, calendar days, for archived cards with both dates, summarized by your chosen statistic (default: average).",
    allowedDims: ["kanban.venture_office", "kanban.assignee", "kanban.board_column"],
    roles: ["admin", "user", "vo_leader", "technical"],
    officeScoped: true,
    aggChoices: ["avg", "min", "max", "sum", "count"],
    defaultAgg: "avg",
    chartColumns: ["{agg}_cycle_days"],
    exclusions: "unarchived cards; cards missing intake date",
    sql: `SELECT {dims}
  count(*) FILTER (WHERE archived AND intake_date IS NOT NULL) AS measurable,
  round(({agg}(archived_at::date - intake_date) FILTER (WHERE archived AND intake_date IS NOT NULL))::numeric, 1) AS {agg}_cycle_days
FROM public.kanban_cards
WHERE {where}
{dimGroup}`,
  },
];

export const fieldById = new Map(FIELDS.map(f => [f.id, f]));
export const metricById = new Map(METRICS.map(m => [m.id, m]));
