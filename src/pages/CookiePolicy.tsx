import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CookiePolicy = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-950 via-slate-900 to-green-900">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#CCFF00] rounded-full mix-blend-screen blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-20 bg-white/10 backdrop-blur-xl border-b border-white/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Cookie className="h-6 w-6 text-[#CCFF00]" />
                <h1 className="text-2xl font-bold text-white">Cookie Policy</h1>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="gap-2 text-white hover:text-[#CCFF00]"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-12 py-12">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Last Updated */}
            <div className="text-sm text-white/60">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Cookie Policy</h2>
              <p className="text-white/80 leading-relaxed">
                SafeRide ISU uses cookies and similar technologies to enhance your experience, analyze how the application is used, and support our marketing efforts. This Cookie Policy explains what cookies are, why we use them, and your options regarding their use.
              </p>
            </section>

            {/* What Are Cookies */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">1. What Are Cookies?</h3>
              <p className="text-white/80 leading-relaxed">
                Cookies are small text files stored on your device (computer, smartphone, or tablet) that contain information about your browsing activity. They are widely used by websites and applications to remember information about users, preferences, and behaviors. Cookies can be either session-based (temporary, deleted when you close the app) or persistent (stored for a specific duration).
              </p>
            </section>

            {/* Types of Cookies We Use */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">2. Types of Cookies We Use</h3>
              <div className="space-y-4">
                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Essential Cookies</h4>
                  <p className="text-white/80 text-sm">
                    These cookies are necessary for the SafeRide application to function properly. They include authentication tokens, session management, and security features. Without these cookies, you cannot access your account or use core features. These cookies cannot be disabled.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Preference Cookies</h4>
                  <p className="text-white/80 text-sm">
                    These cookies remember your preferences and choices, such as language settings, theme preferences, and accessibility options. This allows us to personalize your experience on subsequent visits.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Analytics Cookies</h4>
                  <p className="text-white/80 text-sm">
                    These cookies help us understand how you use SafeRide. We collect information about which features you use, how long you spend in the app, and any errors encountered. This data helps us improve the application and user experience.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Marketing Cookies</h4>
                  <p className="text-white/80 text-sm">
                    These cookies track your browsing behavior to deliver personalized content and advertisements. They may be set by third-party advertising partners. You can opt out of marketing cookies.
                  </p>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                  <h4 className="text-white font-bold mb-2">Performance Cookies</h4>
                  <p className="text-white/80 text-sm">
                    These cookies collect information about your device and app performance, including app crashes, load times, and responsiveness issues. This helps us optimize the application for better performance.
                  </p>
                </div>
              </div>
            </section>

            {/* Specific Cookies */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">3. Specific Cookies Used</h3>
              <div className="space-y-3 text-white/80 text-sm">
                <p>
                  <strong className="text-white">auth_token:</strong> Stores your authentication token for maintaining your login session (Essential)
                </p>
                <p>
                  <strong className="text-white">user_preferences:</strong> Remembers your language and theme preferences (Preference)
                </p>
                <p>
                  <strong className="text-white">session_id:</strong> Maintains your current session information (Essential)
                </p>
                <p>
                  <strong className="text-white">analytics_id:</strong> Identifies you for analytics purposes without personally identifying you (Analytics)
                </p>
                <p>
                  <strong className="text-white">location_history:</strong> Caches recent location data for improved app performance (Performance)
                </p>
                <p>
                  <strong className="text-white">marketing_consent:</strong> Stores your marketing preference choices (Marketing)
                </p>
              </div>
            </section>

            {/* Third-Party Services */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">4. Third-Party Cookies</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                We may use third-party services that set their own cookies:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li><strong>Google Analytics:</strong> Analyzes user behavior and app usage patterns</li>
                <li><strong>Supabase:</strong> Manages authentication and database operations</li>
                <li><strong>Sentry:</strong> Monitors and reports application errors</li>
                <li><strong>Marketing Partners:</strong> Deliver targeted content and advertisements</li>
              </ul>
            </section>

            {/* Cookie Duration */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">5. Cookie Duration</h3>
              <div className="space-y-3 text-white/80">
                <p>
                  <strong className="text-white">Session Cookies:</strong> These are deleted when you close the SafeRide application or log out from your account. Typical duration: Until app closure.
                </p>
                <p>
                  <strong className="text-white">Persistent Cookies:</strong> These remain on your device for a set period. Duration typically ranges from a few days to one year, depending on the cookie's purpose.
                </p>
              </div>
            </section>

            {/* Your Cookie Choices */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">6. Your Cookie Choices</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                You have several options to manage cookies:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>
                  <strong>In-App Settings:</strong> Use SafeRide's settings menu to manage cookie preferences and privacy settings
                </li>
                <li>
                  <strong>Device Settings:</strong> Configure cookie settings through your device's browser or app settings
                </li>
                <li>
                  <strong>Opt-Out:</strong> Opt out of analytics and marketing cookies through our preference center
                </li>
                <li>
                  <strong>Browser Controls:</strong> Most web browsers allow you to refuse cookies or alert you when cookies are being sent
                </li>
              </ul>
            </section>

            {/* Privacy Impact */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">7. How Cookies Affect Your Privacy</h3>
              <p className="text-white/80 leading-relaxed">
                Cookies themselves cannot contain or transmit viruses or malware. They cannot directly execute code or identify you by name. However, cookies do store information about your browsing behavior and preferences. This information may be used to personalize your experience or for analytics. Rest assured that we do not use cookies to track activity outside of the SafeRide application without your consent. Your privacy is important to us.
              </p>
            </section>

            {/* Do Not Track */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">8. Do Not Track Signals</h3>
              <p className="text-white/80 leading-relaxed">
                Some browsers include a "Do Not Track" feature. If your browser sends a Do Not Track signal, SafeRide respects your privacy choice. Essential cookies will still be used to provide core functionality, but we will limit analytics and marketing tracking if you have enabled Do Not Track.
              </p>
            </section>

            {/* Cookie Updates */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">9. Changes to This Cookie Policy</h3>
              <p className="text-white/80 leading-relaxed">
                We may update this Cookie Policy periodically to reflect changes in our practices or technology. We will notify you of significant changes by updating the "Last Updated" date and, if applicable, through in-app notifications or email.
              </p>
            </section>

            {/* Contact Section */}
            <section className="space-y-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-[#CCFF00]">10. Contact Us About Cookies</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                If you have questions about our use of cookies or how to manage them, please contact us:
              </p>
              <div className="text-white space-y-1">
                <p><strong>Email:</strong> santiago@isu.edu.ph</p>
                <p><strong>Address:</strong> Iowa State University Safety Services</p>
                <p><strong>Hotline:</strong> 911</p>
              </div>
            </section>

            {/* Cookie Consent */}
            <section className="space-y-4 mt-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6">
              <h4 className="text-white font-bold">Your Consent</h4>
              <p className="text-white/80 text-sm">
                By continuing to use SafeRide ISU, you consent to our use of cookies as described in this policy. If you do not agree to our cookie practices, please disable cookies in your device settings or discontinue use of the application.
              </p>
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/10 bg-white/5 backdrop-blur-xl mt-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-8">
            <div className="text-center text-white/50 text-sm">
              <p>© 2025 SafeRide ISU. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CookiePolicy;
