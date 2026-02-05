import { useAuth } from "@/hooks/useAuth";
import SplashScreen from "./SplashScreen";

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * AppLayout - Wraps the entire app to handle session restoration
 * Shows splash screen while session is being loaded
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { loading } = useAuth();

  // Show splash while session is loading
  if (loading) {
    return <SplashScreen isVisible={true} />;
  }

  // Session loaded, render the page
  return <>{children}</>;
};

export default AppLayout;
