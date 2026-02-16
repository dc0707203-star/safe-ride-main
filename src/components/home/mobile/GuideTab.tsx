import React from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Car,
    BookOpen,
    ChevronRight
} from 'lucide-react';
import FloatingParticles from '../FloatingParticles';
import GlassCard from '@/components/ui/GlassCard';
import CustomButton from '@/components/ui/CustomButton';
import { pageVariants, pageTransition, fadeInUp, staggerContainer } from '../animations';

interface GuideTabProps {
    navigate: (path: string) => void;
}

const GuideTab = ({ navigate }: GuideTabProps) => (
    <motion.div
        key="guide"
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
                <BookOpen className="w-10 h-10 text-white" />
            </motion.div>

            <motion.div variants={fadeInUp}>
                <span className="text-white text-xs font-bold uppercase tracking-widest">User Manual</span>
                <h2 className="text-2xl font-black tracking-tight mt-1 text-white">
                    Quick Guide
                </h2>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-white/80 text-sm leading-relaxed my-5 font-medium">
                Learn how to use ISU Safe Ride for student and driver registration.
            </motion.p>

            <motion.div variants={fadeInUp} className="space-y-3">
                <GlassCard glow className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
                            <Users className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-bold uppercase mb-1.5">For Students</h3>
                            <p className="text-white/80 text-xs leading-relaxed font-medium">Register, scan QR codes, and track your rides safely.</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
                            <Car className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h3 className="text-white text-sm font-bold uppercase mb-1.5">For Drivers</h3>
                            <p className="text-white/80 text-xs leading-relaxed font-medium">Register, get your QR code, and start accepting students.</p>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            <motion.div variants={fadeInUp}>
                <CustomButton variant="outline" onClick={() => navigate('/guide')} className="mt-6">
                    Full Guide <ChevronRight className="h-4 w-4" />
                </CustomButton>
            </motion.div>
        </motion.div>
    </motion.div>
);

export default GuideTab;
