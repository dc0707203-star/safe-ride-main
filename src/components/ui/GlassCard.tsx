import React from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    alert?: boolean;
    glow?: boolean;
}

const GlassCard = ({ children, className = "", alert = false, glow = false }: GlassCardProps) => (
    <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`group relative backdrop-blur-2xl border shadow-xl transition-all duration-300 ${alert
                ? "bg-white/10 border-white/40 hover:border-red-400/60"
                : "bg-gradient-to-br from-white/10 to-white/5 border-white/30 hover:border-[#CCFF00]/40"
            } p-8 rounded-[2rem] overflow-hidden ${className}`}
    >
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
        {glow && (
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#CCFF00]/20 blur-[80px] pointer-events-none animate-pulse" />
        )}
        <div className="relative z-10">{children}</div>
    </motion.div>
);

export default GlassCard;
