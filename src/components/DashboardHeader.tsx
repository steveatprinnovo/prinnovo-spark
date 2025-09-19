import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, Home, ClipboardList, DollarSign, ChevronDown, Presentation, TrendingUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-lg font-semibold p-0 h-auto hover:bg-transparent flex items-center gap-1">
                  {location.pathname === "/board-mode" ? (
                    <>
                      <img 
                        src="/lovable-uploads/7ba62feb-acbf-4b79-8e35-bab2872dce29.png" 
                        alt="Board Meeting" 
                        className="h-5 w-5" 
                      />
                      <ChevronDown className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Portfolio Dashboard
                      <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-popover z-50">
                <DropdownMenuItem asChild>
                  <Link to="/" className="w-full">
                    Portfolio Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/board-mode" className="w-full">
                    Board Mode
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Navigation Links */}
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