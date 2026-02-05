import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Shield, Ambulance, LogOut, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import isuLogo from "@/assets/isu-logo.png";
import riseCenter from "@/assets/rise-center.png";
import campusBg from "@/assets/campus-bg.jpeg";

interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  borderColor: string;
  hoverColor: string;
  route: string;
}

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user, userRoles, loading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showIsuLogo, setShowIsuLogo] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowIsuLogo(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }
  }, [user, loading, navigate]);

  const roleOptions: Record<string, RoleOption> = {
    admin: {
      id: "admin",
      title: "ISU Admin",
      description: "University Administration",
      icon: Building2,
      color: "from-lime-500 to-green-700",
      borderColor: "border-lime-400",
      hoverColor: "hover:shadow-lime-500/50",
      route: "/admin",
    },
    pnp: {
      id: "pnp",
      title: "PNP Admin",
      description: "Police Operations Network",
      icon: Shield,
      color: "from-blue-600 to-blue-800",
      borderColor: "border-blue-400",
      hoverColor: "hover:shadow-blue-500/50",
      route: "/pnp",
    },
    rescue_admin: {
      id: "rescue_admin",
      title: "Rescue Admin",
      description: "Emergency Response Team",
      icon: Ambulance,
      color: "from-red-600 to-orange-700",
      borderColor: "border-orange-400",
      hoverColor: "hover:shadow-orange-500/50",
      route: "/rescue-admin",
    },
    rescue: {
      id: "rescue",
      title: "Rescue Officer",
      description: "Emergency Response Team",
      icon: Ambulance,
      color: "from-red-600 to-orange-700",
      borderColor: "border-orange-400",
      hoverColor: "hover:shadow-orange-500/50",
      route: "/rescue",
    },
    student: {
      id: "student",
      title: "Student",
      description: "Student Portal",
      icon: Building2,
      color: "from-green-500 to-emerald-700",
      borderColor: "border-green-400",
      hoverColor: "hover:shadow-green-500/50",
      route: "/student",
    },
    driver: {
      id: "driver",
      title: "Driver",
      description: "Driver Portal",
      icon: Building2,
      color: "from-blue-500 to-cyan-600",
      borderColor: "border-blue-400",
      hoverColor: "hover:shadow-blue-500/50",
      route: "/driver-dashboard",
    },
  };

  const availableRoles = (userRoles || [])
    .filter((role) => role in roleOptions)
    .map((role) => roleOptions[role]);

  const handleSelectRole = async (roleId: string) => {
    setSelectedRole(roleId);
    setIsNavigating(true);
    const option = roleOptions[roleId];
    
    // Small delay for visual feedback
    setTimeout(() => {
      navigate(option.route);
    }, 300);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-12 h-12 border-4 border-lime-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading roles...</p>
        </div>
      </div>
    );
  }

  if (!user || availableRoles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <p className="mb-4">No roles available</p>
          <Button onClick={() => navigate("/login")} className="bg-lime-400 hover:bg-lime-500 text-slate-900">
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(5, 65, 35, 0.85) 0%, rgba(20, 70, 40, 0.9) 50%, rgba(5, 65, 35, 0.85) 100%), url()`
      }}
    >
      {/* Logout Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-red-300 hover:text-white hover:bg-red-600/30"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl">
        {/* Logo & Header */}
        <div className="text-center mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={showIsuLogo ? 'isu' : 'rise'}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="inline-block mx-auto mb-6"
            >
              {showIsuLogo ? (
                <img src={isuLogo} alt="ISU Logo" className="w-16 h-16 rounded-full" />
              ) : (
                <img src={riseCenter} alt="RISE Center Logo" className="w-16 h-16 rounded-full object-cover" />
              )}
            </motion.div>
          </AnimatePresence>
          <h1 className="text-4xl font-bold text-white mb-2">Select Your Role</h1>
          <p className="text-gray-400">Welcome, {user?.email}. Choose an access level to continue</p>
        </div>

        {/* Role Options */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {availableRoles.map((role) => {
            const IconComponent = role.icon;
            return (
              <button
                key={role.id}
                onClick={() => handleSelectRole(role.id)}
                disabled={isNavigating && selectedRole === role.id}
                className={`group relative overflow-hidden rounded-xl border-2 ${role.borderColor} bg-gradient-to-r ${role.color} p-6 transition-all duration-300 ${role.hoverColor} hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 -skew-x-12"></div>

                {/* Loading Indicator */}
                {isNavigating && selectedRole === role.id && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}

                {/* Content */}
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:bg-white/30 transition-colors">
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-xl font-bold text-white">{role.title}</h2>
                      <p className="text-sm text-white/80">{role.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white group-hover:translate-x-2 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-500 text-sm">
          <p>You have {availableRoles.length} role{availableRoles.length !== 1 ? "s" : ""} available</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
