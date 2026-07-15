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
    label: "Deals granting equity to other affiliate health systems",
    definition: "Count and share of executed-IPA deals whose provisions let OTHER Prinnovo affiliates earn or receive equity (warrants/shares), per deals.external_equity. Strict-equity reading: revenue credits (Gradient Health) and holder-affiliate transfer rights (Ansana) do not count. Denominator = adjudicated deals (external_equity not null); unadjudicated deals (Cone register-sourced pending source docs) are reported separately, never silently included.",
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
