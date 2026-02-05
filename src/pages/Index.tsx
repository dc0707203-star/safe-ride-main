import '../footer-link-glow.css';
import { useState, useEffect, type CSSProperties } from 'react';
import MobileBottomNav from '@/components/MobileBottomNav';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  Home,
  Info,
  Phone,
  Code2,
  Users, 
  Car, 
  QrCode, 
  MapPin, 
  Bell, 
  ShieldCheck,
  ChevronRight, 
  Zap,
  Sparkles,
  Shield,
  Radio,
  BookOpen,
  Star,
  CheckCircle,
  Award,
  TrendingUp,
  Activity,
  Clock,
  Github,
  Facebook,
  Instagram
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useAuth } from '@/hooks/useAuth';
import isuLogo from '@/assets/isu-logo.png';
import riseCenter from '@/assets/rise-center.png';
import campusBg from '@/assets/campus-bg.jpeg';
import SplashScreen from '@/components/SplashScreen';

type TabType = 'home' | 'features' | 'about' | 'contact' | 'developer' | 'guide';

const TABS: TabType[] = ['home', 'features', 'guide', 'about', 'contact', 'developer'];

// --- Custom Button Component ---
const Button = ({ children, className = "", variant = "secondary", onClick, size = "md", style }: { 
  children: React.ReactNode, 
  className?: string, 
  variant?: "secondary" | "outline", 
  onClick?: () => void,
  size?: "md" | "lg",
  style?: CSSProperties
}) => {
  const sizeStyles = size === "lg" ? "h-12 px-6 text-sm" : "h-11 px-6 text-xs";
  const baseStyles = `inline-flex items-center justify-center rounded-2xl font-black transition-all active:scale-95 uppercase tracking-[0.12em] ${sizeStyles} relative z-30 overflow-hidden group cursor-pointer focus:outline-none`;
  
  const variants = {
    secondary: "bg-gradient-to-r from-[#CCFF00] to-[#a8e600] text-[#002211] hover:text-[#004d25] hover:shadow-[0_0_50px_rgba(204,255,0,0.4),0_10px_40px_-10px_rgba(204,255,0,0.3)] shadow-[0_4px_20px_rgba(204,255,0,0.3)] border-none", 
    outline: "border border-[#004d25]/30 text-[#004d25] hover:text-[#004d25] hover:bg-[#004d25]/5 hover:border-[#004d25]/60 active:text-[#004d25] active:bg-[#004d25]/5 backdrop-blur-xl bg-white/50 hover:shadow-[0_0_30px_rgba(0,77,37,0.1)]",
  };
  
  const inlineStyle: CSSProperties = { color: variant === 'secondary' ? '#002211' : '#004d25', ...style };

  return (
    <button
      onClick={onClick}
      style={inlineStyle}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      aria-label={typeof children === 'string' ? children : undefined}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {variant === 'secondary' && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        </>
      )}
    </button>
  );
};

// --- Custom Glass Card Component (Light Mode) ---
const Card = ({ children, className = "", alert = false, glow = false }: { children: React.ReactNode, className?: string, alert?: boolean, glow?: boolean }) => (
  <motion.div 
    whileHover={{ y: -4, scale: 1.02 }}
    transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
    className={`group relative backdrop-blur-xl border shadow-lg ${
      alert 
        ? 'bg-white/10 border-white/50 hover:border-white/60 hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)]' 
        : 'bg-white/10 border-white/50 hover:border-white/60 hover:shadow-[0_8px_32px_rgba(204,255,0,0.1)]'
    } p-5 rounded-3xl transition-all duration-500 overflow-hidden ${className}`}
  >
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-white/5" />
    {glow && (
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#CCFF00]/20 blur-[60px] pointer-events-none animate-pulse" />
    )}
    <div className="relative z-10">{children}</div>
  </motion.div>
);

// --- Philippine Motorcycle/Tricycle Icon ---
const PhilippineMotorcycleIcon = ({ className = "h-5 w-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Main body/sidecar */}
    <path d="M3 14 L4 10 Q4 8 6 8 L12 8 Q13 8 13 9 L13 14" strokeWidth="2" />
    {/* Motorcycle body */}
    <path d="M13 14 L14 9 Q14 8 15 8 L18 8 Q19 8 19 9 L19 14" strokeWidth="2" />
    
    {/* Front wheel (sidecar) */}
    <circle cx="5" cy="17" r="2.5" strokeWidth="2" />
    {/* Middle wheel */}
    <circle cx="12" cy="17" r="2.5" strokeWidth="2" />
    {/* Back wheel */}
    <circle cx="18" cy="17" r="2.5" strokeWidth="2" />
    
    {/* Connection between sidecar and motorcycle */}
    <line x1="9" y1="14" x2="15" y2="14" strokeWidth="1.5" />
    
    {/* Handlebar */}
    <path d="M16 8 L15 6 M16 8 L17 6" strokeWidth="1.5" />
    
    {/* Roof/canopy */}
    <path d="M6 8 Q6 6 8 6 L14 6" strokeWidth="1.5" />
    
    {/* Window opening */}
    <line x1="10" y1="8" x2="10" y2="10" strokeWidth="1" opacity="0.7" />
  </svg>
);


// Animation variants
const pageVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -50 }
};

const pageTransition = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
};

// --- Floating Particles Component (Green for White BG) ---
const FloatingParticles = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {[...Array(8)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-gradient-to-r from-[#CCFF00]/20 to-[#CCFF00]/10"
        style={{
          width: `${20 + (i % 3) * 10}px`,
          height: `${20 + (i % 3) * 10}px`,
          left: `${10 + i * 12}%`,
          top: `${15 + (i % 4) * 20}%`,
        }}
        animate={{
          y: [-30, 30, -30],
          x: [-10, 10, -10],
          opacity: [0.1, 0.4, 0.1],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{
          duration: 4 + i * 0.6,
          repeat: Infinity,
          ease: "easeInOut",
          delay: i * 0.25,
        }}
      />
    ))}
  </div>
);


// --- Mobile Home Tab Content ---
const MobileHomeContent = ({ navigate }: { navigate: (path: string) => void }) => {
  const { ref, isVisible } = useScrollAnimation();
  const [showIsuLogo, setShowIsuLogo] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setShowIsuLogo(prev => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  const steps = [
    { number: "01", title: "Register", description: "Create your account", icon: Users, color: "from-blue-100 to-cyan-50" },
    { number: "02", title: "Verify", description: "Complete verification", icon: ShieldCheck, color: "from-green-100 to-emerald-50" },
    { number: "03", title: "Connect", description: "Link with drivers", icon: MapPin, color: "from-purple-100 to-pink-50" },
    { number: "04", title: "Travel", description: "Enjoy safe rides", icon: Car, color: "from-orange-100 to-red-50" },
  ];

  return (
    <motion.div 
      key="home"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="flex flex-col px-4 w-full relative"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0,77,37,0.85), rgba(0,77,37,0.85)), url(${campusBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <FloatingParticles />
      {/* Mobile Hero Section */}
      <div className="flex flex-col items-center justify-center mb-8 mt-12">
        <div className="w-full max-w-md mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
            className="w-full"
          >
            <div className="flex justify-center mb-6">
              <AnimatePresence mode="wait">
                <motion.div
                  key={showIsuLogo ? 'isu' : 'rise'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <motion.img 
                    src={showIsuLogo ? isuLogo : riseCenter} 
                    alt={showIsuLogo ? "ISU Logo" : "RISE Center Logo"}
                    className="w-20 h-20 object-contain drop-shadow-lg"
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="text-center mb-8">
              <div className="inline-block px-6 py-4 rounded-3xl border-2 border-[#90EE90]/40 bg-gradient-to-b from-white/5 to-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(144,238,144,0.15),inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight leading-tight drop-shadow-lg text-[#90EE90]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6), 0 0 20px rgba(144,238,144,0.4)' }}>ISU Monitoring<br />and Emergency Response<br />System</h1>
              </div>
            </div>
            <div className="w-full flex flex-col gap-4">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shadow-lg">
                <Button size="lg" variant="secondary" onClick={() => navigate('/admin-portal')} className="w-full">
                  <Zap className="h-5 w-5" /> Admin Access
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shadow-lg relative overflow-hidden group">
                <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1609708536965-4a6d0b1d8054?w=500&h=300&fit=crop)' }}></div>
                <Button size="lg" variant="outline" onClick={() => navigate('/login?type=student')} className="w-full relative">
                  <Users className="h-5 w-5" /> Student Portal
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shadow-lg">
                <Button size="lg" variant="outline" onClick={() => navigate('/driver-portal')} className="w-full">
                  <PhilippineMotorcycleIcon className="h-5 w-5" /> Driver Registration
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Quick Stats */}
      <motion.div 
        variants={fadeInUp}
        className="flex flex-col gap-4 mt-6 pt-6 border-t border-[#CCFF00]/30"
      >
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: '24/7', label: 'SUPPORT', icon: Bell },
            { value: '100%', label: 'SECURE', icon: ShieldCheck },
            { value: 'Real-time', label: 'TRACKING', icon: MapPin },
          ].map((stat, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05, y: -4 }} className="text-center p-3 bg-white/20 backdrop-blur-xl rounded-2xl border border-white/30 shadow-lg hover:bg-white/30 hover:border-white/40 transition-all">
              <div className="flex justify-center mb-2">
                <stat.icon className="w-5 h-5 text-[#90EE90]" />
              </div>
              <div className="text-[#90EE90] text-lg font-extrabold drop-shadow-lg">{stat.value}</div>
              <div className="text-xs uppercase tracking-wider font-bold drop-shadow text-[#90EE90]/90">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>
      {/* How It Works - Mobile */}
      <motion.div ref={ref} variants={staggerContainer} initial="initial" animate="animate" className="w-full mb-8 mt-8">
        <motion.div 
          variants={fadeInUp}
          className="text-center mb-8"
        >
          <div className="inline-block px-4 py-2 bg-[#90EE90]/20 rounded-full border border-[#90EE90]/40 mb-3">
            <span className="text-[#90EE90] text-xs font-bold uppercase tracking-widest">Quick Start</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#90EE90] mb-2 drop-shadow-lg uppercase tracking-tight">How It Works</h2>
          <p className="text-white/90 text-sm sm:text-base font-medium">4 simple steps to get started</p>
        </motion.div>
        <div className="grid grid-cols-2 gap-4">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -6 }}
            >
              <Card className="p-5 h-full bg-gradient-to-br from-green-400/20 to-green-300/10 hover:from-green-400/30 hover:to-green-300/15 border-2 border-green-300/40">
                <div className="flex items-start gap-3 mb-3">
                  <motion.div className="px-2.5 py-1.5 bg-green-400/30 rounded-lg text-white text-xs font-black tracking-wider" whileHover={{ scale: 1.1 }}>
                    {step.number}
                  </motion.div>
                  <motion.div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`} whileHover={{ scale: 1.1, rotate: 5 }}>
                    <step.icon className="h-5 w-5 drop-shadow" style={{ color: '#CCFF00' }} />
                  </motion.div>
                </div>
                <h3 className="text-base font-extrabold text-white mb-2 leading-tight">{step.title}</h3>
                <p className="text-sm font-semibold text-white/85 leading-snug">{step.description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
      {/* CTA Section - Mobile */}
      <motion.div variants={fadeInUp} className="w-full mb-4 mt-8">
        <Card glow className="p-6 bg-white/10 backdrop-blur-xl border-2 border-white/40">
          <div className="text-center relative z-10">
            <motion.div className="inline-block px-4 py-2 bg-[#90EE90]/40 rounded-full border border-[#90EE90]/60 mb-3" whileHover={{ scale: 1.05 }}>
              <span className="text-[#90EE90] text-xs font-bold uppercase tracking-widest">Final Step</span>
            </motion.div>
            <h3 className="text-white text-xl font-black uppercase mb-3 tracking-tight">Ready to Get Started?</h3>
            <p className="text-white/90 text-sm mb-5 leading-relaxed font-medium">
              Join students already using SafeRide ISU for secure campus transportation.
            </p>
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button size="lg" variant="secondary" onClick={() => navigate('/login?type=student')} className="w-full">
                <Users className="h-5 w-5" /> Join Now
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>
      </motion.div>
  );
};



// --- Mobile Features Tab Content ---
const MobileFeaturesContent = () => {
  const features = [
    { icon: Users, title: "Students", desc: "Secure digital profiles & tracking", color: "from-blue-400 to-blue-500" },
    { icon: Car, title: "Drivers", desc: "Verified registry with QR codes", color: "from-green-400 to-green-500" },
    { icon: QrCode, title: "QR Scan", desc: "Instant trip logging system", color: "from-purple-400 to-purple-500" },
    { icon: MapPin, title: "Tracking", desc: "Real-time GPS monitoring", color: "from-orange-400 to-orange-500" },
    { icon: Bell, title: "SOS Alert", desc: "One-tap emergency response", alert: true, color: "from-red-400 to-red-500" },
    { icon: ShieldCheck, title: "Security", desc: "End-to-end encryption", color: "from-cyan-400 to-cyan-500" },
  ];

  return (
    <motion.div 
      key="features"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="min-h-[calc(100vh-10rem)] px-4 py-6 w-full relative"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0,77,37,0.85), rgba(0,77,37,0.85)), url(${campusBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <FloatingParticles />
      
      <motion.div variants={staggerContainer} initial="initial" animate="animate">
        {/* Header */}
        <motion.div variants={fadeInUp} className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">Security Suite</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">
            Core Features
          </h2>
        </motion.div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeInUp}
              transition={{ delay: i * 0.05 }}
            >
              <Card alert={f.alert} className="p-4 h-full">
                <div className={`w-12 h-12 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-lg`}>
                  <f.icon className="h-6 md:h-5 w-6 md:w-5" style={{ color: '#CCFF00' }} />
                </div>
                <h3 className={`text-sm font-bold mb-1.5 ${f.alert ? 'text-white' : 'text-white'}`}> 
                  {f.title}
                </h3>
                <p className="text-white/85 text-xs leading-relaxed font-medium">{f.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Mobile Guide Tab Content ---
const MobileGuideContent = ({ navigate }: { navigate: (path: string) => void }) => (
  <motion.div 
    key="guide"
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
    className="min-h-[calc(100vh-10rem)] px-4 py-6 w-full"
  >
    <FloatingParticles />
    
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="w-full">
      <motion.div 
        variants={fadeInUp}
        className="w-20 h-20 bg-gradient-to-br from-[#CCFF00]/20 to-white rounded-3xl border border-green-100 flex items-center justify-center mb-6"
      >
        <BookOpen className="w-10 h-10 text-white" />
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <span className="text-white text-xs font-bold uppercase tracking-widest">User Manual</span>
        <h2 className="text-2xl font-black tracking-tight mt-1 text-white">
          Quick Guide
        </h2>
      </motion.div>
      
      <motion.p variants={fadeInUp} className="text-white/80 text-sm leading-relaxed my-5 font-medium">
        Learn how to use ISU Safe Ride for student and driver registration.
      </motion.p>
      
      <motion.div variants={fadeInUp} className="space-y-3">
        <Card glow className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
              <Users className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold uppercase mb-1.5">For Students</h3>
              <p className="text-white/80 text-xs leading-relaxed font-medium">Register, scan QR codes, and track your rides safely.</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-white text-sm font-bold uppercase mb-1.5">For Drivers</h3>
              <p className="text-white/80 text-xs leading-relaxed font-medium">Register, get your QR code, and start accepting students.</p>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <Button variant="outline" onClick={() => navigate('/guide')} className="mt-6">
          Full Guide <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  </motion.div>
);

// --- Mobile About Tab Content ---
const MobileAboutContent = ({ navigate }: { navigate: (path: string) => void }) => (
  <motion.div
    key="about"
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
    className="min-h-[calc(100vh-10rem)] px-4 py-6 w-full"
  >
    <FloatingParticles />
    
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="w-full">
      <motion.div 
        variants={fadeInUp}
        className="w-20 h-20 bg-gradient-to-br from-[#CCFF00]/20 to-white rounded-3xl border border-green-100 flex items-center justify-center mb-6 shadow-sm"
      >
        <img src={isuLogo} alt="ISU Logo" className="w-12 h-12 object-contain" />
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <span className="text-white text-xs font-bold uppercase tracking-widest">About Us</span>
        <h2 className="text-2xl font-black tracking-tight mt-1 text-white">ISU Safe Ride</h2>
        <motion.p variants={fadeInUp} className="text-white/80 text-sm leading-relaxed my-5 font-medium">
        </motion.p>
      </motion.div>
      
      <motion.p variants={fadeInUp} className="text-gray-600 text-sm leading-relaxed my-5 font-medium">
        Comprehensive emergency response at safe transportation system para sa mga estudyante ng Isabela State University.
      </motion.p>
      
      <motion.div variants={fadeInUp} className="space-y-3">
        <Card glow className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-[#004d25]" />
            </div>
            <div>
              <h3 className="text-[#004d25] text-sm font-bold uppercase mb-1.5">Mission</h3>
              <p className="text-white/80 text-xs leading-relaxed font-medium">Provide safe and reliable transportation for all ISU students.</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
              <Radio className="w-4 h-4 text-[#004d25]" />
            </div>
            <div>
              <h3 className="text-[#004d25] text-sm font-bold uppercase mb-1.5">Vision</h3>
              <p className="text-white/80 text-xs leading-relaxed font-medium">Be the most advanced and trusted campus safety system.</p>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <Button variant="outline" onClick={() => navigate('/about')} className="mt-6">
          Learn More <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  </motion.div>
);

// --- Mobile Contact Tab Content ---
const MobileContactContent = ({ navigate }: { navigate: (path: string) => void }) => (
  <motion.div
    key="contact"
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
    className="min-h-[calc(100vh-10rem)] px-4 py-6 w-full"
  >
    <FloatingParticles />
    
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="w-full">
      <motion.div 
        variants={fadeInUp}
        className="w-20 h-20 bg-gradient-to-br from-[#CCFF00]/20 to-white rounded-3xl border border-green-100 flex items-center justify-center mb-6"
      >
        <Phone className="w-10 h-10 text-[#004d25]" />
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <span className="text-[#004d25] text-xs font-bold uppercase tracking-widest">Get in Touch</span>
        <h2 className="text-2xl font-black tracking-tight mt-1 text-white">
          Contact Us
        </h2>
      </motion.div>
      
      <motion.div variants={fadeInUp} className="space-y-3 mt-5">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-[#004d25]" />
            </div>
            <div>
              <h3 className="text-[#004d25] text-sm font-bold">Address</h3>
              <p className="text-white/80 text-xs font-medium">Santiago City Extension Campus</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
              <Phone className="w-5 h-5 text-[#004d25]" />
            </div>
            <div>
              <h3 className="text-[#004d25] text-sm font-bold">Phone</h3>
              <p className="text-white/80 text-xs font-medium">(078) 123-4567</p>
            </div>
          </div>
        </Card>
        
        {/* Emergency Card */}
        <Card alert className="p-5 mt-4 border-red-200 bg-red-50/80">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              <Bell className="w-6 h-6 text-red-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-red-600 text-sm font-bold uppercase tracking-wide">Emergency Hotline</h3>
              <p className="text-white text-xl font-black tracking-wide">911</p>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <Button variant="outline" onClick={() => navigate('/contact')} className="mt-6">
          Full Contact Info <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  </motion.div>
);

// --- Mobile Developer Tab Content ---
const MobileDeveloperContent = ({ navigate }: { navigate: (path: string) => void }) => (
  <motion.div
    key="developer"
    variants={pageVariants}
    initial="initial"
    animate="animate"
    exit="exit"
    transition={pageTransition}
    className="min-h-[calc(100vh-10rem)] px-4 py-6 w-full"
  >
    <FloatingParticles />
    
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="w-full">
      <motion.div 
        variants={fadeInUp}
        className="w-20 h-20 bg-gradient-to-br from-[#CCFF00]/20 to-white rounded-3xl border border-green-100 flex items-center justify-center mb-6"
      >
        <Code2 className="w-10 h-10 text-[#004d25]" />
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <span className="text-[#004d25] text-xs font-bold uppercase tracking-widest">Behind the Code</span>
        <h2 className="text-2xl font-black tracking-tight mt-1 text-white">Meet the Developer</h2>
        <motion.p variants={fadeInUp} className="text-white/80 text-sm leading-relaxed my-5 font-medium"></motion.p>
      </motion.div>
      
      <motion.p variants={fadeInUp} className="text-gray-600 text-sm leading-relaxed my-5 font-medium">
        Built with passion and dedication for the safety of ISU students.
      </motion.p>
      
      <motion.div variants={fadeInUp} className="space-y-3">
        <Card glow className="p-4">
          <h3 className="text-white text-sm font-bold uppercase mb-3">Tech Stack</h3>
          <div className="flex flex-wrap gap-2">
            {['React', 'TypeScript', 'Supabase', 'Tailwind', 'Framer'].map((tech) => (
              <span key={tech} className="px-3 py-1.5 bg-white/20 border border-white/40 rounded-lg text-xs font-bold text-white">
                {tech}
              </span>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white text-sm font-bold uppercase mb-1.5">Version</h3>
              <p className="text-white text-sm font-mono font-bold">v2.5.3</p>
            </div>
            <div className="px-3 py-1 bg-[#CCFF00]/20 rounded-full">
              <span className="text-white text-xs font-bold uppercase">Stable</span>
            </div>
          </div>
        </Card>
      </motion.div>
      
      <motion.div variants={fadeInUp}>
        <Button variant="outline" onClick={() => navigate('/developer')} className="mt-6">
          View Full Profile <ChevronRight className="h-4 w-4" />
        </Button>
      </motion.div>
    </motion.div>
  </motion.div>
);

// --- Features Showcase Section (Desktop) ---
const FeaturesShowcase = () => {
  const { ref, isVisible } = useScrollAnimation();
  const features = [
    { 
      icon: Users, 
      title: "Student Portal", 
      desc: "Secure digital profiles with real-time ride booking", 
      color: "from-blue-50 to-blue-100/50",
      stat: "500+ Students"
    },
    { 
      icon: Car, 
      title: "Driver Management", 
      desc: "Verified drivers with QR-based authentication", 
      color: "from-green-50 to-green-100/50",
      stat: "50+ Drivers"
    },
    { 
      icon: MapPin, 
      title: "GPS Tracking", 
      desc: "Real-time location monitoring for safety", 
      color: "from-orange-50 to-orange-100/50",
      stat: "99.8% Uptime"
    },
    { 
      icon: Bell, 
      title: "SOS Alert System", 
      desc: "One-tap emergency response to authorities", 
      color: "from-red-50 to-red-100/50",
      stat: "24/7 Monitoring"
    },
    { 
      icon: ShieldCheck, 
      title: "Security First", 
      desc: "End-to-end encryption and data protection", 
      color: "from-cyan-50 to-cyan-100/50",
      stat: "100% Secure"
    },
    { 
      icon: QrCode, 
      title: "QR System", 
      desc: "Instant trip logging and verification", 
      color: "from-purple-50 to-purple-100/50",
      stat: "0-5s Scan"
    },
  ];

  return (
    <section ref={ref} className={`relative py-20 px-4 md:px-6 transition-all duration-500 w-full ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{
      backgroundImage: `linear-gradient(135deg, rgba(0,77,37,0.8), rgba(0,77,37,0.8)), url(${campusBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      <div className="w-full max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#CCFF00]/10 backdrop-blur-xl border border-[#CCFF00]/30 mb-6">
            <Sparkles className="w-4 h-4 text-white" />
            <span className="text-white text-xs font-bold uppercase tracking-widest">Complete Platform</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Feature Rich Platform</h2>
          <p className="text-white/90 max-w-2xl mx-auto text-lg">Everything you need for safe and secure student transportation</p>
        </motion.div>

        <motion.div
          initial="initial"
          animate="animate"
          variants={{
            initial: {},
            animate: {
              transition: { staggerChildren: 0.15 }
            }
          }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 18, delay: i * 0.1 }}
              whileHover={{ scale: 1.04, boxShadow: "0 8px 32px rgba(204,255,0,0.15)" }}
              className={`group relative backdrop-blur-2xl border border-green-400/40 hover:border-green-400/70 p-4 rounded-2xl transition-all duration-500 bg-gradient-to-br from-green-500/25 via-teal-500/20 to-emerald-600/15 hover:shadow-[0_10px_40px_rgba(204,255,0,0.2)]`}
            >
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#CCFF00]/15 blur-[60px] pointer-events-none group-hover:bg-[#CCFF00]/25 transition-colors" />
              <div className="relative z-10">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 20, delay: i * 0.18 }}
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                >
                  <f.icon className="h-5 w-5 text-white" />
                </motion.div>
                <h3 className="text-lg font-bold text-white mb-1">{f.title}</h3>
                <p className="text-white/85 text-xs mb-3">{f.desc}</p>
                <div className="flex items-center gap-2 text-white/90 text-[10px] font-bold">
                  <TrendingUp className="h-3 w-3" />
                  <span>{f.stat}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

// --- Trust & Testimonials Section (Desktop) ---
const TrustSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  
  const testimonials = [
    {
      name: "Maria Santos",
      role: "Student - 3rd Year",
      content: "SafeRide ISU made me feel secure during my late night classes. Real-time tracking is a game changer!",
      avatar: "MS"
    },
    {
      name: "Carlos Reyes",
      role: "Registered Driver",
      content: "The QR system is so convenient. Easy trip logging and transparent payments. Highly recommended!",
      avatar: "CR"
    },
    {
      name: "Dr. Juliet Ballastas",
      role: "ISU Administrator",
      content: "SafeRide transformed how we ensure student safety. The emergency alert system is invaluable.",
      avatar: "JB"
    },
  ];

  const stats = [
    { number: "500+", label: "Active Students", icon: Users },
    { number: "50+", label: "Verified Drivers", icon: Car },
    { number: "5000+", label: "Safe Rides", icon: Activity },
    { number: "99.8%", label: "Uptime", icon: Clock },
  ];

  return (
    <section ref={ref} className={`relative py-12 md:py-20 px-4 md:px-6 transition-all duration-500 w-full bg-white ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-12 md:mb-16">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative backdrop-blur-xl border border-green-100 hover:border-[#004d25]/20 p-6 rounded-2xl text-center transition-all bg-white/60 hover:bg-white/80 hover:shadow-lg"
            >
              <s.icon className="w-8 h-8 text-white mx-auto mb-3" />
              <div className="text-3xl font-black text-white mb-2">{s.number}</div>
              <div className="text-white text-sm">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-black text-white mb-4">Trusted by Students & Drivers</h2>
          <p className="text-white/80 max-w-2xl mx-auto">Real stories from real users about their SafeRide ISU experience</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative backdrop-blur-xl border border-green-100 hover:border-[#CCFF00]/40 p-6 rounded-2xl transition-all bg-white/60 hover:bg-white hover:shadow-[0_10px_40px_rgba(0,0,0,0.05)]"
            >
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#90EE90] text-[#90EE90]" />
                ))}
              </div>
              <p className="text-gray-700 mb-6 italic">{t.content}</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#90EE90] to-[#7ED321] flex items-center justify-center text-sm font-bold text-green-950">
                  {t.avatar}
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-6 justify-center mt-16 pt-12 border-t border-green-100">
          {[
            { icon: ShieldCheck, text: "100% Secure" },
            { icon: CheckCircle, text: "ISO Certified" },
            { icon: Award, text: "Award Winning" },
          ].map((badge, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/20 backdrop-blur-xl"
            >
              <badge.icon className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">{badge.text}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

// --- Footer Component (Light Mode) ---
const Footer = ({ navigate }: { navigate: (path: string) => void }) => {
  const { ref, isVisible } = useScrollAnimation();
    return (
      <footer ref={ref} className={`relative border-t border-white/30 bg-white/8 backdrop-blur-3xl transition-all duration-500 w-full shadow-[0_-8px_32px_rgba(0,0,0,0.3)] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="w-full px-4 md:px-6 py-8 sm:py-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Brand Section */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img src={isuLogo} alt="ISU Logo" className="w-6 h-6" />
              <span className="font-black text-white text-lg uppercase tracking-widest">SafeRide ISU</span>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">Emergency Response & Safe Transportation System</p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Quick Links</h4>
            <ul className="space-y-2 text-white/85 text-sm font-semibold">
              <li><button onClick={() => navigate('/')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Home</button></li>
              <li><button onClick={() => window.scrollTo(0, 0)} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Features</button></li>
              <li><button onClick={() => navigate('/about')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">About</button></li>
              <li><button onClick={() => navigate('/contact')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Contact</button></li>
            </ul>
          </div>

          {/* Support */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Support</h4>
            <ul className="space-y-2 text-white/85 text-sm font-semibold">
              <li><button onClick={() => navigate('/guide')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Guide</button></li>
              <li><button onClick={() => navigate('/developer')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Developer</button></li>
              <li><button onClick={() => navigate('/report-issues')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Report Issue</button></li>
              <li><a href="#" className="transition block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Contact IT</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <ul className="space-y-2 text-white/85 text-sm font-semibold">
              <li><button onClick={() => navigate('/privacy')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Privacy Policy</button></li>
              <li><button onClick={() => navigate('/terms')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Terms of Service</button></li>
              <li><button onClick={() => navigate('/security')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Security</button></li>
              <li><button onClick={() => navigate('/cookie-policy')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Cookie Policy</button></li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="pt-8 border-t border-white/20 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 text-white/80 text-xs sm:text-sm">
          <div className="text-center sm:text-left">© 2025 SafeRide ISU. All rights reserved.</div>
          <div className="flex gap-6 justify-center sm:justify-end">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-2 text-white/85">
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            <a href="#" className="hover:text-white transition flex items-center gap-2 text-white/85">
              <Facebook className="w-5 h-5" />
              <span>Facebook</span>
            </a>
            <a href="#" className="hover:text-white transition flex items-center gap-2 text-white/85">
              <Instagram className="w-5 h-5" />
              <span>Instagram</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- Desktop Full Page Design ---
const DesktopLayout = ({ navigate }: { navigate: (path: string) => void }) => {
  const [showIsuLogo, setShowIsuLogo] = useState(true);
  const [pressedNav, setPressedNav] = useState<string | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setShowIsuLogo(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
  <>
    {/* Desktop Navigation Bar - Light Mode */}
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0.9 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 140, damping: 20 }}
        className="bg-white/10 backdrop-blur-xl border border-white/50 shadow-[0_8px_32px_rgba(255,255,255,0.1)] rounded-full px-8 py-3.5 flex justify-between items-center w-full max-w-5xl transition-all hover:bg-white/15 hover:border-white/60 hover:shadow-[0_12px_40px_rgba(255,255,255,0.15)]"
      >
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 140, damping: 20 }}
          className="flex items-center gap-2.5 group cursor-pointer flex-shrink-0" 
          onClick={() => navigate('/')}
        >
          <div className="bg-white p-2 rounded-lg shadow-sm border border-green-100 transition-all group-hover:scale-110 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={showIsuLogo ? 'isu' : 'rise'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.4 }}
              >
                {showIsuLogo ? (
                  <img src={isuLogo} alt="ISU Logo" className="w-6 h-6 object-contain" />
                ) : (
                  <img src={riseCenter} alt="RISE Center Logo" className="w-6 h-6 object-contain" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <span className="font-black text-sm tracking-tight uppercase text-[#90EE90] group-hover:text-[#90EE90]/80 transition-colors hidden sm:inline">ISU Safe Ride</span>
        </motion.div>

        {/* Navigation Links */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 140, damping: 20 }}
          className="flex gap-2 items-center"
        >
          {['guide', 'about', 'contact', 'developer'].map((item) => (
            <motion.button 
              key={item}
              whileTap={{ scale: 0.94 }}
              onClick={() => navigate(`/${item}`)} 
              onMouseDown={() => setPressedNav(item)}
              onMouseUp={() => setPressedNav(null)}
              onMouseLeave={() => setPressedNav(null)}
              onFocus={() => setPressedNav(item)}
              onBlur={() => setPressedNav(null)}
              style={{ color: '#004d25', backgroundColor: pressedNav === item ? '#f9fafb' : undefined }}
              className="relative px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] text-[#004d25] bg-white/70 hover:bg-white hover:shadow-sm transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#CCFF00]/40 active:bg-white"
            >
              {item}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </motion.nav>

    <motion.section
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, type: 'spring', stiffness: 80, damping: 18 }}
      className="relative min-h-screen flex flex-col pt-32"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(0,77,37,0.75), rgba(0,77,37,0.75)), url(${campusBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Hero Content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-6 py-8 lg:py-0 w-full">
        <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center max-w-7xl mx-auto">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-[#CCFF00]/30 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#90EE90] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#90EE90]"></span>
              </span>
              <span className="text-[#90EE90] text-xs font-bold uppercase tracking-widest">Network Secured</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 tracking-tight leading-tight drop-shadow-xl text-[#90EE90]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6), 0 0 20px rgba(144,238,144,0.4)' }}>
              ISU Monitoring & Emergency Response System
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-xl font-medium drop-shadow">Emergency Response & Safe Transportation System for ISU students.</p>
            <div className="flex flex-col lg:flex-row gap-3 w-full max-w-2xl">
              <Button size="lg" variant="secondary" onClick={() => navigate('/admin-portal')} className="lg:flex-1">
                <Zap className="h-4 w-4" /> Admin Access
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/login?type=student')} className="relative overflow-hidden group lg:flex-1">
                <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1609708536965-4a6d0b1d8054?w=500&h=300&fit=crop)' }}></div>
                <span className="relative flex items-center gap-2">
                  <Users className="h-4 w-4" /> Student Portal
                </span>
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/driver-portal')} className="lg:flex-1">
                <PhilippineMotorcycleIcon className="h-4 w-4" /> Driver Registration
              </Button>
            </div>
          </motion.div>

          {/* Right Content - Feature Cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {[
              { icon: ShieldCheck, title: "Secure System", desc: "End-to-end encryption", color: "from-[#CCFF00]/10 to-white" },
              { icon: MapPin, title: "Live Tracking", desc: "Real-time GPS monitoring", color: "from-blue-50 to-white" },
              { icon: Bell, title: "SOS Alert", desc: "One-tap emergency", color: "from-red-50 to-white", alert: true },
              { icon: QrCode, title: "QR System", desc: "Instant trip logging", color: "from-purple-50 to-white" },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
              >
                <Card alert={f.alert} glow={i === 0} className="p-4 sm:p-6 h-full">
                  <motion.div 
                    whileHover={{ rotate: 6, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${f.color} border border-gray-100 flex items-center justify-center mb-3 ${
                      f.alert ? 'text-red-500' : 'text-[#004d25]'
                    }`}>
                    <f.icon className="h-5 sm:h-6 w-5 sm:w-6" />
                  </motion.div>
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                    className={`text-sm sm:text-base font-bold mb-0.5 sm:mb-1 ${f.alert ? 'text-red-500' : 'text-[#90EE90]'}`}>
                    {f.title}
                  </motion.h3>
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                    className={`text-xs ${f.alert ? 'text-red-400' : 'text-[#90EE90]/90'}`}>{f.desc}</motion.p>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom Stats Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="border-t border-green-50 py-6 sm:py-8 px-4 sm:px-6 lg:px-6 w-full bg-gray-50/30"
      >
        <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-3 gap-6 flex-1">
            {[
              { value: '24/7', label: 'System Support' },
              { value: '100%', label: 'Secure & Encrypted' },
              { value: 'Real-time', label: 'Location Tracking' },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-[#90EE90] text-lg sm:text-2xl font-black">{stat.value}</div>
                <div className="text-[#90EE90]/80 text-[10px] sm:text-xs uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="text-gray-300 text-[10px] font-mono whitespace-nowrap">v2.5.3_stable</div>
        </div>
      </motion.div>
    </motion.section>
  </>
  );
};

// --- Main Page Component ---
const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, loading, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [direction, setDirection] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  // Hoist showIsuLogo state to top-level Index component for use in both mobile and desktop
  const [showIsuLogo, setShowIsuLogo] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setShowIsuLogo((prev) => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Auto-redirect authenticated users to their dashboard
  // NOTE: This is now handled by AppLayout, but kept as backup
  useEffect(() => {
    if (loading) {
      // Still loading session, don't do anything yet
      return;
    }
    
    // Session load is complete
    if (user && userRole) {
      // User is logged in, redirect to their dashboard
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'rescue_admin') {
        navigate('/rescue-admin');
      } else if (userRole === 'pnp') {
        navigate('/pnp');
      } else if (userRole === 'rescue') {
        navigate('/rescue');
      } else if (userRole === 'student') {
        navigate('/student');
      } else if (userRole === 'driver') {
        navigate('/driver-dashboard');
      }
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    // Keep splash screen visible while loading auth
    if (loading) {
      return; // Don't hide splash while loading
    }
    
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 800); // Shorter timeout since auth is already loaded
    
    return () => clearTimeout(timer);
  }, [loading]);

  const handleTabChange = (newTab: TabType) => {
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const handleSwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const currentIndex = TABS.indexOf(activeTab);
    
    if (info.offset.x < -threshold && currentIndex < TABS.length - 1) {
      handleTabChange(TABS[currentIndex + 1]);
    } else if (info.offset.x > threshold && currentIndex > 0) {
      handleTabChange(TABS[currentIndex - 1]);
    }
  };

  const handlePullRefresh = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 0) {
      setPullDistance(Math.min(info.offset.y, 120));
    }
  };

  const handlePullEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 80 && !isRefreshing) {
      setIsRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1500);
    } else {
      setPullDistance(0);
    }
  };

  const renderMobileContent = () => {
    switch (activeTab) {
      case 'home':
        return <MobileHomeContent navigate={navigate} />;
      case 'features':
        return <MobileFeaturesContent />;
      case 'guide':
        return <MobileGuideContent navigate={navigate} />;
      case 'about':
        return <MobileAboutContent navigate={navigate} />;
      case 'contact':
        return <MobileContactContent navigate={navigate} />;
      case 'developer':
        return <MobileDeveloperContent navigate={navigate} />;
      default:
        return <MobileHomeContent navigate={navigate} />;
    }
  };

  return (
    <>
      {/* Show splash screen while loading session */}
      {loading ? (
        <SplashScreen isVisible={true} />
      ) : (
        <>
          <SplashScreen isVisible={showSplash} />
          {/* Overlay/blur for main content */}
          <div className="min-h-screen text-gray-900 relative overflow-x-hidden font-sans selection:bg-[#CCFF00] selection:text-[#001a0d] w-full bg-gradient-to-br from-[#003d1a] via-[#004d25] to-[#1a2b1a]">
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-black/30 backdrop-blur-[2px]" />
              <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#CCFF00]/5 to-transparent" />
            </div>

            {isMobile ? (
              <>

                {/* Pull to Refresh Indicator */}
                <motion.div 
                  className="fixed top-20 left-0 right-0 z-30 flex justify-center w-full"
                  style={{ y: pullDistance > 0 ? pullDistance / 2 : 0 }}
                >
                  <div 
                    className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-xl border border-green-100 shadow-sm ${
                      pullDistance > 80 || isRefreshing ? 'opacity-100' : 'opacity-0'
                    } transition-opacity`}
                  >
                    <motion.div 
                      className="w-5 h-5 border-2 border-[#004d25] border-t-transparent rounded-full"
                      animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 3 }}
                      transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
                    />
                    <span className="text-[#004d25] text-xs font-bold uppercase tracking-wider whitespace-nowrap">
                      {isRefreshing ? 'Refreshing...' : 'Release to refresh'}
                    </span>
                  </div>
                </motion.div>

                {/* Mobile Main Content */}
                <motion.main 
                  className="relative z-10 pt-0 pb-20 w-full overflow-y-auto"
                >
                  <AnimatePresence mode="wait" custom={direction}>
                    {renderMobileContent()}
                  </AnimatePresence>
                </motion.main>

                {/* Bottom Navigation */}
                <MobileBottomNav active={activeTab} onTabChange={handleTabChange} />
              </>
            ) : (
              /* Desktop Layout */
              <main className="relative z-10 w-full">
                <DesktopLayout navigate={navigate} />
                <FeaturesShowcase />
                <Footer navigate={navigate} />
              </main>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Index;