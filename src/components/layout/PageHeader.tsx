import { ReactNode } from "react";
import { useUserAuth } from "@/hooks/useUserAuth";
import { useAdminVentureOffice } from "@/hooks/useAdminVentureOffice";
import { useAllVentureOffices } from "@/hooks/useAllVentureOffices";
import { VentureOfficeDropdown } from "@/components/VentureOfficeDropdown";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  /** Show the venture-office dropdown (admins only; other roles see their
   *  office in the eyebrow). Defaults to true. */
  officeSelector?: boolean;
  /** Extra controls rendered on the right, above the office selector. */
  actions?: ReactNode;
}

/** Standard page header (UX redesign 2026-07-18): teal office eyebrow,
 *  navy H1, subtitle, and the venture-office selector at the right with a
 *  "Current as of" line beneath. */
export function PageHeader({ title, subtitle, officeSelector = true, actions }: PageHeaderProps) {
  const { isAdmin, ventureOffice } = useUserAuth();
  const { selectedVentureOffice, changeVentureOffice } = useAdminVentureOffice();
  const { ventureOffices } = useAllVentureOffices();

  const effectiveOffice = isAdmin ? selectedVentureOffice : ventureOffice;
  const eyebrow = !effectiveOffice || effectiveOffice === "all" ? "Prinnovo" : effectiveOffice;
  const asOf = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="mb-7 flex items-start justify-between gap-6">
      <div>
        <div className="eyebrow mb-2">{eyebrow}</div>
        <h1 className="m-0 text-[32px] font-bold leading-[1.1] text-[#171d70]">{title}</h1>
        {subtitle && <div className="mt-1.5 text-sm text-[#5c6178]">{subtitle}</div>}
      </div>
      <div className="flex flex-col items-end gap-2">
        {actions}
        {officeSelector && isAdmin && (
          <div className="min-w-[300px]">
            <VentureOfficeDropdown
              value={selectedVentureOffice}
              onChange={changeVentureOffice}
              ventureOffices={ventureOffices}
            />
          </div>
        )}
        <div className="text-xs italic text-[#8b8fa3]">Current as of {asOf}</div>
      </div>
    </div>
  );
}

/** Standard page container matching the redesign canvas. */
export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-10 pb-12 pt-8">{children}</div>;
}
