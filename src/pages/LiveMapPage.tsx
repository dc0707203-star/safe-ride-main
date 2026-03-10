import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import RealtimeMap from "@/components/RealtimeMap";
import isuLogo from "@/assets/isu-logo.png";
import campusBg from "@/assets/campus-bg.jpeg";

const LiveMapPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src={campusBg} alt="" className="w-full h-full object-cover blur-xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-green-950/90 via-green-900/85 to-green-950/90" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-green-900/40 border-b border-[#CCFF00]/10">
        <div className="w-full px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin')}
                className="hover:bg-white/10 text-white rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/80 rounded-full shadow-lg backdrop-blur-sm hover:bg-white/90 transition-all">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <img src={isuLogo} alt="ISU Logo" className="h-9 w-9 sm:h-11 sm:w-11" />
                </motion.div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#CCFF00] via-lime-300 to-green-400 bg-clip-text text-transparent">
                  Live Map
                </h1>
                <p className="text-xs sm:text-sm text-white/50">Real-time tracking of all active student trips</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-lime-500/20 border border-lime-500/40">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-lime-500"></span>
                </span>
                <span className="text-xs font-bold text-lime-300">Live</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="hover:bg-white/10 text-white rounded-xl"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          <RealtimeMap isFullPage={true} />
        </div>
      </main>
    </div>
  );
};

export default LiveMapPage;
