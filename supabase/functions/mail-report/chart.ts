/**
 * Server-side chart rendering for the email reporting channel: builds a
 * grouped bar chart (or stat card) as an SVG string, then rasterizes to PNG
 * via resvg-wasm. No DOM, no browser.
 */
import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.2";

const WASM_URL = "https://unpkg.com/@resvg/resvg-wasm@2.6.2/index_bg.wasm";
const FONT_URL = "https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxP.ttf";
export const SERIES_COLORS = ["#2a78d6", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"];

let wasmReady: Promise<void> | null = null;
let fontBytes: Uint8Array | null = null;

async function ensureRenderer(): Promise<void> {
  if (!wasmReady) {
    wasmReady = (async () => {
      const [wasm, font] = await Promise.all([
        fetch(WASM_URL).then(r => { if (!r.ok) throw new Error("wasm fetch failed"); return r.arrayBuffer(); }),
        fetch(FONT_URL).then(r => { if (!r.ok) throw new Error("font fetch failed"); return r.arrayBuffer(); }),
      ]);
      await initWasm(wasm);
      fontBytes = new Uint8Array(font);
    })();
  }
  await wasmReady;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);
const fmt = (v: number) => Math.abs(v) >= 1_000_000 ? (v / 1_000_000).toFixed(1) + "M" : Math.abs(v) >= 1_000 ? (v / 1_000).toFixed(1) + "k" : String(Math.round(v * 10) / 10);

export interface ChartSeries { name: string; color: string; values: (number | null)[] }

export function barChartSvg(title: string, subtitle: string, categories: string[], series: ChartSeries[]): string {
  const W = 960, H = 540;
  const m = { top: 76, right: 24, bottom: 96 + (series.length > 1 ? 28 : 0), left: 64 };
  const plotW = W - m.left - m.right, plotH = H - m.top - m.bottom;
  const allVals = series.flatMap(s => s.values).filter((v): v is number => v !== null && isFinite(v));
  const rawMax = Math.max(1, ...allVals.map(v => Math.abs(v)));
  const pow = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const niceMax = Math.ceil(rawMax / pow) * pow;
  const y = (v: number) => m.top + plotH - (v / niceMax) * plotH;

  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Roboto">`);
  parts.push(`<rect width="${W}" height="${H}" fill="#ffffff"/>`);
  parts.push(`<text x="${m.left}" y="34" font-size="20" font-weight="bold" fill="#1a1a2e">${esc(trunc(title, 80))}</text>`);
  parts.push(`<text x="${m.left}" y="56" font-size="12" fill="#777777">${esc(trunc(subtitle, 120))}</text>`);

  // gridlines + y ticks
  for (let i = 0; i <= 5; i++) {
    const val = (niceMax / 5) * i;
    const yy = y(val);
    parts.push(`<line x1="${m.left}" y1="${yy}" x2="${W - m.right}" y2="${yy}" stroke="#e5e5e5" stroke-width="1"/>`);
    parts.push(`<text x="${m.left - 8}" y="${yy + 4}" font-size="11" fill="#888888" text-anchor="end">${fmt(val)}</text>`);
  }

  // bars
  const groupW = plotW / Math.max(1, categories.length);
  const barW = Math.min(48, (groupW * 0.75) / series.length);
  categories.forEach((cat, ci) => {
    const cx = m.left + ci * groupW + groupW / 2;
    series.forEach((s, si) => {
      const v = s.values[ci];
      if (v === null || !isFinite(v)) return;
      const bx = cx - (series.length * barW) / 2 + si * barW;
      const by = y(Math.max(0, v));
      const bh = Math.abs(y(0) - y(v));
      parts.push(`<rect x="${bx.toFixed(1)}" y="${by.toFixed(1)}" width="${(barW - 2).toFixed(1)}" height="${Math.max(1, bh).toFixed(1)}" rx="3" fill="${s.color}"/>`);
      if (categories.length <= 12) {
        parts.push(`<text x="${(bx + (barW - 2) / 2).toFixed(1)}" y="${(by - 5).toFixed(1)}" font-size="10" fill="#555555" text-anchor="middle">${fmt(v)}</text>`);
      }
    });
    const label = trunc(cat, 16);
    const lx = cx, ly = m.top + plotH + 18;
    if (label.length > 9 || categories.length > 8) {
      parts.push(`<text x="${lx}" y="${ly}" font-size="11" fill="#555555" text-anchor="end" transform="rotate(-30 ${lx} ${ly})">${esc(label)}</text>`);
    } else {
      parts.push(`<text x="${lx}" y="${ly}" font-size="11" fill="#555555" text-anchor="middle">${esc(label)}</text>`);
    }
  });

  // axis line
  parts.push(`<line x1="${m.left}" y1="${y(0)}" x2="${W - m.right}" y2="${y(0)}" stroke="#bbbbbb" stroke-width="1.5"/>`);

  // legend
  if (series.length > 1) {
    let lx = m.left;
    const ly = H - 24;
    series.forEach(s => {
      parts.push(`<rect x="${lx}" y="${ly - 9}" width="10" height="10" rx="2" fill="${s.color}"/>`);
      const label = trunc(s.name.replace(/_/g, " "), 30);
      parts.push(`<text x="${lx + 15}" y="${ly}" font-size="11" fill="#444444">${esc(label)}</text>`);
      lx += 15 + label.length * 6.2 + 24;
    });
  }
  parts.push(`<text x="${W - m.right}" y="${H - 8}" font-size="9" fill="#aaaaaa" text-anchor="end">Prinnovo Reporting · ${new Date().toISOString().slice(0, 10)}</text>`);
  parts.push("</svg>");
  return parts.join("");
}

export function statCardSvg(title: string, subtitle: string, stats: { label: string; value: string }[]): string {
  const W = 960, cols = Math.min(3, Math.max(1, stats.length));
  const rows = Math.ceil(stats.length / cols);
  const H = 110 + rows * 110;
  const parts: string[] = [];
  parts.push(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" font-family="Roboto">`);
  parts.push(`<rect width="${W}" height="${H}" fill="#ffffff"/>`);
  parts.push(`<text x="32" y="40" font-size="20" font-weight="bold" fill="#1a1a2e">${esc(trunc(title, 80))}</text>`);
  parts.push(`<text x="32" y="62" font-size="12" fill="#777777">${esc(trunc(subtitle, 120))}</text>`);
  const cw = (W - 64) / cols;
  stats.forEach((s, i) => {
    const x = 32 + (i % cols) * cw, yy = 90 + Math.floor(i / cols) * 110;
    parts.push(`<rect x="${x}" y="${yy}" width="${cw - 16}" height="92" rx="8" fill="#f4f5f7"/>`);
    parts.push(`<text x="${x + 16}" y="${yy + 30}" font-size="12" fill="#777777">${esc(trunc(s.label.replace(/_/g, " "), 34))}</text>`);
    parts.push(`<text x="${x + 16}" y="${yy + 68}" font-size="28" font-weight="bold" fill="#1a1a2e">${esc(trunc(s.value, 22))}</text>`);
  });
  parts.push("</svg>");
  return parts.join("");
}

/** Rasterize SVG → PNG bytes (2x for crispness in mail clients). */
export async function svgToPng(svg: string): Promise<Uint8Array> {
  await ensureRenderer();
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: 1920 },
    font: { loadSystemFonts: false, fontBuffers: [fontBytes!], defaultFontFamily: "Roboto" },
  });
  return resvg.render().asPng();
}
