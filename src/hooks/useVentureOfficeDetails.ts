import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserAuth } from "./useUserAuth";

export interface VentureOfficeDetails {
  office_id?: number;
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
      console.log('useVentureOfficeDetails - officeToFetch:', officeToFetch);
      
      if (!officeToFetch) {
        console.log('useVentureOfficeDetails - no office to fetch');
        setDetails(null);
        setLoading(false);
        return;
      }

      try {
        // If "all" is selected, aggregate all offices
        if (officeToFetch === "all") {
          console.log('useVentureOfficeDetails - fetching all offices for aggregation');
          const { data, error } = await supabase
            .from('venture_office_detail' as any)
            .select('*');

          console.log('useVentureOfficeDetails - all offices data:', data);
          console.log('useVentureOfficeDetails - all offices error:', error);

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
            console.log('useVentureOfficeDetails - aggregated:', aggregated);
            setDetails(aggregated);
          }
        } else {
          // Fetch specific office
          console.log('useVentureOfficeDetails - fetching specific office:', officeToFetch);
          const { data, error } = await supabase
            .from('venture_office_detail' as any)
            .select('*')
            .eq('Venture Office Name', officeToFetch)
            .maybeSingle();

          console.log('useVentureOfficeDetails - specific office data:', data);
          console.log('useVentureOfficeDetails - specific office error:', error);

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
