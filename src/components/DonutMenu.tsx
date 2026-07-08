import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ClipboardList, DollarSign, TrendingUp, Target, Settings, Menu, X, LogOut, Layers, Kanban } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const navigationItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/implementations", icon: ClipboardList, label: "Implementations" },
  { path: "/investments", icon: DollarSign, label: "Investments" },
  { path: "/projections", icon: TrendingUp, label: "Projections" },
  { path: "/focus-areas", icon: Target, label: "Focus Areas" },
  { path: "/dealflow", icon: Layers, label: "Dealflow CRM" },
  { path: "/taskboard", icon: Kanban, label: "IT Taskboard" },
  { path: "/settings", icon: Settings, label: "Settings" },
];


export function DonutMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { user, signOut } = useAuth();

  const toggleMenu = () => setIsOpen(!isOpen);

  return (
    <div className="relative">
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleMenu}
        className="relative z-50"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Container */}
      {isOpen && (
        <div className="fixed top-20 right-4 z-40 bg-background border border-border rounded-lg shadow-lg p-4 w-64">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Navigation</h3>
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-accent text-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* User Section */}
          <div className="pt-3 border-t border-border">
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {user?.email}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                signOut();
                setIsOpen(false);
              }}
              className="w-full gap-2 justify-start"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}