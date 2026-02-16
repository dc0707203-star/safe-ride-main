import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount?: number;
  pendingSOSCount?: number;
}

export const OfflineIndicator = ({ isOnline, pendingCount = 0, pendingSOSCount = 0 }: OfflineIndicatorProps) => {
  const [show, setShow] = useState(!isOnline);

  useEffect(() => {
    setShow(!isOnline);
    
    // Auto-hide online indicator after 3 seconds
    if (isOnline) {
      const timer = setTimeout(() => setShow(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  const hasUrgent = pendingSOSCount > 0;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-3 px-4 ${
            hasUrgent
              ? 'bg-gradient-to-r from-red-500/90 to-rose-500/90 backdrop-blur-md'
              : isOnline
              ? 'bg-gradient-to-r from-green-500/90 to-emerald-500/90 backdrop-blur-md'
              : 'bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-md'
          } border-b ${
            hasUrgent
              ? 'border-red-400/30'
              : isOnline
              ? 'border-green-400/30'
              : 'border-yellow-400/30'
          } shadow-lg`}
        >
          <div className="flex items-center gap-3 max-w-2xl mx-auto w-full">
            <motion.div
              animate={{ rotate: hasUrgent ? [0, 10, -10, 0] : isOnline ? 0 : 360 }}
              transition={
                hasUrgent
                  ? { duration: 0.4, repeat: Infinity, repeatDelay: 0.5 }
                  : isOnline
                  ? { duration: 0.5, ease: 'easeOut' }
                  : { duration: 2, repeat: Infinity, ease: 'linear' }
              }
            >
              {hasUrgent ? (
                <AlertTriangle className="h-5 w-5 text-white flex-shrink-0" />
              ) : isOnline ? (
                <CheckCircle className="h-5 w-5 text-white flex-shrink-0" />
              ) : (
                <WifiOff className="h-5 w-5 text-white flex-shrink-0" />
              )}
            </motion.div>

            <div className="flex-1">
              <p className="text-white font-semibold text-sm">
                {hasUrgent ? (
                  <span>🚨 SOS Alert Queued</span>
                ) : isOnline ? (
                  <span>You're back online!</span>
                ) : (
                  <span>You are offline</span>
                )}
              </p>
              {pendingSOSCount > 0 && (
                <p className="text-white/90 text-xs mt-0.5 font-semibold">
                  {pendingSOSCount} SOS alert{pendingSOSCount !== 1 ? 's' : ''} waiting to send
                </p>
              )}
              {pendingCount > 0 && !hasUrgent && !isOnline && (
                <p className="text-white/80 text-xs mt-0.5">
                  {pendingCount} action{pendingCount !== 1 ? 's' : ''} waiting to sync
                </p>
              )}
              {isOnline && (pendingCount > 0 || pendingSOSCount > 0) && (
                <p className="text-white/80 text-xs mt-0.5">
                  Syncing pending actions...
                </p>
              )}
            </div>

            {(pendingCount > 0 || pendingSOSCount > 0) && (
              <motion.div
                animate={{ scale: isOnline ? 1 : [1, 1.1, 1] }}
                transition={{ duration: isOnline ? 0.5 : 1, repeat: isOnline ? 0 : Infinity }}
                className={`${
                  hasUrgent ? 'bg-red-400/30' : 'bg-white/20'
                } px-3 py-1 rounded-full flex-shrink-0`}
              >
                <span className="text-white text-xs font-bold">
                  {pendingSOSCount > 0 ? pendingSOSCount : pendingCount}
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const OfflineBanner = ({ isOnline }: { isOnline: boolean }) => {
  if (isOnline) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4"
    >
      <div className="flex">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-yellow-800">
            Offline Mode Active
          </p>
          <p className="mt-2 text-sm text-yellow-700">
            You are currently offline. SOS alerts will be sent to admin when you're back online.
          </p>
        </div>
      </div>
    </motion.div>
  );
};
