import React from 'react';
import { motion } from 'framer-motion';
import {
    Phone,
    MapPin,
    Bell,
    ChevronRight
} from 'lucide-react';
import FloatingParticles from '../FloatingParticles';
import GlassCard from '@/components/ui/GlassCard';
import CustomButton from '@/components/ui/CustomButton';
import { pageVariants, pageTransition, fadeInUp, staggerContainer } from '../animations';

interface ContactTabProps {
    navigate: (path: string) => void;
}

const ContactTab = ({ navigate }: ContactTabProps) => (
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
                <GlassCard className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-[#004d25]" />
                        </div>
                        <div>
                            <h3 className="text-[#004d25] text-sm font-bold">Address</h3>
                            <p className="text-white/80 text-xs font-medium">Santiago City Extension Campus</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#CCFF00]/20 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-[#004d25]" />
                        </div>
                        <div>
                            <h3 className="text-[#004d25] text-sm font-bold">Phone</h3>
                            <p className="text-white/80 text-xs font-medium">(078) 123-4567</p>
                        </div>
                    </div>
                </GlassCard>

                {/* Emergency Card */}
                <GlassCard alert className="p-5 mt-4 border-red-200 bg-red-50/80">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                            <Bell className="w-6 h-6 text-red-600 animate-pulse" />
                        </div>
                        <div>
                            <h3 className="text-red-600 text-sm font-bold uppercase tracking-wide">Emergency Hotline</h3>
                            <p className="text-white text-xl font-black tracking-wide">911</p>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            <motion.div variants={fadeInUp}>
                <CustomButton variant="outline" onClick={() => navigate('/contact')} className="mt-6">
                    Full Contact Info <ChevronRight className="h-4 w-4" />
                </CustomButton>
            </motion.div>
        </motion.div>
    </motion.div>
);

export default ContactTab;
