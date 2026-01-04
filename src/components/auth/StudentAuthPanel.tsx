import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signOut } from "@/lib/auth";
import { resolvePrimaryRole } from "@/lib/roles";
import { IdCard, Lock, User, Phone, MapPin, GraduationCap, Upload } from "lucide-react";

const StudentAuthPanel = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  // Login state
  const [loginData, setLoginData] = useState({
    studentId: "",
    password: "",
  });
  
  // Register state
  const [registerData, setRegisterData] = useState({
    studentId: "",
    fullName: "",
    course: "",
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
      const email = `${loginData.studentId.replace(/[^a-zA-Z0-9]/g, '')}@student.isu.edu.ph`;

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid Student ID or Password');
        }
        throw error;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

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
      navigate('/student');
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
    
    setLoading(true);

    try {
      const email = `${registerData.studentId.replace(/[^a-zA-Z0-9]/g, '')}@student.isu.edu.ph`;

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: registerData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/student`,
          data: {
            full_name: registerData.fullName,
          }
        }
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("Failed to create account");

      const userId = authData.user.id;
      let photoUrl = "";

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${userId}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, photoFile, { upsert: true });

        if (!uploadError) {
          const { data } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(filePath);
          photoUrl = data.publicUrl;
        }
      }

      // Insert student data
      const { error: studentError } = await supabase
        .from('students')
        .insert({
          user_id: userId,
          student_id_number: registerData.studentId,
          full_name: registerData.fullName,
          course: registerData.course,
          contact_number: registerData.contactNumber,
          address: registerData.address,
          photo_url: photoUrl,
          is_registered: true,
          is_active: false,
        });

      if (studentError) throw studentError;

      // Add student role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: userId,
          role: 'student',
        });

      if (roleError) {
        console.error('Role assignment error:', roleError);
        // Continue anyway, role might be assigned by trigger
      }

      toast.success("Account created successfully!");
      toast.info("You can now login with your Student ID and password");
      
      // Switch to login mode
      setMode('login');
      setLoginData({
        studentId: registerData.studentId,
        password: "",
      });
      
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.message?.includes('already registered')) {
        toast.error("This Student ID is already registered. Please login instead.");
        setMode('login');
      } else {
        toast.error(error.message || "Failed to create account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full border-0 bg-card/80 backdrop-blur shadow-xl rounded-2xl overflow-hidden">
      {/* Mode Switch */}
      <div className="flex border-b border-border">
        <button
          type="button"
          onClick={() => setMode('login')}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            mode === 'login'
              ? 'text-green-700 bg-green-50 border-b-2 border-green-600'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode('register')}
          className={`flex-1 py-4 text-sm font-semibold transition-all ${
            mode === 'register'
              ? 'text-green-700 bg-green-50 border-b-2 border-green-600'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
          }`}
        >
          Register
        </button>
      </div>

      {mode === 'login' ? (
        /* LOGIN FORM */
        <>
          <CardHeader className="pt-6 pb-4">
            <CardTitle className="text-xl font-bold text-foreground text-center">
              Welcome Back!
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center text-sm">
              Enter your Student ID and password to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="loginStudentId" className="text-sm font-medium">Student ID</Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="loginStudentId"
                    type="text"
                    placeholder="e.g., 2024-12345"
                    value={loginData.studentId}
                    onChange={(e) => setLoginData({ ...loginData, studentId: e.target.value })}
                    className="pl-10 h-11 rounded-xl"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="loginPassword" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="loginPassword"
                    type="password"
                    placeholder="Enter your password"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="pl-10 h-11 rounded-xl"
                    required
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </div>
                ) : "Sign In"}
              </Button>

              <p className="text-sm text-center text-muted-foreground pt-2">
                New student?{' '}
                <button 
                  type="button" 
                  onClick={() => setMode('register')}
                  className="text-green-600 font-semibold hover:underline"
                >
                  Create an account
                </button>
              </p>
            </form>
          </CardContent>
        </>
      ) : (
        /* REGISTER FORM */
        <>
          <CardHeader className="pt-6 pb-2">
            <div className="flex justify-center mb-3">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center overflow-hidden border-3 border-white shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-green-600" />
                  )}
                </div>
                <Label htmlFor="photo" className="absolute -bottom-1 -right-1 cursor-pointer">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg hover:shadow-xl transition-shadow">
                    <Upload className="h-3.5 w-3.5 text-white" />
                  </div>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </Label>
              </div>
            </div>
            <CardTitle className="text-xl font-bold text-foreground text-center">
              Create Account
            </CardTitle>
            <CardDescription className="text-muted-foreground text-center text-sm">
              Fill in your details to register
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="regStudentId" className="text-xs font-medium">Student ID *</Label>
                  <div className="relative">
                    <IdCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="regStudentId"
                      type="text"
                      placeholder="2024-12345"
                      value={registerData.studentId}
                      onChange={(e) => setRegisterData({ ...registerData, studentId: e.target.value })}
                      className="pl-9 h-10 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="regFullName" className="text-xs font-medium">Full Name *</Label>
                  <div className="relative">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="regFullName"
                      type="text"
                      placeholder="Juan Dela Cruz"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                      className="pl-9 h-10 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="regCourse" className="text-xs font-medium">Course *</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="regCourse"
                      type="text"
                      placeholder="BSIT"
                      value={registerData.course}
                      onChange={(e) => setRegisterData({ ...registerData, course: e.target.value })}
                      className="pl-9 h-10 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="regContact" className="text-xs font-medium">Contact *</Label>
                  <div className="relative">
                    <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="regContact"
                      type="tel"
                      placeholder="09XXXXXXXXX"
                      value={registerData.contactNumber}
                      onChange={(e) => setRegisterData({ ...registerData, contactNumber: e.target.value })}
                      className="pl-9 h-10 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="regAddress" className="text-xs font-medium">Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="regAddress"
                    type="text"
                    placeholder="Barangay, Municipality, Province"
                    value={registerData.address}
                    onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                    className="pl-9 h-10 rounded-xl text-sm"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="regPassword" className="text-xs font-medium">Password *</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="regPassword"
                      type="password"
                      placeholder="Min. 6 chars"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      className="pl-9 h-10 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="regConfirmPassword" className="text-xs font-medium">Confirm *</Label>
                  <div className="relative">
                    <Lock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="regConfirmPassword"
                      type="password"
                      placeholder="Confirm password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      className="pl-9 h-10 rounded-xl text-sm"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 rounded-xl text-base font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 mt-2" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating Account...
                  </div>
                ) : (
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Create Account
                  </span>
                )}
              </Button>

              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <button 
                  type="button" 
                  onClick={() => setMode('login')}
                  className="text-green-600 font-semibold hover:underline"
                >
                  Sign in
                </button>
              </p>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );
};

export default StudentAuthPanel;