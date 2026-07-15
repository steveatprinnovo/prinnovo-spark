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
  /** Human-readable definition — echoed verbatim in every validation footer. */
  definition: string;
  /** Fields permitted as GROUP BY dimensions for this metric. */
  allowedDims: string[];
  roles: Role[];
  officeScoped: boolean;
  /**
   * SQL template. Placeholders: {dims} (select-list dimension columns,
   * comma-suffixed), {dimGroup} (GROUP BY clause or empty), {where}
   * (compiled filters AND-ed into the base predicate, or 'true').
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

export const METRICS: DerivedMetric[] = [
  {
    id: "ts_to_ipa_days",
    label: "Days from term sheet to IPA signature",
    definition: "IPA Signature Date minus Term Sheet Signature Date, calendar days. Companies missing either date are excluded; negative intervals are flagged, not dropped.",
    allowedDims: ["company_detail.venture_office", "company_detail.pipeline_stage", "company_detail.focus_area"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    exclusions: "rows with a missing term-sheet or IPA signature date",
    sql: `SELECT {dims}
  count(*) AS companies_total,
  count(*) FILTER (WHERE "Term Sheet Signature Date" IS NOT NULL AND "IPA Signature Date" IS NOT NULL) AS measurable,
  round(avg("IPA Signature Date" - "Term Sheet Signature Date") FILTER (WHERE "Term Sheet Signature Date" IS NOT NULL AND "IPA Signature Date" IS NOT NULL), 1) AS avg_days,
  min("IPA Signature Date" - "Term Sheet Signature Date") FILTER (WHERE "Term Sheet Signature Date" IS NOT NULL AND "IPA Signature Date" IS NOT NULL) AS min_days,
  max("IPA Signature Date" - "Term Sheet Signature Date") FILTER (WHERE "Term Sheet Signature Date" IS NOT NULL AND "IPA Signature Date" IS NOT NULL) AS max_days,
  count(*) FILTER (WHERE "IPA Signature Date" < "Term Sheet Signature Date") AS negative_intervals
FROM public.company_detail
WHERE {where}
{dimGroup}`,
  },
  {
    id: "external_equity_share",
    label: "Deals granting external economics to other affiliate health systems",
    definition: "Count and share of executed-IPA deals whose provisions grant OTHER Prinnovo affiliates ANY external economics — equity (warrants/shares), revenue credits, or affiliate transfer rights — per deals.external_equity (definition broadened 2026-07-15 per Steve; includes Gradient Health credits and Ansana transfer rights). Denominator = adjudicated deals (external_equity not null); unadjudicated deals (Cone register-sourced pending source docs) are reported separately, never silently included.",
    allowedDims: ["deals.venture_office", "deals.ipa_structure", "deals.assigned_to"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
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
    id: "portfolio_value",
    label: "Portfolio value (most recent round valuations)",
    definition: "Sum over companies with an Investment Tracker Stage of each company's most recent round valuation — dated valuations beat undated, newest date wins, later round breaks ties. Identical to the Investments page computation. Companies with no round valuation contribute nothing and are reported as unvalued.",
    allowedDims: ["company_detail.venture_office", "company_detail.tracker_stage"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    exclusions: "companies without an Investment Tracker Stage; invested companies with no round valuation (counted as unvalued)",
    sql: `SELECT {dims}
  count(DISTINCT cd.deal_id) AS invested_companies,
  count(DISTINCT cd.deal_id) FILTER (WHERE x.v IS NULL) AS unvalued_companies,
  sum(x.v) AS portfolio_value
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
    id: "stage_count",
    label: "Deal count by stage",
    definition: "Count of deals grouped by pipeline stage (office-scoped for non-admins).",
    allowedDims: ["deals.stage", "deals.venture_office", "deals.status", "deals.assigned_to", "deals.source"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    exclusions: "none",
    sql: `SELECT {dims}
  count(*) AS deals
FROM public.deals
WHERE {where}
{dimGroup}`,
  },
  {
    id: "legal_cost_total",
    label: "Total legal costs",
    definition: "Sum of venture_office_costs.legal_costs over the filtered month range. Coverage is reported (months present, months carrying a legal value) so partial-year data cannot masquerade as a full-year total.",
    allowedDims: ["costs.venture_office", "costs.month"],
    roles: ["admin", "vo_leader"],
    officeScoped: true,
    exclusions: "months with no cost row (reported via coverage counts)",
    sql: `SELECT {dims}
  sum(legal_costs) AS legal_total,
  count(*) AS cost_months,
  count(*) FILTER (WHERE legal_costs IS NOT NULL) AS months_with_legal,
  min(month) AS first_month,
  max(month) AS last_month
FROM public.venture_office_costs
WHERE {where}
{dimGroup}`,
  },
  // ── Milestone intervals: every consecutive + end-to-end pair the four
  //    dated milestones support. (Per-stage dealflow transitions are NOT
  //    timestamped in the schema — only these four dates exist; a
  //    stage_history table would be required for time-in-stage metrics.) ──
  {
    id: "ipa_to_impl_days",
    label: "Days from IPA signature to implementation complete",
    definition: "Implementation Completion Date minus IPA Signature Date, calendar days. Companies missing either date are excluded; negative intervals are flagged, not dropped.",
    allowedDims: ["company_detail.venture_office", "company_detail.pipeline_stage", "company_detail.focus_area", "company_detail.ipa_year"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    exclusions: "rows with a missing IPA signature or implementation completion date",
    sql: `SELECT {dims}
  count(*) AS companies_total,
  count(*) FILTER (WHERE "IPA Signature Date" IS NOT NULL AND "Implementation Completion Date" IS NOT NULL) AS measurable,
  round(avg("Implementation Completion Date" - "IPA Signature Date") FILTER (WHERE "IPA Signature Date" IS NOT NULL AND "Implementation Completion Date" IS NOT NULL), 1) AS avg_days,
  min("Implementation Completion Date" - "IPA Signature Date") FILTER (WHERE "IPA Signature Date" IS NOT NULL AND "Implementation Completion Date" IS NOT NULL) AS min_days,
  max("Implementation Completion Date" - "IPA Signature Date") FILTER (WHERE "IPA Signature Date" IS NOT NULL AND "Implementation Completion Date" IS NOT NULL) AS max_days,
  count(*) FILTER (WHERE "Implementation Completion Date" < "IPA Signature Date") AS negative_intervals
FROM public.company_detail
WHERE {where}
{dimGroup}`,
  },
  {
    id: "impl_to_decision_days",
    label: "Days from implementation complete to final portfolio decision",
    definition: "Final Portfolio Decision Date minus Implementation Completion Date, calendar days. Companies missing either date are excluded; negative intervals are flagged, not dropped.",
    allowedDims: ["company_detail.venture_office", "company_detail.pipeline_stage", "company_detail.focus_area", "company_detail.ipa_year"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    exclusions: "rows with a missing implementation completion or final decision date",
    sql: `SELECT {dims}
  count(*) AS companies_total,
  count(*) FILTER (WHERE "Implementation Completion Date" IS NOT NULL AND "Final Portfolio Decision Date" IS NOT NULL) AS measurable,
  round(avg("Final Portfolio Decision Date" - "Implementation Completion Date") FILTER (WHERE "Implementation Completion Date" IS NOT NULL AND "Final Portfolio Decision Date" IS NOT NULL), 1) AS avg_days,
  min("Final Portfolio Decision Date" - "Implementation Completion Date") FILTER (WHERE "Implementation Completion Date" IS NOT NULL AND "Final Portfolio Decision Date" IS NOT NULL) AS min_days,
  max("Final Portfolio Decision Date" - "Implementation Completion Date") FILTER (WHERE "Implementation Completion Date" IS NOT NULL AND "Final Portfolio Decision Date" IS NOT NULL) AS max_days,
  count(*) FILTER (WHERE "Final Portfolio Decision Date" < "Implementation Completion Date") AS negative_intervals
FROM public.company_detail
WHERE {where}
{dimGroup}`,
  },
  {
    id: "ts_to_decision_days",
    label: "Days from term sheet to final portfolio decision (end to end)",
    definition: "Final Portfolio Decision Date minus Term Sheet Signature Date, calendar days — the full journey through implementation. Companies missing either date are excluded; negative intervals are flagged, not dropped.",
    allowedDims: ["company_detail.venture_office", "company_detail.pipeline_stage", "company_detail.focus_area", "company_detail.ipa_year"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    exclusions: "rows with a missing term-sheet or final decision date",
    sql: `SELECT {dims}
  count(*) AS companies_total,
  count(*) FILTER (WHERE "Term Sheet Signature Date" IS NOT NULL AND "Final Portfolio Decision Date" IS NOT NULL) AS measurable,
  round(avg("Final Portfolio Decision Date" - "Term Sheet Signature Date") FILTER (WHERE "Term Sheet Signature Date" IS NOT NULL AND "Final Portfolio Decision Date" IS NOT NULL), 1) AS avg_days,
  min("Final Portfolio Decision Date" - "Term Sheet Signature Date") FILTER (WHERE "Term Sheet Signature Date" IS NOT NULL AND "Final Portfolio Decision Date" IS NOT NULL) AS min_days,
  max("Final Portfolio Decision Date" - "Term Sheet Signature Date") FILTER (WHERE "Term Sheet Signature Date" IS NOT NULL AND "Final Portfolio Decision Date" IS NOT NULL) AS max_days,
  count(*) FILTER (WHERE "Final Portfolio Decision Date" < "Term Sheet Signature Date") AS negative_intervals
FROM public.company_detail
WHERE {where}
{dimGroup}`,
  },
  {
    id: "milestone_funnel",
    label: "Implementation milestone funnel",
    definition: "Of portfolio companies, how many have reached each dated milestone: term sheet signed, IPA signed, implementation complete, final portfolio decision. A company counts for a milestone when that date is populated.",
    allowedDims: ["company_detail.venture_office", "company_detail.focus_area", "company_detail.ipa_year"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
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
  // ── Dealflow timing ──
  {
    id: "deal_age_days",
    label: "Deal age (days since received)",
    definition: "Days from date_received to today, per deal. Median uses percentile_cont(0.5). Deals with no received date are excluded.",
    allowedDims: ["deals.stage", "deals.venture_office", "deals.status", "deals.assigned_to", "deals.source"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    exclusions: "deals with no date_received",
    sql: `SELECT {dims}
  count(*) FILTER (WHERE date_received IS NOT NULL) AS measurable,
  round(avg(CURRENT_DATE - date_received) FILTER (WHERE date_received IS NOT NULL), 1) AS avg_days,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY (CURRENT_DATE - date_received)) FILTER (WHERE date_received IS NOT NULL))::numeric, 1) AS median_days,
  min(CURRENT_DATE - date_received) FILTER (WHERE date_received IS NOT NULL) AS min_days,
  max(CURRENT_DATE - date_received) FILTER (WHERE date_received IS NOT NULL) AS max_days
FROM public.deals
WHERE {where}
{dimGroup}`,
  },
  {
    id: "deal_staleness",
    label: "Deal staleness (days since last interaction)",
    definition: "Days from last_interaction to today, per deal, plus counts of deals untouched for over 30 and over 90 days. Deals with no recorded interaction are counted separately, not mixed into the averages.",
    allowedDims: ["deals.stage", "deals.venture_office", "deals.status", "deals.assigned_to"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    exclusions: "deals with no last_interaction (reported as never_contacted)",
    sql: `SELECT {dims}
  count(*) FILTER (WHERE last_interaction IS NOT NULL) AS measurable,
  round(avg(CURRENT_DATE - last_interaction) FILTER (WHERE last_interaction IS NOT NULL), 1) AS avg_days_stale,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY (CURRENT_DATE - last_interaction)) FILTER (WHERE last_interaction IS NOT NULL))::numeric, 1) AS median_days_stale,
  count(*) FILTER (WHERE CURRENT_DATE - last_interaction > 30) AS stale_over_30d,
  count(*) FILTER (WHERE CURRENT_DATE - last_interaction > 90) AS stale_over_90d,
  count(*) FILTER (WHERE last_interaction IS NULL) AS never_contacted
FROM public.deals
WHERE {where}
{dimGroup}`,
  },
  // ── IPA facets (structured ones; deeper facets like tier percentages and
  //    term lengths live in ipa_details free text and would need column
  //    promotion, as external_equity was) ──
  {
    id: "ipa_facet_count",
    label: "Executed IPA counts by facet",
    definition: "Count of executed-IPA deals (portfolio stage with IPA detail populated), groupable by structure taxonomy, external-economics flag, office, or owner. Base population identical to the external-economics metric.",
    allowedDims: ["deals.ipa_structure", "deals.external_equity", "deals.venture_office", "deals.assigned_to"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    exclusions: "deals without executed IPA detail",
    sql: `SELECT {dims}
  count(*) AS executed_ipas
FROM public.deals
WHERE stage IN ('6 - Portfolio IPA','7 - Portfolio Fund') AND ipa_details IS NOT NULL AND {where}
{dimGroup}`,
  },
  // ── Investment economics ──
  {
    id: "invested_total",
    label: "Total invested (all rounds)",
    definition: "Sum of Invested Amount + Invested Amount 2 + Invested Amount 3 (NULLs treated as zero) over companies with an Investment Tracker Stage — same population as the Investments page.",
    allowedDims: ["company_detail.venture_office", "company_detail.tracker_stage"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
    exclusions: "companies without an Investment Tracker Stage",
    sql: `SELECT {dims}
  count(*) AS companies,
  count(*) FILTER (WHERE coalesce("Invested Amount",0)+coalesce("Invested Amount 2",0)+coalesce("Invested Amount 3",0) > 0) AS companies_with_investment,
  sum(coalesce("Invested Amount",0)+coalesce("Invested Amount 2",0)+coalesce("Invested Amount 3",0)) AS invested_total
FROM public.company_detail
WHERE "Investment Tracker Stage" IS NOT NULL AND {where}
{dimGroup}`,
  },
  {
    id: "moic",
    label: "Portfolio multiple (MOIC)",
    definition: "Portfolio value (most recent round valuation per company, same rule as the portfolio-value metric) divided by total invested (all rounds, NULLs as zero), over companies with an Investment Tracker Stage. Companies with zero invested are included in value but produce no ratio contribution denominator-side.",
    allowedDims: ["company_detail.venture_office", "company_detail.tracker_stage"],
    roles: DEALFLOW_ROLES,
    officeScoped: false,
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
  // ── Office cost analytics ──
  {
    id: "monthly_burn",
    label: "Office cost burn",
    definition: "Cost components (venture team services, IT team services, operating expenses, legal) and their total per office/month, NULLs as zero. Group by cost month for a time series.",
    allowedDims: ["costs.venture_office", "costs.month"],
    roles: ["admin", "vo_leader"],
    officeScoped: true,
    exclusions: "months with no cost row simply have no data point",
    sql: `SELECT {dims}
  sum(coalesce(venture_team_services_cost,0)) AS venture_team,
  sum(coalesce(it_team_services_cost,0)) AS it_team,
  sum(coalesce(operating_expenses,0)) AS operating,
  sum(coalesce(legal_costs,0)) AS legal,
  sum(coalesce(venture_team_services_cost,0)+coalesce(it_team_services_cost,0)+coalesce(operating_expenses,0)+coalesce(legal_costs,0)) AS total_cost
FROM public.venture_office_costs
WHERE {where}
{dimGroup}`,
  },
  {
    id: "budget_vs_actual",
    label: "Budget vs actual by contract year",
    definition: "Actual costs rolled up to contract years (year 1 starts at the office's initiation date) against venture_office_budgets. Mapping confirmed by Steve 2026-07-15: services actual = venture team + IT team services; operating actual = operating expenses + legal. Returns one row per office × contract year; offices/years without a budget row show null budgets. Filterable by office only.",
    allowedDims: [],
    roles: ["admin", "vo_leader"],
    officeScoped: true,
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
  {
    id: "stage_dwell_days",
    label: "Time in stage (dealflow)",
    definition: "Average days a deal spends in each stage, from deal_stage_history. IMPORTANT: history capture began 2026-07-15 — the baseline was seeded at that moment and earlier dwell time is unknowable, so figures are provisional until several weeks of transitions accrue. Open (current) stage entries are measured to now; completed entries are also reported separately.",
    allowedDims: ["history.stage"],
    roles: DEALFLOW_ROLES,
    officeScoped: true,
    exclusions: "dwell time before 2026-07-15 (pre-history) is not represented",
    sql: `SELECT {dims}
  count(*) AS stage_entries,
  count(*) FILTER (WHERE next_at IS NOT NULL) AS completed_entries,
  round((avg(EXTRACT(epoch FROM (coalesce(next_at, now()) - changed_at)) / 86400))::numeric, 1) AS avg_days_in_stage,
  round((avg(EXTRACT(epoch FROM (next_at - changed_at)) / 86400) FILTER (WHERE next_at IS NOT NULL))::numeric, 1) AS avg_days_completed_only
FROM (
  SELECT h.to_stage, h.changed_at,
         lead(h.changed_at) OVER (PARTITION BY h.deal_id ORDER BY h.changed_at) AS next_at
  FROM public.deal_stage_history h
) x
WHERE {where}
{dimGroup}`,
  },
  {
    id: "kanban_cycle_days",
    label: "Taskboard cycle time",
    definition: "archived_at minus intake_date, calendar days, for archived cards with both dates.",
    allowedDims: ["kanban.venture_office", "kanban.assignee", "kanban.board_column"],
    roles: ["admin", "user", "vo_leader", "technical"],
    officeScoped: true,
    exclusions: "unarchived cards; cards missing intake date",
    sql: `SELECT {dims}
  count(*) FILTER (WHERE archived AND intake_date IS NOT NULL) AS measurable,
  round(avg(archived_at::date - intake_date) FILTER (WHERE archived AND intake_date IS NOT NULL), 1) AS avg_cycle_days
FROM public.kanban_cards
WHERE {where}
{dimGroup}`,
  },
];

export const fieldById = new Map(FIELDS.map(f => [f.id, f]));
export const metricById = new Map(METRICS.map(m => [m.id, m]));
