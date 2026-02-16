import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Car,
    MapPin,
    Bell,
    ShieldCheck,
    QrCode,
    Sparkles,
    TrendingUp
} from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import campusBg from '@/assets/campus-bg.jpeg';

const Features = () => {
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
                            whileHover={{ 
                                scale: 1.08, 
                                y: -12,
                                boxShadow: "0 20px 60px rgba(204,255,0,0.25), 0 0 40px rgba(204,255,0,0.15)",
                                transition: { type: "spring", stiffness: 400, damping: 10 }
                            }}
                            className={`group relative backdrop-blur-2xl border border-green-400/40 hover:border-green-400/80 p-4 rounded-2xl transition-all duration-300 bg-gradient-to-br from-green-500/25 via-teal-500/20 to-emerald-600/15 hover:shadow-[0_10px_40px_rgba(204,255,0,0.2)] cursor-pointer`}
                        >
                            {/* Animated Glow Background */}
                            <motion.div 
                                className="absolute -top-20 -right-20 w-40 h-40 bg-[#CCFF00]/15 blur-[60px] pointer-events-none"
                                whileHover={{ 
                                    opacity: 0.4,
                                    scale: 1.2,
                                    transition: { duration: 0.4 }
                                }}
                            />
                            
                            {/* Floating Particles Effect */}
                            <motion.div
                                className="absolute inset-0 pointer-events-none"
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1 }}
                            >
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-1 h-1 bg-[#CCFF00] rounded-full"
                                        style={{
                                            left: `${20 + i * 30}%`,
                                            top: `${10 + i * 20}%`,
                                        }}
                                        animate={{
                                            y: [0, -30, 0],
                                            x: [0, 10, 0],
                                            opacity: [0, 1, 0],
                                        }}
                                        transition={{
                                            duration: 2,
                                            delay: i * 0.3,
                                            repeat: Infinity,
                                        }}
                                    />
                                ))}
                            </motion.div>
                            
                            <div className="relative z-10">
                                <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ type: 'spring', stiffness: 180, damping: 20, delay: i * 0.18 }}
                                    whileHover={{ 
                                        scale: 1.25,
                                        rotate: 12,
                                        transition: { type: "spring", stiffness: 400, damping: 10 }
                                    }}
                                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                                >
                                    <f.icon className="h-5 w-5 text-white" />
                                </motion.div>
                                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-[#CCFF00] transition-colors">{f.title}</h3>
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

export default Features;
