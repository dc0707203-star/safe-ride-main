import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { signInWithEmail, signInWithGoogle, signUpWithEmail, signOut } from "@/lib/auth";
import { resolvePrimaryRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Lock, Chrome, User } from "lucide-react";

interface LoginFormProps {
  userType: 'admin' | 'student';
}

const LoginForm = ({ userType }: LoginFormProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

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
      navigate(primaryRole === "admin" ? "/admin" : "/student");
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
    <div className="min-h-screen bg-green-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-green-800 bg-green-950 shadow-2xl rounded-xl overflow-hidden">
        <CardHeader className="pt-6 pb-4">
          <CardTitle className="text-xl font-bold text-white text-center">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </CardTitle>
          <CardDescription className="text-green-300 text-center text-sm">
            {isSignUp 
              ? 'Enter your details to create an account' 
              : 'Enter your credentials to sign in'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-6 pb-6">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {isSignUp && userType === 'student' && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-white">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Juan Dela Cruz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="pl-10 bg-green-900 border-green-700 text-white placeholder-green-500 focus:ring-green-600 focus:border-green-600"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder={userType === 'admin' ? 'admin@isu.edu.ph' : 'your.email@isu.edu.ph'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-green-900 border-green-700 text-white placeholder-green-500 focus:ring-green-600 focus:border-green-600"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-white">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-green-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-green-900 border-green-700 text-white placeholder-green-500 focus:ring-green-600 focus:border-green-600"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
              disabled={loading}
            >
              {loading 
                ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      {isSignUp ? "Creating account..." : "Signing in..."}
                    </div>
                  ) 
                : (isSignUp ? "Create Account" : "Sign In")}
            </Button>

            {userType === 'student' && (
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm text-green-300 hover:text-white"
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
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-green-700"></span>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-green-950 px-3 text-sm text-green-400">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full border-green-500 text-green-300 hover:bg-green-900"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <Chrome className="mr-2 h-4 w-4" />
                Sign in with Google
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;