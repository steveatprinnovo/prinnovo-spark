import { useAllVentureOfficeLogos } from "@/hooks/useVentureOfficeLogo";
import { PREVIEW } from "@/preview/previewMode";
import previewLogos from "@/preview/preview-office-logos.json";

// Venture office name/code with its logo, matching the VentureOfficeDropdown
// pattern used on the other pages (logo left of the name).

const CODES: Record<string, string> = {
  "Cone Health Ventures": "CHV",
  "Healthliant Ventures": "HLV",
  "Northeast Georgia Health Ventures": "NGHV",
  "Salinas Valley Health Ventures": "SVHV",
};

export function useOfficeLogo(officeName: string | null): string | null {
  const { logos } = useAllVentureOfficeLogos();
  if (!officeName) return null;
  if (PREVIEW) return (previewLogos as Record<string, string>)[officeName] || null;
  return logos.find(l => l.name === officeName)?.logoUrl || null;
}

export function OfficeTag({ office, short = false, className = "" }: {
  office: string | null;
  short?: boolean;          // render CHV instead of Cone Health Ventures
  className?: string;
}) {
  const logoUrl = useOfficeLogo(office);
  if (!office) return <span className="text-muted-foreground">—</span>;
  const label = short ? (CODES[office] || office) : office;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {logoUrl && <img src={logoUrl} alt={office} title={office} className="w-4 h-4 object-contain shrink-0" />}
      <span>{label}</span>
    </span>
  );
}
