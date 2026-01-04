import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import prinnovoLogo from "@/assets/prinnovo-logo.webp";
import previewHome from "@/assets/auth-preview-home.png";
import previewImplementations from "@/assets/auth-preview-implementations.png";
import previewFocus from "@/assets/auth-preview-focus.png";
export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });
      if (error) {
        toast({
          title: "Google sign in failed",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const redirectUrl = `${window.location.origin}/`;
      const {
        error
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (error) {
        if (error.message.includes("User already registered")) {
          toast({
            title: "Account exists",
            description: "An account with this email already exists. Please sign in instead.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign up failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Check your email",
          description: "We've sent you a confirmation link to complete your registration."
        });
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast({
            title: "Invalid credentials",
            description: "Please check your email and password and try again.",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sign in failed",
            description: error.message,
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Welcome back",
          description: "Redirecting to your dashboard..."
        });
        navigate("/");
      }
    } catch (error) {
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex bg-background">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 lg:p-16">
        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-2">
              {isSignUp ? "Create your account" : "Log in to your account"}
            </h1>
            <p className="text-muted-foreground">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium inline-flex items-center hover:underline">
                {isSignUp ? "Log In" : "Sign Up"} <ChevronRight className="h-4 w-4" />
              </button>
            </p>
          </div>

          {/* Google OAuth Button */}
          <Button type="button" variant="outline" className="w-full h-12 mb-4 text-foreground border-border hover:bg-accent" onClick={handleGoogleSignIn} disabled={isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>}
            Google
          </Button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-background text-muted-foreground">OR</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={isSignUp ? handleSignUp : handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground font-medium">Email</Label>
              <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} className="h-12 border-border" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground font-medium">Password</Label>
              <Input id="password" type="password" placeholder={isSignUp ? "Create a password (min. 4 characters)" : "••••••••"} value={password} onChange={e => setPassword(e.target.value)} required minLength={4} disabled={isLoading} className="h-12 border-border" />
            </div>
            <Button type="submit" className="w-full h-12 bg-[hsl(220,60%,25%)] hover:bg-[hsl(220,60%,20%)] text-white font-medium" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSignUp ? "Sign Up" : "Log In"}
            </Button>
          </form>

          {/* Helper Links */}
          {!isSignUp && <div className="flex justify-between mt-4 text-sm">
              <button type="button" className="text-muted-foreground hover:text-foreground">
                Forgot password?
              </button>
              <button type="button" className="text-destructive hover:underline">
                Need help?
              </button>
            </div>}

          {/* Terms */}
          
        </div>

        {/* Logo at bottom */}
        <div className="flex justify-center mt-8">
          <img src={prinnovoLogo} alt="Prinnovo" className="h-8" />
        </div>
      </div>

      {/* Right Panel - Dashboard Preview */}
      <div className="hidden lg:flex w-1/2 bg-muted/30 flex-col items-center justify-center p-8 relative overflow-hidden">
        {/* Decorative dots pattern */}
        
        

        {/* Preview Screenshots */}
        <div className="relative w-full max-w-2xl">
          {/* Main screenshot */}
          <div className="relative z-10 rounded-xl shadow-2xl overflow-hidden border border-border/50 bg-background">
            <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/50 border-b border-border/50">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <div className="w-3 h-3 rounded-full bg-green-400"></div>
            </div>
            <img src={previewHome} alt="Dashboard Preview" className="w-full" />
          </div>

          {/* Secondary screenshot - offset */}
          <div className="absolute -bottom-8 -right-8 w-3/4 rounded-xl shadow-xl overflow-hidden border border-border/50 bg-background z-0 opacity-80">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted/50 border-b border-border/50">
              <div className="w-2 h-2 rounded-full bg-red-400"></div>
              <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <img src={previewImplementations} alt="Implementations Preview" className="w-full" />
          </div>

          {/* Third screenshot - smaller offset */}
          <div className="absolute -top-4 -left-4 w-1/2 rounded-xl shadow-lg overflow-hidden border border-border/50 bg-background z-20 opacity-90">
            <div className="flex items-center gap-1 px-2 py-1 bg-muted/50 border-b border-border/50">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
            </div>
            <img src={previewFocus} alt="Focus Areas Preview" className="w-full" />
          </div>
        </div>

        {/* Tagline */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold text-foreground"> Prinnovo portfolio companies</h2>
          <p className="text-2xl font-semibold">
            <span className="text-primary">in one single place</span>
          </p>
        </div>
      </div>
    </div>;
}