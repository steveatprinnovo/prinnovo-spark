import { Home, ClipboardList, DollarSign, TrendingUp, Target, Settings, Layers, Kanban, LucideIcon } from "lucide-react";
import { AppRole } from "@/hooks/useUserAuth";

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  roles: AppRole[];
}

/** Single source of truth for navigation visibility. Mirrors the RoleGate
 *  allow-lists in App.tsx and the RLS matrix (RBAC design, 2026-07-14). */
export const NAV_ITEMS: NavItem[] = [
  { path: "/", icon: Home, label: "Home", roles: ["admin", "user", "vo_leader"] },
  { path: "/implementations", icon: ClipboardList, label: "Implementations", roles: ["admin", "user", "vo_leader", "technical"] },
  { path: "/investments", icon: DollarSign, label: "Investments", roles: ["admin", "user", "vo_leader"] },
  { path: "/projections", icon: TrendingUp, label: "Projections", roles: ["admin", "user", "vo_leader"] },
  { path: "/focus-areas", icon: Target, label: "Focus Areas", roles: ["admin", "user", "vo_leader"] },
  { path: "/dealflow", icon: Layers, label: "Dealflow CRM", roles: ["admin", "user", "vo_leader"] },
  { path: "/taskboard", icon: Kanban, label: "IT Taskboard", roles: ["admin", "user", "vo_leader", "technical"] },
  { path: "/settings", icon: Settings, label: "Settings", roles: ["admin", "user", "vo_leader"] },
];

export function navItemsForRole(role: AppRole | null, preview: boolean): NavItem[] {
  if (preview) return NAV_ITEMS;
  if (!role) return [];
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}
