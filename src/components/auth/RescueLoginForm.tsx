import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { resolvePrimaryRole } from "@/lib/roles";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface RescueLoginFormProps {
  onSuccess?: () => void;
}

const RescueLoginForm = ({ onSuccess }: RescueLoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Sign in flow
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password');
        }
        throw authError;
      }

      if (!authData?.user) {
        throw new Error('Failed to get user data');
      }

      // Wait for role propagation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify Rescue role is assigned
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);

      if (rolesError) {
        throw rolesError;
      }

      const roles = (rolesData ?? []).map((r: any) => r.role);

      // Resolve the primary role
      const primaryRole = resolvePrimaryRole(roles);

      // Verify they have a rescue-related role
      if (primaryRole !== "rescue" && primaryRole !== "rescue_admin") {
        throw new Error("Access denied: Only users with Rescue or Rescue Admin roles can log in here. Please contact your administrator.");
      }

      toast.success("Successfully logged in!");
      
      // Wait for state propagation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const targetRoute = primaryRole === "rescue_admin" ? "/rescue-admin" : "/rescue";
      
      // Navigate directly without closing modal first - avoids auth state issues
      navigate(targetRoute, { replace: true });
      
    } catch (error: any) {
      console.error("❌ Login error:", error);
      toast.error(error.message || "Failed to log in");
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="space-y-2 mb-6">
        <h3 className="text-2xl font-bold text-slate-900">Rescue Officer Login</h3>
        <p className="text-sm text-slate-600">Secure access for Emergency Response Team</p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-900 font-semibold">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="rescue@team.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-orange-400"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-slate-900 font-semibold">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 pr-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:ring-orange-400"
              required
              disabled={loading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-red-700 to-orange-600 hover:from-red-800 hover:to-orange-700 text-white font-bold py-2 rounded-lg transition-all duration-200"
        >
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <div className="text-xs text-slate-500 text-center">
        <p>Secure connection • Authentication required</p>
      </div>
    </div>
  );
};

export default RescueLoginForm;
