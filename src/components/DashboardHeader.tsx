import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { useVentureOfficeLogo } from "@/hooks/useVentureOfficeLogo";
import { LogOut, Home, ClipboardList, DollarSign, TrendingUp, Target, Settings, Layers, Kanban } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { DonutMenu } from "./DonutMenu";
import prinnovoLogo from "@/assets/prinnovo-logo.webp";
import { PREVIEW } from "@/preview/previewMode";

export function DashboardHeader() {
  const { signOut, user } = useAuth();
  const { isAdmin, ventureOffice } = useUserAuth();
  const { selectedVentureOffice } = useAdminVentureOffice();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSignOut = async () => {
    await signOut();
    // Clear any local storage related to admin selection
    localStorage.removeItem("admin_selected_venture_office");
    // Force navigation to auth page
    navigate("/auth", { replace: true });
  };

  // Determine which venture office to get logo for
  const effectiveVentureOffice = isAdmin ? selectedVentureOffice : ventureOffice;
  const { logoUrl } = useVentureOfficeLogo(effectiveVentureOffice);

  // Determine which logo to show
  const getLogoSrc = () => {
    if (isAdmin && (!selectedVentureOffice || selectedVentureOffice === "all")) {
      return prinnovoLogo;
    }
    if (logoUrl) {
      return logoUrl;
    }
    // Fallback to default
    return "/uploads/eca45e5a-5531-4df2-9100-f1abdac3ca74.png";
  };

  const getLogoAlt = () => {
    if (isAdmin && (!selectedVentureOffice || selectedVentureOffice === "all")) {
      return "Prinnovo";
    }
    return effectiveVentureOffice || "Portfolio Dashboard";
  };

  return (
    <div className="border-b bg-card">
      <div className="flex h-16 items-center px-6">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-4">
            <img 
              src={getLogoSrc()} 
              alt={getLogoAlt()} 
              className="h-8 w-auto"
            />
          </div>
          
          {/* Navigation - Desktop vs Mobile/Tablet */}
          {!isMobile ? (
            /* Desktop Navigation Links */
            <nav className="flex items-center space-x-8">
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
              <Link 
                to="/focus-areas" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                  location.pathname === "/focus-areas" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Target className="h-4 w-4" />
                Focus Areas
              </Link>
              <Link
                to="/dealflow"
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                  location.pathname.startsWith("/dealflow") ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Layers className="h-4 w-4" />
                Dealflow
              </Link>
              {(isAdmin || PREVIEW) && (
                <Link
                  to="/taskboard"
                  className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                    location.pathname === "/taskboard" ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  <Kanban className="h-4 w-4" />
                  Taskboard
                </Link>
              )}
              <Link 
                to="/settings" 
                className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                  location.pathname === "/settings" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Settings className="h-4 w-4" />
                Settings
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
            {user?.user_metadata?.full_name || user?.user_metadata?.name ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-sm text-muted-foreground cursor-default">
                      {user?.user_metadata?.full_name || user?.user_metadata?.name}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{user?.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <span className="text-sm text-muted-foreground">
                {user?.email}
              </span>
            )}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
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