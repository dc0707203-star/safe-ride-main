import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Privacy = () => {
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
                <ShieldCheck className="h-6 w-6 text-[#CCFF00]" />
                <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
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
              <h2 className="text-3xl font-bold text-white">Our Commitment to Your Privacy</h2>
              <p className="text-white/80 leading-relaxed">
                SafeRide ISU is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services.
              </p>
            </section>

            {/* Information Collection */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">1. Information We Collect</h3>
              <div className="space-y-3 text-white/80">
                <p>
                  <strong className="text-white">Personal Information:</strong> Name, email, phone number, student/employee ID, and password when you create an account.
                </p>
                <p>
                  <strong className="text-white">Location Data:</strong> Your precise geolocation is collected when using the SafeRide service to provide ride-tracking and emergency response capabilities.
                </p>
                <p>
                  <strong className="text-white">Device Information:</strong> Device type, operating system, unique device identifiers, and mobile network information.
                </p>
                <p>
                  <strong className="text-white">Usage Data:</strong> Information about how you interact with the app, including features used, rides completed, and support tickets.
                </p>
              </div>
            </section>

            {/* Use of Information */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">2. How We Use Your Information</h3>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>To provide, operate, and maintain the SafeRide service</li>
                <li>To enable ride-sharing and emergency response features</li>
                <li>To communicate with you about service updates and support</li>
                <li>To process transactions and send related information</li>
                <li>To improve and optimize our application and services</li>
                <li>To comply with legal obligations and safety requirements</li>
                <li>To detect and prevent fraudulent or unauthorized activity</li>
              </ul>
            </section>

            {/* Data Protection */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">3. Data Protection & Security</h3>
              <p className="text-white/80 leading-relaxed">
                We implement comprehensive security measures including end-to-end encryption, secure data transmission using HTTPS, access controls, and regular security audits to protect your personal information from unauthorized access, alteration, or destruction.
              </p>
            </section>

            {/* Data Sharing */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">4. Data Sharing & Third Parties</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                We do not sell your personal information. We may share information with:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Service providers who assist in operating the application</li>
                <li>Law enforcement and emergency services when required by law or for your safety</li>
                <li>Other users (drivers/students) to facilitate ride-sharing services</li>
                <li>Analytics partners to improve our services</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">5. Your Privacy Rights</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Access your personal information</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your information (subject to legal requirements)</li>
                <li>Opt-out of non-essential data collection</li>
                <li>Request a copy of your data in a portable format</li>
              </ul>
            </section>

            {/* Location Privacy */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">6. Location Information</h3>
              <p className="text-white/80 leading-relaxed">
                Location data is essential for our emergency response system. Your location is encrypted and only shared with emergency responders when you activate an emergency alert. You can control location permissions through your device settings.
              </p>
            </section>

            {/* Policy Updates */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">7. Changes to This Privacy Policy</h3>
              <p className="text-white/80 leading-relaxed">
                We may update this Privacy Policy periodically. We will notify you of significant changes by updating the "Last Updated" date and, if applicable, by requesting your consent.
              </p>
            </section>

            {/* Contact */}
            <section className="space-y-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-[#CCFF00]">8. Contact Us</h3>
              <p className="text-white/80">
                If you have questions about this Privacy Policy or our privacy practices, please contact us at:
              </p>
              <div className="text-white space-y-1">
                <p><strong>Email:</strong> santiago@isu.edu.ph</p>
                <p><strong>Address:</strong> Iowa State University Safety Services</p>
              </div>
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

export default Privacy;
