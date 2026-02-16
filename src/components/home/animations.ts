export const pageVariants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
};

export const pageTransition = {
    type: "spring",
    stiffness: 300,
    damping: 30
};

export const staggerContainer = {
    animate: { transition: { staggerChildren: 0.08 } }
};

export const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 }
};
