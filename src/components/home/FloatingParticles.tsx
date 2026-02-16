import { motion } from "framer-motion";

const FloatingParticles = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute rounded-full bg-gradient-to-r from-[#CCFF00]/15 to-transparent"
                style={{
                    width: `${30 + (i % 4) * 25}px`,
                    height: `${30 + (i % 4) * 25}px`,
                    left: `${5 + i * 15}%`,
                    top: `${10 + (i % 5) * 15}%`,
                }}
                animate={{
                    y: [-40, 40, -40],
                    x: [-15, 15, -15],
                    opacity: [0.1, 0.5, 0.1],
                    scale: [0.7, 1.3, 0.7],
                }}
                transition={{
                    duration: 5 + i * 0.7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.2,
                }}
            />
        ))}
    </div>
);

export default FloatingParticles;
