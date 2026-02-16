import React from 'react';
import { motion } from 'framer-motion';
import {
    Code2,
    ChevronRight
} from 'lucide-react';
import FloatingParticles from '../FloatingParticles';
import GlassCard from '@/components/ui/GlassCard';
import CustomButton from '@/components/ui/CustomButton';
import { pageVariants, pageTransition, fadeInUp, staggerContainer } from '../animations';

interface DeveloperTabProps {
    navigate: (path: string) => void;
}

const DeveloperTab = ({ navigate }: DeveloperTabProps) => (
    <motion.div
        key="developer"
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
                <Code2 className="w-10 h-10 text-[#004d25]" />
            </motion.div>

            <motion.div variants={fadeInUp}>
                <span className="text-[#004d25] text-xs font-bold uppercase tracking-widest">Behind the Code</span>
                <h2 className="text-2xl font-black tracking-tight mt-1 text-white">Meet the Developer</h2>
                <motion.p variants={fadeInUp} className="text-white/80 text-sm leading-relaxed my-5 font-medium"></motion.p>
            </motion.div>

            <motion.p variants={fadeInUp} className="text-gray-600 text-sm leading-relaxed my-5 font-medium">
                Built with passion and dedication for the safety of ISU students.
            </motion.p>

            <motion.div variants={fadeInUp} className="space-y-3">
                <GlassCard glow className="p-4">
                    <h3 className="text-white text-sm font-bold uppercase mb-3">Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                        {['React', 'TypeScript', 'Supabase', 'Tailwind', 'Framer'].map((tech) => (
                            <span key={tech} className="px-3 py-1.5 bg-white/20 border border-white/40 rounded-lg text-xs font-bold text-white">
                                {tech}
                            </span>
                        ))}
                    </div>
                </GlassCard>
                <GlassCard className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white text-sm font-bold uppercase mb-1.5">Version</h3>
                            <p className="text-white text-sm font-mono font-bold">v2.5.3</p>
                        </div>
                        <div className="px-3 py-1 bg-[#CCFF00]/20 rounded-full">
                            <span className="text-white text-xs font-bold uppercase">Stable</span>
                        </div>
                    </div>
                </GlassCard>
            </motion.div>

            <motion.div variants={fadeInUp}>
                <CustomButton variant="outline" onClick={() => navigate('/developer')} className="mt-6">
                    View Full Profile <ChevronRight className="h-4 w-4" />
                </CustomButton>
            </motion.div>
        </motion.div>
    </motion.div>
);

export default DeveloperTab;
