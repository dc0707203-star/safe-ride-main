import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { detectDeviceCapabilities, getOptimizedTimings } from "@/lib/performanceOptimization";

interface UseLocationTrackerProps {
  studentId: string | null;
  tripId?: string | null; // Current active trip ID
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Hook that continuously tracks and updates student location
 * Saves to students table for current location + trip_locations for real-time trip tracking
 * Optimized for low-spec Android devices
 */
export function useLocationTracker({ 
  studentId, 
  tripId,
  enabled = true, 
  intervalMs,
}: UseLocationTrackerProps) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  // Use optimized timing for low-spec devices
  const capabilities = detectDeviceCapabilities();
  const timings = getOptimizedTimings(capabilities);
  const finalInterval = intervalMs || timings.locationUpdateInterval;

  const updateLocation = useCallback(async (latitude: number, longitude: number, heading?: number) => {
    if (!studentId) return;

    // Skip if location hasn't changed significantly (avoid excessive DB writes)
    const LOCATION_THRESHOLD = 0.0001; // ~10 meters
    if (
      lastLocationRef.current &&
      Math.abs(lastLocationRef.current.lat - latitude) < LOCATION_THRESHOLD &&
      Math.abs(lastLocationRef.current.lng - longitude) < LOCATION_THRESHOLD
    ) {
      return;
    }

    lastLocationRef.current = { lat: latitude, lng: longitude };

    try {
      // Always update student's current location
      const { error: studentError } = await supabase
        .from('students' as any)
        .update({
          current_location_lat: latitude,
          current_location_lng: longitude,
          location_updated_at: new Date().toISOString(),
        })
        .eq('id', studentId);

      if (studentError) {
        console.error('Failed to update student location:', studentError);
      } else {
        console.log('Student location updated:', { latitude, longitude });
      }

      // If trip is active, also save to trip_locations for real-time map tracking
      if (tripId) {
        const { error: tripLocError } = await supabase
          .from('trip_locations')
          .insert({
            trip_id: tripId,
            student_id: studentId,
            latitude,
            longitude,
            heading: heading || null,
            accuracy: null,
          });

        if (tripLocError) {
          console.error('Failed to save trip location:', tripLocError);
        } else {
          console.log('Trip location saved:', { tripId, latitude, longitude });
        }
      }
    } catch (error) {
      console.error('Failed to update location:', error);
    }
  }, [studentId, tripId]);

  const getCurrentPosition = useCallback(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        updateLocation(
          position.coords.latitude, 
          position.coords.longitude,
          position.coords.heading || undefined
        );
      },
      (error) => {
        console.log('Location error:', error.message);
      },
      {
        // Use less accurate positioning for low-spec devices to save battery/CPU
        enableHighAccuracy: !capabilities.isLowSpec,
        timeout: 10000,
        maximumAge: capabilities.isLowSpec ? 30000 : 5000,
      }
    );
  }, [updateLocation, capabilities]);

  useEffect(() => {
    if (!enabled || !studentId) return;

    // Get initial position
    getCurrentPosition();

    // Set up interval for periodic updates with optimized timing
    intervalRef.current = setInterval(getCurrentPosition, finalInterval);

    // For low-spec devices, disable watchPosition as it's more expensive
    // Only use watchPosition on higher-spec devices for better real-time tracking
    if (navigator.geolocation && !capabilities.isLowSpec) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          updateLocation(
            position.coords.latitude, 
            position.coords.longitude,
            position.coords.heading || undefined
          );
        },
        (error) => {
          console.log('Watch position error:', error.message);
        },
        {
          enableHighAccuracy: false,
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
  }, [enabled, studentId, tripId, finalInterval, getCurrentPosition, updateLocation, capabilities]);

  return null;
}

