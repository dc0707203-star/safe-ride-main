import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import DriverAuthPanel from "@/components/auth/DriverAuthPanel";
import campusBg from "@/assets/campus-bg.jpeg";
import isuLogo from "@/assets/isu-logo.png";

const DriverPortal = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && userRole === "driver") {
      navigate("/driver-dashboard");
    }
  }, [user, userRole, loading, navigate]);

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 overflow-y-auto bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 50%, rgba(0,0,0,0.9) 100%), url(${campusBg})` }}
    >
      <div className="relative z-10 w-full max-w-md">
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

        {/* Header */}
        <div className="mb-12 md:mb-16 landscape:mb-6 animate-fade-in">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-gradient-to-br from-[#CCFF00] via-lime-300 to-green-400 p-3.5 rounded-2xl shadow-[0_0_30px_rgba(204,255,0,0.6)]">
              <img src={isuLogo} alt="ISU Logo" className="h-12 w-12" />
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl landscape:text-3xl font-black bg-gradient-to-r from-[#CCFF00] via-lime-300 to-green-400 bg-clip-text text-transparent mb-2">
              SafeRide
            </h1>
            <p className="text-white/70 text-base font-semibold tracking-wide">DRIVER PORTAL</p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="relative mb-8 landscape:mb-4 group cursor-pointer transition-all duration-500 bg-transparent rounded-2xl p-0 md:bg-transparent md:rounded-3xl md:p-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#CCFF00]/30 to-green-400/30 rounded-3xl blur-3xl opacity-0 md:group-hover:opacity-100 transition-all duration-500" />
          <div className="relative z-10">
            <DriverAuthPanel />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/50 text-xs landscape:hidden">
          <p>© 2025 SafeRide ISU. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default DriverPortal;
