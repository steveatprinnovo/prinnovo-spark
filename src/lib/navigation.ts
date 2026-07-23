import { Home, ClipboardList, DollarSign, TrendingUp, Target, Settings, Layers, Kanban, BarChart3, Calculator, Bot, LucideIcon } from "lucide-react";
import { AppRole } from "@/hooks/useUserAuth";

export interface NavChild {
  path: string;
  label: string;
  /** When set, the child is visible only to these roles (parent roles apply otherwise). */
  roles?: AppRole[];
}

export interface NavItem {
  path: string;
  icon: LucideIcon;
  label: string;
  roles: AppRole[];
  children?: NavChild[];
}

export interface NavSection {
  label: string | null;
  items: NavItem[];
}

/** Single source of truth for navigation visibility. Mirrors the RoleGate
 *  allow-lists in App.tsx and the RLS matrix (RBAC design, 2026-07-14).
 *  Regrouped into sidebar sections per the UX redesign (2026-07-18). */
export const NAV_ITEMS: NavItem[] = [
  { path: "/", icon: Home, label: "Home", roles: ["admin", "user", "vo_leader"] },
  { path: "/projections", icon: TrendingUp, label: "Revenue Projections", roles: ["admin", "user", "vo_leader"] },
  { path: "/investments", icon: DollarSign, label: "Investments", roles: ["admin", "user", "vo_leader"] },
  { path: "/focus-areas", icon: Target, label: "Focus Areas", roles: ["admin", "user", "vo_leader"] },
  { path: "/dealflow", icon: Layers, label: "Dealflow CRM", roles: ["admin", "user", "vo_leader"] },
  { path: "/implementations", icon: ClipboardList, label: "Implementations", roles: ["admin", "user", "vo_leader", "technical"] },
  {
    path: "/taskboard", icon: Kanban, label: "Technical Services", roles: ["admin", "user", "vo_leader", "technical"],
    children: [
      { path: "/taskboard", label: "Board" },
      { path: "/taskboard/archive", label: "Archive" },
      // Value-story audit for health systems: no base-user access (2026-07-21)
      { path: "/taskboard/audit", label: "Activity Audit", roles: ["admin", "technical", "vo_leader"] },
    ],
  },
  { path: "/costs", icon: Calculator, label: "Cost Projections", roles: ["admin", "vo_leader"] },
  {
    path: "/intelligence/agent", icon: Bot, label: "Agent", roles: ["admin", "vo_leader"],
    children: [
      { path: "/intelligence/agent/baa-review", label: "BAA Review" },
      { path: "/intelligence/agent/expense-report", label: "Expense Report" },
      { path: "/intelligence/agent/financial-pro-forma", label: "Financial Pro-Forma" },
      { path: "/intelligence/agent/ipa-review", label: "IPA Review" },
      { path: "/intelligence/agent/legal-tracker", label: "Legal Tracker" },
      { path: "/intelligence/agent/msa-comparison", label: "MSA Comparison" },
    ],
  },
  { path: "/reporting", icon: BarChart3, label: "Reporting", roles: ["admin", "user", "vo_leader", "technical"] },
  { path: "/settings", icon: Settings, label: "Settings", roles: ["admin", "user", "vo_leader"] },
];

const byPath = new Map(NAV_ITEMS.map(i => [i.path, i]));

/** Sidebar grouping (Settings intentionally excluded — it renders in the
 *  sidebar bottom block). */
export const NAV_SECTIONS: NavSection[] = [
  { label: null, items: [byPath.get("/")!] },
  { label: "Portfolio", items: [byPath.get("/projections")!, byPath.get("/investments")!, byPath.get("/focus-areas")!, byPath.get("/dealflow")!] },
  { label: "Operations", items: [byPath.get("/implementations")!, byPath.get("/taskboard")!, byPath.get("/costs")!] },
  { label: "Intelligence", items: [byPath.get("/intelligence/agent")!] },
  { label: "Reports", items: [byPath.get("/reporting")!] },
];

export function navItemsForRole(role: AppRole | null, preview: boolean): NavItem[] {
  if (preview) return NAV_ITEMS;
  if (!role) return [];
  return NAV_ITEMS.filter(item => item.roles.includes(role));
}

export function navSectionsForRole(role: AppRole | null, preview: boolean): NavSection[] {
  return NAV_SECTIONS
    .map(sec => ({
      label: sec.label,
      items: sec.items.filter(item => preview || (role !== null && item.roles.includes(role))),
    }))
    .filter(sec => sec.items.length > 0);
}
