import React from 'react';
import {
    Github,
    Facebook,
    Instagram,
    Phone,
    Shield,
    Download,
    AlertCircle
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import isuLogo from '@/assets/isu-logo.png';

interface FooterProps {
    navigate: (path: string) => void;
}

const Footer = ({ navigate }: FooterProps) => {
    const { ref, isVisible } = useScrollAnimation();
    return (
        <footer ref={ref} className={`relative border-t border-white/30 bg-white/8 backdrop-blur-3xl transition-all duration-500 w-screen shadow-[0_-8px_32px_rgba(0,0,0,0.3)] ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="w-full px-6 md:px-10 lg:px-16 py-6 sm:py-8 max-w-full mx-auto">
                {/* Main Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-7 mb-8">
                    {/* Brand Section */}
                    <div className="col-span-1 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-3">
                            <img src={isuLogo} alt="ISU Logo" className="w-6 h-6" />
                            <span className="font-black text-white text-base uppercase tracking-widest">SafeRide ISU</span>
                        </div>
                        <p className="text-white/90 text-xs leading-relaxed mb-3">Emergency Response & Safe Transportation System</p>
                        <div className="flex gap-3 text-xs text-green-300 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 items-center">
                            <Shield className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>✅ System Operational</span>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="col-span-1">
                        <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Quick Links</h4>
                        <ul className="space-y-1.5 text-white/85 text-xs font-semibold">
                            <li><button onClick={() => navigate('/')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Home</button></li>
                            <li><button onClick={() => window.scrollTo(0, 0)} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Features</button></li>
                            <li><button onClick={() => navigate('/about')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">About</button></li>
                            <li><button onClick={() => navigate('/contact')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Contact</button></li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="col-span-1">
                        <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Resources</h4>
                        <ul className="space-y-1.5 text-white/85 text-xs font-semibold">
                            <li><button onClick={() => navigate('/guide')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Safety Guide</button></li>
                            <li><button onClick={() => navigate('/report-issues')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Report Issue</button></li>
                            <li><a href="#" className="transition block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">FAQs</a></li>
                        </ul>
                    </div>

                    {/* Emergency Contact */}
                    <div className="col-span-1 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <h4 className="text-red-300 font-bold mb-2 text-xs uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Emergency
                        </h4>
                        <ul className="space-y-1.5 text-xs">
                            <li>
                                <a href="tel:911" className="text-white/90 hover:text-white font-semibold flex items-center gap-2 py-1">
                                    <Phone className="w-3.5 h-3.5 text-red-400" />
                                    Call 911
                                </a>
                            </li>
                            <li className="text-white/70 text-[10px]">
                                Campus Security:<br/>
                                <span className="text-white/90 font-semibold">(available soon)</span>
                            </li>
                        </ul>
                    </div>

                    {/* Legal */}
                    <div className="col-span-1">
                        <h4 className="text-white font-bold mb-3 text-xs uppercase tracking-wider">Legal</h4>
                        <ul className="space-y-1.5 text-white/85 text-xs font-semibold">
                            <li><button onClick={() => navigate('/privacy')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Privacy</button></li>
                            <li><button onClick={() => navigate('/terms')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Terms</button></li>
                            <li><button onClick={() => navigate('/security')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Security</button></li>
                            <li><button onClick={() => navigate('/cookie-policy')} className="transition cursor-pointer block w-full text-left py-1 bg-transparent rounded-none focus:outline-none footer-link-glow text-white/85 hover:text-white">Cookies</button></li>
                        </ul>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/20 my-6" />

                {/* Footer Bottom */}
                <div className="pt-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-white/80 text-xs sm:text-xs">
                    <div className="text-center sm:text-left text-[10px] sm:text-xs">© 2026 SafeRide ISU. All rights reserved. Emergency Response & Safe Transportation System.</div>
                    <div className="flex gap-4 justify-center sm:justify-end">
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition flex items-center gap-2 text-white/85 hover:text-[#CCFF00]">
                            <Github className="w-4 h-4" />
                            <span className="hidden sm:inline">GitHub</span>
                        </a>
                        <a href="#" className="hover:text-white transition flex items-center gap-2 text-white/85 hover:text-blue-400">
                            <Facebook className="w-4 h-4" />
                            <span className="hidden sm:inline">Facebook</span>
                        </a>
                        <a href="#" className="hover:text-white transition flex items-center gap-2 text-white/85 hover:text-pink-400">
                            <Instagram className="w-4 h-4" />
                            <span className="hidden sm:inline">Instagram</span>
                        </a>
                    </div>
                </div>
            </div>

            {/* Floating Download Bubble */}
            <div className="fixed bottom-20 right-5 z-40">
                <div className="relative group">
                    {/* Main Bubble */}
                    <button className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/50 hover:shadow-xl hover:shadow-blue-500/70 transition-all hover:scale-110 flex items-center justify-center text-white font-bold border-2 border-blue-400/30 hover:border-blue-400/60">
                        <Download className="w-6 h-6" />
                    </button>
                    
                    {/* Tooltip/Hover Label */}
                    <div className="absolute bottom-full right-0 mb-2 bg-gray-900 text-white text-xs font-semibold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[10px]">Download App</span>
                            <span className="text-orange-300 text-[9px] font-normal">Coming Soon</span>
                        </div>
                        <div className="absolute top-full right-1 -mt-0.5 w-0 h-0 border-l-3 border-r-3 border-t-3 border-l-transparent border-r-transparent border-t-gray-900" />
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

