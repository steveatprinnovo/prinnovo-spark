import { Building2, BarChart3, Users, TrendingUp } from "lucide-react";

export function DashboardHeader() {
  return (
    <div className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-4">
          <img 
            src="/lovable-uploads/eca45e5a-5531-4df2-9100-f1abdac3ca74.png" 
            alt="Healthliant Ventures" 
            className="h-8 w-auto"
          />
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span>Portfolio Dashboard</span>
          </div>
        </div>
      </div>
    </div>
  );
}