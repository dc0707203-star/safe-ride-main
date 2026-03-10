import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Users, Car, FileCheck, Shield, AlertTriangle, CheckCircle, HelpCircle, BookOpen, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import campusBg from '@/assets/campus-bg.jpeg';
import isuLogo from '@/assets/isu-logo.png';

const Guide = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState<'en' | 'tl'>('en');

  const texts: Record<string, any> = {
    en: {
      headerTitle: 'User Guide',
      subtitle: 'Registration & Usage Instructions',
      intro: {
        title: 'Welcome to ISU Safe Ride',
        paragraph: 'ISU Safe Ride is a system that provides safe transportation for Isabela State University students. Follow the steps below to register and use the system.'
      },
      student: {
        title: 'Student Registration Guide',
        steps: [
          { title: 'Go to Student Portal', content: 'On the homepage, click the "Student Portal" button. This will take you to the login/registration page.' },
          { title: 'Register an Account', bullets: [ 'Click the "Register" tab', 'Enter your Gmail address - this will be used to login', 'Fill in Student ID, Full Name, Course, Year Level, and Section', 'Upload a profile photo', 'Create a password (minimum 6 characters)', 'Click "Create Account"' ] },
          { title: 'Wait for Admin Approval', content: 'After registering, you must wait for Admin approval before accessing the student dashboard. This is to verify that you are an enrolled ISU student.' },
          { title: 'Login and Use the System', content: 'Once approved, log in using your Gmail and password. You can access your trips and send emergency alerts from the student dashboard.' }
        ]
      },
      driver: {
        title: 'Driver Registration Guide',
        steps: [
          { title: 'Access Driver Registration', content: 'From the homepage click the "Driver Registration" button. You will be taken to the registration form for drivers.' },
          { title: 'Fill Personal Information', bullets: [ 'Full Name - Your full name', 'Email - Gmail address for login', 'Contact Number - Mobile number', 'Date of Birth - Your birth date', 'Profile Photo - Clear photo' ] },
          { title: 'Enter License and Vehicle Details', bullets: [ 'License Number - Driver\'s license number', 'License Type - Professional or Non-Professional', 'License Expiry - Expiration date', 'Tricycle Plate Number - Your plate number', 'Vehicle Details - Type, Model, Year' ] },
          { title: 'Download the QR Code', content: 'After registration you will see a unique QR Code. Download it and attach it to your tricycle so students can scan before boarding.' }
        ]
      },
      notes: [
        'Use your real information when registering. Fake accounts will be rejected.',
        'Do not share your password with others.',
        'For drivers, make sure your license and vehicle registration are current.',
        'The emergency alert system is for genuine emergencies only. Do not abuse it.'
      ],
      quick: { student: 'Student Portal', driver: 'Driver Registration', back: 'Back to Home' }
    },
    tl: {
      headerTitle: 'User Guide',
      subtitle: 'Mga Tagubilin sa Pagrehistro at Paggamit',
      intro: {
        title: 'Maligayang Pagdating sa ISU Safe Ride',
        paragraph: 'Ang ISU Safe Ride ay isang sistema na nagbibigay ng ligtas na transportasyon para sa mga estudyante ng Isabela State University. Sundan ang mga hakbang sa ibaba para makapag-register at magamit ang sistema.'
      },
      student: {
        title: 'Gabay sa Pagrehistro ng Estudyante',
        steps: [
          { title: 'Pumunta sa Student Portal', content: 'Sa homepage, i-click ang "Student Portal" button. Dadalhin ka nito sa login/registration page.' },
          { title: 'Mag-Register ng Account', bullets: [ 'I-click ang "Register" tab', 'Ilagay ang iyong Gmail address - ito ang gagamitin mo para mag-login', 'Punan ang Student ID, Full Name, Course, Year Level, at Section', 'Mag-upload ng profile photo', 'Gumawa ng password (minimum 6 characters)', 'I-click ang "Create Account"' ] },
          { title: 'Hintayin ang Admin Approval', content: 'Pagkatapos mag-register, kailangan mong hintayin ang approval ng Admin bago ka makapag-access sa student dashboard. Ito ay para ma-verify na ikaw ay tunay na estudyante ng ISU.' },
          { title: 'Mag-Login at Gamitin ang System', content: 'Kapag na-approve na, pwede ka nang mag-login gamit ang iyong Gmail at password. Ma-access mo na ang student dashboard kung saan mo makikita ang iyong trips at makakapag-send ng emergency alerts.' }
        ]
      },
      driver: {
        title: 'Gabay sa Pagrehistro ng Driver',
        steps: [
          { title: 'I-access ang Driver Registration', content: 'Sa homepage, i-click ang "Driver Registration" button. Dadalhin ka sa registration form para sa mga driver.' },
          { title: 'Punan ang Personal Information', bullets: [ 'Full Name - Buong pangalan', 'Email - Gmail address para sa login', 'Contact Number - Cellphone number', 'Date of Birth - Petsa ng kapanganakan', 'Profile Photo - Malinaw na larawan' ] },
          { title: 'Ilagay ang License at Vehicle Details', bullets: [ 'License Number - Numero ng driver\'s license', 'License Type - Professional, Non-Professional, etc.', 'License Expiry - Expiration date ng license', 'Tricycle Plate Number - Plate number ng tricycle', 'Vehicle Details - Type, Model, Year' ] },
          { title: 'I-download ang QR Code', content: 'Pagkatapos mag-register, makikita mo ang iyong unique QR Code. I-download ito at ilagay sa iyong tricycle para ma-scan ng mga estudyante kapag sumakay sila.' }
        ]
      },
      notes: [
        'Gamitin ang iyong tunay na impormasyon sa registration. Ang fake accounts ay ma-reject.',
        'Huwag ibahagi ang iyong password sa ibang tao.',
        'Para sa mga driver, siguraduhing updated ang iyong license at vehicle registration.',
        'Ang emergency alert system ay para lang sa tunay na emergency. Huwag abusuhin.'
      ],
      quick: { student: 'Student Portal', driver: 'Driver Register', back: 'Back to Home' }
    }
  };

  return (
    <div className="min-h-screen text-white relative overflow-hidden font-sans">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img src={campusBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#001209]/95 via-[#001209]/90 to-[#001209]/95" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-[#CCFF00]/20 bg-black/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate(-1)} 
                className="rounded-xl text-white hover:bg-white/10 hover:text-[#CCFF00]"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="bg-[#CCFF00] p-2 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.5)]">
                  <BookOpen className="h-5 w-5 text-[#004225]" />
                </div>
                <div>
                  <h1 className="text-xl font-black uppercase italic tracking-tight text-white">User Guide</h1>
                  <p className="text-xs text-[#CCFF00]/60 font-bold">Registration & Usage Instructions</p>
                </div>
              </div>
            </div>
            <div className="bg-[#CCFF00] p-1.5 rounded-lg shadow-lg">
              <img src={isuLogo} alt="ISU Logo" className="w-6 h-6 object-contain" />
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Introduction */}
        <Card className="bg-white/5 backdrop-blur-xl border-[#CCFF00]/20 mb-8">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-black uppercase italic text-white flex items-center gap-3">
              <HelpCircle className="h-7 w-7 text-[#CCFF00]" />
              {texts[lang].intro.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white/70 text-base leading-relaxed">{texts[lang].intro.paragraph}</p>
          </CardContent>
        </Card>

        {/* Student Registration Guide */}
        <Card className="bg-white/5 backdrop-blur-xl border-[#CCFF00]/20 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black uppercase text-[#CCFF00] flex items-center gap-3">
              <Users className="h-6 w-6" />
              {texts[lang].student.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible className="space-y-2">
              {texts[lang].student.steps.map((s: any, idx: number) => (
                <AccordionItem key={idx} value={`step-${idx}`} className="border border-white/10 rounded-xl px-4 bg-white/5">
                  <AccordionTrigger className="text-white font-bold text-base hover:text-[#CCFF00]">
                    <span className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#CCFF00] text-[#004225] flex items-center justify-center text-sm font-black">{idx + 1}</span>
                      {s.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 text-base leading-relaxed pl-10">
                    {s.content && <p>{s.content}</p>}
                    {s.bullets && (
                      <ul className="list-disc list-inside space-y-2">
                        {s.bullets.map((b: string, i: number) => (
                          <li key={i} dangerouslySetInnerHTML={{ __html: b.replace(/"/g, '"') }} />
                        ))}
                      </ul>
                    )}
                    {idx === 2 && (
                      <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg mt-3">
                        <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                        <p>{s.content}</p>
                      </div>
                    )}
                    {idx === 3 && (
                      <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg mt-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p>{s.content}</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Driver Registration Guide */}
        <Card className="bg-white/5 backdrop-blur-xl border-[#CCFF00]/20 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black uppercase text-[#CCFF00] flex items-center gap-3">
              <Car className="h-6 w-6" />
              {texts[lang].driver.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Accordion type="single" collapsible className="space-y-2">
              {texts[lang].driver.steps.map((s: any, idx: number) => (
                <AccordionItem key={`d-${idx}`} value={`d-step-${idx}`} className="border border-white/10 rounded-xl px-4 bg-white/5">
                  <AccordionTrigger className="text-white font-bold text-base hover:text-[#CCFF00]">
                    <span className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-[#CCFF00] text-[#004225] flex items-center justify-center text-sm font-black">{idx + 1}</span>
                      {s.title}
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="text-white/70 text-base leading-relaxed pl-10">
                    {s.content && <p>{s.content}</p>}
                    {s.bullets && (
                      <ul className="list-disc list-inside space-y-2">
                        {s.bullets.map((b: string, i: number) => (
                          <li key={i} dangerouslySetInnerHTML={{ __html: b.replace(/"/g, '"') }} />
                        ))}
                      </ul>
                    )}
                    {idx === 3 && (
                      <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/30 rounded-lg mt-3">
                        <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <p>{s.content}</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Important Notes */}
        <Card className="bg-white/5 backdrop-blur-xl border-red-500/30 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black uppercase text-red-400 flex items-center gap-3">
              <Shield className="h-6 w-6" />
              {lang === 'en' ? 'Important Notes' : 'Mahalagang Paalala'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-white/70 text-base">
              {texts[lang].notes.map((n: string, i: number) => (
                <li key={i} className="flex items-start gap-3">
                  {i < 3 ? (
                    <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <FileCheck className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                  )}
                  <span dangerouslySetInnerHTML={{ __html: n }} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button 
            onClick={() => navigate('/login?type=student')}
            className="h-14 bg-[#CCFF00] text-[#004225] font-black uppercase tracking-wider hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] rounded-xl"
          >
            <Users className="h-5 w-5 mr-2" />
            {texts[lang].quick.student}
          </Button>
          <Button 
            onClick={() => navigate('/driver-register')}
            className="h-14 bg-white/10 text-white border border-[#CCFF00]/30 font-black uppercase tracking-wider hover:bg-[#CCFF00] hover:text-[#004225] rounded-xl"
          >
            <Car className="h-5 w-5 mr-2" />
            {texts[lang].quick.driver}
          </Button>
          <Button 
            onClick={() => navigate(-1)}
            className="h-14 bg-white/10 text-white border border-white/20 font-black uppercase tracking-wider hover:bg-white/20 rounded-xl"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            {texts[lang].quick.back}
          </Button>
        </div>
      </main>
      {/* Floating draggable language selector widget (globe icon, click to expand) */}
      <DraggableLangWidget
        lang={lang}
        setLang={setLang}
      />

    </div>
  );
};

export default Guide;

// Draggable language widget component
function DraggableLangWidget({ lang, setLang }: { lang: 'en' | 'tl'; setLang: (l: 'en' | 'tl') => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0, left: 0, top: 0 });
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ left: 0, top: 0 });

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const size = 64;
    setPos({ left: Math.max(12, w - size - 24), top: Math.max(12, h - size - 24) });
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    movedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY, left: pos.left, top: pos.top };

    const onMove = (ev: PointerEvent) => {
      if (!draggingRef.current) return;
      const dx = ev.clientX - startRef.current.x;
      const dy = ev.clientY - startRef.current.y;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) movedRef.current = true;
      const newLeft = Math.max(8, Math.min(window.innerWidth - 64, startRef.current.left + dx));
      const newTop = Math.max(8, Math.min(window.innerHeight - 64, startRef.current.top + dy));
      setPos({ left: newLeft, top: newTop });
    };

    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!movedRef.current) {
        setOpen(o => !o);
      }
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };

  const widgetStyle: React.CSSProperties = {
    position: 'fixed',
    left: pos.left,
    top: pos.top,
    zIndex: 9999,
    touchAction: 'none',
  };

  return (
    <div ref={ref} style={widgetStyle}>
      <div className="flex flex-col items-center">
        <button
          aria-label="Language widget"
          onPointerDown={onPointerDown}
          className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center shadow-2xl text-white"
        >
          <Globe className="h-6 w-6 text-[#CCFF00]" />
        </button>
      </div>

      {/* Expanded selector */}
      {open && (
        <div className="mt-2 bg-black/60 backdrop-blur-md p-2 rounded-lg shadow-2xl flex flex-col items-center">
          <button
            onClick={() => { setLang('en'); setOpen(false); }}
            className={`px-3 py-1 rounded-md font-bold mb-1 ${lang === 'en' ? 'bg-white/10 text-[#CCFF00]' : 'bg-transparent text-white/60'}`}
          >
            English
          </button>
          <button
            onClick={() => { setLang('tl'); setOpen(false); }}
            className={`px-3 py-1 rounded-md font-bold ${lang === 'tl' ? 'bg-white/10 text-[#CCFF00]' : 'bg-transparent text-white/60'}`}
          >
            Tagalog
          </button>
        </div>
      )}
    </div>
  );
}
