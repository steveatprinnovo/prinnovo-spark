import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface VentureOfficeLogoData {
  name: string;
  logoUrl: string | null;
}

export function useVentureOfficeLogo(ventureOfficeName?: string | null) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogo = async () => {
      if (!ventureOfficeName || ventureOfficeName === "all") {
        setLogoUrl(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("venture_office_detail")
          .select('"Venture Office Name", "Venture Office Logo"')
          .eq("Venture Office Name", ventureOfficeName)
          .maybeSingle();

        if (error) {
          console.error("Error fetching venture office logo:", error);
          setLogoUrl(null);
        } else {
          setLogoUrl(data?.["Venture Office Logo"] || null);
        }
      } catch (error) {
        console.error("Error fetching venture office logo:", error);
        setLogoUrl(null);
      }
      setLoading(false);
    };

    fetchLogo();
  }, [ventureOfficeName]);

  return { logoUrl, loading };
}

export function useAllVentureOfficeLogos() {
  const [logos, setLogos] = useState<VentureOfficeLogoData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const { data, error } = await supabase
          .from("venture_office_detail")
          .select('"Venture Office Name", "Venture Office Logo"');

        if (error) {
          console.error("Error fetching venture office logos:", error);
          setLogos([]);
        } else {
          setLogos(
            (data || []).map((item) => ({
              name: item["Venture Office Name"] || "",
              logoUrl: item["Venture Office Logo"] || null,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching venture office logos:", error);
        setLogos([]);
      }
      setLoading(false);
    };

    fetchLogos();
  }, []);

  return { logos, loading };
}
