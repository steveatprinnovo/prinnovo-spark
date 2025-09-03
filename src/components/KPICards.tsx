import { Card, CardContent } from "@/components/ui/card";
import { Building2, DollarSign, TrendingUp } from "lucide-react";

const kpiData = [
  {
    label: "Companies Evaluated",
    value: "900",
    icon: Building2,
    description: "Companies evaluated to date",
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
    <div className="flex flex-col justify-between h-[500px] 2xl:h-[700px] max-w-xs 2xl:max-w-md gap-4 2xl:gap-6 mr-10 2xl:mr-16">{/* Larger for 4K */}
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
            <CardContent className="p-6 2xl:p-10">
              <div className="flex items-center justify-between">
                <div className="space-y-2 2xl:space-y-4">
                  <p className="text-sm 2xl:text-lg font-medium text-white/90">
                    {kpi.label}
                  </p>
                  <p className="text-3xl 2xl:text-5xl font-bold text-white">
                    {kpi.value}
                  </p>
                  <p className="text-xs 2xl:text-base text-white/80">
                    {kpi.description}
                  </p>
                </div>
                <div className="flex h-12 w-12 2xl:h-20 2xl:w-20 items-center justify-center rounded-lg bg-white/20">
                  <Icon className="h-6 w-6 2xl:h-10 2xl:w-10 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}