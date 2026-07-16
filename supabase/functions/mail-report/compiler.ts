/**
 * Report request validator + SQL compiler.
 *
 * The model emits ReportRequest objects whose every id must exist in the
 * catalog. Compilation is template substitution only — the model cannot
 * inject SQL because values are bound as parameters and identifiers come
 * exclusively from the catalog. Execution happens elsewhere, as the asking
 * user's JWT, so RLS remains the enforcement layer.
 */

import { fieldById, metricById, type Role, type DerivedMetric, type Agg, type CatalogField } from "./catalog.ts";

export interface ReportFilter {
  field: string;
  op: "eq" | "neq" | "in" | "gte" | "lte" | "is_null" | "not_null";
  value?: string | number | (string | number)[];
}

/** Curated derived-metric request (original shape — `metric` present). */
export interface MetricRequest {
  metric: string;
  dimensions: string[];
  filters: ReportFilter[];
  /** Summary statistic, only for metrics that declare aggChoices. */
  agg?: Agg;
}

/**
 * Pivot-style request (Reporting page builder): arbitrary measures over
 * catalog fields. All fields — measures, dimensions, filters — must belong
 * to the same table (no joins in v1), and each aggregation must be listed
 * in the field's catalog `aggs`.
 */
export interface AggregateRequest {
  measures: { field: string; agg: Agg }[];
  dimensions: string[];
  filters: ReportFilter[];
}

export type ReportRequest = MetricRequest | AggregateRequest;

export function isMetricRequest(r: ReportRequest): r is MetricRequest {
  return typeof (r as MetricRequest).metric === "string";
}

export interface CompiledReport {
  sql: string;
  params: (string | number)[];
  /** Present for curated-metric requests; undefined for pivot aggregates. */
  metric?: DerivedMetric;
  /** Column aliases charts should plot; everything else is table-only context. */
  chartKeys: string[];
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

/** NL models may omit empty arrays; treat missing dimensions/filters as empty. */
function normalized<T extends ReportRequest>(req: T): T {
  return { ...req, dimensions: req.dimensions ?? [], filters: req.filters ?? [] };
}

export function validate(rawReq: ReportRequest, role: Role): ValidationError[] {
  const req = normalized(rawReq);
  return isMetricRequest(req) ? validateMetric(req, role) : validateAggregate(req, role);
}

function validateMetric(req: MetricRequest, role: Role): ValidationError[] {
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
  if (req.agg !== undefined) {
    if (!metric.aggChoices) {
      errors.push({ code: "agg_not_supported", message: `Metric '${metric.id}' has fixed statistics — a summary-statistic choice does not apply` });
    } else if (!metric.aggChoices.includes(req.agg)) {
      errors.push({ code: "invalid_agg", message: `'${req.agg}' is not a valid statistic for '${metric.id}' (allowed: ${metric.aggChoices.join(", ")})` });
    }
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
  errors.push(...validateFilters(req.filters, role));
  return errors;
}

function validateAggregate(req: AggregateRequest, role: Role): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!req.measures || req.measures.length === 0) {
    errors.push({ code: "no_measures", message: "At least one measure is required" });
    return errors;
  }
  if (req.dimensions.length > 2) {
    errors.push({ code: "too_many_dimensions", message: "At most 2 dimensions are supported" });
  }
  let table: string | undefined;
  const requireField = (id: string, use: string): CatalogField | undefined => {
    const f = fieldById.get(id);
    if (!f) {
      errors.push({ code: "unknown_field", message: `Unknown ${use} '${id}'`, suggestion: nearest(id, [...fieldById.keys()]) });
      return undefined;
    }
    if (!f.roles.includes(role)) {
      errors.push({ code: "field_forbidden", message: `'${id}' is not visible to role '${role}'` });
    }
    if (table === undefined) table = f.table;
    else if (f.table !== table) {
      errors.push({ code: "cross_table", message: `'${id}' is from '${f.table}' but this report reads '${table}' — cross-table reports are not supported` });
    }
    return f;
  };
  for (const m of req.measures) {
    const f = requireField(m.field, "measure field");
    if (f && !f.aggs.includes(m.agg)) {
      errors.push({ code: "invalid_agg", message: `'${m.agg}' is not a valid aggregation for '${m.field}' (allowed: ${f.aggs.join(", ")})` });
    }
  }
  for (const dim of req.dimensions) requireField(dim, "dimension");
  for (const flt of req.filters) requireField(flt.field, "filter field");
  errors.push(...validateFilters(req.filters, role, true));
  return errors;
}

function validateFilters(filters: ReportFilter[], role: Role, skipCatalogCheck = false): ValidationError[] {
  const errors: ValidationError[] = [];
  for (const flt of filters) {
    if (!skipCatalogCheck) {
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
    }
    const needsValue = flt.op !== "is_null" && flt.op !== "not_null";
    if (needsValue && (flt.value === undefined || (Array.isArray(flt.value) && flt.value.length === 0))) {
      errors.push({ code: "missing_value", message: `Filter on '${flt.field}' requires a value` });
    }
  }
  return errors;
}

function compileFilters(filters: ReportFilter[]): { where: string; params: (string | number)[] } {
  const params: (string | number)[] = [];
  const clauses: string[] = [];
  for (const flt of filters) {
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
  return { where: clauses.length > 0 ? clauses.join(" AND ") : "true", params };
}

function officeScopeNote(officeScoped: boolean, role: Role): string[] {
  return officeScoped && role !== "admin"
    ? ["Office-scoped data: results reflect your venture office only; cross-office comparison requires admin access."]
    : [];
}

export function compile(rawReq: ReportRequest, role: Role): CompiledReport {
  const req = normalized(rawReq);
  const errors = validate(req, role);
  if (errors.length > 0) {
    throw new ReportValidationError(errors);
  }
  return isMetricRequest(req) ? compileMetric(req, role) : compileAggregate(req, role);
}

/** Select-list / GROUP BY fragments for dimensions; derived (expression)
 *  fields carry an alias so result columns stay readable and unambiguous. */
function dimFragments(dimensions: string[]): { dims: string; dimGroup: string } {
  const fields = dimensions.map(d => fieldById.get(d)!);
  const select = fields.map(f => (f.alias ? `${f.column} AS ${f.alias}` : f.column));
  const group = fields.map(f => f.alias ?? f.column);
  return {
    dims: select.length > 0 ? select.join(", ") + "," : "",
    dimGroup: group.length > 0 ? `GROUP BY ${group.join(", ")}\nORDER BY ${group.join(", ")}` : "",
  };
}

function compileMetric(req: MetricRequest, role: Role): CompiledReport {
  const metric = metricById.get(req.metric)!;

  const { dims, dimGroup } = dimFragments(req.dimensions);

  const { where, params } = compileFilters(req.filters);

  // Chosen summary statistic (validated above); metrics without aggChoices
  // carry no {agg} placeholder, so the substitution is a no-op for them.
  const agg: Agg = req.agg ?? metric.defaultAgg ?? "avg";

  const sql = metric.sql
    .replace("{dims}", dims)
    .replace("{where}", where)
    .replace("{dimGroup}", dimGroup)
    .replace(/\{agg\}/g, agg)
    .trim();

  const roleNotes = officeScopeNote(metric.officeScoped, role);
  const definition = metric.aggChoices
    ? `${metric.definition} Statistic applied: ${agg}.`
    : metric.definition;

  const chartKeys = metric.chartColumns.map(c => c.replace(/\{agg\}/g, agg));

  return {
    sql, params, metric, chartKeys,
    footer: { definition, exclusions: metric.exclusions, roleNotes },
  };
}

function aggAlias(field: CatalogField, agg: Agg): string {
  return `${agg}_${field.id.split(".").pop()}`;
}

function compileAggregate(req: AggregateRequest, role: Role): CompiledReport {
  const first = fieldById.get(req.measures[0].field)!;
  const table = first.table;
  const officeScoped = [
    ...req.measures.map(m => fieldById.get(m.field)!),
    ...req.dimensions.map(d => fieldById.get(d)!),
  ].some(f => f.officeScoped);

  const dimFields = req.dimensions.map(d => fieldById.get(d)!);
  const dimCols = dimFields.map(f => (f.alias ? `${f.column} AS ${f.alias}` : f.column));
  const groupCols = dimFields.map(f => f.alias ?? f.column);
  const measureCols = req.measures.map(m => {
    const f = fieldById.get(m.field)!;
    return `${m.agg}(${f.column}) AS ${aggAlias(f, m.agg)}`;
  });

  const { where, params } = compileFilters(req.filters);

  const select = [...dimCols, ...measureCols].join(",\n  ");
  const group = groupCols.length > 0 ? `GROUP BY ${groupCols.join(", ")}\nORDER BY ${groupCols.join(", ")}` : "";
  const sql = `SELECT ${select}\nFROM public.${table}\nWHERE ${where}\n${group}\nLIMIT 1000`.trim();

  const measureText = req.measures
    .map(m => `${m.agg} of ${fieldById.get(m.field)!.label}`)
    .join(", ");
  const definition = `Custom report over ${table}: ${measureText}` +
    (req.dimensions.length > 0 ? `, grouped by ${req.dimensions.map(d => fieldById.get(d)!.label).join(" and ")}` : "") +
    ". Aggregates ignore NULL values (count counts non-null entries).";

  const chartKeys = req.measures.map(m => aggAlias(fieldById.get(m.field)!, m.agg));

  return {
    sql, params, chartKeys,
    footer: { definition, exclusions: "NULL values are excluded by each aggregate", roleNotes: officeScopeNote(officeScoped, role) },
  };
}

export class ReportValidationError extends Error {
  errors: ValidationError[];
  constructor(errors: ValidationError[]) {
    super(errors.map(e => e.message + (e.suggestion ? ` (did you mean '${e.suggestion}'?)` : "")).join("; "));
    this.name = "ReportValidationError";
    this.errors = errors;
  }
}
