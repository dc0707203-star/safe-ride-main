import { useEffect, useRef, useCallback } from "react";
import { Capacitor } from "@capacitor/core";

interface UseVolumeButtonSOSProps {
  onTrigger: () => void;
  enabled?: boolean;
}

/**
 * Hook that detects rapid volume button presses to trigger SOS
 * Pressing volume up or down 4 times quickly triggers the callback (emergency mode)
 * On Android: Uses native Android keydown events from MainActivity
 * On Web: Emulates with keyboard events for testing
 */
export function useVolumeButtonSOS({ onTrigger, enabled = true }: UseVolumeButtonSOSProps) {
  const pressTimesRef = useRef<number[]>([]);
  const REQUIRED_PRESSES = 4;
  const TIME_WINDOW_MS = 2000; // Must press 4 times within 2 seconds

  // Handler that gets called on every volume button press
  const handleVolumePressDetected = useCallback(() => {
    if (!enabled) return;

    const now = Date.now();
    pressTimesRef.current.push(now);

    // Remove presses older than TIME_WINDOW_MS
    pressTimesRef.current = pressTimesRef.current.filter(
      (time) => now - time < TIME_WINDOW_MS
    );

    console.log(`Volume button press detected. Count: ${pressTimesRef.current.length}`);

    // Check if we have enough rapid presses
    if (pressTimesRef.current.length >= REQUIRED_PRESSES) {
      // Reset and trigger SOS
      pressTimesRef.current = [];
      console.log("SOS triggered from volume button!");
      onTrigger();
    }
  }, [enabled, onTrigger]);

  // For web browsers - detect keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Detect volume keys (works on some browsers/devices)
    // Also detect common volume key codes
    const isVolumeKey = 
      event.key === "AudioVolumeUp" || 
      event.key === "AudioVolumeDown" ||
      event.keyCode === 175 || // Volume Up
      event.keyCode === 174 || // Volume Down
      event.keyCode === 38 || // Arrow Up (fallback for testing)
      event.keyCode === 40;   // Arrow Down (fallback for testing)


    if (!isVolumeKey) return;

    handleVolumePressDetected();
  }, [enabled, handleVolumePressDetected]);

  // Web platform - listen for keyboard events
  useEffect(() => {
    if (!enabled || Capacitor.isNativePlatform()) return;

    console.log("[VolumeButtonSOS] Setting up web keyboard listener");
    document.addEventListener("keydown", handleKeyDown);
    
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, handleKeyDown]);

  // Native platform - set up callback that native Android code will call
  useEffect(() => {
    if (!enabled || !Capacitor.isNativePlatform()) return;

    console.log("[VolumeButtonSOS] Setting up native volume button callback");

    // Make the trigger function available to native code
    (window as any).volumeButtonSOSTriggered = () => {
      console.log("[VolumeButtonSOS] Native SOS triggered!");
      handleVolumePressDetected();
    };

    return () => {
      delete (window as any).volumeButtonSOSTriggered;
    };
  }, [enabled, handleVolumePressDetected]);

  return null;
}
