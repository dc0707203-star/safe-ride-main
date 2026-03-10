import { useEffect, useRef, useCallback } from "react";

interface UseShakeSOSProps {
  onTrigger: () => void;
  enabled?: boolean;
  sensitivity?: number; // 15-40, higher = less sensitive
}

/**
 * Hook that detects device shake to trigger SOS
 * Works on both iOS and Android via accelerometer (DeviceMotionEvent)
 * More reliable than volume buttons
 */
export function useShakeSOS({ onTrigger, enabled = true, sensitivity = 25 }: UseShakeSOSProps) {
  const lastShakeRef = useRef<number>(0);
  const lastAccelerationRef = useRef({ x: 0, y: 0, z: 0 });

  const handleDeviceMotion = useCallback((event: DeviceMotionEvent) => {
    if (!enabled) return;

    const { x = 0, y = 0, z = 0 } = event.acceleration || {};
    
    const lastX = lastAccelerationRef.current.x;
    const lastY = lastAccelerationRef.current.y;
    const lastZ = lastAccelerationRef.current.z;
    
    // Store current acceleration
    lastAccelerationRef.current = { x, y, z };
    
    // Calculate acceleration delta (how much it changed)
    const deltaX = Math.abs(x - lastX);
    const deltaY = Math.abs(y - lastY);
    const deltaZ = Math.abs(z - lastZ);
    
    // Sum of changes across all axes
    const totalDelta = deltaX + deltaY + deltaZ;
    
    // If movement exceeds threshold, trigger SOS
    if (totalDelta > sensitivity) {
      const now = Date.now();
      const timeSinceLastShake = now - lastShakeRef.current;
      
      // Prevent multiple triggers within 1 second
      if (timeSinceLastShake < 1000) return;
      
      lastShakeRef.current = now;
      console.log("🚨 SHAKE SOS DETECTED! Delta:", totalDelta.toFixed(2));
      onTrigger();
    }
  }, [enabled, onTrigger, sensitivity]);

  // Set up device motion listener
  useEffect(() => {
    if (!enabled) return;

    // Request permission on iOS 13+
    const setupListener = async () => {
      try {
        if ((window as any).DeviceMotionEvent?.requestPermission) {
          const permission = await (window as any).DeviceMotionEvent.requestPermission();
          if (permission !== 'granted') {
            console.warn("[ShakeSOS] Device motion permission denied");
            return;
          }
        }
        
        window.addEventListener('devicemotion', handleDeviceMotion);
        console.log("[ShakeSOS] Device motion listener started");
      } catch (error) {
        console.warn("[ShakeSOS] Failed to setup device motion:", error);
      }
    };

    setupListener();

    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
    };
  }, [enabled, handleDeviceMotion]);
}
