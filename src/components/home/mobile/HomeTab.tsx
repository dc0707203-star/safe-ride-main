import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Car,
    MapPin,
    Bell,
    ShieldCheck,
    Zap
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import isuLogo from '@/assets/isu-logo.png';
import riseCenter from '@/assets/rise-center.png';
import campusBg from '@/assets/campus-bg.jpeg';
import FloatingParticles from '../FloatingParticles';
import CustomButton from '@/components/ui/CustomButton';
import GlassCard from '@/components/ui/GlassCard';
import PhilippineMotorcycleIcon from '@/components/ui/PhilippineMotorcycleIcon';
import { pageVariants, pageTransition, fadeInUp, staggerContainer } from '../animations';

interface HomeTabProps {
    navigate: (path: string) => void;
}

const HomeTab = ({ navigate }: HomeTabProps) => {
    const { ref } = useScrollAnimation();
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
            className="flex flex-col px-4 sm:px-5 w-full relative"
            style={{
                backgroundImage: `linear-gradient(135deg, rgba(0,20,5,0.95), rgba(0,30,15,0.95)), url(${campusBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <FloatingParticles />
            <div className="flex flex-col items-center justify-center mb-8 sm:mb-10 mt-12 sm:mt-16">
                <div className="w-full max-w-md mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, type: 'spring', stiffness: 100 }}
                        className="w-full"
                    >
                        <div className="flex justify-center mb-6 sm:mb-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={showIsuLogo ? 'isu' : 'rise'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <motion.img
                                        src={showIsuLogo ? isuLogo : riseCenter}
                                        alt={showIsuLogo ? "ISU Logo" : "RISE Center Logo"}
                                        className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>
                        {/* Enhanced Hero Text */}
                        <div className="text-center mb-6 sm:mb-8">
                            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight leading-tight text-transparent bg-clip-text bg-gradient-to-r from-[#CCFF00] to-[#90EE90] drop-shadow-[0_0_20px_rgba(204,255,0,0.5)]">
                                ISU Safe Ride
                            </h1>
                        </div>
                        <div className="w-full flex flex-col gap-3 sm:gap-4">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shadow-lg">
                                <CustomButton size="md" variant="secondary" onClick={() => navigate('/admin-portal')} className="w-full text-xs sm:text-sm">
                                    <Zap className="h-4 w-4 sm:h-5 sm:w-5" /> Admin Access
                                </CustomButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shadow-lg relative overflow-hidden group">
                                <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1609708536965-4a6d0b1d8054?w=500&h=300&fit=crop)' }}></div>
                                <CustomButton size="md" variant="outline" onClick={() => navigate('/login?type=student')} className="w-full relative text-xs sm:text-sm">
                                    <Users className="h-4 w-4 sm:h-5 sm:w-5" /> Student Portal
                                </CustomButton>
                            </motion.div>
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="shadow-lg">
                                <CustomButton size="md" variant="outline" onClick={() => navigate('/driver-portal')} className="w-full text-xs sm:text-sm">
                                    <PhilippineMotorcycleIcon className="h-4 w-4 sm:h-5 sm:w-5" /> Driver Registration
                                </CustomButton>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Quick Stats */}
            <motion.div
                variants={fadeInUp}
                className="flex flex-col gap-2.5 sm:gap-3 mt-6 sm:mt-8 pt-6 border-t border-[#CCFF00]/30"
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    {[
                        {
                            value: '24/7',
                            label: 'SUPPORT',
                            icon: Bell,
                            gradient: 'from-green-500/20 to-emerald-500/10',
                            borderColor: 'border-green-400/30',
                            glow: 'shadow-[0_0_30px_rgba(34,197,94,0.15)]'
                        },
                        {
                            value: '100%',
                            label: 'SECURE',
                            icon: ShieldCheck,
                            gradient: 'from-emerald-500/20 to-teal-500/10',
                            borderColor: 'border-emerald-400/30',
                            glow: 'shadow-[0_0_30px_rgba(16,185,129,0.15)]'
                        },
                        {
                            value: 'Real-time',
                            label: 'TRACKING',
                            icon: MapPin,
                            gradient: 'from-teal-500/20 to-cyan-500/10',
                            borderColor: 'border-teal-400/30',
                            glow: 'shadow-[0_0_30px_rgba(20,184,166,0.15)]'
                        },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            whileHover={{
                                scale: 1.05,
                                y: -8,
                                boxShadow: stat.glow.replace('0_0_30px', '0_0_50px')
                            }}
                            className={`relative p-5 sm:p-6 rounded-2xl sm:rounded-3xl border-2 ${stat.borderColor} ${stat.gradient} backdrop-blur-xl bg-white/5 transition-all duration-300 overflow-hidden group`}
                        >
                            {/* Subtle glow effect */}
                            <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-[#CCFF00]/20 to-transparent rounded-full blur-3xl pointer-events-none group-hover:from-[#CCFF00]/30 transition-all duration-500`} />

                            <div className="relative z-10 flex items-start gap-4">
                                <motion.div
                                    whileHover={{ scale: 1.15, rotate: 5 }}
                                    className="p-2.5 bg-gradient-to-br from-white/20 to-white/10 rounded-xl backdrop-blur-md border border-white/20 shadow-lg flex-shrink-0 mt-0.5"
                                >
                                    <stat.icon className="w-5 h-5 text-[#CCFF00]" />
                                </motion.div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-[#CCFF00] text-2xl sm:text-3xl font-black mb-0.5 drop-shadow-lg tracking-tight">{stat.value}</div>
                                    <div className="text-white/90 text-xs font-bold uppercase tracking-[0.15em]">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
            {/* How It Works - Mobile */}
            <motion.div ref={ref} variants={staggerContainer} initial="initial" animate="animate" className="w-full mb-8 mt-8">
                <motion.div
                    variants={fadeInUp}
                    className="text-center mb-6 sm:mb-8"
                >
                    <div className="inline-block px-4 py-2 bg-[#90EE90]/20 rounded-full border border-[#90EE90]/40 mb-2.5 sm:mb-3">
                        <span className="text-[#90EE90] text-xs font-bold uppercase tracking-widest">Quick Start</span>
                    </div>
                    <h2 className="text-xl sm:text-3xl font-black text-[#90EE90] mb-2 drop-shadow-lg uppercase tracking-tight">How It Works</h2>
                    <p className="text-white/90 text-sm font-medium">4 simple steps to get started</p>
                </motion.div>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {steps.map((step, i) => (
                        <motion.div
                            key={i}
                            variants={fadeInUp}
                            transition={{ delay: i * 0.08 }}
                            whileHover={{ y: -6 }}
                        >
                            <GlassCard className="p-3.5 sm:p-5 h-full bg-gradient-to-br from-green-400/20 to-green-300/10 hover:from-green-400/30 hover:to-green-300/15 border-2 border-green-300/40">
                                <div className="flex items-start gap-2 sm:gap-3 mb-2.5 sm:mb-3">
                                    <motion.div className="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-green-400/30 rounded-lg text-white text-xs font-black tracking-wider" whileHover={{ scale: 1.1 }}>
                                        {step.number}
                                    </motion.div>
                                    <motion.div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-md`} whileHover={{ scale: 1.1, rotate: 5 }}>
                                        <step.icon className="h-4 w-4 sm:h-5 sm:w-5 drop-shadow" style={{ color: '#CCFF00' }} />
                                    </motion.div>
                                </div>
                                <h3 className="text-sm sm:text-base font-extrabold text-white mb-1.5 sm:mb-2 leading-tight">{step.title}</h3>
                                <p className="text-xs sm:text-sm font-semibold text-white/85 leading-snug">{step.description}</p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
            {/* CTA Section - Mobile */}
            <motion.div variants={fadeInUp} className="w-full mb-4 mt-6 sm:mt-8">
                <GlassCard glow className="p-5 sm:p-6 bg-white/10 backdrop-blur-xl border-2 border-white/40">
                    <div className="text-center relative z-10">
                        <motion.div className="inline-block px-4 py-2 bg-[#90EE90]/40 rounded-full border border-[#90EE90]/60 mb-2.5 sm:mb-3" whileHover={{ scale: 1.05 }}>
                            <span className="text-[#90EE90] text-xs font-bold uppercase tracking-widest">Final Step</span>
                        </motion.div>
                        <h3 className="text-white text-lg sm:text-xl font-black uppercase mb-2.5 sm:mb-3 tracking-tight">Ready to Get Started?</h3>
                        <p className="text-white/90 text-xs sm:text-sm mb-4 sm:mb-5 leading-relaxed font-medium">
                            Join students already using SafeRide ISU for secure campus transportation.
                        </p>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <CustomButton size="md" variant="secondary" onClick={() => navigate('/login?type=student')} className="w-full text-xs sm:text-sm">
                                <Users className="h-4 w-4 sm:h-5 sm:w-5" /> Join Now
                            </CustomButton>
                        </motion.div>
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default HomeTab;
