/**
 * Chart export utilities for the Reporting page.
 *
 * PNG: serializes the Recharts SVG and rasterizes onto a canvas at high
 * resolution, drawing the series legend manually (Recharts legends are HTML,
 * not SVG, so they would otherwise be lost).
 * PDF: wraps the same rasterization with the report title and validation
 * footer, so an exported chart always carries its definition.
 * CSV: serializes the RLS-scoped result rows (admins and VO leaders only —
 * enforced by the caller).
 */

export interface LegendEntry {
  label: string;
  color: string;
}

const EXPORT_SCALE = 3; // ~3x on-screen resolution
const LEGEND_ROW_H = 28;
const LEGEND_PAD = 16;

export function downloadBlob(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportFilename(base: string, ext: string): string {
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "report";
  const stamp = new Date().toISOString().slice(0, 10);
  return `${slug}-${stamp}.${ext}`;
}

/** Rasterize the chart SVG (plus a drawn legend) to a canvas. */
export async function chartToCanvas(svg: SVGSVGElement, legend: LegendEntry[]): Promise<HTMLCanvasElement> {
  const rect = svg.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width));
  const height = Math.max(1, Math.round(rect.height));

  // Clone so we can pin fonts/dimensions without touching the live chart.
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.style.fontFamily = "Inter, ui-sans-serif, system-ui, sans-serif";

  const svgText = new XMLSerializer().serializeToString(clone);
  const svgUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("Could not rasterize chart"));
      i.src = svgUrl;
    });

    const legendRows = legend.length > 0 ? Math.ceil(legend.length / 4) : 0;
    const legendHeight = legendRows > 0 ? legendRows * LEGEND_ROW_H + LEGEND_PAD : 0;

    const canvas = document.createElement("canvas");
    canvas.width = width * EXPORT_SCALE;
    canvas.height = (height + legendHeight) * EXPORT_SCALE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");

    ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height + legendHeight);
    ctx.drawImage(img, 0, 0, width, height);

    if (legendRows > 0) {
      ctx.font = "12px Inter, ui-sans-serif, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      const perRow = Math.min(4, legend.length);
      const colWidth = Math.floor(width / perRow);
      legend.forEach((entry, i) => {
        const row = Math.floor(i / perRow);
        const col = i % perRow;
        const x = col * colWidth + 12;
        const y = height + LEGEND_PAD / 2 + row * LEGEND_ROW_H + LEGEND_ROW_H / 2;
        ctx.fillStyle = entry.color;
        ctx.fillRect(x, y - 5, 10, 10);
        ctx.fillStyle = "#333333";
        const label = entry.label.length > 38 ? entry.label.slice(0, 37) + "…" : entry.label;
        ctx.fillText(label, x + 16, y);
      });
    }
    return canvas;
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export async function exportChartPng(svg: SVGSVGElement, legend: LegendEntry[], filenameBase: string): Promise<void> {
  const canvas = await chartToCanvas(svg, legend);
  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("PNG encoding failed");
  downloadBlob(exportFilename(filenameBase, "png"), blob);
}

export interface PdfMeta {
  title: string;
  definition: string;
  exclusions: string;
  roleNotes: string[];
  rowCount: number;
}

export async function exportChartPdf(svg: SVGSVGElement, legend: LegendEntry[], filenameBase: string, meta: PdfMeta): Promise<void> {
  const { jsPDF } = await import("jspdf"); // lazy: only loads on demand
  const canvas = await chartToCanvas(svg, legend);
  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 40;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(meta.title, margin, margin + 4);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text(`Generated ${new Date().toLocaleString()} · ${meta.rowCount.toLocaleString()} row${meta.rowCount === 1 ? "" : "s"} · Prinnovo Reporting`, margin, margin + 20);

  // Fit the chart between the header and the footer block.
  const footerLines = pdf.splitTextToSize(
    [`Definition: ${meta.definition}`, `Excluded: ${meta.exclusions}`, ...meta.roleNotes].join("\n"),
    pageW - margin * 2,
  ) as string[];
  const footerHeight = footerLines.length * 11 + 16;

  const imgTop = margin + 36;
  const availW = pageW - margin * 2;
  const availH = pageH - imgTop - margin - footerHeight;
  const ratio = Math.min(availW / canvas.width, availH / canvas.height);
  const drawW = canvas.width * ratio;
  const drawH = canvas.height * ratio;
  pdf.addImage(imgData, "PNG", margin + (availW - drawW) / 2, imgTop, drawW, drawH);

  pdf.setFontSize(8);
  pdf.setTextColor(90);
  pdf.text(footerLines, margin, pageH - margin - footerHeight + 12);

  pdf.save(exportFilename(filenameBase, "pdf"));
}

/** CSV of the result rows exactly as returned (RLS-scoped to the caller). */
export function exportRowsCsv(rows: Record<string, unknown>[], filenameBase: string): void {
  if (rows.length === 0) return;
  const cols = Object.keys(rows[0]);
  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return "";
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [cols.map(escape).join(","), ...rows.map(r => cols.map(c => escape(r[c])).join(","))];
  downloadBlob(exportFilename(filenameBase, "csv"), new Blob(["﻿" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
}
