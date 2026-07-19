import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowDown, CornerDownRight } from "lucide-react";
import { PageHeader, PageContainer } from "@/components/layout/PageHeader";
import { PLUGIN_LATEST, skillBySlug, type FlowNode } from "@/lib/agentSkills";

/** Vertical logic-path infographic for a skill (Intelligence · Agent).
 *  Node kinds: step (navy), decision (teal, with branch chips), gate
 *  (teal-tint outline quality gate with loop note), optional (dashed),
 *  deliver (green). */
function FlowDiagram({ flow }: { flow: FlowNode[] }) {
  return (
    <div className="mx-auto flex max-w-[620px] flex-col items-stretch">
      {flow.map((node, i) => (
        <div key={i} className="flex flex-col items-center">
          {i > 0 && (
            <div className="flex flex-col items-center py-1.5 text-[#8b8fa3]">
              <ArrowDown className="h-4 w-4" strokeWidth={1.5} />
            </div>
          )}

          {node.kind === "step" && (
            <div className="w-full rounded-lg bg-[#171d70] px-6 py-4 text-center">
              <div className="text-[13.5px] font-semibold text-white">{i + 1} · {node.title}</div>
              {node.sub && <div className="mt-1 text-[11.5px] text-[#b3e0e6]">{node.sub}</div>}
            </div>
          )}

          {node.kind === "decision" && (
            <div className="w-full">
              <div className="rounded-lg bg-[#0299aa] px-6 py-4 text-center">
                <div className="text-[13.5px] font-semibold text-white">{i + 1} · {node.title}</div>
                {node.sub && <div className="mt-1 text-[11.5px] text-[#e6f5f7]">{node.sub}</div>}
              </div>
              <div className={`mt-2.5 grid gap-2 ${node.branches.length === 4 ? "grid-cols-2 lg:grid-cols-4" : node.branches.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                {node.branches.map((b, j) => (
                  <div key={j} className="rounded-md bg-[#e8e9f1] px-3 py-2.5 text-center">
                    <div className="text-[11.5px] font-semibold text-[#5a5f9c]">{b.label}</div>
                    {b.sub && <div className="mt-0.5 text-[10.5px] text-[#8b8fa3]">{b.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {node.kind === "gate" && (
            <div className="w-full rounded-lg border-2 border-[#0299aa] bg-[#e6f5f7] px-6 py-4 text-center">
              <div className="text-[13.5px] font-semibold text-[#171d70]">{i + 1} · {node.title}</div>
              {node.sub && <div className="mt-1 text-[11.5px] text-[#5c6178]">{node.sub}</div>}
              {node.loopNote && (
                <div className="mt-2 inline-flex items-center gap-1.5 text-[10.5px] italic text-[#b3413f]">
                  <CornerDownRight className="h-3 w-3" strokeWidth={1.5} /> {node.loopNote}
                </div>
              )}
            </div>
          )}

          {node.kind === "optional" && (
            <div className="w-full rounded-lg border-[1.5px] border-dashed border-[#b9bbd4] bg-white px-6 py-3.5 text-center">
              <div className="text-[12.5px] font-semibold text-[#5a5f9c]">{node.title}</div>
              {node.sub && <div className="mt-0.5 text-[10.5px] text-[#8b8fa3]">{node.sub}</div>}
            </div>
          )}

          {node.kind === "deliver" && (
            <div className="w-full rounded-lg bg-[#2e7d5b] px-6 py-4 text-center">
              <div className="text-[13.5px] font-semibold text-white">{node.title}</div>
              {node.sub && <div className="mt-1 text-[11.5px] text-[#d9f0e5]">{node.sub}</div>}
            </div>
          )}
        </div>
      ))}
    </div>
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
