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

export function useVentureOfficeDetails() {
  const { ventureOffice } = useUserAuth();
  const [details, setDetails] = useState<VentureOfficeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!ventureOffice) {
        setDetails(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('venture_office_detail' as any)
          .select('*')
          .eq('Venture Office Name', ventureOffice)
          .maybeSingle();

        if (error) {
          console.error('Error fetching venture office details:', error);
          setDetails(null);
        } else {
          setDetails(data as any);
        }
      } catch (err) {
        console.error('Error in fetchDetails:', err);
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [ventureOffice]);

  return { details, loading };
}
