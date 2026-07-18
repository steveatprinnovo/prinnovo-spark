import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { DonutMenu } from "@/components/DonutMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import markColor from "@/assets/prinnovo-mark-color.svg";

/** App layout (UX redesign 2026-07-18): collapsible left sidebar + scrollable
 *  main area. On mobile the sidebar is replaced by a slim top bar with the
 *  existing DonutMenu. Pages render inside <Outlet/> and use <PageHeader/>. */
export function AppShell() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex h-14 flex-none items-center gap-3 border-b border-[#e2e3ec] bg-[#f7f8fb] px-4">
          <img src={markColor} alt="Prinnovo" className="h-8 w-8" />
          <DonutMenu />
        </div>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white text-[#232842]">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto bg-white">
        <Outlet />
      </main>
    </div>
  );
}
