import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export function DashboardHeader() {
  const { signOut, user } = useAuth();
  const location = useLocation();

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
            <span className="text-lg font-semibold">Portfolio Dashboard</span>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Home
            </Link>
            <Link 
              to="/implementations" 
              className={`text-sm font-medium transition-colors hover:text-primary ${
                location.pathname === "/implementations" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Implementations
            </Link>
          </nav>
        </div>
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
      </div>
    </div>
  );
}