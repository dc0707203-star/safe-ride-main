import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, ArrowLeft, Users, Car, MapPin, Bell, Lock, CheckCircle, Zap, HelpCircle, User, Building2, Badge, Ambulance } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/LoginForm";
import StudentAuthPanel from "@/components/auth/StudentAuthPanel";
import PNPLoginForm from "@/components/auth/PNPLoginForm";
import RescueLoginForm from "@/components/auth/RescueLoginForm";
import { supabase } from "@/integrations/supabase/client";
import isuLogo from "@/assets/isu-logo.png";
import campusBg from "@/assets/campus-bg.jpeg";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState<'admin' | 'student' | 'pnp' | 'rescue_admin'>('student');
  const [adminType, setAdminType] = useState<'isu' | 'pnp' | 'rescue'>('isu');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserAndRole = async () => {
      try {
        // Check for active session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is already logged in - get their role and redirect
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id);

          if (rolesError) throw rolesError;

          const roles = (rolesData ?? []).map((r: unknown) => r.role as 'admin' | 'student' | 'driver' | 'pnp' | 'rescue' | 'rescue_admin');
          const primaryRole = roles.includes('admin')
            ? 'admin'
            : roles.includes('rescue_admin')
              ? 'rescue_admin'
              : roles.includes('pnp')
                ? 'pnp'
                : roles.includes('rescue')
                  ? 'rescue'
                  : roles.includes('driver')
                    ? 'driver'
                    : roles.includes('student')
                      ? 'student'
                      : null;

          // Redirect based on role
          if (primaryRole === 'admin') navigate('/admin', { replace: true });
          else if (primaryRole === 'rescue_admin') navigate('/rescue-admin', { replace: true });
          else if (primaryRole === 'pnp') navigate('/pnp', { replace: true });
          else if (primaryRole === 'rescue') navigate('/rescue', { replace: true });
          else if (primaryRole === 'student') navigate('/student', { replace: true });
          else if (primaryRole === 'driver') navigate('/', { replace: true });
          return;
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
      
      // No active session - show login form
      const requestedType = searchParams.get('type') as 'admin' | 'student' | 'pnp' | 'rescue_admin' || 'student';
      setUserType(requestedType);
      if (requestedType === 'pnp') setAdminType('pnp');
      else if (requestedType === 'admin') setAdminType('isu');
      setIsLoading(false);
    };

    // Also set up auth state listener for real-time redirect after login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // User just logged in - redirect immediately
        checkUserAndRole();
      }
    });

    checkUserAndRole();

    return () => subscription?.unsubscribe();
  }, [navigate, searchParams]);

  const isAdmin = userType === 'admin' || userType === 'rescue_admin';
  const isPNP = userType === 'pnp';

  // Show loading while checking session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#CCFF00]/30 border-t-[#CCFF00] rounded-full animate-spin" />
          <p className="text-[#CCFF00] font-semibold">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-start md:justify-center px-4 py-8 md:p-4 overflow-y-auto bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 50%, rgba(0,0,0,0.9) 100%), url('${campusBg}')` }}
    >
      {/* Main Content Container */}
      <div
        className={`relative z-10 w-full ${
          userType === "student"
            ? "max-w-md md:max-w-3xl"
            : "max-w-md md:max-w-3xl lg:max-w-4xl"
        }`}
      >
        {userType === 'student' ? (
          <>
            {/* Back Button */}
            <div className="mb-8">
              <Button
                onClick={() => navigate("/")}
                variant="ghost"
                size="icon"
                className="text-[#CCFF00] hover:bg-[#CCFF00]/10 hover:text-[#CCFF00]"
              >
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </div>

            {/* Header (mobile). Desktop branding is inside the landscape card below. */}
            <div className="mb-10 md:hidden animate-fade-in">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="bg-gradient-to-br from-[#CCFF00] via-lime-300 to-green-400 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(204,255,0,0.6)]">
                  <img src={isuLogo} alt="ISU Logo" className="h-12 w-12" />
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-4xl md:text-5xl landscape:text-3xl font-black bg-gradient-to-r from-[#CCFF00] via-lime-300 to-green-400 bg-clip-text text-transparent mb-2">
                  SafeRide
                </h1>
                <p className="text-white/70 text-base font-semibold tracking-wide">STUDENT PORTAL</p>
              </div>
            </div>

            {/* Main Content Card */}
            <div className="relative mb-8 landscape:mb-4 group transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-[#CCFF00]/30 to-green-400/30 rounded-3xl blur-3xl opacity-0 md:group-hover:opacity-100 transition-all duration-500" />
            <div className="relative bg-white md:bg-gradient-to-br md:from-white/10 md:via-white/5 md:to-transparent border border-white/15 rounded-3xl overflow-hidden md:backdrop-blur-2xl md:shadow-2xl hover:md:shadow-[0_0_60px_rgba(204,255,0,0.25),0_20px_40px_rgba(204,255,0,0.08)] transition-all duration-500 transform md:group-hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 md:grid md:grid-cols-5 md:grid-rows-[minmax(0,1fr)] md:h-[520px] md:min-h-0">
              {/* Desktop left panel (landscape) */}
              <div className="hidden md:flex md:col-span-2 flex-col justify-between p-8 border-r border-white/10 bg-gradient-to-br from-slate-950/70 via-slate-900/60 to-slate-900/40">
                <div>
                  <div className="flex items-center gap-4">
                    <div className="bg-gradient-to-br from-[#CCFF00] via-lime-300 to-green-400 p-3 rounded-2xl shadow-[0_0_30px_rgba(204,255,0,0.35)]">
                      <img src={isuLogo} alt="ISU Logo" className="h-10 w-10" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-black bg-gradient-to-r from-[#CCFF00] via-lime-300 to-green-300 bg-clip-text text-transparent leading-tight">
                        SafeRide
                      </h1>
                      <p className="text-white/70 text-sm font-semibold tracking-wide">STUDENT PORTAL</p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <Lock className="h-4 w-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Secure access</p>
                        <p className="text-white/60 text-sm">Login or register with your student account.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <MapPin className="h-4 w-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Ride features</p>
                        <p className="text-white/60 text-sm">Track rides and stay updated while on campus.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <Bell className="h-4 w-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Safety alerts</p>
                        <p className="text-white/60 text-sm">Get notifications and use SOS when needed.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-white/40 text-xs">© 2025 SafeRide ISU. All rights reserved.</p>
              </div>

              {/* Right panel */}
              <div className="md:col-span-3 md:bg-white/95 md:backdrop-blur-xl md:min-h-0 md:flex md:flex-col">
                <StudentAuthPanel embedded />
              </div>
            </div>
          </div>
            </div>

            {/* Footer */}
            <div className="text-center text-white/50 text-xs md:hidden landscape:hidden">
              <p>© 2025 SafeRide ISU. All rights reserved.</p>
            </div>
          </>
        ) : (
          <>
            {/* Desktop Title */}
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent mb-2">
                Admin & Officer Portal
              </h2>
              <div className="h-1 w-24 bg-gradient-to-r from-primary to-primary/60 mx-auto rounded-full" />
            </div>

            {/* Admin/PNP Login Card - Unified */}
            <div className="bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 backdrop-blur-sm overflow-hidden border border-slate-100">
              {/* Admin Type Selector */}
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => setAdminType('isu')}
                  className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    adminType === 'isu'
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-white border-b-2 border-primary'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Building2 className="h-5 w-5" />
                  ISU Admin
                </button>
                <button
                  onClick={() => setAdminType('pnp')}
                  className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    adminType === 'pnp'
                      ? 'bg-gradient-to-r from-blue-700 to-blue-600 text-white border-b-2 border-blue-700'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Shield className="h-5 w-5" />
                  PNP Admin
                </button>
                <button
                  onClick={() => setAdminType('rescue')}
                  className={`flex-1 py-4 px-6 font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                    adminType === 'rescue'
                      ? 'bg-gradient-to-r from-red-700 to-orange-600 text-white border-b-2 border-red-700'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Ambulance className="h-5 w-5" />
                  Rescue Admin
                </button>
              </div>

              {/* Login Form Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 min-h-56">
                {/* Left Side - Branding & Info */}
                <div className={`p-5 lg:p-6 flex flex-col justify-center items-start border-b md:border-b-0 md:border-r border-slate-100 ${
                  adminType === 'isu'
                    ? 'bg-gradient-to-br from-primary/15 via-primary/10 to-primary/5'
                    : adminType === 'pnp'
                    ? 'bg-gradient-to-br from-blue-700/15 via-blue-700/10 to-blue-700/5'
                    : 'bg-gradient-to-br from-red-700/15 via-red-700/10 to-red-700/5'
                }`}>
                  {/* Security Badge */}
                  <div className={`flex items-center gap-1.5 px-2 py-0.5 border rounded-full w-fit mb-3 ${
                    adminType === 'isu'
                      ? 'bg-green-50 border-green-200'
                      : adminType === 'pnp'
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <CheckCircle className={`h-3 w-3 ${
                      adminType === 'isu'
                        ? 'text-green-600'
                        : adminType === 'pnp'
                        ? 'text-blue-600'
                        : 'text-red-600'
                    }`} />
                    <span className={`text-xs font-semibold ${
                      adminType === 'isu'
                        ? 'text-green-700'
                        : adminType === 'pnp'
                        ? 'text-blue-700'
                        : 'text-red-700'
                    }`}>Secure Connection</span>
                  </div>

                  {/* Logo */}
                  <div className="mb-2">
                    <img src={isuLogo} alt="ISU Logo" className="h-12 w-12 rounded-full object-cover shadow-lg" />
                  </div>

                  {/* Header */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-0.5">
                      {adminType === 'isu' 
                        ? 'ISU Admin Dashboard' 
                        : adminType === 'pnp'
                        ? 'PNP Command Center'
                        : 'Rescue Admin Panel'}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {adminType === 'isu' 
                        ? 'Secure Campus Access'
                        : adminType === 'pnp'
                        ? 'Police Operations'
                        : 'Emergency Response'}
                    </p>
                    <div className={`h-0.5 w-8 rounded-full mt-1.5 ${
                      adminType === 'isu'
                        ? 'bg-gradient-to-r from-primary to-primary/60'
                        : adminType === 'pnp'
                        ? 'bg-gradient-to-r from-blue-700 to-blue-600'
                        : 'bg-gradient-to-r from-red-700 to-orange-600'
                    }`} />
                  </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="p-5 lg:p-6 flex flex-col justify-start bg-gradient-to-br from-white via-slate-50/30 to-white">
                  {adminType === 'isu' ? (
                    <LoginForm userType="admin" />
                  ) : adminType === 'pnp' ? (
                    <PNPLoginForm />
                  ) : (
                    <RescueLoginForm />
                  )}
                </div>
              </div>
            </div>

            {/* Help Link */}
            <div className="flex justify-center mt-6">
              <Button
                variant="ghost"
                className="gap-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200 text-sm"
                onClick={() => navigate('/help')}
              >
                <HelpCircle className="h-4 w-4" />
                Need Help?
              </Button>
            </div>
          </>
        )}
      </div>

    </div>
  );
};

export default Login;
