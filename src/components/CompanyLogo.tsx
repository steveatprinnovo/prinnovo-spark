import { useState } from "react";

// Company logo resolved from the deal's own website domain — the domain is the
// verification. Provenance chain:
//   1. Logo.dev (transparent brand logos) when VITE_LOGODEV_KEY is set
//   2. Google favicon service (keyless fallback, lower fidelity)
//   3. Nothing (renders null) — never a wrong-company guess by name.
// PitchBook MCP provides no logo assets, so logos cannot come from enrichment.

const LOGODEV_KEY = import.meta.env.VITE_LOGODEV_KEY as string | undefined;

export function domainFromWebsite(website: string | null): string | null {
  if (!website) return null;
  const d = website.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0].trim().toLowerCase();
  return d.includes(".") ? d : null;
}

export function CompanyLogo({ website, name, size = 24, className = "" }: {
  website: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  const domain = domainFromWebsite(website);
  const sources: string[] = [];
  if (domain && LOGODEV_KEY) sources.push(`https://img.logo.dev/${domain}?token=${LOGODEV_KEY}&size=${size * 2}&format=png`);
  if (domain) sources.push(`https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=${size * 2}`);
  const [idx, setIdx] = useState(0);

  if (!domain || idx >= sources.length) return null;
  return (
    <img
      src={sources[idx]}
      alt={name}
      title={name}
      width={size}
      height={size}
      className={`object-contain rounded-sm shrink-0 ${className}`}
      onError={() => setIdx(i => i + 1)}
    />
  );
}
