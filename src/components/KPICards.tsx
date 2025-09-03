import { Card, CardContent } from "@/components/ui/card";
import { Building2, DollarSign, TrendingUp } from "lucide-react";

const kpiData = [
  {
    label: "Companies Evaluated",
    value: "900",
    icon: Building2,
    description: "Total companies evaluated by Healthliant Ventures",
    gradient: "var(--gradient-primary)"
  },
  {
    label: "Direct Investment",
    value: "$4,087,500",
    icon: DollarSign,
    description: "Total amount directly invested to date",
    gradient: "var(--gradient-accent)"
  },
  {
    label: "Portfolio Value",
    value: "$17,985,975",
    icon: TrendingUp,
    description: "Total portfolio investment value",
    gradient: "var(--gradient-primary)"
  }
];

export function KPICards() {
  return (
    <div className="flex flex-col justify-between h-[500px] max-w-xs gap-4">{/* Match map height and distribute vertically */}
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card 
            key={index} 
            className="relative overflow-hidden transition-all duration-300 hover:shadow-lg border-0 flex-1"
            style={{ 
              background: kpi.gradient,
              boxShadow: "var(--shadow-kpi)"
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/90">
                    {kpi.label}
                  </p>
                  <p className="text-3xl font-bold text-white">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-white/80">
                    {kpi.description}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/20">
                  <Icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}