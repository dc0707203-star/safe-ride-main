import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, MapPin, QrCode, ShieldCheck } from "lucide-react";
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
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-start md:justify-center px-4 py-8 md:p-4 overflow-y-auto bg-fixed bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.9) 50%, rgba(0,0,0,0.9) 100%), url('${campusBg}')` }}
    >
      <div className="relative z-10 w-full max-w-md md:max-w-4xl">
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
            <p className="text-white/70 text-base font-semibold tracking-wide">DRIVER PORTAL</p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="relative mb-8 landscape:mb-4 group transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-[#CCFF00]/30 to-green-400/30 rounded-3xl blur-3xl opacity-0 md:group-hover:opacity-100 transition-all duration-500" />
          <div className="relative bg-white md:bg-gradient-to-br md:from-white/10 md:via-white/5 md:to-transparent border border-white/15 rounded-3xl overflow-hidden md:backdrop-blur-2xl md:shadow-2xl hover:md:shadow-[0_0_60px_rgba(204,255,0,0.25),0_20px_40px_rgba(204,255,0,0.08)] transition-all duration-500 transform md:group-hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative z-10 md:grid md:grid-cols-5 md:grid-rows-[minmax(0,1fr)] md:min-h-[560px] md:h-[calc(100vh-220px)] md:max-h-[720px] md:min-h-0">
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
                      <p className="text-white/70 text-sm font-semibold tracking-wide">DRIVER PORTAL</p>
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <ShieldCheck className="h-4 w-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Verified profile</p>
                        <p className="text-white/60 text-sm">Register once, then access your driver dashboard.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <QrCode className="h-4 w-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">QR system</p>
                        <p className="text-white/60 text-sm">Fast trip logging for students and drivers.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <MapPin className="h-4 w-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Live tracking</p>
                        <p className="text-white/60 text-sm">Share location when needed for safety and monitoring.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 h-8 w-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/10">
                        <Bell className="h-4 w-4 text-[#CCFF00]" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">Emergency alerts</p>
                        <p className="text-white/60 text-sm">Get notified and respond quickly when incidents occur.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-white/40 text-xs">© 2025 SafeRide ISU. All rights reserved.</p>
              </div>

              {/* Right panel */}
              <div className="md:col-span-3 md:bg-white/95 md:backdrop-blur-xl md:min-h-0 md:flex md:flex-col">
                <DriverAuthPanel embedded />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/50 text-xs md:hidden landscape:hidden">
          <p>© 2025 SafeRide ISU. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default DriverPortal;
