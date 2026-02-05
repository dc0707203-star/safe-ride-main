import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Lock, User, Phone, Mail, Upload, Calendar, FileText, 
  Truck, Camera, ChevronRight, Loader2, CreditCard, ShieldCheck, Wrench 
} from "lucide-react";

// --- Constants ---
const VALID_ID_TYPES = [
  "Driver's License", "Passport", "UMID", "PhilHealth ID", 
  "SSS ID", "Postal ID", "Voter's ID", "PRC ID", "National ID",
];

const LICENSE_TYPES = ["Professional", "Non-Professional"];
const VEHICLE_TYPES = ["Tricycle", "Motorcycle", "Car", "Van", "Jeepney"];

type DriverAuthPanelProps = {
  embedded?: boolean;
};

const DriverAuthPanel = ({ embedded = false }: DriverAuthPanelProps) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Login state
  const [loginData, setLoginData] = useState({ email: "", password: "" });

  // Register state
  const [registerData, setRegisterData] = useState({
    fullName: "", dateOfBirth: "", contactNumber: "", email: "",
    password: "", confirmPassword: "", validIdType: "", idNumber: "",
    licenseNumber: "", licenseType: "", licenseExpiry: "",
    vehicleType: "", plateNumber: "", vehicleModel: "", vehicleYear: "",
  });

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateQRCode = (driverId: string, plateNumber: string) => {
    return `ISU-DRIVER-${plateNumber}-${driverId}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      if (error) throw error;

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: driverProfile } = await supabase
          .from("drivers").select("id").eq("user_id", session.user.id).single();
        if (!driverProfile) throw new Error("No driver profile found");
      }

      toast.success("Login successful!");
      navigate("/driver-dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Failed to login");
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
    if (!photoFile) {
      toast.error("Please upload a profile photo");
      return;
    }

    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
      });
      if (authError) throw authError;
      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to create user");

      // Upload Photo
      const fileName = `driver-${userId}-${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, photoFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("profile-photos").getPublicUrl(fileName);

      // Create Driver Record
      const { data: driverData, error: driverError } = await supabase
        .from("drivers")
        .insert({
          user_id: userId, full_name: registerData.fullName, email: registerData.email,
          contact_number: registerData.contactNumber, date_of_birth: registerData.dateOfBirth,
          valid_id_type: registerData.validIdType, id_number: registerData.idNumber,
          license_number: registerData.licenseNumber, license_type: registerData.licenseType,
          license_expiry: registerData.licenseExpiry, vehicle_type: registerData.vehicleType,
          tricycle_plate_number: registerData.plateNumber, vehicle_model: registerData.vehicleModel,
          vehicle_year: registerData.vehicleYear, photo_url: publicUrl,
          qr_code: "", // Will update after getting driver ID
        } as any)
        .select()
        .single();
      if (driverError) throw driverError;
      
      // Update QR code with actual driver ID
      if (driverData?.id) {
        const qrCode = generateQRCode(driverData.id, registerData.plateNumber);
        await supabase
          .from("drivers")
          .update({ qr_code: qrCode })
          .eq("id", driverData.id);
      }

      await supabase.from("user_roles").insert({ user_id: userId, role: "driver" });

      toast.success("Registration successful!");
      toast.info("You can now login with your credentials");
      setMode("login");
      setLoginData({ email: registerData.email, password: "" });
      // Reset Form State logic here if needed...
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const wrapperClass = embedded
    ? "w-full h-full min-h-0 relative"
    : "w-full max-w-md mx-auto animate-in fade-in zoom-in duration-300";

  const cardClass = embedded
    ? "w-full h-full min-h-0 bg-transparent border-none shadow-none rounded-none flex flex-col overflow-hidden relative z-10"
    : "w-full rounded-3xl shadow-2xl border-none bg-white flex flex-col overflow-hidden relative z-10";

  return (
    <div className={wrapperClass}>
      <Card className={cardClass}>
        
        {/* --- Segmented Control for md+ --- */}
        <div className="p-2 pb-0 bg-muted/30 hidden md:block">
          <div className="relative bg-slate-100 p-1 rounded-2xl flex h-14">
            <div className={`absolute top-1 left-1 w-[calc(50%-4px)] h-[calc(100%-8px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${mode === 'register' ? 'translate-x-[100%]' : 'translate-x-0'}`} />
            <button type="button" onClick={() => setMode('login')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'login' ? 'text-[#004d25]' : 'text-slate-600 md:text-slate-400 hover:text-slate-600'}`}><Lock className="h-4 w-4" /> Sign In</button>
            <button type="button" onClick={() => setMode('register')} className={`relative z-10 flex-1 flex items-center justify-center gap-2 text-sm font-bold rounded-xl transition-all duration-300 ${mode === 'register' ? 'text-[#004d25]' : 'text-slate-600 md:text-slate-400 hover:text-slate-600'}`}><Truck className="h-4 w-4" /> Register</button>
          </div>
        </div>

        {/* Mobile Header & Tabs */}
        <div className="md:hidden px-6 pt-6 text-center">
          <div className="flex border-b border-slate-100 -mx-6">
            <button onClick={() => setMode('login')} className={`flex-1 py-4 text-center font-bold ${mode === 'login' ? 'text-[#004d25] border-b-2 border-[#004d25]' : 'text-slate-600'}`}>Sign In</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-4 text-center font-bold ${mode === 'register' ? 'text-[#004d25] border-b-2 border-[#004d25]' : 'text-slate-600'}`}>Register</button>
          </div>
        </div>

        {/* --- LOGIN VIEW --- */}
        {mode === "login" ? (
          <div className="px-5 py-6 md:px-6 md:py-8 flex-1 flex flex-col justify-start md:justify-center">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Welcome Back!</h2>
              <p className="text-sm text-slate-700 md:text-slate-500">Enter your email and password to access driver portal.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="loginEmail" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 md:text-slate-400 group-focus-within:text-[#004d25] transition-colors z-10" />
                  <Input
                    id="loginEmail"
                    type="email"
                    placeholder="driver@example.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    className="pl-11 h-12 rounded-xl border-slate-200 bg-white focus-visible:ring-2 focus-visible:ring-[#004d25]/20 focus-visible:border-[#004d25] transition-all text-base"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <Label htmlFor="loginPassword" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</Label>
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3.5 h-5 w-5 text-slate-500 md:text-slate-400 group-focus-within:text-[#004d25] transition-colors z-10" />
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
                disabled={loading}
                className="w-full h-12 rounded-full text-base font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg active:scale-[0.98] transition-all" 
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign In"}
              </Button>
              <div className="pt-4 text-center">
                <p className="text-sm text-slate-600">New driver?{' '}<button type="button" onClick={() => setMode('register')} className="text-[#004d25] font-bold hover:underline">Create an account</button></p>
              </div>
            </form>
          </div>
        ) : (
          // REGISTER VIEW
          <div className="flex-1 min-h-0 overflow-y-auto bg-white md:bg-transparent relative">
            {/* Photo Header */}
            <div className="pt-8 pb-6 px-6 flex flex-col items-center bg-gradient-to-b from-blue-50/50 to-transparent">
              <div className="relative group cursor-pointer">
                <div className={`w-28 h-28 rounded-full border-4 border-white shadow-xl flex items-center justify-center overflow-hidden transition-all duration-300 ${photoPreview ? '' : 'bg-slate-50'}`}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-slate-500/50" />
                  )}
                </div>
                <Label htmlFor="photoUpload" className="absolute bottom-0 right-0 p-2.5 bg-[#004d25] rounded-full text-white shadow-lg hover:bg-[#00391c] transition-colors border-2 border-white">
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
              <div className="mt-4 text-center">
                <h2 className="text-xl font-bold text-slate-800">Driver Registration</h2>
                <p className="text-xs text-slate-500 mt-1">Set up your driver profile</p>
              </div>
            </div>

            <form onSubmit={handleRegister} className="px-6 pb-8 space-y-6">
              
              {/* Section: Personal Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-blue-700 rounded-full"></span> Personal Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400" />
                      <Input
                        placeholder="Juan Dela Cruz"
                        value={registerData.fullName}
                        onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-white border-slate-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="juan@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-muted/20 border-muted"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Contact</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="0912..."
                        value={registerData.contactNumber}
                        onChange={(e) => setRegisterData({ ...registerData, contactNumber: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-muted/20 border-muted"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Date of Birth</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        value={registerData.dateOfBirth}
                        onChange={(e) => setRegisterData({ ...registerData, dateOfBirth: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-muted/20 border-muted"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Identification */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-blue-700 rounded-full"></span> Verification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Valid ID Type</Label>
                    <Select value={registerData.validIdType} onValueChange={(value) => setRegisterData({ ...registerData, validIdType: value })}>
                      <SelectTrigger className="h-10 rounded-lg bg-muted/20 border-muted">
                        <SelectValue placeholder="Select ID" />
                      </SelectTrigger>
                      <SelectContent>
                        {VALID_ID_TYPES.map((type) => (
                          <SelectItem key={type} value={type} className="text-sm">{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">ID Number</Label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="1234567890"
                        value={registerData.idNumber}
                        onChange={(e) => setRegisterData({ ...registerData, idNumber: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-muted/20 border-muted"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: License */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-blue-700 rounded-full"></span> Driver's License
                </h3>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground ml-1">License Number</Label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="D01-23-456789"
                      value={registerData.licenseNumber}
                      onChange={(e) => setRegisterData({ ...registerData, licenseNumber: e.target.value })}
                      className="pl-9 h-10 rounded-lg bg-muted/20 border-muted"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Type</Label>
                    <Select value={registerData.licenseType} onValueChange={(value) => setRegisterData({ ...registerData, licenseType: value })}>
                      <SelectTrigger className="h-10 rounded-lg bg-muted/20 border-muted">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Expiry</Label>
                    <Input
                      type="date"
                      value={registerData.licenseExpiry}
                      onChange={(e) => setRegisterData({ ...registerData, licenseExpiry: e.target.value })}
                      className="h-10 rounded-lg bg-muted/20 border-muted"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section: Vehicle */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-blue-700 rounded-full"></span> Vehicle Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Type</Label>
                    <Select value={registerData.vehicleType} onValueChange={(value) => setRegisterData({ ...registerData, vehicleType: value })}>
                      <SelectTrigger className="h-10 rounded-lg bg-muted/20 border-muted">
                        <SelectValue placeholder="Vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Plate No.</Label>
                    <div className="relative">
                      <Truck className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="ABC-1234"
                        value={registerData.plateNumber}
                        onChange={(e) => setRegisterData({ ...registerData, plateNumber: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-muted/20 border-muted"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Model</Label>
                    <div className="relative">
                      <Wrench className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Honda Wave"
                        value={registerData.vehicleModel}
                        onChange={(e) => setRegisterData({ ...registerData, vehicleModel: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-muted/20 border-muted"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Year</Label>
                    <Input
                      placeholder="2023"
                      value={registerData.vehicleYear}
                      onChange={(e) => setRegisterData({ ...registerData, vehicleYear: e.target.value })}
                      className="h-10 rounded-lg bg-muted/20 border-muted"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Security */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-blue-700 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-4 h-[2px] bg-blue-700 rounded-full"></span> Security
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground ml-1">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400" />
                      <Input
                        type="password"
                        placeholder="Min. 6 chars"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-white border-slate-200"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600 ml-1">Confirm</Label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-slate-500 md:text-slate-400" />
                      <Input
                        type="password"
                        placeholder="Repeat password"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        className="pl-9 h-10 rounded-lg bg-white border-slate-200"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={loading}
                className="w-full h-11 rounded-full text-base font-bold bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-lg active:scale-[0.98] transition-all mt-4" 
              >
                {loading ? (
                  <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Creating Account...</div>
                ) : (
                  <span className="flex items-center gap-2">Complete Registration <ChevronRight className="h-4 w-4" /></span>
                )}
              </Button>
              
              <div className="pt-2 text-center">
                <p className="text-sm text-muted-foreground">
                  Already registered?{' '}
                  <button type="button" onClick={() => setMode("login")} className="text-blue-600 font-semibold hover:underline">
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DriverAuthPanel;
