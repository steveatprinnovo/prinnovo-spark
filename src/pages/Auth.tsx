import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { usePageTitle } from "@/hooks/usePageTitle";

const Auth = () => {
  usePageTitle("Login");
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;
  return <AuthForm />;
};

export default Auth;
