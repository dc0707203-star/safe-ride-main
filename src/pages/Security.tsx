import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Security = () => {
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
                <Lock className="h-6 w-6 text-[#CCFF00]" />
                <h1 className="text-2xl font-bold text-white">Security</h1>
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
              <h2 className="text-3xl font-bold text-white">Security at SafeRide ISU</h2>
              <p className="text-white/80 leading-relaxed">
                Security is our top priority at SafeRide ISU. We implement comprehensive technical, administrative, and physical security measures to protect your data, ensure your safety, and maintain the integrity of our platform.
              </p>
            </section>

            {/* Data Encryption */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">1. End-to-End Encryption</h3>
              <div className="space-y-3 text-white/80">
                <p>
                  <strong className="text-white">Transport Security:</strong> All data transmitted between your device and our servers is encrypted using TLS 1.3 (HTTPS/SSL).
                </p>
                <p>
                  <strong className="text-white">Location Data:</strong> GPS coordinates and location information are encrypted at rest and in transit to prevent unauthorized access.
                </p>
                <p>
                  <strong className="text-white">Communications:</strong> Messages between drivers and students, and emergency reports, are encrypted to maintain privacy.
                </p>
              </div>
            </section>

            {/* Authentication */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">2. Authentication & Access Control</h3>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Secure password hashing using industry-standard algorithms</li>
                <li>Multi-factor authentication (MFA) support for enhanced account security</li>
                <li>Session management with automatic timeout for inactive sessions</li>
                <li>Role-based access control ensuring users can only access appropriate features</li>
                <li>Audit logging of all administrative actions</li>
              </ul>
            </section>

            {/* Data Security */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">3. Data Storage & Protection</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                We implement multiple layers of data protection:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Database encryption with AES-256 for sensitive information</li>
                <li>Redundant backup systems with encryption at rest</li>
                <li>Secure data deletion protocols following industry standards</li>
                <li>Limited data retention policies for non-essential information</li>
                <li>Access controls restricting data access to authorized personnel only</li>
              </ul>
            </section>

            {/* Network Security */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">4. Network Security Infrastructure</h3>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Firewalls and intrusion detection systems (IDS)</li>
                <li>Intrusion prevention systems (IPS) to block attacks</li>
                <li>DDoS protection to ensure service availability</li>
                <li>Regular network penetration testing</li>
                <li>Secure API endpoints with rate limiting and request validation</li>
              </ul>
            </section>

            {/* Vulnerability Management */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">5. Vulnerability Management & Patching</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                We maintain a comprehensive security program:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Regular security assessments and code reviews</li>
                <li>Automated vulnerability scanning tools</li>
                <li>Prompt patching of identified vulnerabilities</li>
                <li>Responsible disclosure program for security researchers</li>
                <li>Regular updates to all dependencies and libraries</li>
              </ul>
            </section>

            {/* User Safety Features */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">6. User Safety Features</h3>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Real-time trip sharing with trusted contacts</li>
                <li>Emergency SOS button with automatic emergency responder notification</li>
                <li>Driver background verification and screening</li>
                <li>In-app video recording for accountability</li>
                <li>Real-time driver-student communication channels</li>
                <li>Anonymous safety reporting system</li>
                <li>Automatic ride cancellation features for safety concerns</li>
              </ul>
            </section>

            {/* Incident Response */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">7. Incident Response & Reporting</h3>
              <p className="text-white/80 leading-relaxed">
                We maintain a comprehensive incident response plan that includes immediate detection, investigation, containment, and notification procedures. In the event of a security incident, we will notify affected users and relevant authorities as required by law within appropriate timeframes.
              </p>
            </section>

            {/* Compliance */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">8. Compliance & Standards</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                SafeRide ISU complies with:
              </p>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>FERPA (Family Educational Rights and Privacy Act)</li>
                <li>OWASP (Open Web Application Security Project) guidelines</li>
                <li>NIST Cybersecurity Framework</li>
                <li>PCI DSS compliance for payment processing</li>
                <li>Iowa State University security policies</li>
              </ul>
            </section>

            {/* User Best Practices */}
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-[#CCFF00]">9. Security Best Practices for Users</h3>
              <ul className="space-y-2 text-white/80 list-disc list-inside">
                <li>Use a strong, unique password for your SafeRide account</li>
                <li>Enable multi-factor authentication if available</li>
                <li>Never share your account credentials with others</li>
                <li>Keep your device and app updated with the latest patches</li>
                <li>Be cautious of phishing attempts or suspicious emails</li>
                <li>Log out from your account when finished</li>
                <li>Report suspicious activity immediately to our support team</li>
              </ul>
            </section>

            {/* Security Monitoring */}
            <section className="space-y-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6">
              <h3 className="text-2xl font-bold text-[#CCFF00]">10. 24/7 Security Monitoring</h3>
              <p className="text-white/80 leading-relaxed">
                SafeRide ISU operates a Security Operations Center (SOC) that monitors the platform 24/7 for suspicious activities, unauthorized access attempts, and security anomalies. Our security team responds immediately to any detected threats.
              </p>
            </section>

            {/* Reporting Security Issues */}
            <section className="space-y-4 mt-8">
              <h3 className="text-2xl font-bold text-[#CCFF00]">Report a Security Issue</h3>
              <p className="text-white/80 leading-relaxed mb-3">
                If you discover a security vulnerability or have concerns about our security practices, please report it responsibly to:
              </p>
              <div className="text-white space-y-1">
                <p><strong>Email:</strong> santiago@isu.edu.ph</p>
                <p><strong>Emergency Hotline:</strong> 911</p>
                <p className="text-white/60 text-sm mt-3">
                  Please do not publicly disclose security vulnerabilities until they have been addressed.
                </p>
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

export default Security;
