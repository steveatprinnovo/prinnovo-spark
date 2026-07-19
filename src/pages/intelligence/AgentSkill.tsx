import { useMemo } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { PageHeader, PageContainer } from "@/components/layout/PageHeader";
import { PLUGIN_LATEST, skillBySlug, type FlowNode } from "@/lib/agentSkills";

/**
 * Spatial (serpentine) logic-path infographic for a skill — Intelligence ·
 * Agent. Nodes flow left-to-right, wrap down, and return right-to-left,
 * matching the approved preview diagram rather than a plain vertical stack.
 * Node kinds: step (navy), decision (teal + branch chips), gate (teal-tint
 * outline with a dashed revision-loop arc), optional (dashed), deliver
 * (green). Rendered as one responsive SVG; text lives in foreignObject so
 * it wraps naturally.
 */

const CANVAS_W = 960;
const COLS = 3;
const BOX_W = 272;
const COL_X = [8, 332, 656]; // 3 columns, 52px gutters, 8px margins
const ROW_GAP = 58;

function nodeHeight(n: FlowNode): number {
  switch (n.kind) {
    case "decision": {
      const chipRows = Math.ceil(n.branches.length / 2);
      return 58 + 6 + chipRows * 42;
    }
    case "gate": return n.loopNote ? 96 : 72;
    case "optional": return 58;
    default: return 64; // step, deliver
  }
}

interface Placed {
  node: FlowNode;
  x: number;
  y: number;
  h: number;
  numbered?: number;
}

function layout(flow: FlowNode[]): { cells: Placed[]; height: number } {
  const cells: Placed[] = [];
  let y = 4;
  let num = 0;
  for (let i = 0; i < flow.length; i += COLS) {
    const row = flow.slice(i, i + COLS);
    const rowH = Math.max(...row.map(nodeHeight));
    const rowIdx = Math.floor(i / COLS);
    row.forEach((node, j) => {
      const col = rowIdx % 2 === 0 ? j : COLS - 1 - j;
      const numbered = node.kind === "step" || node.kind === "decision" || node.kind === "gate" ? ++num : undefined;
      cells.push({ node, x: COL_X[col], y, h: nodeHeight(node), numbered });
    });
    y += rowH + ROW_GAP;
  }
  return { cells, height: y - ROW_GAP + 8 };
}

function Connector({ a, b }: { a: Placed; b: Placed }) {
  if (a.y === b.y) {
    const leftToRight = a.x < b.x;
    const x1 = leftToRight ? a.x + BOX_W : a.x;
    const x2 = leftToRight ? b.x : b.x + BOX_W;
    return <line x1={x1} y1={a.y + a.h / 2} x2={x2} y2={b.y + b.h / 2} stroke="#8b8fa3" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />;
  }
  // row wrap: down from bottom-center of a to top-center of b (same column)
  return <line x1={a.x + BOX_W / 2} y1={a.y + a.h} x2={b.x + BOX_W / 2} y2={b.y} stroke="#8b8fa3" strokeWidth="1.5" markerEnd="url(#flow-arrow)" />;
}

/** Dashed revision-loop from a gate back to the previous node.
 *  Design rules (2026-07-19 label-overlap fix):
 *  - endpoints are offset 68px off the box centerlines so the loop's
 *    arrowhead never stacks on a main-flow arrowhead;
 *  - the label sits INSIDE the arc's bow (between the curve apex and the
 *    box edge), never on the curve, with a white halo for legibility;
 *  - the arc bows above the row when there is headroom, below it when the
 *    pair sits on the top row. */
function LoopArc({ from, to, note }: { from: Placed; to: Placed; note: string }) {
  const dir = to.x > from.x ? 1 : -1;
  const x1 = from.x + BOX_W / 2 + dir * 68;
  const x2 = to.x + BOX_W / 2 - dir * 68;
  const midX = (x1 + x2) / 2;
  const lift = 48;
  const halo = { paintOrder: "stroke" as const, stroke: "#ffffff", strokeWidth: 3.5, strokeLinejoin: "round" as const };
  const roomAbove = Math.min(from.y, to.y) > lift + 6;
  if (roomAbove) {
    const boxTop = Math.min(from.y, to.y);
    const ctrlY = boxTop - lift; // curve apex ≈ boxTop - 36
    const d = `M ${x1} ${from.y} C ${x1} ${ctrlY}, ${x2} ${ctrlY}, ${x2} ${to.y}`;
    return (
      <g>
        <path d={d} fill="none" stroke="#b3413f" strokeWidth="1.3" strokeDasharray="5 4" markerEnd="url(#flow-arrow-red)" />
        <text x={midX} y={boxTop - 12} textAnchor="middle" fontSize="10.5" fontStyle="italic" fill="#b3413f" style={halo}>{note}</text>
      </g>
    );
  }
  const y1 = from.y + from.h;
  const y2 = to.y + to.h;
  const boxBottom = Math.max(y1, y2);
  const ctrlY = boxBottom + 40; // curve nadir ≈ boxBottom + 30
  const d = `M ${x1} ${y1} C ${x1} ${ctrlY}, ${x2} ${ctrlY}, ${x2} ${y2}`;
  return (
    <g>
      <path d={d} fill="none" stroke="#b3413f" strokeWidth="1.3" strokeDasharray="5 4" markerEnd="url(#flow-arrow-red)" />
      <text x={midX} y={boxBottom + 16} textAnchor="middle" fontSize="10.5" fontStyle="italic" fill="#b3413f" style={halo}>{note}</text>
    </g>
  );
}

function NodeBox({ cell, showInlineLoop }: { cell: Placed; showInlineLoop: boolean }) {
  const { node, x, y, h, numbered } = cell;
  const title = numbered ? `${numbered} · ${node.title}` : node.title;

  if (node.kind === "decision") {
    const chipRows = Math.ceil(node.branches.length / 2);
    const chipW = (BOX_W - 6) / 2;
    return (
      <g>
        <rect x={x} y={y} width={BOX_W} height={52} rx={8} fill="#0299aa" />
        <foreignObject x={x} y={y} width={BOX_W} height={52}>
          <div className="flex h-full flex-col items-center justify-center px-3 text-center">
            <div className="text-[12.5px] font-semibold leading-tight text-white">{title}</div>
            {node.sub && <div className="mt-0.5 text-[10px] leading-tight text-[#e6f5f7]">{node.sub}</div>}
          </div>
        </foreignObject>
        {node.branches.map((b, j) => {
          const row = Math.floor(j / 2);
          const colInRow = j % 2;
          const isLastOdd = node.branches.length % 2 === 1 && j === node.branches.length - 1;
          const bw = isLastOdd ? BOX_W : chipW;
          const bx = isLastOdd ? x : x + colInRow * (chipW + 6);
          const by = y + 58 + row * 42;
          return (
            <g key={j}>
              <rect x={bx} y={by} width={bw} height={38} rx={6} fill="#e8e9f1" />
              <foreignObject x={bx} y={by} width={bw} height={38}>
                <div className="flex h-full flex-col items-center justify-center px-2 text-center">
                  <div className="text-[10.5px] font-semibold leading-tight text-[#5a5f9c]">{b.label}</div>
                  {b.sub && <div className="text-[9px] leading-tight text-[#8b8fa3]">{b.sub}</div>}
                </div>
              </foreignObject>
            </g>
          );
        })}
      </g>
    );
  }

  const fill = node.kind === "step" ? "#171d70" : node.kind === "deliver" ? "#2e7d5b" : node.kind === "gate" ? "#e6f5f7" : "#ffffff";
  const titleColor = node.kind === "gate" ? "#171d70" : node.kind === "optional" ? "#5a5f9c" : "#ffffff";
  const subColor = node.kind === "step" ? "#b3e0e6" : node.kind === "deliver" ? "#d9f0e5" : node.kind === "gate" ? "#5c6178" : "#8b8fa3";

  return (
    <g>
      <rect
        x={x} y={y} width={BOX_W} height={h} rx={8} fill={fill}
        stroke={node.kind === "gate" ? "#0299aa" : node.kind === "optional" ? "#b9bbd4" : "none"}
        strokeWidth={node.kind === "gate" ? 2 : node.kind === "optional" ? 1.5 : 0}
        strokeDasharray={node.kind === "optional" ? "5 4" : undefined}
      />
      <foreignObject x={x} y={y} width={BOX_W} height={h}>
        <div className="flex h-full flex-col items-center justify-center px-3 text-center">
          <div className="text-[12.5px] font-semibold leading-tight" style={{ color: titleColor }}>{title}</div>
          {node.sub && <div className="mt-1 text-[10px] leading-tight" style={{ color: subColor }}>{node.sub}</div>}
          {node.kind === "gate" && node.loopNote && showInlineLoop && (
            <div className="mt-1.5 text-[9.5px] italic leading-tight text-[#b3413f]">↺ {node.loopNote}</div>
          )}
        </div>
      </foreignObject>
    </g>
  );
}

export function FlowDiagram({ flow }: { flow: FlowNode[] }) {
  const { cells, height } = useMemo(() => layout(flow), [flow]);
  return (
    <svg viewBox={`0 0 ${CANVAS_W} ${height}`} className="block h-auto w-full" role="img" aria-label="Skill logic path diagram">
      <defs>
        <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#8b8fa3" />
        </marker>
        <marker id="flow-arrow-red" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" fill="#b3413f" />
        </marker>
      </defs>
      {cells.slice(1).map((cell, i) => <Connector key={`c${i}`} a={cells[i]} b={cell} />)}
      {cells.map((cell, i) => {
        const arcable = cell.node.kind === "gate" && !!cell.node.loopNote && i > 0 && cells[i - 1].y === cell.y;
        return arcable
          ? <LoopArc key={`l${i}`} from={cell} to={cells[i - 1]} note={(cell.node as { loopNote: string }).loopNote} />
          : null;
      })}
      {cells.map((cell, i) => {
        const hasArc = cell.node.kind === "gate" && !!cell.node.loopNote && i > 0 && cells[i - 1].y === cell.y;
        return <NodeBox key={`n${i}`} cell={cell} showInlineLoop={!hasArc} />;
      })}
    </svg>
  );
}

const LEGEND = [
  { swatch: "bg-[#171d70]", label: "Process step" },
  { swatch: "bg-[#0299aa]", label: "Decision / classification" },
  { swatch: "bg-[#e6f5f7] border border-[#0299aa]", label: "Quality gate" },
  { swatch: "bg-[#2e7d5b]", label: "Deliverable" },
];

export default function AgentSkill() {
  const { slug } = useParams<{ slug: string }>();
  const skill = slug ? skillBySlug.get(slug) : undefined;
  if (!skill) return <Navigate to="/intelligence/agent" replace />;

  return (
    <PageContainer>
      <div className="mb-2.5 text-[12.5px] text-[#8b8fa3]">
        <Link to="/intelligence/agent" className="text-[#0299aa] no-underline hover:text-[#027e8c]">Agent</Link>
        {" / "}{skill.name}
      </div>
      <PageHeader title={skill.name} subtitle={skill.tagline} officeSelector={false} />

      <div className="-mt-3 mb-1 flex gap-2">
        <span className="rounded-full bg-[#e6f5f7] px-2.5 py-0.5 text-[11px] font-semibold text-[#0299aa]">v{PLUGIN_LATEST.version}</span>
        <span className="rounded-full bg-[#e8e9f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#5a5f9c]">{skill.command}</span>
        <span className="rounded-full bg-[#e8e9f1] px-2.5 py-0.5 text-[11px] font-semibold text-[#5a5f9c]">Output: {skill.output}</span>
      </div>

      {/* Description */}
      <div className="mt-6 rounded-lg border border-[#e2e3ec] bg-white p-7 shadow-card">
        <h3 className="m-0 text-base font-bold text-[#171d70]">What this skill does</h3>
        <span className="accent-rule mb-4 mt-2.5" />
        {skill.summary.map((p, i) => (
          <p key={i} className="mb-3 mt-0 text-sm leading-[1.65] text-[#232842]">{p}</p>
        ))}
        <div className="mt-1.5 grid grid-cols-1 gap-x-6 md:grid-cols-2">
          {skill.facts.map((f, i) => (
            <div key={i} className="flex justify-between gap-3 border-b border-[#f0f1f6] py-2 text-[13px] text-[#5c6178]">
              <span>{f.label}</span>
              <b className="text-right font-semibold text-[#171d70]">{f.value}</b>
            </div>
          ))}
        </div>
      </div>

      {/* Logic path */}
      <div className="mt-6 rounded-lg border border-[#e2e3ec] bg-white p-7 shadow-card">
        <h3 className="m-0 text-base font-bold text-[#171d70]">How it works — logic path</h3>
        <span className="accent-rule mb-3.5 mt-2.5" />
        <div className="mb-5 flex flex-wrap gap-4 text-[11.5px] text-[#5c6178]">
          {LEGEND.map((l, i) => (
            <span key={i} className="inline-flex items-center gap-1.5">
              <span className={`inline-block h-2.5 w-2.5 rounded-[3px] ${l.swatch}`} /> {l.label}
            </span>
          ))}
        </div>
        <FlowDiagram flow={skill.flow} />
      </div>
    </PageContainer>
  );
}
