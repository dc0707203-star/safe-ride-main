import React, { useEffect } from 'react';
import { 
  Shield, 
  Target, 
  Eye, 
  Users, 
  Award, 
  ChevronLeft,
  ArrowRight,
  Zap,
  Activity,
  MapPin,
  Clock
} from 'lucide-react';
import isuLogo from '@/assets/isu-logo.png';

// Reusable Button Component
const Button = ({ children, className = "", variant = "secondary", onClick }: { 
  children: React.ReactNode, 
  className?: string, 
  variant?: "secondary" | "outline", 
  onClick?: () => void
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-xl font-black transition-all active:scale-95 uppercase tracking-[0.15em] shadow-lg h-10 px-5 text-xs relative z-30 overflow-hidden group cursor-pointer";
  const variants = {
    secondary: "bg-[#CCFF00] text-[#004225] hover:shadow-[0_0_40px_rgba(204,255,0,0.6)] border-none", 
    outline: "border-2 border-[#CCFF00]/40 text-[#CCFF00] hover:bg-[#CCFF00] hover:text-[#004225] backdrop-blur-md",
  };
  
  return (
    <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
      <span className="relative z-10 flex items-center">{children}</span>
    </button>
  );
};

// Reusable Card Component
const Card = ({ children, className = "", style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div style={style} className={`group relative bg-black/40 backdrop-blur-2xl border border-[#CCFF00]/10 p-6 rounded-[1.5rem] transition-all duration-500 hover:border-[#CCFF00]/50 hover:shadow-[0_0_40px_rgba(204,255,0,0.15)] ${className}`}>
    {children}
  </div>
);

const App = () => {
  // Navigation function for internal state management or simple back action
  const goBack = () => {
    window.history.back();
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('reveal-visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#000805] text-white relative overflow-hidden font-sans selection:bg-[#CCFF00] selection:text-[#004225]">
      
      {/* Background Neon Waves */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 1440 800">
          {[...Array(8)].map((_, i) => (
            <path 
              key={i}
              fill="none" 
              stroke="#CCFF00" 
              strokeWidth="0.5" 
              opacity={0.1 + (i * 0.05)}
              d={`M0,${100 + i * 80} Q360,${50 + i * 80} 720,${150 + i * 80} T1440,${100 + i * 80}`}
              className="animate-pulse"
              style={{ animationDuration: `${3 + i}s` }}
            />
          ))}
        </svg>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex justify-between items-center px-10 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={goBack}>
          <div className="bg-[#CCFF00]/10 p-1.5 rounded-lg border border-[#CCFF00]/20 group-hover:bg-[#CCFF00] transition-all">
            <ChevronLeft className="text-[#CCFF00] group-hover:text-[#004225] w-5 h-5" />
          </div>
          <span className="font-black text-xl italic tracking-tighter uppercase text-white group-hover:text-[#CCFF00] transition-colors">Back</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-12 pb-20 px-6 container mx-auto text-center reveal">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/5 border border-[#CCFF00]/20 mb-6">
          <Shield className="w-3 h-3 text-[#CCFF00]" />
          <span className="text-[#CCFF00] text-[9px] font-black uppercase tracking-[0.2em]">Learn About Our System</span>
        </div>
        <h1 className="text-5xl md:text-8xl font-black mb-6 italic tracking-tighter leading-none uppercase">
          ABOUT <br />
          <span className="text-[#CCFF00] drop-shadow-[0_0_20px_rgba(204,255,0,0.5)]">ISU SAFE RIDE</span>
        </h1>
        <p className="text-white/40 text-sm md:text-lg font-bold max-w-2xl mx-auto italic tracking-wide leading-relaxed">
          The ISU Emergency System is an innovation focused on enhancing the safety of every Isabela State University student during their daily commute.
        </p>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <Card className="reveal">
            <div className="bg-[#CCFF00]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-[#CCFF00]/20">
              <Target className="text-[#CCFF00] w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black italic uppercase text-white mb-4 tracking-tighter">Our Mission</h2>
            <p className="text-white/50 text-sm font-medium leading-relaxed">
              Our goal is to provide a fast, reliable, and digital transportation monitoring system to prevent any harm and accelerate response to emergency situations.
            </p>
          </Card>

          <Card className="reveal" style={{ transitionDelay: '200ms' }}>
            <div className="bg-[#CCFF00]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-6 border border-[#CCFF00]/20">
              <Eye className="text-[#CCFF00] w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black italic uppercase text-white mb-4 tracking-tighter">Our Vision</h2>
            <p className="text-white/50 text-sm font-medium leading-relaxed">
              To become the national standard in campus security and smart transportation tracking, utilizing modern technology for the welfare of students.
            </p>
          </Card>
        </div>
      </section>

      {/* Core Values / Why Us */}
      <section className="py-20 bg-[#CCFF00]/5 border-y border-[#CCFF00]/10 relative z-10">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16 reveal">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">
              Why Does This <span className="text-[#CCFF00]">Matter?</span>
            </h2>
            <div className="w-16 h-1 bg-[#CCFF00] mx-auto mt-4 rounded-full shadow-[0_0_15px_#CCFF00]" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Activity, label: "Real-time", val: "Always Active" },
              { icon: MapPin, label: "Location", val: "Accurate GPS" },
              { icon: Clock, label: "Response", val: "Quick Action" },
              { icon: Users, label: "Community", val: "Everyone Safe" },
            ].map((v, i) => (
              <div key={i} className="text-center reveal" style={{ transitionDelay: `${i * 100}ms` }}>
                <div className="mx-auto w-16 h-16 rounded-full border border-[#CCFF00]/20 flex items-center justify-center mb-4 bg-black/40 group-hover:border-[#CCFF00] transition-all">
                  <v.icon className="text-[#CCFF00] w-6 h-6" />
                </div>
                <h3 className="text-[#CCFF00] font-black uppercase text-[10px] tracking-widest">{v.label}</h3>
                <p className="text-white text-sm font-black italic uppercase mt-1">{v.val}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team / Recognition */}
      <section className="py-24 container mx-auto px-6 relative z-10 reveal">
        <Card className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-10 p-10 overflow-hidden">
          <div className="relative">
            <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-[#CCFF00] to-green-900 p-1">
              <div className="w-full h-full rounded-full bg-[#000805] flex items-center justify-center overflow-hidden">
                <img src={isuLogo} alt="ISU Logo" className="w-20 h-20 md:w-32 md:h-32 object-contain" />
              </div>
            </div>
            <div className="absolute -bottom-2 -right-2 bg-[#CCFF00] text-[#004225] p-2 rounded-lg shadow-xl">
              <Award className="w-6 h-6" />
            </div>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl font-black italic uppercase mb-4 tracking-tighter">Powered by <span className="text-[#CCFF00]">Technology</span></h2>
            <p className="text-white/40 text-sm font-bold leading-relaxed mb-6">
              This system is built using the latest frameworks such as React, Supabase, and Tailwind CSS to ensure 99.9% uptime and fast response rates for every scan and alert.
            </p>
            <Button variant="outline" onClick={goBack}>
              Learn More About Features
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center relative z-10 reveal">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
          ISU Emergency System © 2025 | Safety Is Our Priority
        </p>
      </footer>

      <style dangerouslySetInnerHTML={{ __html: `
        .reveal { opacity: 0; transform: translateY(20px); transition: all 0.8s ease-out; }
        .reveal-visible { opacity: 1; transform: translateY(0); }
        html { scroll-behavior: smooth; }
      `}} />
    </div>
  );
};

export default App;