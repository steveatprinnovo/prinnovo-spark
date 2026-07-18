import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, PanelLeft, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth } from "@/hooks/useUserAuth";
import { navSectionsForRole, NAV_ITEMS } from "@/lib/navigation";
import { PREVIEW } from "@/preview/previewMode";
import logoWhite from "@/assets/prinnovo-logo-white.png";
import markWhite from "@/assets/prinnovo-mark-white.svg";

const COLLAPSE_KEY = "sidebar_collapsed";

/** Brand petal header: navy shape with a straight top edge ending in a
 *  wing-tip at the top-right, concave sweep to the bottom-left, overlaid
 *  with a fading diagonal teal dash texture (redesign spec, 2026-07-18). */
function PetalHeader({ collapsed }: { collapsed: boolean }) {
  const d = collapsed
    ? "M0 0 H76 C74 42 61 75 40 94.5 C28 106 14 114 0 117 Z"
    : "M0 0 H252 C243 42 210 76.5 162 96 C121 112.5 62 123 0 125.2 Z";
  const vb = collapsed ? "0 0 76 129" : "0 0 252 129";
  return (
    <div className="relative h-[129px] flex-none">
      <svg className="absolute inset-0 block h-full w-full" viewBox={vb} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <pattern id="pv-dash" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <line x1="0" y1="0" x2="7" y2="0" stroke="#80ccd5" strokeWidth="1.4" />
          </pattern>
          <linearGradient id="pv-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
          <mask id="pv-mask"><rect x="0" y="0" width="100%" height="100%" fill="url(#pv-fade)" /></mask>
          <clipPath id="pv-clip"><path d={d} /></clipPath>
        </defs>
        <path d={d} fill="#171d70" />
        <rect x="0" y="0" width="100%" height="60%" fill="url(#pv-dash)" clipPath="url(#pv-clip)" mask="url(#pv-mask)" opacity="0.3" />
        <path d={d} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="1" />
      </svg>
      {collapsed ? (
        <img src={markWhite} alt="Prinnovo" className="absolute left-[18px] top-8 w-10" />
      ) : (
        <img src={logoWhite} alt="Prinnovo" className="absolute left-[26px] top-7 w-40" />
      )}
    </div>
  );
}

export function AppSidebar() {
  const { signOut, user } = useAuth();
  const { role } = useUserAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");

  const toggle = () => {
    setCollapsed(c => {
      localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      return !c;
    });
  };

  const handleSignOut = async () => {
    await signOut();
    localStorage.removeItem("admin_selected_venture_office");
    navigate("/auth", { replace: true });
  };

  const sections = navSectionsForRole(role, PREVIEW);
  const settingsItem = NAV_ITEMS.find(i => i.path === "/settings")!;
  const showSettings = PREVIEW || (role !== null && settingsItem.roles.includes(role));

  const isActive = (path: string) =>
    path === "/dealflow" ? location.pathname.startsWith("/dealflow")
      : path === "/taskboard" ? location.pathname.startsWith("/taskboard")
        : location.pathname === path;

  const displayName: string = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || "";
  const initials = displayName
    .split(/[\s@._-]+/).filter(Boolean).slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? "").join("") || "?";

  return (
    <aside
      className="relative z-30 flex h-screen flex-none flex-col border-r border-[#e2e3ec] bg-[#f7f8fb]"
      style={{ width: collapsed ? 76 : 252, transition: "width .25s ease" }}
    >
      <PetalHeader collapsed={collapsed} />

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 pt-2.5">
        {sections.map((sec, si) => (
          <div key={sec.label ?? "top"} className={si === 0 ? "" : "mt-4"}>
            {sec.label && !collapsed && (
              <div className="section-label whitespace-nowrap px-2.5 pb-[7px]">{sec.label}</div>
            )}
            {sec.items.map(item => {
              const active = isActive(item.path);
              const showChildren = !!item.children && !collapsed && location.pathname.startsWith(item.path);
              return (
                <div key={item.path}>
                  <Link
                    to={item.path}
                    title={item.label}
                    className={`flex items-center gap-[11px] rounded-md px-2.5 py-2 text-sm transition-colors ${
                      collapsed ? "justify-center" : ""
                    } ${active
                      ? "bg-[#e6f5f7] font-semibold text-[#171d70]"
                      : "text-[#5c6178] hover:bg-[#eceef5]"}`}
                  >
                    <item.icon
                      className="h-[17px] w-[17px] flex-none"
                      strokeWidth={1.5}
                      style={{ color: active ? "#0299aa" : "#8b8fa3" }}
                    />
                    {!collapsed && <span className="flex-1 whitespace-nowrap">{item.label}</span>}
                  </Link>
                  {showChildren && (
                    <div className="my-0.5 ml-[18px] flex flex-col border-l-[1.5px] border-[#e2e3ec]">
                      {item.children!.map(ch => {
                        const childActive = location.pathname === ch.path;
                        return (
                          <Link
                            key={ch.path}
                            to={ch.path}
                            className={`-ml-[1.5px] border-l-2 py-[6.5px] pl-3 pr-2 text-[13.5px] transition-colors hover:text-[#171d70] ${
                              childActive
                                ? "border-[#0299aa] font-semibold text-[#171d70]"
                                : "border-transparent text-[#5c6178]"
                            }`}
                          >
                            {ch.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom block: Settings + collapse toggle */}
      <div className={`flex flex-none gap-1 px-3 pb-2 ${collapsed ? "flex-col items-center" : "flex-row items-center"}`}>
        {showSettings && (
          <Link
            to="/settings"
            title="Settings"
            className={`order-1 flex min-w-0 items-center gap-[11px] rounded-md px-2.5 py-2 text-sm transition-colors ${
              collapsed ? "justify-center" : "flex-1 self-stretch"
            } ${isActive("/settings")
              ? "bg-[#e6f5f7] font-semibold text-[#171d70]"
              : "text-[#5c6178] hover:bg-[#eceef5]"}`}
          >
            <Settings className="h-[17px] w-[17px] flex-none" strokeWidth={1.5} style={{ color: isActive("/settings") ? "#0299aa" : "#8b8fa3" }} />
            {!collapsed && <span className="whitespace-nowrap">Settings</span>}
          </Link>
        )}
        <button
          type="button"
          onClick={toggle}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          className={`flex h-8 w-8 flex-none items-center justify-center self-center rounded-md text-[#8b8fa3] transition-colors hover:bg-[#eceef5] hover:text-[#171d70] ${collapsed ? "order-0" : "order-2"}`}
        >
          <PanelLeft className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {/* User card */}
      <div className={`flex flex-none items-center gap-2.5 border-t border-[#e2e3ec] p-3 ${collapsed ? "justify-center" : ""}`}>
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#171d70] text-xs font-semibold text-white">
          {initials}
        </div>
        {!collapsed && (
          <>
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <div className="truncate text-[13px] font-semibold text-[#171d70]">
                {user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email}
              </div>
              {(user?.user_metadata?.full_name || user?.user_metadata?.name) && (
                <div className="truncate text-[11.5px] text-[#8b8fa3]">{user?.email}</div>
              )}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              aria-label="Sign out"
              className="flex h-8 w-8 flex-none items-center justify-center rounded-md text-[#8b8fa3] transition-colors hover:bg-[#eceef5] hover:text-[#171d70]"
            >
              <LogOut className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
