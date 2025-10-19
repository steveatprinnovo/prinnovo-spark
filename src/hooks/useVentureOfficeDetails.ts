import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "./useUserAuth";

export interface VentureOfficeDetails {
  "Venture Office Name": string | null;
  "Companies Evaluated": number | null;
  "Qualified Leads": number | null;
  "Term Sheet Negotiations": number | null;
  "IPA Negotiations": number | null;
  "Investment Allotment": number | null;
  "Prinnovo Health Ownership": string | null;
  "Venture Office Logo": string | null;
}

export function useVentureOfficeDetails(selectedOffice?: string) {
  const { ventureOffice } = useUserAuth();
  const [details, setDetails] = useState<VentureOfficeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Use selectedOffice if provided, otherwise use user's venture office
  const officeToFetch = selectedOffice !== undefined ? selectedOffice : ventureOffice;

  useEffect(() => {
    const fetchDetails = async () => {
      if (!officeToFetch) {
        setDetails(null);
        setLoading(false);
        return;
      }

      try {
        // If "all" is selected, aggregate all offices
        if (officeToFetch === "all") {
          const { data, error } = await supabase
            .from('venture_office_detail' as any)
            .select('*');

          if (error) {
            console.error('Error fetching venture office details:', error);
            setDetails(null);
          } else if (data && data.length > 0) {
            // Aggregate all values
            const aggregated: VentureOfficeDetails = {
              "Venture Office Name": "All Offices",
              "Companies Evaluated": data.reduce((sum: number, office: any) => sum + (office["Companies Evaluated"] || 0), 0),
              "Qualified Leads": data.reduce((sum: number, office: any) => sum + (office["Qualified Leads"] || 0), 0),
              "Term Sheet Negotiations": data.reduce((sum: number, office: any) => sum + (office["Term Sheet Negotiations"] || 0), 0),
              "IPA Negotiations": data.reduce((sum: number, office: any) => sum + (office["IPA Negotiations"] || 0), 0),
              "Investment Allotment": data.reduce((sum: number, office: any) => sum + (office["Investment Allotment"] || 0), 0),
              "Prinnovo Health Ownership": null,
              "Venture Office Logo": null,
            };
            setDetails(aggregated);
          }
        } else {
          // Fetch specific office
          const { data, error } = await supabase
            .from('venture_office_detail' as any)
            .select('*')
            .eq('Venture Office Name', officeToFetch)
            .maybeSingle();

          if (error) {
            console.error('Error fetching venture office details:', error);
            setDetails(null);
          } else {
            setDetails(data as any);
          }
        }
      } catch (err) {
        console.error('Error in fetchDetails:', err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [officeToFetch]);

  return { details, loading };
}
