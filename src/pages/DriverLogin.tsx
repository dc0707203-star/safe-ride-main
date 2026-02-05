import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Mail, Lock, Loader, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import campusBg from "@/assets/campus-bg.jpeg";
import isuLogo from "@/assets/isu-logo.png";

const DriverLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);

    try {
      // Sign in with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error(error.message || "Login failed");
        return;
      }

      if (!data.session) {
        toast.error("No session created");
        return;
      }

      // Check if user is a driver
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", data.session.user.id)
        .single();

      if (driverError || !driverData) {
        toast.error("Driver profile not found. Please register first.");
        await supabase.auth.signOut();
        return;
      }

      toast.success("Login successful!");
      navigate("/driver-dashboard");
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/70 via-blue-900/80 to-black/80 backdrop-blur-lg" />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-[#CCFF00] to-[#9acd00] p-2 rounded-xl shadow-[0_0_25px_rgba(204,255,0,0.4)]">
            <img src={isuLogo} alt="ISU Logo" className="w-5 h-5 object-contain" />
          </div>
          <span className="font-black text-[#CCFF00] text-lg uppercase tracking-tight">ISU Safe Ride</span>
        </div>

        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="gap-2 text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Back to Home</span>
        </Button>
      </div>

      {/* Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-100px)] px-4">
        <Card className="w-full max-w-md bg-black/60 border-white/20 backdrop-blur-xl">
          <CardHeader className="space-y-2">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-[#CCFF00]/20 to-blue-500/20 rounded-xl">
                <Car className="h-8 w-8 text-[#CCFF00]" />
              </div>
            </div>
            <CardTitle className="text-white text-2xl text-center">Driver Login</CardTitle>
            <CardDescription className="text-white/60 text-center">
              Sign in with your registered email and password
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#CCFF00]/60" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#CCFF00]/50 focus:bg-white/15"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-[#CCFF00]/60" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-[#CCFF00]/50 focus:bg-white/15"
                  />
                </div>
              </div>

              {/* Login Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#CCFF00] to-[#a8e600] text-green-950 hover:shadow-lg hover:shadow-[#CCFF00]/50 font-bold uppercase tracking-wide"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-2" />
                    Logging in...
                  </>
                ) : (
                  <>Sign In</>
                )}
              </Button>

              {/* Register Link */}
              <div className="text-center pt-2">
                <p className="text-white/60 text-sm">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/driver-register")}
                    className="text-[#CCFF00] hover:underline font-semibold"
                  >
                    Register here
                  </button>
                </p>
              </div>
            </form>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-500/20 border border-blue-400/30 rounded-lg">
              <p className="text-white/80 text-xs leading-relaxed">
                Use the email and password you created during driver registration to access your dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverLogin;
