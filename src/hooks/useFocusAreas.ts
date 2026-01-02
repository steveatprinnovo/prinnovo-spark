import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FocusAreaCompany {
  id: string;
  focus_area_id: string;
  company_name: string;
  website_url: string | null;
  created_at: string;
}

export interface FocusArea {
  id: string;
  venture_office: string;
  focus_area_name: string;
  is_high_priority: boolean;
  created_at: string;
  updated_at: string;
  companies: FocusAreaCompany[];
}

export function useFocusAreas(ventureOffice: string) {
  const [focusAreas, setFocusAreas] = useState<FocusArea[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFocusAreas = useCallback(async () => {
    if (!ventureOffice || ventureOffice === "all") {
      setFocusAreas([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch focus areas for this venture office
      const { data: areasData, error: areasError } = await supabase
        .from('focus_areas')
        .select('*')
        .eq('venture_office', ventureOffice)
        .order('created_at', { ascending: true });

      if (areasError) throw areasError;

      if (!areasData || areasData.length === 0) {
        setFocusAreas([]);
        setLoading(false);
        return;
      }

      // Fetch companies for all focus areas
      const areaIds = areasData.map(a => a.id);
      const { data: companiesData, error: companiesError } = await supabase
        .from('focus_area_companies')
        .select('*')
        .in('focus_area_id', areaIds)
        .order('created_at', { ascending: true });

      if (companiesError) throw companiesError;

      // Map companies to their focus areas
      const areasWithCompanies: FocusArea[] = areasData.map(area => ({
        ...area,
        companies: (companiesData || []).filter(c => c.focus_area_id === area.id)
      }));

      setFocusAreas(areasWithCompanies);
    } catch (error) {
      console.error('Error fetching focus areas:', error);
      setFocusAreas([]);
    } finally {
      setLoading(false);
    }
  }, [ventureOffice]);

  useEffect(() => {
    fetchFocusAreas();
  }, [fetchFocusAreas]);

  const addFocusArea = async (focusAreaName: string) => {
    if (!ventureOffice || ventureOffice === "all") return null;

    try {
      const { data, error } = await supabase
        .from('focus_areas')
        .insert({
          venture_office: ventureOffice,
          focus_area_name: focusAreaName
        })
        .select()
        .single();

      if (error) throw error;

      const newArea: FocusArea = { ...data, companies: [] };
      setFocusAreas(prev => [...prev, newArea]);
      return newArea;
    } catch (error) {
      console.error('Error adding focus area:', error);
      return null;
    }
  };

  const updateFocusArea = async (id: string, focusAreaName: string, isHighPriority?: boolean) => {
    try {
      const updateData: { focus_area_name?: string; is_high_priority?: boolean } = {};
      if (focusAreaName !== undefined) updateData.focus_area_name = focusAreaName;
      if (isHighPriority !== undefined) updateData.is_high_priority = isHighPriority;

      const { error } = await supabase
        .from('focus_areas')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      setFocusAreas(prev => prev.map(area => 
        area.id === id ? { ...area, ...updateData } : area
      ));
      return true;
    } catch (error) {
      console.error('Error updating focus area:', error);
      return false;
    }
  };

  const updateFocusAreaPriority = async (id: string, isHighPriority: boolean) => {
    try {
      const { error } = await supabase
        .from('focus_areas')
        .update({ is_high_priority: isHighPriority })
        .eq('id', id);

      if (error) throw error;

      setFocusAreas(prev => prev.map(area => 
        area.id === id ? { ...area, is_high_priority: isHighPriority } : area
      ));
      return true;
    } catch (error) {
      console.error('Error updating focus area priority:', error);
      return false;
    }
  };

  const deleteFocusArea = async (id: string) => {
    try {
      const { error } = await supabase
        .from('focus_areas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFocusAreas(prev => prev.filter(area => area.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting focus area:', error);
      return false;
    }
  };

  const addCompanyToFocusArea = async (focusAreaId: string, companyName: string, websiteUrl: string | null) => {
    try {
      const { data, error } = await supabase
        .from('focus_area_companies')
        .insert({
          focus_area_id: focusAreaId,
          company_name: companyName,
          website_url: websiteUrl
        })
        .select()
        .single();

      if (error) throw error;

      setFocusAreas(prev => prev.map(area => 
        area.id === focusAreaId 
          ? { ...area, companies: [...area.companies, data] }
          : area
      ));
      return data;
    } catch (error) {
      console.error('Error adding company to focus area:', error);
      return null;
    }
  };

  const removeCompanyFromFocusArea = async (companyId: string, focusAreaId: string) => {
    try {
      const { error } = await supabase
        .from('focus_area_companies')
        .delete()
        .eq('id', companyId);

      if (error) throw error;

      setFocusAreas(prev => prev.map(area => 
        area.id === focusAreaId 
          ? { ...area, companies: area.companies.filter(c => c.id !== companyId) }
          : area
      ));
      return true;
    } catch (error) {
      console.error('Error removing company from focus area:', error);
      return false;
    }
  };

  return {
    focusAreas,
    loading,
    refetch: fetchFocusAreas,
    addFocusArea,
    updateFocusArea,
    updateFocusAreaPriority,
    deleteFocusArea,
    addCompanyToFocusArea,
    removeCompanyFromFocusArea
  };
}
