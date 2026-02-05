import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle, Bug, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const ReportIssues = () => {
  const navigate = useNavigate();
  const [issueType, setIssueType] = useState('bug');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send to a backend
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIssueType('bug');
      setDescription('');
      setEmail('');
    }, 3000);
  };

  const issueTypes = [
    {
      id: 'bug',
      label: 'Bug Report',
      icon: Bug,
      description: 'Report technical issues or app crashes',
      color: 'from-red-500/20 to-red-600/10'
    },
    {
      id: 'safety',
      label: 'Safety Concern',
      icon: AlertTriangle,
      description: 'Report safety or security concerns',
      color: 'from-yellow-500/20 to-yellow-600/10'
    },
    {
      id: 'feedback',
      label: 'General Feedback',
      icon: MessageSquare,
      description: 'Suggest improvements or features',
      color: 'from-blue-500/20 to-blue-600/10'
    },
    {
      id: 'other',
      label: 'Other',
      icon: AlertCircle,
      description: 'Something else',
      color: 'from-purple-500/20 to-purple-600/10'
    }
  ];

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
                <AlertCircle className="h-6 w-6 text-[#CCFF00]" />
                <h1 className="text-2xl font-bold text-white">Report an Issue</h1>
              </div>
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
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
          <div className="max-w-2xl mx-auto">
            {/* Introduction */}
            <section className="mb-12 space-y-4">
              <h2 className="text-3xl font-bold text-white">Help Us Improve</h2>
              <p className="text-white/80 leading-relaxed">
                Your feedback is valuable to us. Whether you've encountered a bug, have a safety concern, or want to suggest an improvement, please let us know. Our team reviews all reports and responds promptly to critical issues.
              </p>
            </section>

            {/* Issue Type Selection */}
            <section className="mb-12">
              <h3 className="text-xl font-bold text-white mb-4">What type of issue are you reporting?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {issueTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setIssueType(type.id)}
                      className={`relative overflow-hidden rounded-lg border p-4 transition-all text-left group ${
                        issueType === type.id
                          ? 'bg-[#CCFF00]/20 border-[#CCFF00] shadow-lg shadow-[#CCFF00]/20'
                          : 'bg-white/10 border-white/20 hover:border-white/40 hover:bg-white/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${issueType === type.id ? 'text-[#CCFF00]' : 'text-white/60'}`} />
                        <div>
                          <p className="font-bold text-white text-sm">{type.label}</p>
                          <p className="text-white/60 text-xs">{type.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Report Form */}
            <section>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email */}
                <div>
                  <label className="block text-white font-bold mb-2">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your.email@iastate.edu"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#CCFF00] transition"
                  />
                  <p className="text-white/50 text-xs mt-1">We'll use this to follow up on your report if needed.</p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white font-bold mb-2">Describe the Issue</label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Please provide as much detail as possible..."
                    rows={6}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#CCFF00] transition resize-none"
                  />
                  <p className="text-white/50 text-xs mt-1">Include steps to reproduce the issue, device info, and any screenshots if applicable.</p>
                </div>

                {/* Submission Status */}
                {submitted && (
                  <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
                    <p className="text-green-400 flex items-center gap-2">
                      <span className="text-xl">✓</span>
                      Thank you! Your report has been submitted successfully.
                    </p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={!email || !description || submitted}
                  className="w-full bg-gradient-to-r from-[#CCFF00] to-[#9acd00] text-black hover:from-[#e0ff66] hover:to-[#b8e600] font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Submit Report
                </Button>
              </form>
            </section>

            {/* Additional Info */}
            <section className="mt-12 space-y-6">
              <h3 className="text-2xl font-bold text-white">Other Ways to Report</h3>

              {/* Support Channels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#CCFF00]" />
                    Email Support
                  </h4>
                  <p className="text-white/80 text-sm">
                    <strong>General Issues:</strong> santiago@isu.edu.ph
                  </p>
                  <p className="text-white/80 text-sm mt-2">
                    <strong>Security Issues:</strong> santiago@isu.edu.ph
                  </p>
                </div>

                <div className="bg-white/10 border border-white/20 rounded-lg p-6">
                  <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-[#CCFF00]" />
                    Emergency Support
                  </h4>
                  <p className="text-white/80 text-sm">
                    <strong>Critical Issues:</strong> 911
                  </p>
                  <p className="text-white/80 text-sm mt-2">
                    Available 24/7 for emergency-related concerns
                  </p>
                </div>
              </div>

              {/* FAQ */}
              <div className="bg-white/10 border border-white/20 rounded-lg p-6 space-y-4">
                <h4 className="text-white font-bold flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-[#CCFF00]" />
                  Frequently Reported Issues
                </h4>
                <div className="space-y-3 text-white/80 text-sm">
                  <p>
                    <strong className="text-white">Location not updating?</strong> Try restarting the app and checking location permissions in your device settings.
                  </p>
                  <p>
                    <strong className="text-white">App crashes on startup?</strong> Clear the app cache and ensure you have the latest version from the app store.
                  </p>
                  <p>
                    <strong className="text-white">Emergency features not working?</strong> Verify that your device has an active internet connection and GPS is enabled.
                  </p>
                  <p>
                    <strong className="text-white">Ride booking issues?</strong> Check that you're connected to the ISU network or have cellular data enabled.
                  </p>
                </div>
              </div>
            </section>

            {/* Privacy Notice */}
            <section className="mt-12 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-6">
              <h4 className="text-white font-bold mb-2">Privacy & Confidentiality</h4>
              <p className="text-white/80 text-sm">
                All reports are treated confidentially. We only use your email to follow up on your report. Your personal information will not be shared with third parties. For sensitive security issues, please use our dedicated security reporting email.
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

export default ReportIssues;
