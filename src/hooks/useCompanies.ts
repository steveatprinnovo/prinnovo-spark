import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Company {
  "Company Name": string;
  "Company Description": string | null;
  "Country of Origin": string | null;
  "High-Level Focus Area": string | null;
  "Specific Focus Area": string | null;
  "Current Company Valuation": number | null;
  "Current HLV Valuation": number | null;
  "Pipeline Stage": string | null;
  "Investment Tracker Stage": string | null;
  "Invested Amount": number | null;
  "Invested Amount Valuation": number | null;
  "Invested Amount Date": string | null;
  "Invested Amount Valuation Date": string | null;
  "Invested Amount Round": string | null;
  "Invested Amount Round 2": string | null;
  "Invested Amount 2": number | null;
  "Invested Amount Date 2": string | null;
  "Invested Amount Valuation 2": number | null;
  "Invested Amount Valuation Date 2": string | null;
  "Invested Amount Round 3": string | null;
  "Invested Amount 3": number | null;
  "Invested Amount Date 3": string | null;
  "Invested Amount Valuation 3": number | null;
  "Invested Amount Valuation Date 3": string | null;
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
  "Target IPA Return": number | null;
  "Target Cash Investment Return": number | null;
  "Data Monetization Dollars": number | null;
  "Data Monetization Forecast": number | null;
  "Total Enterprise Value Captured": number | null;
  imgurl: string | null;
  venture_office: string | null;
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
      setError(null);
      
      const { data, error } = await supabase
        .from('Company Detail')
        .select('*');

      if (error) {
        console.error('Supabase error fetching companies:', error);
        throw error;
      }

      console.log('Successfully fetched companies:', data?.length || 0);
      setCompanies((data as Company[]) || []);
    } catch (err: any) {
      const errorMessage = err.message || 'Unknown error occurred';
      console.error('Error in fetchCompanies:', err);
      setError(errorMessage);
      toast.error(`Failed to load companies: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const updateCompany = async (companyName: string, updates: Partial<Company>) => {
    try {
      const { error } = await supabase
        .from('Company Detail')
        .update(updates)
        .eq('Company Name', companyName);

      if (error) {
        throw error;
      }

      // Update local state
      setCompanies(prev => 
        prev.map(company => 
          company["Company Name"] === companyName 
            ? { ...company, ...updates }
            : company
        )
      );

      toast.success("Company updated successfully");
      return true;
    } catch (err: any) {
      toast.error(`Failed to update company: ${err.message}`);
      return false;
    }
  };

  return { companies, loading, error, refetch: fetchCompanies, updateCompany };
}