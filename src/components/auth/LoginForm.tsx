import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { signInWithEmail, signInWithGoogle, signUpWithEmail, signOut } from "@/lib/auth";
import { resolvePrimaryRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Chrome, User, Eye, EyeOff, ShieldCheck } from "lucide-react";

interface LoginFormProps {
  userType: 'admin' | 'student';
  onSuccess?: () => void;
}

const LoginForm = ({ userType, onSuccess }: LoginFormProps) => {
  const navigate = useNavigate();
  const isAdmin = userType === 'admin';
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up flow
        await signUpWithEmail(email, password, { full_name: fullName });
        toast.success("Account created! Please sign in.");
        setIsSignUp(false);
        setPassword("");
        return;
      }

      // Sign in flow
      await signInWithEmail(email, password);

      // After login, route strictly based on backend role (prevents wrong portal access)
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const userId = session?.user?.id;
      if (!userId) throw new Error("Missing session");

      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      const roles = (rolesData ?? []).map((r: unknown) => r.role);
      const primaryRole = resolvePrimaryRole(roles);

      if (primaryRole !== userType) {
        await signOut();
        toast.error(userType === "admin" ? "Hindi admin ang account na ito." : "Hindi student ang account na ito.");
        return;
      }

      toast.success("Successfully logged in!");
      setShowSuccess(true);
      
      // Get appropriate redirect path based on primary role
      let redirectPath = "/student";
      if (primaryRole === 'admin') {
        redirectPath = '/admin';
      } else if (primaryRole === 'rescue_admin') {
        redirectPath = '/rescue-admin';
      } else if (primaryRole === 'pnp') {
        redirectPath = '/pnp';
      } else if (primaryRole === 'rescue') {
        redirectPath = '/rescue';
      } else if (primaryRole === 'driver') {
        redirectPath = '/driver-dashboard';
      }
      
      // If onSuccess callback is provided (e.g., from modal), call it then navigate
      if (onSuccess) {
        onSuccess();
        setTimeout(() => navigate(redirectPath), 500);
      } else {
        setTimeout(() => navigate(redirectPath), 500);
      }
    } catch (error: unknown) {
      toast.error(error.message || `Failed to ${isSignUp ? 'sign up' : 'log in'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // Redirect is handled by Supabase
    } catch (error: unknown) {
      toast.error(error.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-700/50 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-black/80 p-6 backdrop-blur-sm animate-fadeIn">
        {/* Header */}
        <div className="space-y-2 text-center animate-slideDown">
          <h1 className="text-2xl font-bold text-white">
            {isSignUp ? 'Create Account' : 'Admin Sign In'}
          </h1>
          <p className="text-sm text-slate-400">
            {isSignUp 
              ? 'Enter your details to create an account' 
              : 'Sign in to access the administrative dashboard'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4 animate-fadeIn">
          {isSignUp && userType === 'student' && (
            <div className="space-y-3 animate-slideUp">
              <Label htmlFor="fullName" className="block font-bold text-white">Full Name</Label>
              <div className="relative group">
                <User className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-all duration-300 group-focus-within:text-lime-400 group-focus-within:scale-110" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Juan Dela Cruz"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-slate-600 bg-slate-950/50 pl-10 text-white placeholder-slate-500 focus:border-lime-400 focus:ring-lime-400 transition-all duration-300 hover:border-lime-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-3 animate-slideUp">
            <Label htmlFor="email" className="block font-bold text-white">Email Address</Label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-all duration-300 group-focus-within:text-lime-400 group-focus-within:scale-110" />
              <Input
                id="email"
                type="email"
                placeholder="admin@isu.edu.ph"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-slate-600 bg-slate-950/50 pl-10 text-white placeholder-slate-500 focus:border-lime-400 focus:ring-lime-400 transition-all duration-300 hover:border-lime-500"
                required
              />
            </div>
          </div>
          
          <div className="space-y-3 animate-slideUp">
            <Label htmlFor="password" className="block font-bold text-white">Password</Label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500 transition-all duration-300 group-focus-within:text-lime-400 group-focus-within:scale-110" />
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-slate-600 bg-slate-950/50 pl-10 text-white placeholder-slate-500 focus:border-lime-400 focus:ring-lime-400 transition-all duration-300 hover:border-lime-500"
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-lime-400 to-lime-500 font-semibold text-slate-900 hover:from-lime-300 hover:to-lime-400 transition-all duration-300 transform hover:scale-105"
            disabled={loading}
          >
            {loading 
              ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></div>
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </div>
                ) 
              : (isSignUp ? "Create Account" : "Sign In")}
          </Button>

          {userType === 'student' && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-sm text-slate-400 hover:text-lime-400 transition-all duration-300 transform hover:scale-105"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setPassword("");
                setFullName("");
              }}
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </Button>
          )}
        </form>

        {userType === 'student' && (
          <>
            <div className="relative animate-fadeIn">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-700"></span>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-black/60 px-3 text-sm text-slate-400">Or continue with</span>
              </div>
            </div>
          </>
        )}

        {/* Success Message */}
        {showSuccess && (
          <div className="animate-bounceIn">
            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-green-400 mb-2" />
              <p className="text-green-400 font-semibold">Login Successful!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Add custom animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideDown {
    from { 
      opacity: 0;
      transform: translateY(-20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px);
    }
    to { 
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes bounceIn {
    0% { 
      opacity: 0;
      transform: scale(0.3);
    }
    50% { 
      opacity: 1;
      transform: scale(1.05);
    }
    70% { 
      transform: scale(0.9);
    }
    100% { 
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  
  .animate-slideDown {
    animation: slideDown 0.5s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.5s ease-out;
  }
  
  .animate-bounceIn {
    animation: bounceIn 0.6s ease-out;
  }
`;
document.head.appendChild(style);

export default LoginForm;