import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface UserAuthorization {
  isAdmin: boolean;
  ventureOffice: string | null;
  loading: boolean;
}

export function useUserAuth() {
  const { user } = useAuth();
  const [authorization, setAuthorization] = useState<UserAuthorization>({
    isAdmin: false,
    ventureOffice: null,
    loading: true,
  });

  useEffect(() => {
    const fetchAuthorization = async () => {
      if (!user) {
        setAuthorization({ isAdmin: false, ventureOffice: null, loading: false });
        return;
      }

      try {
        // Get user role and venture office assignment from user_roles table
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role, venture_office_assignment")
          .eq("user_id", user.id)
          .maybeSingle();

        const isAdmin = roleData?.role === "admin";
        // Non-admin users get their venture office from venture_office_assignment
        const ventureOffice = !isAdmin ? (roleData?.venture_office_assignment || null) : null;

        setAuthorization({ isAdmin, ventureOffice, loading: false });
      } catch (error) {
        console.error("Error fetching user authorization:", error);
        setAuthorization({ isAdmin: false, ventureOffice: null, loading: false });
      }
    };

    fetchAuthorization();
  }, [user]);

  return authorization;
}
