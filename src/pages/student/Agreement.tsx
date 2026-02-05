import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle, FileText, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import isuLogo from '@/assets/isu-logo.png';

interface AgreementProps {
  studentId: string;
  onAccepted: () => void;
}

const Agreement = ({ studentId, onAccepted }: AgreementProps) => {
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAcceptAgreement = async () => {
    if (!agreed) {
      toast.error("Please agree to the terms and conditions first.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('students' as any)
        .update({
          agreement_accepted: true,
          agreement_accepted_at: new Date().toISOString(),
        })
        .eq('id', studentId);

      if (error) throw error;

      toast.success("Agreement accepted! Welcome to ISU SafeRide.");
      onAccepted();
    } catch (error: any) {
      console.error('Error accepting agreement:', error);
      toast.error(error.message || "Failed to accept agreement");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f7fdf3] via-white to-[#f3fff0] flex flex-col safe-area-inset">
      {/* Header */}
      <header className="border-b bg-white/60 backdrop-blur-md sticky top-0 z-10 safe-area-top shadow-sm">
        <div className="px-4 py-3 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-full bg-[#E9FF9E] shadow-md flex items-center justify-center">
              <img src={isuLogo} alt="ISU Logo" className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-[#07320a]">ISU SafeRide</h1>
              <p className="text-sm text-[#2f5230] leading-tight">Student Terms & Agreement</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#E9FF9E] to-[#CCFF00] flex items-center justify-center shadow-lg">
            <FileText className="h-10 w-10 text-[#08320a]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#072e08] mb-2">Terms and Conditions</h2>
          <p className="text-[#41684a] text-sm max-w-xl mx-auto">
            Please read and agree to the terms below to continue using ISU SafeRide services.
          </p>
        </div>

        <Card className="mb-6 border-transparent shadow-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Shield className="h-5 w-5 text-[#0b3f12]" />
              ISU SafeRide User Agreement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[380px] pr-4">
              <div className="space-y-4 text-sm text-[#23493a]">
                <section>
                  <h4 className="font-semibold text-foreground mb-2">1. Purpose of the System</h4>
                  <p>
                    The ISU SafeRide Emergency System is designed to enhance the safety and security of students 
                    during their transportation to and from the Isabela State University campus. By using this system, 
                    you agree to its proper use for legitimate safety purposes only.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-foreground mb-2">2. User Responsibilities</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Provide accurate and truthful information during registration</li>
                    <li>Use the emergency SOS feature only in genuine emergency situations</li>
                    <li>Scan the driver's QR code before boarding any tricycle</li>
                    <li>Report any suspicious activities or safety concerns</li>
                    <li>Keep your account credentials secure and confidential</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-foreground mb-2">3. Emergency SOS Feature</h4>
                  <p>
                    The SOS button is designed for emergency situations only. Misuse or false alarms may result in:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                    <li>Warning notifications</li>
                    <li>Temporary suspension of account</li>
                    <li>Disciplinary action as per university guidelines</li>
                  </ul>
                </section>

                <section>
                  <h4 className="font-semibold text-foreground mb-2">4. Data Privacy</h4>
                  <p>
                    Your personal information and trip data are collected and stored securely to ensure your safety. 
                    This data may be shared with university authorities and law enforcement agencies when necessary 
                    for emergency response or investigation purposes.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-foreground mb-2">5. Location Tracking</h4>
                  <p>
                    The system uses GPS location services to track active trips. By accepting this agreement, 
                    you consent to location tracking while using the SafeRide services for your protection.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-foreground mb-2">6. Disclaimer</h4>
                  <p>
                    While the ISU SafeRide System aims to enhance student safety, it is not a guarantee of absolute 
                    security. Users are encouraged to remain vigilant and practice personal safety measures at all times.
                  </p>
                </section>

                <section>
                  <h4 className="font-semibold text-foreground mb-2">7. Updates to Terms</h4>
                  <p>
                    These terms and conditions may be updated from time to time. Users will be notified of any 
                    significant changes through the application.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="mb-6 bg-[#fff9ec] border border-[#ffefc1] shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-[#fff3d6] shadow-inner">
                <AlertTriangle className="h-5 w-5 text-[#b35d00]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#8a4f00]">Important Notice</p>
                <p className="text-xs text-[#8a5a25] mt-1">
                  By accepting this agreement, you confirm that you have read, understood, and agree to comply
                  with all the terms and conditions stated above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agreement Checkbox */}
        <div className="flex items-start gap-3 mb-6 p-4 bg-white rounded-2xl border border-transparent shadow-sm">
          <Checkbox
            id="agreement"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-1 border-green-400"
          />
          <label htmlFor="agreement" className="text-sm cursor-pointer text-[#133a20]">
            I have read, understood, and agree to the <span className="font-semibold text-[#0b571b]">Terms and Conditions</span> of
            the ISU SafeRide Emergency System. I will use this system responsibly and only for its intended purpose.
          </label>
        </div>

        {/* Accept Button */}
        <Button
          onClick={handleAcceptAgreement}
          disabled={!agreed || isSubmitting}
          className="w-full h-12 rounded-xl gap-2 text-base font-semibold bg-gradient-to-r from-[#17a34a] to-[#0b6b2a] shadow-lg hover:from-[#1ec857] hover:to-[#118c39]"
        >
          <CheckCircle className="h-5 w-5 text-white" />
          {isSubmitting ? "Processing..." : "Accept and Continue"}
        </Button>
      </main>
    </div>
  );
};

export default Agreement;
