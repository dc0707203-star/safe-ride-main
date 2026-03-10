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
        whileHover={{ y: -12, scale: 1.03 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className={`group relative backdrop-blur-md border shadow-2xl transition-all duration-300 ${alert
                ? "bg-white/8 border-red-400/40 hover:border-red-400/80 hover:shadow-[0_0_30px_rgba(244,63,94,0.3)]"
                : "bg-white/7 border-white/30 hover:border-[#CCFF00]/60 hover:shadow-[0_0_40px_rgba(204,255,0,0.25)]"
            } p-8 rounded-[2.5rem] overflow-hidden ${className}`}
    >
        {/* Liquid Glass Layer - Clear */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/8 via-white/2 to-white/4 opacity-0 group-hover:opacity-80 transition-opacity duration-500 rounded-[2.5rem]" />
        
        {/* Top Light Refraction */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Shimmer - Subtle */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity duration-500">
            <div className="absolute -top-1/3 -right-1/4 w-1/2 h-1/2 bg-white/15 blur-2xl" />
            <div className="absolute -bottom-1/4 -left-1/4 w-1/3 h-1/3 bg-cyan-300/8 blur-3xl" />
        </div>
        
        {/* Primary Glow */}
        {glow && (
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#CCFF00]/15 blur-[70px] pointer-events-none animate-pulse transition-all group-hover:bg-[#CCFF00]/25" />
        )}
        
        {/* Content */}
        <div className="relative z-10">{children}</div>
    </motion.div>
);

export default GlassCard;
