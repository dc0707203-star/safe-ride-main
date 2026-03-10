import '../footer-link-glow.css';
import { useState, useEffect, type CSSProperties } from 'react'; // CSSProperties unused but kept for safety if needed
import MobileBottomNav from '@/components/MobileBottomNav';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/hooks/useAuth';
import campusBg from '@/assets/campus-bg.jpeg';
import SplashScreen from '@/components/SplashScreen';

// Mobile Tabs
import HomeTab from '@/components/home/mobile/HomeTab';
import FeaturesTab from '@/components/home/mobile/FeaturesTab';
import GuideTab from '@/components/home/mobile/GuideTab';
import AboutTab from '@/components/home/mobile/AboutTab';
import ContactTab from '@/components/home/mobile/ContactTab';
import DeveloperTab from '@/components/home/mobile/DeveloperTab';

// Desktop Sections
import Hero from '@/components/home/Hero';
import Features from '@/components/home/Features';
import Footer from '@/components/home/Footer';

// Shared Components
// (None directly used here except imported ones)

type TabType = 'home' | 'features' | 'about' | 'contact' | 'developer' | 'guide';

const TABS: TabType[] = ['home', 'features', 'guide', 'about', 'contact', 'developer'];

// --- Main Page Component ---
const Index = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, loading, userRole } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [showSplash, setShowSplash] = useState(true);
  const [direction, setDirection] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);

  // Auto-redirect authenticated users to their dashboard
  useEffect(() => {
    if (loading) {
      return;
    }

    if (user && userRole) {
      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'rescue_admin') {
        navigate('/rescue-admin');
      } else if (userRole === 'pnp') {
        navigate('/pnp');
      } else if (userRole === 'rescue') {
        navigate('/rescue');
      } else if (userRole === 'student') {
        navigate('/student');
      } else if (userRole === 'driver') {
        navigate('/driver-dashboard');
      }
    }
  }, [user, userRole, loading, navigate]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [loading]);

  const handleTabChange = (newTab: TabType) => {
    const currentIndex = TABS.indexOf(activeTab);
    const newIndex = TABS.indexOf(newTab);
    setDirection(newIndex > currentIndex ? 1 : -1);
    setActiveTab(newTab);
  };

  const handleSwipe = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const currentIndex = TABS.indexOf(activeTab);

    if (info.offset.x < -threshold && currentIndex < TABS.length - 1) {
      handleTabChange(TABS[currentIndex + 1]);
    } else if (info.offset.x > threshold && currentIndex > 0) {
      handleTabChange(TABS[currentIndex - 1]);
    }
  };

  const handlePullRefresh = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 0) {
      setPullDistance(Math.min(info.offset.y, 120));
    }
  };

  const handlePullEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 80 && !isRefreshing) {
      setIsRefreshing(true);
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false);
        setPullDistance(0);
      }, 1500);
    } else {
      setPullDistance(0);
    }
  };

  const renderMobileContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab navigate={navigate} />;
      case 'features':
        return <FeaturesTab />;
      case 'guide':
        return <GuideTab navigate={navigate} />;
      case 'about':
        return <AboutTab navigate={navigate} />;
      case 'contact':
        return <ContactTab navigate={navigate} />;
      case 'developer':
        return <DeveloperTab navigate={navigate} />;
      default:
        return <HomeTab navigate={navigate} />;
    }
  };

  return (
    <>
      {/* Show splash screen while loading session */}
      {loading ? (
        <SplashScreen isVisible={true} />
      ) : (
        <>
          <SplashScreen isVisible={showSplash} />
          {/* Overlay/blur for main content */}
          <div className="min-h-screen text-gray-900 relative overflow-x-hidden font-sans selection:bg-[#CCFF00] selection:text-[#001a0d] w-full bg-gradient-to-br from-[#003d1a] via-[#004d25] to-[#1a2b1a]">
            <div className="fixed inset-0 z-0 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-black/30 backdrop-blur-[2px]" />
              <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#CCFF00]/5 to-transparent" />
            </div>

            {isMobile ? (
              <>
                {/* Pull to Refresh Indicator */}
                <motion.div
                  className="fixed top-20 left-0 right-0 z-30 flex justify-center w-full"
                  style={{ y: pullDistance > 0 ? pullDistance / 2 : 0 }}
                >
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-xl border border-green-100 shadow-sm ${pullDistance > 80 || isRefreshing ? 'opacity-100' : 'opacity-0'
                      } transition-opacity`}
                  >
                    <motion.div
                      className="w-5 h-5 border-2 border-[#004d25] border-t-transparent rounded-full"
                      animate={isRefreshing ? { rotate: 360 } : { rotate: pullDistance * 3 }}
                      transition={isRefreshing ? { duration: 0.8, repeat: Infinity, ease: "linear" } : { duration: 0 }}
                    />
                    <span className="text-[#004d25] text-xs font-bold uppercase tracking-wider">
                      {isRefreshing ? 'Refreshing...' : 'Release to refresh'}
                    </span>
                  </div>
                </motion.div>

                {/* Mobile Main Content */}
                <motion.main
                  className="relative z-10 pt-0 pb-20 w-full overflow-y-auto"
                >
                  <AnimatePresence mode="wait" custom={direction}>
                    {renderMobileContent()}
                  </AnimatePresence>
                </motion.main>

                {/* Bottom Navigation */}
                <MobileBottomNav active={activeTab} onTabChange={handleTabChange} />
              </>
            ) : (
              /* Desktop Layout */
              <main className="relative z-10 w-full">
                <Hero navigate={navigate} />
                <Features />
                <Footer navigate={navigate} />
              </main>
            )}
          </div>
        </>
      )}
    </>
  );
};

export default Index;