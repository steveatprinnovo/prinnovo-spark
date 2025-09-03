import { Building2, BarChart3, Users, TrendingUp } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="border-b bg-card">
      <div className="flex h-20 2xl:h-24 items-center px-6 2xl:px-12">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/eca45e5a-5531-4df2-9100-f1abdac3ca74.png" 
            alt="Healthliant Ventures" 
            className="h-10 2xl:h-16 w-auto"
          />
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-lg 2xl:text-2xl text-muted-foreground">
            <Building2 className="h-6 w-6 2xl:h-8 2xl:w-8" />
            <span>Portfolio Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}