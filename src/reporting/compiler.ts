/**
 * Report request validator + SQL compiler.
 *
 * The model emits ReportRequest objects whose every id must exist in the
 * catalog. Compilation is template substitution only — the model cannot
 * inject SQL because values are bound as parameters and identifiers come
 * exclusively from the catalog. Execution happens elsewhere, as the asking
 * user's JWT, so RLS remains the enforcement layer.
 */

import { fieldById, metricById, type Role, type DerivedMetric } from "./catalog.ts";

export interface ReportFilter {
  field: string;
  op: "eq" | "neq" | "in" | "gte" | "lte" | "is_null" | "not_null";
  value?: string | number | (string | number)[];
}

export interface ReportRequest {
  metric: string;
  dimensions: string[];
  filters: ReportFilter[];
}

export interface CompiledReport {
  sql: string;
  params: (string | number)[];
  metric: DerivedMetric;
  /** Text the renderer must include in the validation footer. */
  footer: { definition: string; exclusions: string; roleNotes: string[] };
}

export type ValidationError = { code: string; message: string; suggestion?: string };

function nearest(id: string, candidates: string[]): string | undefined {
  const target = id.toLowerCase();
  let best: string | undefined, bestScore = 0;
  for (const c of candidates) {
    const cl = c.toLowerCase();
    let score = 0;
    for (const part of target.split(/[._\s]+/)) if (part && cl.includes(part)) score += part.length;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return bestScore >= 3 ? best : undefined;
}

export function validate(req: ReportRequest, role: Role): ValidationError[] {
  const errors: ValidationError[] = [];
  const metric = metricById.get(req.metric);
  if (!metric) {
    errors.push({
      code: "unknown_metric",
      message: `Unknown metric '${req.metric}'`,
      suggestion: nearest(req.metric, [...metricById.keys()]),
    });
    return errors;
  }
  if (!metric.roles.includes(role)) {
    errors.push({ code: "metric_forbidden", message: `Metric '${metric.id}' is not available to role '${role}'` });
  }
  for (const dim of req.dimensions) {
    if (!metric.allowedDims.includes(dim)) {
      errors.push({
        code: "invalid_dimension",
        message: `'${dim}' is not a valid dimension for '${metric.id}'`,
        suggestion: nearest(dim, metric.allowedDims),
      });
      continue;
    }
    const f = fieldById.get(dim);
    if (f && !f.roles.includes(role)) {
      errors.push({ code: "dimension_forbidden", message: `'${dim}' is not visible to role '${role}'` });
    }
  }
  for (const flt of req.filters) {
    const f = fieldById.get(flt.field);
    if (!f) {
      errors.push({
        code: "unknown_field",
        message: `Unknown filter field '${flt.field}'`,
        suggestion: nearest(flt.field, [...fieldById.keys()]),
      });
      continue;
    }
    if (!f.roles.includes(role)) {
      errors.push({ code: "field_forbidden", message: `'${flt.field}' is not visible to role '${role}'` });
    }
    const needsValue = flt.op !== "is_null" && flt.op !== "not_null";
    if (needsValue && (flt.value === undefined || (Array.isArray(flt.value) && flt.value.length === 0))) {
      errors.push({ code: "missing_value", message: `Filter on '${flt.field}' requires a value` });
    }
  }
  return errors;
}

export function compile(req: ReportRequest, role: Role): CompiledReport {
  const errors = validate(req, role);
  if (errors.length > 0) {
    throw new ReportValidationError(errors);
  }
  const metric = metricById.get(req.metric)!;

  const dimCols = req.dimensions.map(d => fieldById.get(d)!.column);
  const dims = dimCols.length > 0 ? dimCols.join(", ") + "," : "";
  const dimGroup = dimCols.length > 0 ? `GROUP BY ${dimCols.join(", ")}\nORDER BY ${dimCols.join(", ")}` : "";

  const params: (string | number)[] = [];
  const clauses: string[] = [];
  for (const flt of req.filters) {
    const col = fieldById.get(flt.field)!.column;
    switch (flt.op) {
      case "eq": params.push(flt.value as string | number); clauses.push(`${col} = $${params.length}`); break;
      case "neq": params.push(flt.value as string | number); clauses.push(`${col} <> $${params.length}`); break;
      case "gte": params.push(flt.value as string | number); clauses.push(`${col} >= $${params.length}`); break;
      case "lte": params.push(flt.value as string | number); clauses.push(`${col} <= $${params.length}`); break;
      case "in": {
        const vals = flt.value as (string | number)[];
        const ph = vals.map(v => { params.push(v); return `$${params.length}`; });
        clauses.push(`${col} IN (${ph.join(", ")})`);
        break;
      }
      case "is_null": clauses.push(`${col} IS NULL`); break;
      case "not_null": clauses.push(`${col} IS NOT NULL`); break;
    }
  }
  const where = clauses.length > 0 ? clauses.join(" AND ") : "true";

  const sql = metric.sql
    .replace("{dims}", dims)
    .replace("{where}", where)
    .replace("{dimGroup}", dimGroup)
    .trim();

  const roleNotes: string[] = [];
  if (metric.officeScoped && role !== "admin") {
    roleNotes.push("Office-scoped data: results reflect your venture office only; cross-office comparison requires admin access.");
  }

  return { sql, params, metric, footer: { definition: metric.definition, exclusions: metric.exclusions, roleNotes } };
}

export class ReportValidationError extends Error {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(errors.map(e => e.message + (e.suggestion ? ` (did you mean '${e.suggestion}'?)` : "")).join("; "));
    this.name = "ReportValidationError";
    this.errors = errors;
  }
}
