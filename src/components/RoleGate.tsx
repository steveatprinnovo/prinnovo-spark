import { ReactNode, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUserAuth, AppRole } from "@/hooks/useUserAuth";
import { PREVIEW } from "@/preview/previewMode";

/**
 * Route-level role gate. Renders children only when the signed-in user's role
 * is in `allow`; otherwise redirects to the role's home route. RLS enforces
 * the same boundaries server-side — this gate is UX, not the security layer.
 */
export function roleHome(role: AppRole | null): string {
  return role === "technical" ? "/taskboard" : "/";
}

export function RoleGate({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: authzLoading } = useUserAuth();

  const permitted = PREVIEW || (role !== null && allow.includes(role));

  useEffect(() => {
    if (PREVIEW) return;
    if (!authLoading && !user) {
      navigate("/auth", { replace: true });
      return;
    }
    if (!authLoading && !authzLoading && user && role !== null && !allow.includes(role)) {
      navigate(roleHome(role), { replace: true });
    }
  }, [authLoading, authzLoading, user, role, allow, navigate]);

  if (!PREVIEW && (authLoading || authzLoading)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-label="Loading" />
      </div>
    );
  }

  if (!permitted) return null;
  return <>{children}</>;
}
