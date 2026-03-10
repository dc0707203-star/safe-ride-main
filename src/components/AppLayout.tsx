import { useAuth } from "@/hooks/useAuth";
import SplashScreen from "./SplashScreen";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout - Wraps the entire app to handle session restoration
 * Shows splash screen while session is being loaded
 * Detects offline status and skips splash to go directly to dashboard
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { loading } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Listen for online/offline events
    window.addEventListener('online', () => setIsOnline(true));
    window.addEventListener('offline', () => setIsOnline(false));

    return () => {
      window.removeEventListener('online', () => setIsOnline(true));
      window.removeEventListener('offline', () => setIsOnline(false));
    };
  }, []);

  // If offline, skip splash screen and go directly to dashboard
  // This prevents the endless loading flash when there's no internet
  if (!isOnline) {
    return <>{children}</>;
  }

  // Show splash while session is loading (only if online)
  if (loading) {
    return <SplashScreen isVisible={true} />;
  }

  // Session loaded, render the page
  return <>{children}</>;
};

export default AppLayout;
