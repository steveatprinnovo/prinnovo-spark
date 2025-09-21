import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Home, ClipboardList, DollarSign, TrendingUp, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navigationItems = [
  { path: "/", icon: Home, label: "Home" },
  { path: "/implementations", icon: ClipboardList, label: "Implementations" },
  { path: "/investments", icon: DollarSign, label: "Investments" },
  { path: "/projections", icon: TrendingUp, label: "Projections" },
];

export function DonutMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

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

      {/* Donut Menu */}
      {isOpen && (
        <div className="absolute top-0 left-0 z-40">
          <div className="relative w-64 h-64">
            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-background border-2 border-border rounded-full z-10" />
            
            {/* Navigation items positioned in a circle */}
            {navigationItems.map((item, index) => {
              const angle = (index * 90) - 45; // Start from top-right, 90 degrees apart
              const radian = (angle * Math.PI) / 180;
              const radius = 80;
              const x = Math.cos(radian) * radius;
              const y = Math.sin(radian) * radius;
              
              const isActive = location.pathname === item.path;
              
              return (
                <div
                  key={item.path}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                  style={{
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                  }}
                >
                  <Link to={item.path} onClick={() => setIsOpen(false)}>
                    <Button
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      className={`w-16 h-16 rounded-full flex flex-col items-center justify-center gap-1 p-2 ${
                        isActive 
                          ? "bg-primary text-primary-foreground shadow-lg" 
                          : "bg-background hover:bg-accent"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      <span className="text-xs font-medium leading-tight text-center">
                        {item.label}
                      </span>
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}