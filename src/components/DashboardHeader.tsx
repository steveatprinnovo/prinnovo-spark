import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Home, ClipboardList, DollarSign, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { DonutMenu } from "./DonutMenu";

export function DashboardHeader() {
  const { signOut, user } = useAuth();
  const location = useLocation();
  const isMobile = useIsMobile();

  return (
    <div className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-4">
            <img 
              src="/lovable-uploads/eca45e5a-5531-4df2-9100-f1abdac3ca74.png" 
              alt="Healthliant Ventures" 
              className="h-8 w-auto"
            />
            {/* Desktop only - Portfolio title */}
            {!isMobile && (
              <h1 className="text-lg font-semibold">Portfolio Dashboard</h1>
            )}
          </div>
          
          {/* Navigation - Desktop vs Mobile/Tablet */}
          {!isMobile ? (
            /* Desktop Navigation Links */
            <nav className="flex items-center space-x-6">
              <Link 
                to="/" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                  location.pathname === "/" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link 
                to="/implementations" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                  location.pathname === "/implementations" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                Implementations
              </Link>
              <Link 
                to="/investments" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                  location.pathname === "/investments" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <DollarSign className="h-4 w-4" />
                Investments
              </Link>
              <Link 
                to="/projections" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                  location.pathname === "/projections" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Projections
              </Link>
            </nav>
          ) : (
            /* Mobile/Tablet Donut Menu */
            <DonutMenu />
          )}
        </div>
        {/* Desktop only - User section */}
        {!isMobile && (
          <div className="ml-auto flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              {user?.email}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={signOut}
              className="gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}