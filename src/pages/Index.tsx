import { useEffect } from 'react';
import { 
  Users, 
  Car, 
  QrCode, 
  MapPin, 
  Bell, 
  ShieldCheck,
  ChevronRight, 
  Zap,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import campusBg from '@/assets/campus-bg.jpeg';
import isuLogo from '@/assets/isu-logo.png';

// --- Custom Button Component ---
const Button = ({ children, className = "", variant = "secondary", onClick, size = "md" }: { 
  children: React.ReactNode, 
  className?: string, 
  variant?: "secondary" | "outline", 
  onClick?: () => void,
  size?: "md" | "lg"
}) => {
  const sizeStyles = size === "lg" ? "h-12 px-8 text-sm" : "h-10 px-5 text-xs";
  const baseStyles = `inline-flex items-center justify-center rounded-xl font-black transition-all active:scale-95 uppercase tracking-[0.15em] shadow-lg ${sizeStyles} relative z-30 overflow-hidden group cursor-pointer`;
  
  const variants = {
    secondary: "bg-[#CCFF00] text-[#004225] hover:shadow-[0_0_40px_rgba(204,255,0,0.6)] border-none", 
    outline: "border-2 border-[#CCFF00]/40 text-[#CCFF00] hover:bg-[#CCFF00] hover:text-[#004225] backdrop-blur-md hover:border-[#CCFF00] hover:shadow-[0_0_30px_rgba(204,255,0,0.3)]",
  };
  
  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
      <span className="relative z-10 flex items-center">{children}</span>
      {variant === 'secondary' && (
        <div className="absolute inset-0 bg-white/30 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-[-20deg]" />
      )}
    </button>
  );
};

// --- Custom Glass Card Component ---
const Card = ({ children, className = "", alert = false }: { children: React.ReactNode, className?: string, alert?: boolean }) => (
  <div className={`group relative bg-white/10 backdrop-blur-xl border ${alert ? 'border-red-500/40 hover:border-red-500 hover:shadow-[0_0_40px_rgba(239,68,68,0.2)]' : 'border-white/20 hover:border-[#CCFF00]/50 hover:shadow-[0_0_40px_rgba(204,255,0,0.15)]'} p-4 rounded-[1rem] transition-all duration-500 hover:-translate-y-1 overflow-hidden ${className}`}>
    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border border-inset ${alert ? 'border-red-500/20' : 'border-[#CCFF00]/20'}`} />
    <div className={`absolute -top-10 -right-10 w-24 h-24 ${alert ? 'bg-red-600/10' : 'bg-[#CCFF00]/10'} blur-[40px] pointer-events-none group-hover:scale-150 transition-transform duration-700`} />
    {children}
  </div>
);

// --- Main Page Component ---
const Index = () => {
  const navigate = useNavigate();

  // Scroll animation for elements with class "reveal"
  useEffect(() => {
    const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('reveal-visible');
      });
    }, observerOptions);

    document.querySelectorAll('.reveal').forEach(target => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen text-white relative overflow-hidden font-sans selection:bg-[#CCFF00] selection:text-[#004225]">
      
      {/* Background Image with Overlay */}
      <div className="fixed inset-0 z-0">
        <img src={campusBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#001209]/90 via-[#001209]/80 to-[#001209]/95" />
      </div>

      {/* Hero Section */}
      <section className="relative border-b border-[#CCFF00]/10 overflow-hidden">
        <nav className="relative z-50 flex justify-between items-center px-10 py-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-[#CCFF00] p-1.5 rounded-lg shadow-[0_0_20px_rgba(204,255,0,0.5)] transition-all group-hover:shadow-[0_0_30px_rgba(204,255,0,0.8)] overflow-hidden">
              <img src={isuLogo} alt="ISU Logo" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-black text-xl italic tracking-tighter uppercase group-hover:text-[#CCFF00] transition-colors text-white">ISU SAFE RIDE</span>
          </div>
          <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.4em] text-white/40">
            <button onClick={() => navigate('/about')} className="hover:text-[#CCFF00]">About</button>
            <button onClick={() => navigate('/contact')} className="hover:text-[#CCFF00]">Contact</button>
            <button onClick={() => navigate('/developer')} className="hover:text-[#CCFF00]">Developer</button>
          </div>
        </nav>

        <div className="container mx-auto px-4 py-16 relative z-10 text-center reveal">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#CCFF00]/20 mb-6 shadow-[0_0_15px_rgba(204,255,0,0.1)]">
            <Activity className="w-3 h-3 text-[#CCFF00] animate-pulse" />
            <span className="text-[#CCFF00] text-[9px] font-black uppercase tracking-[0.2em]">Status ng Network: Secured</span>
          </div>
          <h1 className="text-4xl md:text-7xl font-black mb-4 italic tracking-tighter leading-none uppercase">
            <span className="text-white">ISU EMERGENCY</span><br />
            <span className="text-[#CCFF00] drop-shadow-[0_0_25px_rgba(204,255,0,0.5)] animate-neon-pulse">SYSTEM</span>
          </h1>
          <p className="text-sm md:text-base mb-8 text-white/60 font-bold max-w-lg mx-auto italic tracking-wide">
           Ensuring student safety and secure transportation for Isabela State University
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" onClick={() => navigate('/login?type=admin')}>
              Admin Access <Zap className="ml-2 h-4 w-4 fill-current" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login?type=student')}>
              Student Portal <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 reveal">
            <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter mb-2 text-white">
              Security <span className="text-[#CCFF00] drop-shadow-[0_0_10px_#CCFF00]">Protocols</span>
            </h2>
            <div className="w-12 h-0.5 bg-[#CCFF00] mx-auto rounded-full shadow-[0_0_10px_#CCFF00]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {[
              { icon: Users, title: "Student Management", desc: "Digital profile management na may encrypted logs." },
              { icon: Car, title: "Driver Registration", desc: "Verified driver registry na may unique neon QR codes." },
              { icon: QrCode, title: "QR Code Scanning", desc: "Instant trip logging gamit ang ultra-responsive engine." },
              { icon: MapPin, title: "Real-Time Tracking", desc: "Live location monitoring ng mga aktibong biyahe." },
              { icon: Bell, title: "Emergency Alerts", desc: "One-tap SOS trigger na may instant GPS ping.", alert: true },
              { icon: ShieldCheck, title: "Complete Security", desc: "End-to-end encrypted transmission at role-based access." },
            ].map((f, i) => (
              <div key={i} className="reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <Card alert={f.alert}>
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center mb-3 transition-all group-hover:scale-110 ${f.alert ? 'bg-red-600/20 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'bg-[#CCFF00]/10 text-[#CCFF00] shadow-[0_0_20px_rgba(204,255,0,0.2)] group-hover:shadow-[0_0_30px_rgba(204,255,0,0.4)]'}`}>
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className={`text-sm font-black uppercase italic mb-1 ${f.alert ? 'text-red-500' : 'text-white group-hover:text-[#CCFF00] transition-colors'}`}>{f.title}</h3>
                  <p className="text-white/30 text-[10px] font-bold leading-tight">{f.desc}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-50 bg-black/40 backdrop-blur-xl border-t border-white/10 py-10 px-10 mt-12 reveal">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 group">
            <div className="bg-[#CCFF00]/10 p-2 rounded-lg border border-[#CCFF00]/20 overflow-hidden">
              <img src={isuLogo} alt="ISU Logo" className="w-5 h-5 object-contain" />
            </div>
            <div>
              <span className="block font-black text-base italic uppercase tracking-tighter text-white">ISU-SAFERIDE</span>
              <span className="text-[7px] font-black uppercase tracking-[0.4em] text-[#CCFF00]/50">Emergency System</span>
            </div>
          </div>

          <p className="text-white/10 text-[8px] font-bold uppercase tracking-[0.2em]">
            © 2025 Isabela State University.
          </p>
        </div>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.4,0,0.2,1); }
        .reveal-visible { opacity: 1; transform: translateY(0); }

        @keyframes wave-neon { 0%{transform:translateX(0) scaleY(1);opacity:0.1;}50%{transform:translateX(-5%) scaleY(1.1);opacity:0.4;filter:drop-shadow(0 0 8px #CCFF00);}100%{transform:translateX(-10%) scaleY(1);opacity:0.1;} }
        @keyframes wave-neon-rev { 0%{transform:translateX(0);opacity:0.1;}50%{transform:translateX(5%);opacity:0.3;}100%{transform:translateX(10%);opacity:0.1;} }
        @keyframes neon-pulse { 0%,100%{filter:drop-shadow(0 0 10px rgba(204,255,0,0.4));}50%{filter:drop-shadow(0 0 20px rgba(204,255,0,0.6));} }
        .animate-neon-wave-1 { animation: wave-neon 12s ease-in-out infinite; }
        .animate-neon-wave-2 { animation: wave-neon 18s ease-in-out infinite; }
        .animate-neon-wave-3 { animation: wave-neon 15s ease-in-out infinite; }
        .animate-neon-wave-reverse { animation: wave-neon-rev 20s ease-in-out infinite; }
        .animate-neon-pulse { animation: neon-pulse 3s ease-in-out infinite; }
      `}} />
    </div>
  );
};

export default Index;
