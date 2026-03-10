import React, { CSSProperties } from "react";

interface CustomButtonProps {
    children: React.ReactNode;
    className?: string;
    variant?: "secondary" | "outline";
    onClick?: () => void;
    size?: "md" | "lg";
    style?: CSSProperties;
}

const CustomButton = ({
    children,
    className = "",
    variant = "secondary",
    onClick,
    size = "md",
    style,
}: CustomButtonProps) => {
    const sizeStyles =
        size === "lg"
            ? "h-14 px-10 text-base font-bold uppercase tracking-[0.18em]"
            : "h-12 px-8 text-sm font-black uppercase tracking-[0.15em]";

    const baseStyles = `inline-flex items-center justify-center rounded-full font-bold transition-all duration-300 active:scale-95 relative z-30 overflow-hidden cursor-pointer focus:outline-none ${sizeStyles}`;

    const variants = {
        secondary:
            "bg-[#CCFF00] text-[#003311] hover:bg-white hover:scale-105 hover:shadow-[0_0_40px_rgba(204,255,0,0.6),0_15px_30px_rgba(0,0,0,0.3)] border-2 border-transparent hover:border-white",
        outline:
            "border border-[#CCFF00]/40 text-[#CCFF00] hover:bg-[#CCFF00]/10 hover:text-white hover:border-[#CCFF00] hover:shadow-[0_0_30px_rgba(0,255,0,0.2)] backdrop-blur-md bg-white/40 active:bg-[#CCFF00]/20",
    };

    const inlineStyle: CSSProperties = {
        color: variant === "secondary" ? "#003311" : "#CCFF00",
        ...style,
    };

    return (
        <button
            onClick={onClick}
            style={inlineStyle}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            aria-label={typeof children === "string" ? children : undefined}
        >
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </button>
    );
};

export default CustomButton;
