import { useState } from "react";
import { Link } from "react-router-dom";
import { Bot, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader, PageContainer } from "@/components/layout/PageHeader";
import { AGENT_SKILLS, PLUGIN_LATEST, RELEASES } from "@/lib/agentSkills";

/** Intelligence · Agent — plugin distribution hub. Download is served from
 *  the private `plugins` storage bucket; storage RLS limits it to admins and
 *  VO leaders (matching the route gate). */
export default function AgentHub() {
  const [downloading, setDownloading] = useState(false);

  const downloadLatest = async () => {
    setDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from("plugins")
        .download(PLUGIN_LATEST.storagePath);
      if (error || !data) throw error ?? new Error("empty file");
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = PLUGIN_LATEST.file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Plugin download failed:", e);
      toast.error("Download failed — your role may not have access, or the file is missing.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Agent"
        subtitle="Healthliant Ventures OS — the firm's packaged operating system for Claude: contract review, deal modeling, and expense automation skills."
        officeSelector={false}
      />

      {/* Hero */}
      <div className="flex items-center gap-6 rounded-lg border border-[#e2e3ec] bg-white p-7 shadow-card">
        <div className="flex h-16 w-16 flex-none items-center justify-center rounded-[14px] bg-[#171d70]">
          <Bot className="h-9 w-9 text-[#80ccd5]" strokeWidth={1.5} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="m-0 text-[19px] font-bold text-[#171d70]">{PLUGIN_LATEST.name}</h2>
            <span className="rounded-full bg-[#e6f5f7] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#0299aa]">
              v{PLUGIN_LATEST.version} · Latest
            </span>
          </div>
          <div className="mt-1.5 text-[13px] text-[#5c6178]">
            <b className="text-[#171d70]">{AGENT_SKILLS.length} skills</b> · {AGENT_SKILLS.length} slash commands · Released{" "}
            <b className="text-[#171d70]">{PLUGIN_LATEST.releasedLabel}</b> · Compatible with Claude Cowork &amp; Claude Code
          </div>
          <span className="accent-rule mt-2.5" />
        </div>
        <div className="ml-auto flex flex-none flex-col items-end gap-2">
          <button
            type="button"
            onClick={downloadLatest}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded bg-[#171d70] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#10154f] disabled:opacity-60"
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download v{PLUGIN_LATEST.version}
          </button>
          <span className="text-[11.5px] text-[#8b8fa3]">{PLUGIN_LATEST.file} · {PLUGIN_LATEST.sizeLabel}</span>
        </div>
      </div>

      {/* Skills grid */}
      <div className="mt-10">
        <h3 className="m-0 text-base font-bold text-[#171d70]">Skills in this release</h3>
        <span className="accent-rule mt-2.5" />
        <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
          {AGENT_SKILLS.map(s => (
            <Link
              key={s.slug}
              to={`/intelligence/agent/${s.slug}`}
              className="card-lift block rounded-lg border border-[#e2e3ec] bg-white p-[18px] no-underline"
            >
              <div className="text-sm font-bold text-[#171d70]">{s.name}</div>
              <div className="mt-1.5 text-[12.5px] leading-[1.45] text-[#5c6178]">{s.tagline}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Changelog */}
      <div className="mt-10">
        <h3 className="m-0 text-base font-bold text-[#171d70]">Changelog</h3>
        <span className="accent-rule mt-2.5" />
        <div className="mt-4 border-l-[1.5px] border-[#e2e3ec] pl-[26px]">
          {RELEASES.map((rel, i) => (
            <div key={rel.version} className={`relative ${i === RELEASES.length - 1 ? "pb-1" : "pb-8"}`}>
              <span
                className={`absolute -left-[33px] top-0.5 h-3 w-3 rounded-full border-2 border-[#0299aa] ${i === 0 ? "bg-[#0299aa]" : "bg-[#e6f5f7]"}`}
              />
              <div className="flex items-baseline gap-2.5">
                <span className="text-[15px] font-bold text-[#171d70]">v{rel.version}</span>
                <span className="text-xs text-[#8b8fa3]">{rel.date}</span>
                {rel.tag && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] ${
                    rel.tag === "Latest" ? "bg-[#e6f5f7] text-[#0299aa]" : "bg-[#e8e9f1] text-[#5a5f9c]"
                  }`}>{rel.tag}</span>
                )}
              </div>
              <ul className="mb-0 mt-2 list-disc pl-[18px]">
                {rel.changes.map((c, j) => (
                  <li key={j} className="mb-1 text-[13.5px] leading-[1.55] text-[#232842]">
                    <b className="text-[#171d70]">{c.area}:</b> {c.text}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 text-xs italic text-[#8b8fa3]">
          Release dates are taken from the plugin file timestamps in the Agent archive; change summaries were cataloged by diffing each packaged version.
        </div>
      </div>
    </PageContainer>
  );
}
