import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseLocationTrackerProps {
  studentId: string | null;
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Hook that continuously tracks and updates student location
 */
export function useLocationTracker({ 
  studentId, 
  enabled = true, 
  intervalMs = 10000 // Update every 10 seconds
}: UseLocationTrackerProps) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateLocation = useCallback(async (latitude: number, longitude: number) => {
    if (!studentId) return;

    try {
      await supabase
        .from('students' as any)
        .update({
          current_location_lat: latitude,
          current_location_lng: longitude,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', studentId);
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, [studentId]);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.log('Location error:', error.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [updateLocation]);

  useEffect(() => {
    if (!enabled || !studentId) return;

    // Get initial position
    getCurrentPosition();

    // Set up interval for periodic updates
    intervalRef.current = setInterval(getCurrentPosition, intervalMs);

    // Also use watchPosition for more real-time updates when moving
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          updateLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.log('Watch position error:', error.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 5000,
        }
      );
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [enabled, studentId, intervalMs, getCurrentPosition, updateLocation]);

  return null;
}
