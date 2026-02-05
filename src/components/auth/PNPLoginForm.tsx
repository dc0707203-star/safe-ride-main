import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock } from "lucide-react";

interface PNPLoginFormProps {
  onSuccess?: () => void;
}

const PNPLoginForm = ({ onSuccess }: PNPLoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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

      // Verify PNP role is assigned
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id);

      if (rolesError) {
        throw rolesError;
      }

      const roles = (rolesData ?? []).map((r: any) => r.role);

      // If user doesn't have a PNP role, assign it
      if (!roles.includes("pnp")) {
        const { error: insertError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "pnp"
          });

        if (insertError) {
          console.warn("Warning: Could not auto-assign PNP role:", insertError);
          // Continue anyway - role may be assigned by admin later
        }
      }

      toast.success("Successfully logged in!");
      
      // Wait for state propagation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (onSuccess) {
        onSuccess();
        setTimeout(() => navigate("/pnp", { replace: true }), 500);
      } else {
        navigate("/pnp", { replace: true });
      }
      
    } catch (error: any) {
      console.error("❌ Login error:", error);
      toast.error(error.message || "Failed to log in");
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4 bg-gradient-to-br from-slate-900/80 via-slate-950/80 to-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      <div className="space-y-2 mb-6">
        <h3 className="text-2xl font-bold text-white">PNP Officer Login</h3>
        <p className="text-sm text-white/70">Secure access for Philippine National Police</p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-bold text-white block">
            Email Address
          </Label>
          <div className="relative group">
            <Mail className="absolute left-4 top-3.5 h-4 w-4 text-green-400/60 group-focus-within:text-green-400 transition-colors" />
            <Input
              id="email"
              type="email"
              placeholder="officer@pnp.gov.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-11 h-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-green-400/50 transition-all"
              required
              disabled={loading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-bold text-white block">
            Password
          </Label>
          <div className="relative group">
            <Lock className="absolute left-4 top-3.5 h-4 w-4 text-green-400/60 group-focus-within:text-green-400 transition-colors" />
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-11 h-11 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:bg-white/15 focus:border-green-400/50 transition-all"
              required
              disabled={loading}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl font-bold text-white bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 shadow-lg shadow-green-600/30 hover:shadow-green-600/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
};

export default PNPLoginForm;
