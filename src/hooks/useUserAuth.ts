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
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        const isAdmin = !!roleData;

        // Get user's venture office if not admin
        let ventureOffice = null;
        if (!isAdmin) {
          const { data: ventureOfficeData } = await supabase
            .from("user_venture_offices")
            .select("venture_office")
            .eq("user_id", user.id)
            .maybeSingle();

          ventureOffice = ventureOfficeData?.venture_office || null;
        }

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
