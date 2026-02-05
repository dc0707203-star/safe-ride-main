import { useNavigate } from "react-router-dom";
import { Shield, Ambulance, Building2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import AdminLoginModal from "@/components/AdminLoginModal";
import isuLogo from "@/assets/isu-logo.png";
import riseCenter from "@/assets/rise-center.png";
import campusBg from "@/assets/campus-bg.jpeg";

const AdminPortal = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedAdminType, setSelectedAdminType] = useState<'isu' | 'pnp' | 'rescue'>('isu');
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);
  const [clickedButton, setClickedButton] = useState<string | null>(null);
  const [showIsuLogo, setShowIsuLogo] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowIsuLogo(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const adminOptions = [
    {
      id: "pnp",
      title: "PNP Admin",
      description: "Police Operations Network",
      icon: Shield,
      color: "from-blue-600 to-blue-800",
      borderColor: "border-blue-400",
      hoverColor: "hover:shadow-blue-500/50",
    },
    {
      id: "rescue",
      title: "Rescue Admin",
      description: "Emergency Response Team",
      icon: Ambulance,
      color: "from-red-600 to-orange-700",
      borderColor: "border-orange-400",
      hoverColor: "hover:shadow-orange-500/50",
    },
    {
      id: "isu",
      title: "ISU Admin",
      description: "University Administration",
      icon: Building2,
      color: "from-lime-500 to-green-700",
      borderColor: "border-lime-400",
      hoverColor: "hover:shadow-lime-500/50",
    },
  ];

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-cover bg-center bg-fixed"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(5, 65, 35, 0.85) 0%, rgba(20, 70, 40, 0.9) 50%, rgba(5, 65, 35, 0.85) 100%), url('${campusBg}')`
      }}
    >
      {/* Back Button */}
      <div className="absolute top-4 left-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-800 hover:text-gray-900 hover:bg-white/70"
        >
          ← Back
        </Button>
      </div>

      {/* Content */}
      <div className="w-full max-w-4xl mx-auto px-4">
        {/* Logo & Header */}
        <div className="text-center mb-16">
          <div className="mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={showIsuLogo ? 'isu' : 'rise'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
                className="inline-block"
              >
                {showIsuLogo ? (
                  <img src={isuLogo} alt="ISU Logo" className="w-20 h-20 mx-auto rounded-full shadow-lg ring-2 ring-white/20" />
                ) : (
                  <img src={riseCenter} alt="RISE Center Logo" className="w-20 h-20 mx-auto rounded-full shadow-lg ring-2 ring-white/20 object-cover" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <h1 className="text-5xl font-bold text-[#CCFF00] mb-3">Admin Portal</h1>
          <p className="text-[#7ee787] text-lg">Select your admin role to continue</p>
        </div>

        {/* Admin Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {adminOptions.map((admin) => {
            const IconComponent = admin.icon;
            const isHovered = hoveredButton === admin.id;
            
            return (
              <button
                key={admin.id}
                onMouseEnter={() => setHoveredButton(admin.id)}
                onMouseLeave={() => setHoveredButton(null)}
                onClick={() => {
                  setClickedButton(admin.id);
                  setSelectedAdminType(admin.id as 'isu' | 'pnp' | 'rescue');
                  setTimeout(() => setShowLoginModal(true), 150);
                }}
                className={`group relative overflow-hidden rounded-2xl backdrop-blur-2xl border-2 ${admin.borderColor} transition-all duration-300 cursor-pointer transform ${
                  isHovered ? 'scale-105 shadow-2xl' : 'scale-100 shadow-lg'
                } ${clickedButton === admin.id ? 'scale-95' : ''}`}
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%), ${
                    admin.id === 'pnp' ? 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' :
                    admin.id === 'rescue' ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' :
                    'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                  }`
                }}
              >
                {/* Animated Glow Background */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500`} style={{
                  background: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, transparent 70%)`,
                }}></div>

                {/* Card Content */}
                <div className="relative p-6 h-full flex flex-col items-center justify-center text-center">
                  {/* Icon Container */}
                  <div className={`w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 mb-4 transition-all duration-300 ${
                    isHovered ? 'scale-125 bg-white/30' : 'scale-100'
                  }`}>
                    <IconComponent className={`w-8 h-8 text-white transition-transform duration-300 ${
                      isHovered ? 'rotate-12 scale-125' : 'rotate-0 scale-100'
                    }`} />
                  </div>

                  {/* Text Content */}
                  <h2 className={`text-2xl font-bold text-white mb-2 transition-all duration-300`}>
                    {admin.title}
                  </h2>
                  <p className={`text-white/85 text-sm font-medium transition-all duration-300 ${
                    isHovered ? 'text-white' : 'text-white/85'
                  }`}>
                    {admin.description}
                  </p>

                  {/* Arrow Badge */}
                  <div className={`absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center transition-all duration-300 ${
                    isHovered ? 'scale-125 bg-white/40' : 'scale-100'
                  }`}>
                    <ArrowRight className={`w-4 h-4 text-white transition-transform duration-300 ${
                      isHovered ? 'translate-x-1' : 'translate-x-0'
                    }`} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="text-center text-gray-600 text-base">
          <p>Choose your admin role to access the corresponding dashboard</p>
        </div>
      </div>

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        initialAdminType={selectedAdminType}
      />
    </div>
  );
};

export default AdminPortal;
