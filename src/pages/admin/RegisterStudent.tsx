import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, User, Sparkles, GraduationCap, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import isuLogo from "@/assets/isu-logo.png";
import campusBg from "@/assets/campus-bg.jpeg";

const RegisterStudent = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  
  const [formData, setFormData] = useState({
    studentIdNumber: "",
    fullName: "",
    course: "",
    address: "",
    contactNumber: "",
    password: "",
  });

  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
    setGeneratedPassword(password);
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.password || formData.password.length < 6) {
      toast.error("Password must be at least 6 characters. Click 'Generate' to create one.");
      return;
    }
    
    setLoading(true);

    try {
      const studentEmail = `${formData.studentIdNumber.replace(/[^a-zA-Z0-9]/g, '')}@student.isu.edu.ph`;

      const { data: authData, error: authError } = await supabase.functions.invoke('create-student-account', {
        body: {
          email: studentEmail,
          password: formData.password,
          fullName: formData.fullName,
        }
      });

      if (authError) throw authError;
      if (authData.error) throw new Error(authData.error);

      const userId = authData.user.id;
      let photoUrl = "";

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${userId}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, photoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        
        photoUrl = data.publicUrl;
      }

      const { error: studentError } = await supabase
        .from('students' as unknown)
        .upsert({
          user_id: userId,
          student_id_number: formData.studentIdNumber,
          full_name: formData.fullName,
          course: formData.course,
          address: formData.address,
          contact_number: formData.contactNumber,
          photo_url: photoUrl,
          is_registered: true,
        }, {
          onConflict: 'user_id'
        });

      if (studentError) throw studentError;

      const { error: roleError } = await supabase.functions.invoke('assign-student-role', {
        body: { userId }
      });

      if (roleError) throw roleError;

      toast.success("Student registered successfully!");
      toast.info(`Student ID: ${formData.studentIdNumber}\nPassword: ${formData.password}`, {
        duration: 10000,
        description: "Give these credentials to the student"
      });
      
      navigate('/admin/students');
    } catch (error: unknown) {
      console.error('Registration error:', error);
      toast.error(error.message || "Failed to register student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      {/* Header */}
      <header className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Register Student</h1>
                <p className="text-xs text-muted-foreground">Create new student account</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-6 max-w-2xl">
        <Card className="border border-white/20 shadow-2xl bg-white/10 backdrop-blur-xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-green-600" />
                  )}
                </div>
                <Label htmlFor="photo" className="absolute -bottom-2 -right-2 cursor-pointer">
                  <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg hover:shadow-xl transition-shadow">
                    <Upload className="h-4 w-4 text-white" />
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
            <CardTitle className="text-xl">Student Information</CardTitle>
            <CardDescription>Fill in all required details below</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-sm font-medium">Student ID *</Label>
                  <Input
                    id="studentId"
                    required
                    value={formData.studentIdNumber}
                    onChange={(e) => setFormData({ ...formData, studentIdNumber: e.target.value })}
                    placeholder="e.g., 2024-12345"
                    className="h-11 rounded-xl border-border/50 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Juan Dela Cruz"
                    className="h-11 rounded-xl border-border/50 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course" className="text-sm font-medium">Course *</Label>
                  <Input
                    id="course"
                    required
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    placeholder="BS Computer Science"
                    className="h-11 rounded-xl border-border/50 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-sm font-medium">Contact Number *</Label>
                  <Input
                    id="contact"
                    type="tel"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="09XX XXX XXXX"
                    className="h-11 rounded-xl border-border/50 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">Address *</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Barangay, Municipality, Province"
                  className="h-11 rounded-xl border-border/50 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Password *
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter or generate password"
                    className="h-11 rounded-xl border-border/50 focus:border-green-500"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={generatePassword}
                    className="h-11 rounded-xl px-4 gap-2 border-green-200 hover:bg-green-50 hover:border-green-300"
                  >
                    <Sparkles className="h-4 w-4 text-green-600" />
                    Generate
                  </Button>
                </div>
              </div>

              {/* Credentials Preview */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1.5 rounded-lg bg-green-100">
                    <KeyRound className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-900">Login Credentials</h4>
                </div>
                <div className="space-y-1.5">
                  <p className="text-sm text-green-800">
                    <span className="text-green-600">Student ID:</span>{' '}
                    <span className="font-mono font-semibold">{formData.studentIdNumber || '---'}</span>
                  </p>
                  <p className="text-sm text-green-800">
                    <span className="text-green-600">Password:</span>{' '}
                    <span className="font-mono font-semibold">{formData.password || '---'}</span>
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <GraduationCap className="h-5 w-5" />
                    Register Student
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default RegisterStudent;