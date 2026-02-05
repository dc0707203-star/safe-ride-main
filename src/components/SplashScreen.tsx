import { motion, AnimatePresence } from 'framer-motion';
import isuLogo from '@/assets/isu-logo.png';

interface SplashScreenProps {
  isVisible: boolean;
}

const SplashScreen = ({ isVisible }: SplashScreenProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-gradient-to-br from-[#001209] via-[#001a0d] to-[#000d06] flex items-center justify-center"
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 -left-32 w-96 h-96 bg-[#CCFF00]/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-[#CCFF00]/3 rounded-full blur-[120px]" />
          </div>

          <div className="relative flex flex-col items-center">
            {/* Animated Ring */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              {/* Outer Ring Pulse */}
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-6 rounded-full border-2 border-[#CCFF00]/30"
              />
              
              {/* Inner Ring Pulse */}
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="absolute -inset-3 rounded-full border border-[#CCFF00]/40"
              />

              {/* Logo Container */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
                className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-[#CCFF00] to-[#9acd00] rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(204,255,0,0.4)]"
              >
                <motion.img
                  src={isuLogo}
                  alt="ISU Logo"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.4 }}
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mt-8 text-center"
            >
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight uppercase">
                <span className="text-white block">ISU</span>
                <span className="bg-gradient-to-r from-[#CCFF00] to-[#e0ff66] bg-clip-text text-transparent">
                  SAFE RIDE
                </span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-3 text-white/50 text-xs sm:text-sm font-medium tracking-wide"
            >
              Emergency Response System
            </motion.p>

            {/* Loading Dots */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
              className="flex gap-2 mt-8"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                  className="w-2 h-2 rounded-full bg-[#CCFF00]"
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
