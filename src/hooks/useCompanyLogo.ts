import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useCompanyLogo(companyName: string) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyName) {
      setLoading(false);
      return;
    }

    const fetchLogo = async () => {
      try {
        // Try different file formats
        const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
        let logoFound = false;

        for (const ext of extensions) {
          const fileName = `${companyName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.${ext}`;
          
          const { data } = await supabase.storage
            .from('Company Logos')
            .getPublicUrl(fileName);

          // Check if the file exists by trying to fetch it
          try {
            const response = await fetch(data.publicUrl, { method: 'HEAD' });
            if (response.ok) {
              setLogoUrl(data.publicUrl);
              logoFound = true;
              break;
            }
          } catch {
            // Continue to next extension
          }
        }

        if (!logoFound) {
          setLogoUrl(null);
        }
      } catch (error) {
        console.error('Error fetching company logo:', error);
        setLogoUrl(null);
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, [companyName]);

  return { logoUrl, loading };
}