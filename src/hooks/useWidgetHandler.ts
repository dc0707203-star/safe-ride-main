import { useEffect, useCallback } from 'react';

/**
 * Hook to handle home screen widget interactions
 * Listens for widget triggers from native Android code
 */
export const useWidgetHandler = (
  onSOSTriggered?: () => void,
  onIncidentTriggered?: () => void,
  onRideTriggered?: () => void
) => {
  // Expose functions to window that native Android code can call
  useEffect(() => {
    const handleSOSFromWidget = useCallback(() => {
      console.log("[Widget] SOS triggered from widget/tile");
      if (onSOSTriggered) {
        onSOSTriggered();
      }
    }, [onSOSTriggered]);

    const handleIncidentFromWidget = useCallback(() => {
      console.log("[Widget] Incident report triggered from widget");
      if (onIncidentTriggered) {
        onIncidentTriggered();
      }
    }, [onIncidentTriggered]);

    const handleRideFromWidget = useCallback(() => {
      console.log("[Widget] Ride request triggered from widget");
      if (onRideTriggered) {
        onRideTriggered();
      }
    }, [onRideTriggered]);

    // Attach to window object for native code to call
    // Note: DO NOT remove these even on cleanup - they may be called while component is unmounting
    (window as any).volumeButtonSOSTriggered = handleSOSFromWidget;
    (window as any).triggerIncidentReport = handleIncidentFromWidget;
    (window as any).triggerRideRequest = handleRideFromWidget;

    // Log that handlers are ready
    console.log("[Widget] Handlers registered on window object");

    // Cleanup: keep handlers available even after component unmounts
    return () => {
      // Don't delete - keep handlers available for native calls
      console.log("[Widget] Component unmounting but keeping handlers available");
    };
  }, [onSOSTriggered, onIncidentTriggered, onRideTriggered]);
};
