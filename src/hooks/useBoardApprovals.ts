import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface BoardApprovalData {
  id: string;
  user_id: string;
  company_title: string;
  logo_storage_path: string | null;
  excel_storage_path: string | null;
  internal_champions: string;
  value_impact_team: string;
  ipa_terms: string;
  referral_incentive: string;
  internal_annual_cost: number;
  one_time_implementation_cost: number;
  annual_subscription_cost: number;
  key_points: string;
  validation: string;
  it_needs_pilot: string;
  post_pilot: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyData {
  id: string;
  companyTitle: string;
  logoFile: File | null;
  logoUrl: string | null;
  internalChampions: string;
  valueImpactTeam: string;
  ipaTerms: string;
  referralIncentive: string;
  internalAnnualCost: string;
  oneTimeImplementationCost: string;
  annualSubscriptionCost: string;
  keyPoints: string;
  validation: string;
  itNeedsPilot: string;
  postPilot: string;
  excelFile: File | null;
  excelUrl: string | null;
}

export function useBoardApprovals() {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Convert database record to CompanyData format
  const convertToCompanyData = async (record: BoardApprovalData): Promise<CompanyData> => {
    let logoUrl = null;
    let excelUrl = null;

    // Get signed URLs for storage files
    if (record.logo_storage_path) {
      const { data } = await supabase.storage
        .from('Company Logos')
        .createSignedUrl(record.logo_storage_path, 3600); // 1 hour expiry
      logoUrl = data?.signedUrl || null;
    }

    if (record.excel_storage_path) {
      const { data } = await supabase.storage
        .from('New Company approvals')
        .createSignedUrl(record.excel_storage_path, 3600); // 1 hour expiry
      excelUrl = data?.signedUrl || null;
    }

    return {
      id: record.id,
      companyTitle: record.company_title,
      logoFile: null,
      logoUrl,
      internalChampions: record.internal_champions,
      valueImpactTeam: record.value_impact_team,
      ipaTerms: record.ipa_terms,
      referralIncentive: record.referral_incentive,
      internalAnnualCost: record.internal_annual_cost.toString(),
      oneTimeImplementationCost: record.one_time_implementation_cost.toString(),
      annualSubscriptionCost: record.annual_subscription_cost.toString(),
      keyPoints: record.key_points,
      validation: record.validation,
      itNeedsPilot: record.it_needs_pilot,
      postPilot: record.post_pilot,
      excelFile: null,
      excelUrl,
    };
  };

  // Load companies from database
  const loadCompanies = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('board_approvals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const companyData = await Promise.all(
        (data || []).map(record => convertToCompanyData(record))
      );

      setCompanies(companyData);
    } catch (error: any) {
      console.error('Error loading companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  // Upload file to storage
  const uploadFile = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true });

      if (error) throw error;
      return path;
    } catch (error: any) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload ${bucket === 'Company Logos' ? 'logo' : 'Excel file'}`);
      return null;
    }
  };

  // Save or update company
  const saveCompany = async (company: CompanyData): Promise<boolean> => {
    if (!user) return false;

    try {
      setSaving(true);
      let logoStoragePath = null;
      let excelStoragePath = null;

      // Upload logo if there's a new file
      if (company.logoFile) {
        const logoPath = `${user.id}/${company.id}/logo_${Date.now()}.${company.logoFile.name.split('.').pop()}`;
        logoStoragePath = await uploadFile(company.logoFile, 'Company Logos', logoPath);
      }

      // Upload Excel if there's a new file
      if (company.excelFile) {
        const excelPath = `${user.id}/${company.id}/excel_${Date.now()}.${company.excelFile.name.split('.').pop()}`;
        excelStoragePath = await uploadFile(company.excelFile, 'New Company approvals', excelPath);
      }

      // Check if company exists in database
      const { data: existingData } = await supabase
        .from('board_approvals')
        .select('id, logo_storage_path, excel_storage_path')
        .eq('id', company.id)
        .single();

      const companyData = {
        user_id: user.id,
        company_title: company.companyTitle,
        logo_storage_path: logoStoragePath || existingData?.logo_storage_path || null,
        excel_storage_path: excelStoragePath || existingData?.excel_storage_path || null,
        internal_champions: company.internalChampions,
        value_impact_team: company.valueImpactTeam,
        ipa_terms: company.ipaTerms,
        referral_incentive: company.referralIncentive,
        internal_annual_cost: parseFloat(company.internalAnnualCost) || 0,
        one_time_implementation_cost: parseFloat(company.oneTimeImplementationCost) || 0,
        annual_subscription_cost: parseFloat(company.annualSubscriptionCost) || 0,
        key_points: company.keyPoints,
        validation: company.validation,
        it_needs_pilot: company.itNeedsPilot,
        post_pilot: company.postPilot,
      };

      if (existingData) {
        // Update existing record
        const { error } = await supabase
          .from('board_approvals')
          .update(companyData)
          .eq('id', company.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from('board_approvals')
          .insert({ ...companyData, id: company.id });

        if (error) throw error;
      }

      toast.success('Company saved successfully');
      await loadCompanies(); // Reload to get updated data
      return true;
    } catch (error: any) {
      console.error('Error saving company:', error);
      toast.error('Failed to save company');
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add new company
  const addNewCompany = (): CompanyData => {
    const newCompany: CompanyData = {
      id: crypto.randomUUID(),
      companyTitle: "",
      logoFile: null,
      logoUrl: null,
      internalChampions: "",
      valueImpactTeam: "",
      ipaTerms: "",
      referralIncentive: "",
      internalAnnualCost: "",
      oneTimeImplementationCost: "",
      annualSubscriptionCost: "",
      keyPoints: "",
      validation: "",
      itNeedsPilot: "",
      postPilot: "",
      excelFile: null,
      excelUrl: null,
    };

    setCompanies(prev => [...prev, newCompany]);
    return newCompany;
  };

  // Update company field
  const updateCompanyField = (companyId: string, field: keyof CompanyData, value: any) => {
    setCompanies(companies => 
      companies.map(company => 
        company.id === companyId ? { ...company, [field]: value } : company
      )
    );
  };

  // Remove company
  const removeCompany = async (companyId: string) => {
    if (!user) return false;

    try {
      // Delete from database
      const { error } = await supabase
        .from('board_approvals')
        .delete()
        .eq('id', companyId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setCompanies(prev => prev.filter(c => c.id !== companyId));
      toast.success('Company removed successfully');
      return true;
    } catch (error: any) {
      console.error('Error removing company:', error);
      toast.error('Failed to remove company');
      return false;
    }
  };

  // Load companies when user changes
  useEffect(() => {
    if (user) {
      loadCompanies();
    } else {
      setCompanies([]);
      setLoading(false);
    }
  }, [user]);

  return {
    companies,
    loading,
    saving,
    addNewCompany,
    updateCompanyField,
    saveCompany,
    removeCompany,
    loadCompanies,
  };
}