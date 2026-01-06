import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Code, 
  Shield,
  Github,
  Linkedin,
  Facebook,
  Mail,
  Sparkles,
  Layers,
  Database,
  Globe
} from 'lucide-react';
import developerPhoto from '@/assets/developer-photo.jpg';

const Developer = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add('reveal-visible');
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const skills = [
    { icon: Code, label: "Frontend", value: "React, TypeScript, Tailwind" },
    { icon: Database, label: "Backend", value: "Node.js, Supabase, PostgreSQL" },
    { icon: Globe, label: "Full Stack", value: "REST APIs, Authentication" },
    { icon: Layers, label: "Tools", value: "Git, VS Code, Figma" },
  ];

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
      <nav className="relative z-50 flex justify-between items-center px-6 md:px-10 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="bg-[#CCFF00]/10 p-1.5 rounded-lg border border-[#CCFF00]/20 group-hover:bg-[#CCFF00] transition-all">
            <ChevronLeft className="text-[#CCFF00] group-hover:text-[#004225] w-5 h-5" />
          </div>
          <span className="font-black text-xl italic tracking-tighter uppercase text-white group-hover:text-[#CCFF00] transition-colors">Back</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-8 pb-12 px-6 container mx-auto text-center reveal">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/5 border border-[#CCFF00]/20 mb-6">
          <Sparkles className="w-3 h-3 text-[#CCFF00]" />
          <span className="text-[#CCFF00] text-[9px] font-black uppercase tracking-[0.2em]">Meet the Developer</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-black mb-4 italic tracking-tighter leading-none uppercase">
          <span className="text-[#CCFF00] drop-shadow-[0_0_20px_rgba(204,255,0,0.5)]">DEVELOPER</span>
        </h1>
      </section>

      {/* Developer Profile Card */}
      <section className="py-8 container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto reveal">
          <div className="relative bg-black/40 backdrop-blur-2xl border border-[#CCFF00]/20 rounded-[2rem] overflow-hidden">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/5 via-transparent to-[#CCFF00]/10 pointer-events-none" />
            
            <div className="relative p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12">
                {/* Photo */}
                <div className="relative">
                  <div className="w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-[#CCFF00]/30 shadow-[0_0_40px_rgba(204,255,0,0.2)]">
                    <img 
                      src={developerPhoto} 
                      alt="JENSLER T. DELA CRUZ" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#CCFF00] text-[#004225] p-3 rounded-xl shadow-xl">
                    <Code className="w-6 h-6" />
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                  <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter mb-2 text-white">
                    JENSLER T. DELA CRUZ
                  </h2>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#CCFF00]/10 border border-[#CCFF00]/30 mb-6">
                    <span className="text-[#CCFF00] text-sm font-black uppercase tracking-wider">Full Stack Developer</span>
                  </div>
                  <p className="text-white/50 text-sm md:text-base font-medium leading-relaxed mb-6">
                    Passionate developer dedicated to creating innovative solutions. The mastermind behind the ISU SafeRide Emergency System, 
                    committed to ensuring the safety and security of every student through cutting-edge technology.
                  </p>
                  
                  {/* Social Links */}
                  <div className="flex justify-center md:justify-start gap-3">
                    <a 
                      href="https://www.facebook.com/jenslerdelacruz1" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 p-3 rounded-xl hover:bg-[#CCFF00] hover:text-[#004225] transition-all group"
                    >
                      <Facebook className="w-5 h-5 text-[#CCFF00] group-hover:text-[#004225]" />
                    </a>
                    <a 
                      href="https://github.com/jensdelacruz866-oss" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 p-3 rounded-xl hover:bg-[#CCFF00] hover:text-[#004225] transition-all group"
                    >
                      <Github className="w-5 h-5 text-[#CCFF00] group-hover:text-[#004225]" />
                    </a>
                    <a 
                      href="https://www.linkedin.com/in/your-linkedin-profile" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 p-3 rounded-xl hover:bg-[#CCFF00] hover:text-[#004225] transition-all group"
                    >
                      <Linkedin className="w-5 h-5 text-[#CCFF00] group-hover:text-[#004225]" />
                    </a>
                    <a 
                      href="jensdelacruz866@gmail.com" 
                      className="bg-[#CCFF00]/10 border border-[#CCFF00]/20 p-3 rounded-xl hover:bg-[#CCFF00] hover:text-[#004225] transition-all group"
                    >
                      <Mail className="w-5 h-5 text-[#CCFF00] group-hover:text-[#004225]" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills Section */}
      <section className="py-12 container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-black uppercase italic tracking-tighter text-center mb-8 text-white reveal">
            Technical <span className="text-[#CCFF00]">Expertise</span>
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {skills.map((skill, i) => (
              <div 
                key={i} 
                className="reveal bg-black/40 backdrop-blur-2xl border border-[#CCFF00]/10 p-5 rounded-xl text-center hover:border-[#CCFF00]/50 hover:shadow-[0_0_30px_rgba(204,255,0,0.15)] transition-all"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className="bg-[#CCFF00]/10 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 border border-[#CCFF00]/20">
                  <skill.icon className="text-[#CCFF00] w-5 h-5" />
                </div>
                <h4 className="text-[#CCFF00] text-[10px] font-black uppercase tracking-widest mb-1">{skill.label}</h4>
                <p className="text-white/50 text-xs font-medium">{skill.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Project Credit */}
      <section className="py-12 container mx-auto px-6 relative z-10 reveal">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-[#CCFF00]/10 to-[#004225]/20 border border-[#CCFF00]/30 rounded-[1.5rem] p-8 text-center">
          <div className="bg-[#CCFF00]/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[#CCFF00]" />
          </div>
          <h3 className="text-xl font-black uppercase italic text-[#CCFF00] mb-2">ISU SafeRide System</h3>
          <p className="text-white/60 text-sm mb-4">
            Developed with passion and dedication for the safety of ISU students.
          </p>
          <p className="text-white/40 text-xs font-bold uppercase tracking-wider">
            © 2025 All Rights Reserved
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center relative z-10 reveal">
        <p className="text-white/20 text-[10px] font-black uppercase tracking-[0.4em]">
          ISU Emergency System © 2025 | Developed by JENSLER T. DELA CRUZ
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

export default Developer;