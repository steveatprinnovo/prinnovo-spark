import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAllVentureOfficeLogos } from "@/hooks/useVentureOfficeLogo";
import prinnovoLogo from "@/assets/prinnovo-logo.webp";

interface VentureOfficeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  ventureOffices: string[];
  companyCounts?: Record<string, number>;
  totalCount?: number;
}

export function VentureOfficeDropdown({ 
  value, 
  onChange, 
  ventureOffices, 
  companyCounts,
  totalCount 
}: VentureOfficeDropdownProps) {
  const { logos } = useAllVentureOfficeLogos();

  const getLogoForOffice = (officeName: string): string | null => {
    const officeData = logos.find((l) => l.name === officeName);
    return officeData?.logoUrl || null;
  };

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="bg-background min-w-[360px]">
        <SelectValue placeholder="Select Venture Office" />
      </SelectTrigger>
      <SelectContent className="bg-popover z-50 min-w-[360px]">
        <SelectItem value="all">
          <div className="flex items-center gap-2">
            <img 
              src={prinnovoLogo} 
              alt="Prinnovo" 
              className="w-4 h-4 object-contain"
            />
            <span>All {totalCount !== undefined ? `(${totalCount})` : ""}</span>
          </div>
        </SelectItem>
        {ventureOffices.map((office) => {
          const logoUrl = getLogoForOffice(office);
          const count = companyCounts?.[office];
          return (
            <SelectItem key={office} value={office}>
              <div className="flex items-center gap-2">
                {logoUrl && (
                  <img 
                    src={logoUrl} 
                    alt={office} 
                    className="w-4 h-4 object-contain"
                  />
                )}
                <span>{office}{count !== undefined ? ` (${count})` : ""}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
