import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Shield,
  Facebook
} from 'lucide-react';

const Contact = () => {
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

  const contactInfo = [
    {
      icon: MapPin,
      label: "Address",
      value: "Isabela State University, Santiago, Extension, Unit Campus",
    },
    {
      icon: Phone,
      label: "Phone",
      value: "+63 (078) 123-4567",
    },
    {
      icon: Mail,
      label: "Email",
      value: "santiago@isu.edu.ph",
    },
    {
      icon: Clock,
      label: "Office Hours",
      value: "Monday - Friday, 8:00 AM - 5:00 PM",
    },
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
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate(-1)}>
          <div className="bg-[#CCFF00]/10 p-1.5 rounded-lg border border-[#CCFF00]/20 group-hover:bg-[#CCFF00] transition-all">
            <ChevronLeft className="text-[#CCFF00] group-hover:text-[#004225] w-5 h-5" />
          </div>
          <span className="font-black text-xl italic tracking-tighter uppercase text-white group-hover:text-[#CCFF00] transition-colors">Back</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-8 pb-16 px-6 container mx-auto text-center reveal">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#CCFF00]/5 border border-[#CCFF00]/20 mb-6">
          <Mail className="w-3 h-3 text-[#CCFF00]" />
          <span className="text-[#CCFF00] text-[9px] font-black uppercase tracking-[0.2em]">Contact Us</span>
        </div>
        <h1 className="text-4xl md:text-7xl font-black mb-4 italic tracking-tighter leading-none uppercase">
          <span className="text-[#CCFF00] drop-shadow-[0_0_20px_rgba(204,255,0,0.5)]">CONTACT</span> US
        </h1>
        <p className="text-white/40 text-sm md:text-lg font-bold max-w-xl mx-auto italic tracking-wide leading-relaxed">
          Have questions or feedback? Get in touch with the ISU SafeRide team.
        </p>
      </section>

      {/* Contact Cards */}
      <section className="py-12 container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {contactInfo.map((info, i) => (
            <div 
              key={i} 
              className="reveal group relative bg-black/40 backdrop-blur-2xl border border-[#CCFF00]/10 p-6 rounded-[1.5rem] transition-all duration-500 hover:border-[#CCFF00]/50 hover:shadow-[0_0_40px_rgba(204,255,0,0.15)]"
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="bg-[#CCFF00]/10 w-12 h-12 rounded-xl flex items-center justify-center border border-[#CCFF00]/20 group-hover:bg-[#CCFF00] transition-all">
                  <info.icon className="text-[#CCFF00] group-hover:text-[#004225] w-5 h-5 transition-colors" />
                </div>
                <div>
                  <h3 className="text-[#CCFF00] text-xs font-black uppercase tracking-widest mb-1">{info.label}</h3>
                  <p className="text-white/70 text-sm font-medium">{info.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Social Links */}
      <section className="py-12 container mx-auto px-6 relative z-10 reveal">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter mb-8 text-white">
            Follow Us on <span className="text-[#CCFF00]">Social Media</span>
          </h2>
          <div className="flex justify-center gap-4">
            <a 
              href="https://www.facebook.com/profile.php?id=61556821949029" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-black/40 backdrop-blur-2xl border border-[#CCFF00]/10 p-4 rounded-xl transition-all duration-500 hover:border-[#CCFF00]/50 hover:shadow-[0_0_40px_rgba(204,255,0,0.15)] group"
            >
              <Facebook className="w-6 h-6 text-[#CCFF00] group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </section>

      {/* Emergency Section */}
      <section className="py-12 container mx-auto px-6 relative z-10 reveal">
        <div className="max-w-2xl mx-auto bg-gradient-to-br from-red-500/10 to-red-900/10 border border-red-500/30 rounded-[1.5rem] p-8 text-center">
          <div className="bg-red-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-xl font-black uppercase italic text-red-400 mb-2">Emergency Hotline</h3>
          <p className="text-white/60 text-sm mb-4">For emergencies and immediate assistance</p>
          <a href="tel:+639123456789" className="text-2xl font-black text-red-400 hover:text-red-300 transition-colors">
            911
          </a>
        </div>
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

export default Contact;