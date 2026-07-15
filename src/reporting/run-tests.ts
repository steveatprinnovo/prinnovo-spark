/**
 * Regression tests for the reporting catalog + compiler. Zero dependencies:
 *   node --experimental-strip-types src/reporting/run-tests.ts
 *
 * The three canonical questions (Steve, 2026-07-15) plus validator behavior.
 * Production values recorded at authoring time are kept as fixtures for the
 * live-check script; offline tests assert compilation, not data.
 */

import { compile, validate, type ReportRequest } from "./compiler.ts";

let passed = 0, failed = 0;
function check(name: string, fn: () => void) {
  try { fn(); passed++; console.log(`  ok  ${name}`); }
  catch (e: any) { failed++; console.error(`FAIL  ${name}: ${e.message}`); }
}
function assert(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

// ── Regression 1: avg term-sheet → IPA days by office ─────────────────────
// Live values 2026-07-15: HLV 88.8 (n18/22), NGHV 95.7 (11/11), CHV 98.7 (9/15),
// SVHV 100.3 (3/3); 41/51 measurable, 0 negative intervals.
const q1: ReportRequest = {
  metric: "ts_to_ipa_days",
  dimensions: ["company_detail.venture_office"],
  filters: [],
};

check("Q1 compiles for admin with office dimension", () => {
  const r = compile(q1, "admin");
  assert(r.sql.includes('"IPA Signature Date" - "Term Sheet Signature Date"'), "interval expression missing");
  assert(r.sql.includes("GROUP BY venture_office"), "office grouping missing");
  assert(r.sql.includes("negative_intervals"), "quality flag missing");
  assert(r.footer.definition.includes("calendar days"), "definition must ride the footer");
});

check("Q1 is available to base users (all-office portfolio data)", () => {
  const r = compile(q1, "user");
  assert(r.footer.roleNotes.length === 0, "company_detail metrics are not office-scoped");
});

check("Q1 denied to technical role", () => {
  const errs = validate(q1, "technical");
  assert(errs.some(e => e.code === "metric_forbidden"), "technical must be denied");
});

// ── Regression 2: external affiliate economics count + share by office ────
// Definition = ANY external economics (broadened 2026-07-15 per Steve).
// Live values 2026-07-15: HLV 4/11 = 36.4%, NGHV 0/10, SVHV 1/2 = 50.0%,
// CHV 0 adjudicated + 9 unadjudicated; total 5/23 = 21.7%.
// TRUE set: Robbie AI, Kent Imaging, Steadywell (warrants), Gradient Health
// (Phase II revenue credits), Ansana (holder-affiliate transfer rights).
const q2: ReportRequest = {
  metric: "external_equity_share",
  dimensions: ["deals.venture_office"],
  filters: [],
};

check("Q2 compiles with adjudicated denominator and unadjudicated count", () => {
  const r = compile(q2, "admin");
  assert(r.sql.includes("FILTER (WHERE external_equity)"), "numerator missing");
  assert(r.sql.includes("external_equity IS NOT NULL"), "adjudicated denominator missing");
  assert(r.sql.includes("external_equity IS NULL) AS unadjudicated"), "unadjudicated accounting missing");
  assert(r.sql.includes("'6 - Portfolio IPA'"), "base population must be executed-IPA deals");
});

check("Q2 warns non-admins about office scoping", () => {
  const r = compile(q2, "vo_leader");
  assert(r.footer.roleNotes.some(n => n.includes("your venture office only")), "office-scope note required");
});

// ── Regression 3: total value of the HLV portfolio to date ────────────────
// Live value 2026-07-15: HLV $14,670,550 across 11 invested companies
// (all offices: $42,761,550 / 22). NOTE: Home KPI hardcodes $17,985,975 —
// stale; the catalog definition matches the Investments page computation.
const q3: ReportRequest = {
  metric: "portfolio_value",
  dimensions: [],
  filters: [{ field: "company_detail.venture_office", op: "eq", value: "Healthliant Ventures" }],
};

check("Q3 compiles most-recent-valuation lateral with office filter", () => {
  const r = compile(q3, "admin");
  assert(r.sql.includes("ORDER BY r.d DESC NULLS LAST, r.i DESC"), "recency rule missing");
  assert(r.sql.includes("unvalued_companies"), "unvalued accounting missing");
  assert(r.sql.includes("venture_office = $1"), "office filter must be parameterized");
  assert(r.params[0] === "Healthliant Ventures", "param binding wrong");
  assert(r.sql.includes('"Investment Tracker Stage" IS NOT NULL'), "population rule missing");
});

// ── Regression 4: total HLV legal costs, calendar year 2024 ────────────────
// Live value 2026-07-15: $65,987.00 — 12 of 12 months present (Jan–Dec 2024),
// all 12 carrying a legal_costs value (full-year coverage).
const q4: ReportRequest = {
  metric: "legal_cost_total",
  dimensions: [],
  filters: [
    { field: "costs.venture_office", op: "eq", value: "Healthliant Ventures" },
    { field: "costs.month", op: "gte", value: "2024-01-01" },
    { field: "costs.month", op: "lte", value: "2024-12-31" },
  ],
};

check("Q4 compiles parameterized office + year-range filters with coverage columns", () => {
  const r = compile(q4, "admin");
  assert(r.sql.includes("sum(legal_costs) AS legal_total"), "sum missing");
  assert(r.sql.includes("months_with_legal"), "coverage accounting missing");
  assert(r.sql.includes("venture_office = $1") && r.sql.includes("month >= $2") && r.sql.includes("month <= $3"), "filters must be parameterized");
  assert(r.params.length === 3 && r.params[0] === "Healthliant Ventures", "param binding wrong");
});

check("Q4 available to VO leaders (own office via RLS) with scope note", () => {
  const r = compile(q4, "vo_leader");
  assert(r.footer.roleNotes.some(n => n.includes("your venture office only")), "office-scope note required");
});

check("Q4 denied to base users (costs are admin + VO leader only)", () => {
  const errs = validate(q4, "user");
  assert(errs.some(e => e.code === "metric_forbidden" || e.code === "field_forbidden"), "base user must be denied");
});

// ── Validator behavior ─────────────────────────────────────────────────────
check("unknown metric gets a suggestion", () => {
  const errs = validate({ metric: "ipa_days", dimensions: [], filters: [] } as ReportRequest, "admin");
  assert(errs[0].code === "unknown_metric" && errs[0].suggestion === "ts_to_ipa_days", "suggestion expected");
});

check("invalid dimension for metric is rejected with suggestion", () => {
  const errs = validate({ metric: "portfolio_value", dimensions: ["deals.stage"], filters: [] }, "admin");
  assert(errs.some(e => e.code === "invalid_dimension"), "must reject");
});

check("cost fields hidden from base users", () => {
  const errs = validate({ metric: "stage_count", dimensions: ["deals.stage"], filters: [{ field: "costs.legal", op: "gte", value: 0 }] }, "user");
  assert(errs.some(e => e.code === "field_forbidden"), "cost field must be forbidden to base users");
});

check("technical role may use kanban metric", () => {
  const errs = validate({ metric: "kanban_cycle_days", dimensions: ["kanban.assignee"], filters: [] }, "technical");
  assert(errs.length === 0, "kanban is technical's one reporting surface");
});

check("filter without value is rejected", () => {
  const errs = validate({ metric: "stage_count", dimensions: ["deals.stage"], filters: [{ field: "deals.status", op: "eq" }] }, "admin");
  assert(errs.some(e => e.code === "missing_value"), "must require a value");
});

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
