import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Shield, ArrowLeft, Users, Car, MapPin, Bell, Lock, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/auth/LoginForm";
import StudentAuthPanel from "@/components/auth/StudentAuthPanel";
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const userType = (searchParams.get('type') as 'admin' | 'student') || 'student';

  useEffect(() => {
    const checkUserAndRole = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        // A user can have multiple roles; resolve deterministically.
        const { data: rolesData, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id);

        if (rolesError) throw rolesError;

        const roles = (rolesData ?? []).map((r: any) => r.role as 'admin' | 'student' | 'driver');
        const primaryRole = roles.includes('admin')
          ? 'admin'
          : roles.includes('driver')
            ? 'driver'
            : roles.includes('student')
              ? 'student'
              : null;

        if (primaryRole === 'admin') navigate('/admin');
        else if (primaryRole === 'student') navigate('/student');
        else if (primaryRole === 'driver') navigate('/');
      } catch {
        // No active session or role
      }
    };

    checkUserAndRole();
  }, [navigate]);

  const isAdmin = userType === 'admin';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Branding (visible on laptop/desktop) */}
      <div className={`hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden ${
        isAdmin 
          ? 'bg-gradient-to-br from-primary via-primary/90 to-primary/80' 
          : 'bg-gradient-to-br from-green-700 via-green-800 to-green-900'
      }`}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12 text-white">
          <div className="max-w-lg">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Shield className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">ISU Emergency System</h1>
                <p className="text-white/80 text-sm">
                  {isAdmin ? 'Administrative Portal' : 'Student Safety Portal'}
                </p>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-4xl xl:text-5xl font-bold mb-6 leading-tight">
              {isAdmin 
                ? 'Manage Campus Safety with Confidence' 
                : 'Your Safety is Our Priority'}
            </h2>
            <p className="text-lg text-white/90 mb-10">
              {isAdmin 
                ? 'Monitor students, manage drivers, and respond to emergencies in real-time from a unified dashboard.'
                : 'Access emergency services, track your rides, and stay connected with campus security.'}
            </p>

            {/* Features */}
            <div className="space-y-4">
              {isAdmin ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Users className="h-5 w-5" />
                    </div>
                    <span>Manage students and drivers</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span>Real-time location tracking</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Bell className="h-5 w-5" />
                    </div>
                    <span>Instant emergency alerts</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    <span>One-tap SOS emergency button</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Car className="h-5 w-5" />
                    </div>
                    <span>Scan driver QR codes before boarding</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg">
                      <Lock className="h-5 w-5" />
                    </div>
                    <span>Secure and encrypted communication</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Decorative circles */}
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-white/10 rounded-full" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full" />
      </div>

      {/* Right Panel - Login Form */}
      <div className={`flex-1 flex flex-col min-h-screen ${
        isAdmin 
          ? 'bg-gradient-to-br from-primary/5 via-background to-primary/10' 
          : 'bg-gradient-to-br from-green-50 via-white to-emerald-50'
      }`}>
        {/* Mobile Header */}
        <div className={`lg:hidden p-4 ${
          isAdmin ? 'bg-primary' : 'bg-green-800'
        } text-white`}>
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 p-2"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6" />
              <span className="font-semibold">ISU Emergency</span>
            </div>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Desktop Back Button */}
        <div className="hidden lg:block p-6">
          <Button
            variant="ghost"
            className="gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="w-full max-w-md">
            {/* Desktop Title */}
            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {isAdmin ? 'Admin Sign In' : 'Student Sign In'}
              </h2>
              <p className="text-muted-foreground">
                {isAdmin 
                  ? 'Access the administrative dashboard' 
                  : 'Enter your credentials to continue'}
              </p>
            </div>

            {userType === 'student' ? (
              <StudentAuthPanel />
            ) : (
              <LoginForm userType="admin" />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 text-center text-sm text-muted-foreground">
          © 2025 Isabela State University. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default Login;
