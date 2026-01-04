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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex flex-col safe-area-inset">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-10 safe-area-top shadow-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-xl bg-primary/10 border border-primary/20">
              <img src={isuLogo} alt="ISU Logo" className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">SafeRide ISU</h1>
              <p className="text-[11px] text-muted-foreground leading-tight">Terms & Agreement</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Terms and Conditions</h2>
          <p className="text-muted-foreground text-sm">
            Please read and accept the following agreement to continue.
          </p>
        </div>

        <Card className="mb-6 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              ISU SafeRide User Agreement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4 text-sm text-muted-foreground">
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
        <Card className="mb-6 bg-amber-50 border-amber-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-100">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800">Important Notice</p>
                <p className="text-xs text-amber-600 mt-1">
                  By accepting this agreement, you confirm that you have read, understood, and agree to comply 
                  with all the terms and conditions stated above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agreement Checkbox */}
        <div className="flex items-start gap-3 mb-6 p-4 bg-card rounded-xl border">
          <Checkbox
            id="agreement"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked === true)}
            className="mt-1"
          />
          <label htmlFor="agreement" className="text-sm cursor-pointer">
            I have read, understood, and agree to the <span className="font-semibold text-primary">Terms and Conditions</span> of 
            the ISU SafeRide Emergency System. I will use this system responsibly and only for its intended purpose.
          </label>
        </div>

        {/* Accept Button */}
        <Button 
          onClick={handleAcceptAgreement}
          disabled={!agreed || isSubmitting}
          className="w-full h-12 rounded-xl gap-2 text-base font-semibold"
        >
          <CheckCircle className="h-5 w-5" />
          {isSubmitting ? "Processing..." : "Accept and Continue"}
        </Button>
      </main>
    </div>
  );
};

export default Agreement;
