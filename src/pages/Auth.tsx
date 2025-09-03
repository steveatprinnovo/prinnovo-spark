import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const Auth = () => {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;
  return <AuthForm />;
};

export default Auth;
