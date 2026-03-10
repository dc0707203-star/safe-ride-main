import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Car,
    MapPin,
    Bell,
    ShieldCheck,
    QrCode,
    Shield
} from 'lucide-react';
import campusBg from '@/assets/campus-bg.jpeg';
import FloatingParticles from '../FloatingParticles';
import GlassCard from '@/components/ui/GlassCard';
import { pageVariants, pageTransition, fadeInUp, staggerContainer } from '../animations';

const FeaturesTab = () => {
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
                            <GlassCard alert={f.alert} className="p-4 h-full">
                                <div className={`w-12 h-12 md:w-10 md:h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-3 shadow-lg`}>
                                    <f.icon className="h-6 md:h-5 w-6 md:w-5" style={{ color: '#CCFF00' }} />
                                </div>
                                <h3 className={`text-sm font-bold mb-1.5 ${f.alert ? 'text-white' : 'text-white'}`}>
                                    {f.title}
                                </h3>
                                <p className="text-white/85 text-xs leading-relaxed font-medium">{f.desc}</p>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default FeaturesTab;
