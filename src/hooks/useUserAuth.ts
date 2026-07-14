import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type AppRole = "admin" | "user" | "vo_leader" | "technical";

export interface UserAuthorization {
  /** Convenience flag, equivalent to role === "admin". */
  isAdmin: boolean;
  role: AppRole | null;
  /** Office scope. Populated for base users and VO leaders; null for admin/technical (all-office roles). */
  ventureOffice: string | null;
  loading: boolean;
}

export function useUserAuth() {
  const { user } = useAuth();
  const [authorization, setAuthorization] = useState<UserAuthorization>({
    isAdmin: false,
    role: null,
    ventureOffice: null,
    loading: true,
  });

  useEffect(() => {
    const fetchAuthorization = async () => {
      if (!user) {
        setAuthorization({ isAdmin: false, role: null, ventureOffice: null, loading: false });
        return;
      }

      try {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role, venture_office_assignment")
          .eq("user_id", user.id)
          .maybeSingle();

        const role = (roleData?.role as AppRole) ?? null;
        const isAdmin = role === "admin";
        // Office scoping applies only to office-bound roles.
        const ventureOffice =
          role === "user" || role === "vo_leader"
            ? (roleData as any)?.venture_office_assignment || null
            : null;

        setAuthorization({ isAdmin, role, ventureOffice, loading: false });
      } catch (error) {
        console.error("Error fetching user authorization:", error);
        setAuthorization({ isAdmin: false, role: null, ventureOffice: null, loading: false });
      }
    };

    fetchAuthorization();
  }, [user]);

  return authorization;
}
