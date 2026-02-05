
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { resolvePrimaryRole } from "@/lib/roles";
import { IdCard, Lock, User, Phone, MapPin, Upload, GraduationCap, Mail, ChevronRight, Loader2, Camera } from "lucide-react";

// --- Constants ---
const COURSES = [
  "BS Information Technology", "BS Computer Science", "BS Information Systems",
  "BS Computer Engineering", "BS Electronics Engineering", "BS Electrical Engineering",
  "BS Civil Engineering", "BS Mechanical Engineering", "BS Agriculture",
  "BS Forestry", "BS Fisheries", "BS Environmental Science", "BS Biology",
  "BS Chemistry", "BS Mathematics", "BS Nursing", "BS Midwifery",
  "BS Pharmacy", "BS Medical Technology", "BS Criminology",
  "BS Education - Elementary", "BS Education - Secondary", "BS Business Administration",
  "BS Accountancy", "BS Hospitality Management", "BS Tourism Management",
  "BS Social Work", "BA Communication", "BA Political Science", "Bachelor of Laws",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const SECTIONS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

type StudentAuthPanelProps = {
  embedded?: boolean;
};

const StudentAuthPanel = ({ embedded = false }: StudentAuthPanelProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  const [loginData, setLoginData] = useState({
    studentId: "",
    password: "",
  });
  
  const [registerData, setRegisterData] = useState({
    studentId: "",
    fullName: "",
    email: "",
    course: "",
    yearLevel: "",
    section: "",
    contactNumber: "",
    address: "",
    password: "",
    confirmPassword: "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.studentId,
        password: loginData.password,
      });

      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) throw new Error('Missing session');

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (rolesError) throw rolesError;

      const roles = (rolesData ?? []).map((r: any) => r.role);
      const primaryRole = resolvePrimaryRole(roles);

      if (primaryRole !== 'student') {
        await signOut();
        toast.error('Hindi student ang account na ito.');
        return;
      }

      toast.success('Successfully logged in!');
      if (primaryRole === 'admin') navigate('/admin');
      else if (primaryRole === 'rescue_admin') navigate('/rescue-admin');
      else if (primaryRole === 'pnp') navigate('/pnp');
      else if (primaryRole === 'rescue') navigate('/rescue');
      else if (primaryRole === 'driver') navigate('/driver-dashboard');
      else navigate('/student');
    } catch (error: any) {
      toast.error(error.message || 'Failed to log in');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!registerData.email) {
      toast.error("Email is required");
      return;
    }
    
    setLoading(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/student`,
          data: { full_name: registerData.fullName }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      const userId = authData.user.id;
      let photoUrl = "";

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${userId}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, photoFile, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
          photoUrl = data.publicUrl;
        }
      }

      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: userId,
          student_id_number: registerData.studentId,
          full_name: registerData.fullName,
          course: registerData.course,
          year_level: registerData.yearLevel,
          section: registerData.section,
          contact_number: registerData.contactNumber,
          address: registerData.address,
          photo_url: photoUrl,
          is_registered: true,
          is_active: false,
          email: registerData.email,
        } as any);

      if (studentError) throw studentError;

      await supabase.from('user_roles').insert({ user_id: userId, role: 'student' });

      toast.success("Account created successfully!");
      setMode('login');
      setLoginData({ studentId: registerData.email, password: "" }); 
      
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message?.includes('already registered')) {
        toast.error("This Email/ID is already registered.");
        setMode('login');
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  const wrapperClass = embedded
    ? "w-full h-full min-h-0 relative"
    : "min-h-screen w-full bg-slate-50 flex flex-col md:justify-center md:items-center md:p-4 relative overflow-hidden";

  const cardClass = embedded
    ? "w-full h-full min-h-0 bg-transparent border-none shadow-none rounded-none flex flex-col relative z-10"
    : "w-[92%] max-w-md md:max-w-[480px] mx-auto my-6 md:my-0 rounded-2xl md:rounded-3xl shadow-none md:shadow-2xl border-none bg-white flex flex-col overflow-hidden relative z-10";

  return (
    <div className={wrapperClass}>
      {!embedded && (
        <>
          {/* --- Decorative Background Blobs (Stays on bg-slate-50, visible outside card) --- */}
          <div className="absolute top-0 left-0 w-72 h-72 bg-green-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full mix-blend-multiply filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2"></div>
        </>
      )}

      {/* --- Main Card (Solid White) --- */}
      <Card className={cardClass}>
        {!embedded ? (
          <>
            {/* --- Sticky Header & Nav (md+ only). Mobile header and tabs below --- */}
            <div className="pt-8 pb-4 px-6 border-b border-slate-100 bg-white sticky top-0 z-20 hidden md:block">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#004d25] to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-900/20">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <span className="font-black text-[#004d25] text-xl tracking-tight leading-none">SafeRide</span>
                      <span className="block text-[10px] font-bold text-green-600 uppercase tracking-widest">ISU Access</span>
                    </div>
                 </div>
              </div>

              {/* Toggle Switch for md+ */}
              <div className="relative bg-slate-100 p-1 rounded-2xl h-14 hidden md:flex">
                <div 
                  className={`absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${mode === 'register' ? 'translate-x-[100%]' : 'translate-x-0'}`}
                />
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                    mode === 'login' ? 'text-[#004d25]' : 'text-slate-600 md:text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <User className="h-4 w-4" /> Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                    mode === 'register' ? 'text-[#004d25]' : 'text-slate-600 md:text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <GraduationCap className="h-4 w-4" /> Register
                </button>
              </div>
            </div>

            {/* Mobile Header & Tabs */}
            <div className="md:hidden px-6 pt-6 text-center">
              <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#004d25] to-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg mb-3">
                <User className="h-5 w-5" />
              </div>
              <div className="flex border-b border-slate-100 -mx-6">
                <button onClick={() => setMode('login')} className={`flex-1 py-4 text-center font-bold ${mode === 'login' ? 'text-[#004d25] border-b-2 border-[#004d25]' : 'text-slate-600'}`}>Sign In</button>
                <button onClick={() => setMode('register')} className={`flex-1 py-4 text-center font-bold ${mode === 'register' ? 'text-[#004d25] border-b-2 border-[#004d25]' : 'text-slate-600'}`}>Register</button>
              </div>
            </div>
          </>
        ) : (
          <div className="px-4 pt-4">
            <div className="flex border-b border-slate-100 -mx-4">
              <button
                onClick={() => setMode('login')}
                className={`flex-1 py-3 text-center font-bold ${mode === 'login' ? 'text-[#004d25] border-b-2 border-[#004d25]' : 'text-slate-600'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('register')}
                className={`flex-1 py-3 text-center font-bold ${mode === 'register' ? 'text-[#004d25] border-b-2 border-[#004d25]' : 'text-slate-600'}`}
              >
                Register
              </button>
            </div>
          </div>
        )}

        {/* --- LOGIN VIEW --- */}
        {mode === 'login' ? (
          <div className="px-5 py-6 md:px-6 md:py-8 flex-1 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back!</h2>
              <p className="text-sm text-slate-700 md:text-slate-500">Enter your email and password to access student portal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="loginEmail" className="text-xs font-bold text-slate-700 uppercase tracking-wide ml-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 md:text-slate-400 group-focus-within:text-[#004d25] transition-colors z-10" />
                  {/* Solid Input Background */}
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="student@isu.edu.ph"
                    value={loginData.studentId}
                    onChange={(e) => setLoginData({ ...loginData, studentId: e.target.value })}
                    className="pl-11 h-12 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] transition-all text-base"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="loginPassword" className="text-xs font-bold text-slate-700 uppercase tracking-wide">Password</Label>
                  <button type="button" className="text-xs font-bold text-green-700 hover:text-green-800 transition-colors">
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 md:text-slate-400 group-focus-within:text-[#004d25] transition-colors z-10" />
                  {/* Solid Input Background */}
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="•••••"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-11 h-12 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] transition-all text-base"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-full text-base font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg active:scale-[0.98] transition-all" 
                disabled={loading}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
              <div className="pt-4 text-center">
                <p className="text-sm text-slate-600">New student?{' '}<button type="button" onClick={() => setMode('register')} className="text-[#004d25] font-bold hover:underline">Create an account</button></p>
              </div>
            </form>
          </div>
        ) : (
          
          /* --- REGISTER VIEW (Solid Inputs) --- */
          <div className="flex-1 min-h-0 overflow-y-auto bg-white relative">
            <div className="pt-6 pb-16 px-5 md:pt-8 md:pb-24 md:px-6 space-y-8">
              
              {/* Profile Upload */}
              <div className="flex flex-col items-center pb-6 border-b border-slate-100">
                <div className="relative group mb-4 cursor-pointer">
                  <div className={`w-28 h-28 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-[#004d25] group-hover:bg-green-50 ${photoPreview ? 'border-solid border-[#004d25]' : ''}`}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="h-8 w-8 text-slate-500 md:text-slate-400 group-hover:text-[#004d25] transition-colors" />
                        <span className="text-[10px] font-bold text-slate-600 md:text-slate-400 uppercase tracking-widest">Photo</span>
                      </div>
                    )}
                  </div>
                  <Label htmlFor="photoUpload" className="absolute bottom-0 right-0 p-2.5 bg-[#004d25] rounded-xl text-white shadow-lg hover:bg-[#00391c] transition-all hover:scale-110 border-4 border-white cursor-pointer">
                    <Camera className="h-4 w-4" />
                    <Input
                      id="photoUpload"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                  </Label>
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-slate-800">Student Profile</h2>
                  <p className="text-sm text-slate-700 md:text-slate-500 mt-1">Upload a clear photo for your ID</p>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-8">
                
                {/* Section 1: Personal */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#004d25] rounded-full"></div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Personal Info</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 md:text-slate-500 ml-0.5">Student ID</Label>
                      <div className="relative group">
                        <IdCard className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400 z-10" />
                        <Input
                          type="text"
                          placeholder="2024-12345"
                          value={registerData.studentId}
                          onChange={(e) => setRegisterData({ ...registerData, studentId: e.target.value })}
                          className="pl-9 h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 ml-0.5">Full Name</Label>
                      <div className="relative group">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400 z-10" />
                        <Input
                          type="text"
                          placeholder="Juan Dela Cruz"
                          value={registerData.fullName}
                          onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                          className="pl-9 h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 ml-0.5">Email</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400 z-10" />
                      <Input
                        type="email"
                        placeholder="juan.d@gmail.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="pl-9 h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Academic */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#004d25] rounded-full"></div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Academic</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 ml-0.5">Course</Label>
                    <Select value={registerData.course} onValueChange={(value) => setRegisterData({ ...registerData, course: value })}>
                      <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm">
                        <SelectValue placeholder="Select your program" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {COURSES.map((course) => (
                          <SelectItem key={course} value={course} className="text-sm">{course}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 ml-0.5">Year</Label>
                      <Select value={registerData.yearLevel} onValueChange={(value) => setRegisterData({ ...registerData, yearLevel: value })}>
                        <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm">
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {YEAR_LEVELS.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 ml-0.5">Section</Label>
                      <Select value={registerData.section} onValueChange={(value) => setRegisterData({ ...registerData, section: value })}>
                        <SelectTrigger className="h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm">
                          <SelectValue placeholder="Sec" />
                        </SelectTrigger>
                        <SelectContent>
                          {SECTIONS.map((section) => (
                            <SelectItem key={section} value={section}>{section}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Section 3: Security */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-[#004d25] rounded-full"></div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Security</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 ml-0.5">Mobile</Label>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400 z-10" />
                        <Input
                          type="tel"
                          placeholder="0912..."
                          value={registerData.contactNumber}
                          onChange={(e) => setRegisterData({ ...registerData, contactNumber: e.target.value })}
                          className="pl-9 h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-500 ml-0.5">Password</Label>
                      <div className="relative group">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400 z-10" />
                        <Input
                          type="password"
                          placeholder="••••"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                          className="pl-9 h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 ml-0.5">Address</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400 z-10" />
                      <Input
                        type="text"
                        placeholder="Barangay, City"
                        value={registerData.address}
                        onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                        className="pl-9 h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-500 ml-0.5">Confirm Password</Label>
                    <div className="relative group">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400 z-10" />
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="pl-9 h-10 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-full text-base font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      Complete Registration <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="pt-4 text-center border-t border-slate-50">
                  <p className="text-sm text-slate-700 md:text-slate-500">
                    Already have an account?{' '}
                    <button 
                      type="button" 
                      onClick={() => setMode('login')}
                      className="text-[#004d25] font-bold hover:underline"
                    >
                      Sign In
                    </button>
                  </p>
                </div>
              </form>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default StudentAuthPanel;
