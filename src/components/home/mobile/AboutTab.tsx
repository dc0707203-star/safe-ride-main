import React from 'react';
import { motion } from 'framer-motion';
import {
    Sparkles,
    Radio,
    ChevronRight
} from 'lucide-react';
import FloatingParticles from '../FloatingParticles';
import GlassCard from '@/components/ui/GlassCard';
import CustomButton from '@/components/ui/CustomButton';
import isuLogo from '@/assets/isu-logo.png';
import { pageVariants, pageTransition, fadeInUp, staggerContainer } from '../animations';

interface AboutTabProps {
    navigate: (path: string) => void;
}

const AboutTab = ({ navigate }: AboutTabProps) => (
    <motion.div
        key="about"
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
                className="w-20 h-20 bg-gradient-to-br from-[#CCFF00]/20 to-white rounded-3xl border border-green-100 flex items-center justify-center mb-6 shadow-sm"
            >
                <img src={isuLogo} alt="ISU Logo" className="w-12 h-12 object-contain" />
            </motion.div>

            <motion.div variants={fadeInUp}>
                <span className="text-white text-xs font-bold uppercase tracking-widest">About Us</span>
                <h2 className="text-2xl font-black tracking-tight mt-1 text-white">ISU Safe Ride</h2>
                <motion.p variants={fadeInUp} className="text-white/80 text-sm leading-relaxed my-5 font-medium">
                </motion.p>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-gray-600 text-sm leading-relaxed my-5 font-medium">
                Comprehensive emergency response at safe transportation system para sa mga estudyante ng Isabela State University.
            </motion.p>

            <motion.div variants={fadeInUp} className="space-y-3">
                <GlassCard glow className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="w-4 h-4 text-[#004d25]" />
                        </div>
                        <div>
                            <h3 className="text-[#004d25] text-sm font-bold uppercase mb-1.5">Mission</h3>
                            <p className="text-white/80 text-xs leading-relaxed font-medium">Provide safe and reliable transportation for all ISU students.</p>
                        </div>
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#CCFF00]/20 flex items-center justify-center flex-shrink-0">
                            <Radio className="w-4 h-4 text-[#004d25]" />
                        </div>
                        <div>
                            <h3 className="text-[#004d25] text-sm font-bold uppercase mb-1.5">Vision</h3>
                            <p className="text-white/80 text-xs leading-relaxed font-medium">Be the most advanced and trusted campus safety system.</p>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            <motion.div variants={fadeInUp}>
                <CustomButton variant="outline" onClick={() => navigate('/about')} className="mt-6">
                    Learn More <ChevronRight className="h-4 w-4" />
                </CustomButton>
            </motion.div>
        </motion.div>
    </motion.div>
);

export default AboutTab;
