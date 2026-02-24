import { useMemo } from "react";
import { useAllVentureOfficeLogos } from "./useVentureOfficeLogo";

/**
 * Returns all venture office names from the venture_office_detail table.
 * This ensures offices appear in dropdowns even if they have no companies yet.
 */
export function useAllVentureOffices() {
  const { logos, loading } = useAllVentureOfficeLogos();

  const ventureOffices = useMemo(
    () => logos.map((l) => l.name).filter(Boolean),
    [logos]
  );

  return { ventureOffices, loading };
}
