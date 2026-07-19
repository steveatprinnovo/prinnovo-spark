import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { useVentureOfficeLogo } from "@/hooks/useVentureOfficeLogo";
import { LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { navItemsForRole } from "@/lib/navigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { DonutMenu } from "./DonutMenu";
import prinnovoLogo from "@/assets/prinnovo-logo.webp";
import { PREVIEW } from "@/preview/previewMode";

export function DashboardHeader() {
  const { signOut, user } = useAuth();
  const { isAdmin, role, ventureOffice } = useUserAuth();
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
            /* Desktop Navigation Links — visibility driven by role (lib/navigation.ts) */
            <nav className="flex items-center space-x-8">
              {navItemsForRole(role, PREVIEW).map(item => {
                const active = item.path === "/dealflow"
                  ? location.pathname.startsWith("/dealflow")
                  : item.path === "/taskboard"
                    ? location.pathname.startsWith("/taskboard")
                    : location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm font-medium transition-colors hover:text-primary flex items-center gap-2 ${
                      active ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
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