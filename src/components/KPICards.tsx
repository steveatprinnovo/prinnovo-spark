import { Building2, DollarSign, TrendingUp } from "lucide-react";
import { useVentureOfficeDetails } from "@/hooks/useVentureOfficeDetails";

interface KPICardsProps {
  selectedVentureOffice?: string;
}

export function KPICards({ selectedVentureOffice }: KPICardsProps) {
  const { details } = useVentureOfficeDetails(selectedVentureOffice);

  const kpiData = [
    {
      label: "Companies Evaluated",
      value: details?.["Companies Evaluated"]?.toString() || "0",
      icon: Building2,
      description: "Companies evaluated to date",
      background: "#171d70",
      shadow: "0 4px 16px rgba(23,29,112,.14)",
      iconBg: "rgba(255,255,255,.12)",
      iconColor: "text-[#80ccd5]",
      labelOpacity: "text-white/70",
      descOpacity: "text-white/55"
    },
    {
      label: "Direct Cash Investment",
      value: "$4,087,500",
      icon: DollarSign,
      description: "Non-IPA cash purchases of company equity",
      background: "#0299aa",
      shadow: "0 4px 16px rgba(2,153,170,.18)",
      iconBg: "rgba(255,255,255,.14)",
      iconColor: "text-white",
      labelOpacity: "text-white/80",
      descOpacity: "text-white/65"
    },
    {
      label: "Portfolio Value",
      value: "$17,985,975",
      icon: TrendingUp,
      description: "Total portfolio investment value",
      background: "#0b0e3a",
      shadow: "0 4px 16px rgba(11,14,58,.2)",
      iconBg: "rgba(255,255,255,.1)",
      iconColor: "text-[#80ccd5]",
      labelOpacity: "text-white/70",
      descOpacity: "text-white/55"
    }
  ];

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-4">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <div
            key={index}
            className="flex flex-1 items-center justify-between gap-3.5 rounded-lg p-[22px] text-white"
            style={{ background: kpi.background, boxShadow: kpi.shadow }}
          >
            <div className="min-w-0">
              <p className={`m-0 text-[11.5px] font-semibold uppercase tracking-[0.14em] ${kpi.labelOpacity}`}>
                {kpi.label}
              </p>
              <p className="mb-1 mt-1.5 text-[30px] font-bold leading-none text-white">
                {kpi.value}
              </p>
              <p className={`m-0 text-xs ${kpi.descOpacity}`}>
                {kpi.description}
              </p>
            </div>
            <div
              className="flex h-11 w-11 flex-none items-center justify-center rounded-lg"
              style={{ background: kpi.iconBg }}
            >
              <Icon className={`h-5 w-5 ${kpi.iconColor}`} strokeWidth={1.5} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
