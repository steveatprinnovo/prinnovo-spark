import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Company {
  "Company Name": string;
  "Country of Origin": string | null;
  "High-Level Focus Area": string | null;
  "Specific Focus Area": string | null;
  "Current Company Valuation": number | null;
  "Current HLV Valuation": number | null;
  "Pipeline Stage": string | null;
  "EVP Owner": string | null;
  "IPA Year": number | null;
  "Company Contact": string | null;
  "Champions": string | null;
  "Intro Origin": string | null;
  "HLV Ownership Percentage": string | null;
  "IPA Signature Date": string | null;
  "Term Sheet Signature Date": string | null;
  "Final Portfolio Decision Date": string | null;
  "Implementation Completion Date": string | null;
  imgurl: string | null;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('Company Detail')
        .select('*');

      if (error) {
        throw error;
      }

      setCompanies(data || []);
    } catch (err: any) {
      setError(err.message);
      toast.error(`Failed to load companies: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return { companies, loading, error, refetch: fetchCompanies };
}