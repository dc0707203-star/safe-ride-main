import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Terms = () => {
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
                <FileText className="h-6 w-6 text-[#CCFF00]" />
                <h1 className="text-2xl font-bold text-white">Terms of Service</h1>
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
              Effective Date: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>

            {/* Introduction */}
            <section className="space-y-4">
              <h2 className="text-3xl font-bold text-white">Terms of Service</h2>
              <p className="text-white/80 leading-relaxed">
                Welcome to SafeRide ISU. These Terms of Service ("Terms") govern your use of our mobile application and services. By downloading, installing, or using SafeRide ISU, you agree to be bound by these Terms. If you do not agree to any part of these Terms, please do not use the application.
              </p>
            </section>

            {/* Definitions */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">1. Definitions</h3>
              <div className="space-y-3 text-white/80">
                <p>
                  <strong className="text-white">"Service"</strong> means the SafeRide ISU application and all related services, features, and content.
                </p>
                <p>
                  <strong className="text-white">"User"</strong> means any person who downloads, installs, or uses the SafeRide ISU application.
                </p>
                <p>
                  <strong className="text-white">"Student"</strong> means an enrolled student at Iowa State University using the student portal.
                </p>
                <p>
                  <strong className="text-white">"Driver"</strong> means an approved driver providing safe rides through the SafeRide service.
                </p>
              </div>
            </section>

            {/* User Eligibility */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">2. Eligibility & Registration</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                To use SafeRide ISU, you must:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Be at least 18 years of age</li>
                <li>Be an authorized user of Iowa State University services</li>
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Accept all terms and conditions of this agreement</li>
              </ul>
            </section>

            {/* User Conduct */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">3. User Conduct & Responsibilities</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                You agree not to:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Harass, threaten, abuse, or harm other users or drivers</li>
                <li>Provide false information during registration or usage</li>
                <li>Attempt to gain unauthorized access to the system</li>
                <li>Use the Service while impaired or under the influence</li>
                <li>Violate Iowa State University policies or local laws</li>
                <li>Misuse emergency features or make false emergency reports</li>
              </ul>
            </section>

            {/* Ride Safety */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">4. Ride Safety & Code of Conduct</h3>
              <p className="text-white/80 leading-relaxed">
                All users must follow SafeRide ISU's Code of Conduct. This includes maintaining respectful behavior, following traffic laws, and adhering to driver instructions. Violations may result in account suspension or termination. Drivers reserve the right to refuse service to users who appear intoxicated or pose a safety risk.
              </p>
            </section>

            {/* Emergency Features */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">5. Emergency Features & SOS System</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                The SOS and emergency alert features are designed for genuine safety emergencies:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Use emergency features only for legitimate safety concerns</li>
                <li>False emergency reports may result in account termination and legal action</li>
                <li>Emergency responders are authorized to contact your account holder</li>
                <li>Location data may be shared with emergency services and law enforcement</li>
              </ul>
            </section>

            {/* Limitation of Liability */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">6. Limitation of Liability</h3>
              <p className="text-white/80 leading-relaxed">
                SafeRide ISU and Iowa State University provide the Service "as is" without warranties. We are not liable for indirect, incidental, special, or consequential damages. Our maximum liability is limited to the amount you paid for the Service. This includes but is not limited to delays, cancellations, or safety incidents.
              </p>
            </section>

            {/* Liability Disclaimer */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">7. Safety Disclaimer</h3>
              <p className="text-white/80 leading-relaxed">
                While we implement safety measures, we do not guarantee that the Service is completely safe or secure. Users assume all risks associated with transportation. We recommend following general safety practices and trusting your instincts.
              </p>
            </section>

            {/* Termination */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">8. Termination of Service</h3>
              <p className="text-white/80 leading-relaxed">
                We reserve the right to suspend or terminate accounts that violate these Terms, pose a safety risk, or misuse emergency features. Termination may be permanent and may prohibit future use of the Service.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">9. Changes to Terms</h3>
              <p className="text-white/80 leading-relaxed">
                We may modify these Terms at any time. Continued use of the Service indicates your acceptance of updated Terms. We will notify users of significant changes through the application or email.
              </p>
            </section>

            {/* Governing Law */}
            <section className="space-y-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-[#CCFF00]">10. Governing Law & Dispute Resolution</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                These Terms are governed by the laws of the State of Iowa. Any disputes arising from these Terms shall be resolved through:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Good faith negotiation between parties</li>
                <li>Mediation through Iowa State University services</li>
                <li>Arbitration in Story County, Iowa if necessary</li>
              </ul>
            </section>

            {/* Contact */}
            <section className="space-y-4 mt-8">
              <h3 className="text-2xl font-bold text-[#CCFF00]">Contact Information</h3>
              <p className="text-white/80">
                For questions about these Terms of Service, please contact:
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

export default Terms;
