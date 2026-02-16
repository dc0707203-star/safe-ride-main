import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    MapPin,
    Bell,
    ShieldCheck,
    Zap,
    QrCode
} from 'lucide-react';
import isuLogo from '@/assets/isu-logo.png';
import riseCenter from '@/assets/rise-center.png';
import campusBg from '@/assets/campus-bg.jpeg';
import CustomButton from '@/components/ui/CustomButton';
import GlassCard from '@/components/ui/GlassCard';
import PhilippineMotorcycleIcon from '@/components/ui/PhilippineMotorcycleIcon';

interface HeroProps {
    navigate: (path: string) => void;
}

const Hero = ({ navigate }: HeroProps) => {
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
                                <CustomButton size="lg" variant="secondary" onClick={() => navigate('/admin-portal')} className="lg:flex-1">
                                    <Zap className="h-4 w-4" /> Admin Access
                                </CustomButton>
                                <CustomButton size="lg" variant="outline" onClick={() => navigate('/login?type=student')} className="relative overflow-hidden group lg:flex-1">
                                    <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1609708536965-4a6d0b1d8054?w=500&h=300&fit=crop)' }}></div>
                                    <span className="relative flex items-center gap-2">
                                        <Users className="h-4 w-4" /> Student Portal
                                    </span>
                                </CustomButton>
                                <CustomButton size="lg" variant="outline" onClick={() => navigate('/driver-portal')} className="lg:flex-1">
                                    <PhilippineMotorcycleIcon className="h-4 w-4" /> Driver Registration
                                </CustomButton>
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
                                    whileHover={{
                                        y: -16,
                                        boxShadow: "0 24px 50px rgba(204,255,0,0.2), 0 12px 30px rgba(0,0,0,0.1)",
                                        transition: { type: "spring", stiffness: 400, damping: 10 }
                                    }}
                                >
                                    <GlassCard alert={f.alert} glow={i === 0} className="p-4 sm:p-6 h-full group cursor-pointer transition-all border-white/40 hover:border-white/80">
                                        <motion.div
                                            whileHover={{ rotate: 12, scale: 1.2, y: -8 }}
                                            transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${f.color} border border-gray-100 flex items-center justify-center mb-3 ${f.alert ? 'text-red-500' : 'text-[#004d25]'
                                                }`}>
                                            <f.icon className="h-5 sm:h-6 w-5 sm:w-6" />
                                        </motion.div>
                                        <motion.h3
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
                                            className={`text-sm sm:text-base font-bold mb-0.5 sm:mb-1 ${f.alert ? 'text-red-500' : 'text-[#90EE90]'} group-hover:text-[#CCFF00] transition-colors`}>
                                            {f.title}
                                        </motion.h3>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.7 + i * 0.1, duration: 0.5 }}
                                            className={`text-xs ${f.alert ? 'text-red-400' : 'text-[#90EE90]/90'}`}>{f.desc}</motion.p>
                                    </GlassCard>
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

export default Hero;
