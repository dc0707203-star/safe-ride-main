import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, User, Sparkles, GraduationCap, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { validateStudentRegistration } from "@/lib/validators";
import { useIsMobile } from "@/hooks/use-mobile";
import campusBg from "@/assets/campus-bg.jpeg";
import isuLogo from "@/assets/isu-logo.png";

const COURSES = [
  "BS Information Technology",
  "BS Computer Science",
  "BS Information Systems",
  "BS Computer Engineering",
  "BS Electronics Engineering",
  "BS Electrical Engineering",
  "BS Civil Engineering",
  "BS Mechanical Engineering",
  "BS Agriculture",
  "BS Forestry",
  "BS Fisheries",
  "BS Environmental Science",
  "BS Biology",
  "BS Chemistry",
  "BS Mathematics",
  "BS Nursing",
  "BS Midwifery",
  "BS Pharmacy",
  "BS Medical Technology",
  "BS Criminology",
  "BS Education - Elementary",
  "BS Education - Secondary",
  "BS Business Administration",
  "BS Accountancy",
  "BS Hospitality Management",
  "BS Tourism Management",
  "BS Social Work",
  "BA Communication",
  "BA Political Science",
  "Bachelor of Laws",
];

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

const SECTIONS = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

const RegisterStudent = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  
  const [formData, setFormData] = useState({
    studentIdNumber: "",
    fullName: "",
    course: "",
    yearLevel: "",
    section: "",
    address: "",
    contactNumber: "",
    password: "",
  });

  // Cryptographically secure password generation
  const generatePassword = (): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    const length = 16;
    const allChars = uppercase + lowercase + numbers + symbols;

    // Use crypto.getRandomValues for cryptographically secure randomness
    const randomArray = new Uint8Array(length);
    crypto.getRandomValues(randomArray);

    let password = '';
    
    // Ensure at least one character from each category
    password += uppercase[randomArray[0] % uppercase.length];
    password += lowercase[randomArray[1] % lowercase.length];
    password += numbers[randomArray[2] % numbers.length];
    password += symbols[randomArray[3] % symbols.length];

    // Fill the rest with secure random characters
    for (let i = 4; i < length; i++) {
      password += allChars[randomArray[i] % allChars.length];
    }

    // Secure Fisher-Yates shuffle using crypto.getRandomValues
    const chars = password.split('');
    const shuffleArray = new Uint8Array(length);
    crypto.getRandomValues(shuffleArray);

    for (let i = chars.length - 1; i > 0; i--) {
      const j = shuffleArray[i] % (i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    return chars.join('');
  };

  const handleGeneratePassword = () => {
    const securePassword = generatePassword();
    setFormData({ ...formData, password: securePassword });
    setGeneratedPassword(securePassword);
    toast.success("Secure password generated! Password will be sent to student's email after registration.");
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
    
    // Validate all form fields
    const validation = validateStudentRegistration({
      fullName: formData.fullName,
      studentIdNumber: formData.studentIdNumber,
      password: formData.password,
      contactNumber: formData.contactNumber,
    });

    if (!validation.isValid) {
      validation.errors.forEach(error => {
        toast.error(`${error.field}: ${error.message}`);
      });
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
        .from('students' as any)
        .upsert({
          user_id: userId,
          student_id_number: formData.studentIdNumber,
          full_name: formData.fullName,
          course: formData.course,
          year_level: formData.yearLevel,
          section: formData.section,
          address: formData.address,
          contact_number: formData.contactNumber,
          photo_url: photoUrl,
          is_registered: true,
          email: studentEmail,
        }, {
          onConflict: 'user_id'
        });

      if (studentError) throw studentError;

      const { error: roleError } = await supabase.functions.invoke('assign-student-role', {
        body: { userId }
      });

      if (roleError) throw roleError;

      toast.success("Student registered successfully!");
      toast.info(`Student ID: ${formData.studentIdNumber}`, {
        duration: 5000,
        description: "Password has been sent to student's email. Make sure they change it on first login."
      });
      
      navigate('/admin/students');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Failed to register student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Fixed Background */}
      <div className="fixed inset-0 z-0">
        <img src={campusBg} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/70" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-xl border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl text-white hover:bg-white/20">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Register Student</h1>
                <p className="text-xs text-white/60">Create new student account</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-6">
        <Card className={`border border-white/20 shadow-2xl bg-white/95 backdrop-blur-xl mx-auto ${isMobile ? 'max-w-md' : 'max-w-3xl'}`}>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 sm:h-12 sm:w-12 text-green-600" />
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
            <CardTitle className="text-lg sm:text-xl">Student Information</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Fill in all required details below</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="space-y-2">
                  <Label htmlFor="studentId" className="text-xs sm:text-sm font-medium">Student ID *</Label>
                  <Input
                    id="studentId"
                    required
                    value={formData.studentIdNumber}
                    onChange={(e) => setFormData({ ...formData, studentIdNumber: e.target.value })}
                    placeholder="e.g., 2024-12345"
                    className="h-10 sm:h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-xs sm:text-sm font-medium">Full Name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Juan Dela Cruz"
                    className="h-10 sm:h-11 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="course" className="text-xs sm:text-sm font-medium">Course *</Label>
                  <Select
                    value={formData.course}
                    onValueChange={(value) => setFormData({ ...formData, course: value })}
                    required
                  >
                    <SelectTrigger className="h-10 sm:h-11 rounded-xl text-sm">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COURSES.map((course) => (
                        <SelectItem key={course} value={course}>
                          {course}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-xs sm:text-sm font-medium">Contact Number *</Label>
                  <Input
                    id="contact"
                    type="tel"
                    required
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    placeholder="09XX XXX XXXX"
                    className="h-10 sm:h-11 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                <div className="space-y-2">
                  <Label htmlFor="yearLevel" className="text-xs sm:text-sm font-medium">Year Level *</Label>
                  <Select
                    value={formData.yearLevel}
                    onValueChange={(value) => setFormData({ ...formData, yearLevel: value })}
                  >
                    <SelectTrigger className="h-10 sm:h-11 rounded-xl text-sm">
                      <SelectValue placeholder="Select year level" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEAR_LEVELS.map((year) => (
                        <SelectItem key={year} value={year}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="section" className="text-xs sm:text-sm font-medium">Section *</Label>
                  <Select
                    value={formData.section}
                    onValueChange={(value) => setFormData({ ...formData, section: value })}
                  >
                    <SelectTrigger className="h-10 sm:h-11 rounded-xl text-sm">
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTIONS.map((section) => (
                        <SelectItem key={section} value={section}>
                          {section}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs sm:text-sm font-medium">Address *</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Barangay, Municipality, Province"
                  className="h-10 sm:h-11 rounded-xl text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs sm:text-sm font-medium flex items-center gap-2">
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
                    className="h-10 sm:h-11 rounded-xl text-sm"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleGeneratePassword}
                    className="h-10 sm:h-11 rounded-xl px-3 sm:px-4 gap-1 sm:gap-2 border-green-200 hover:bg-green-50 hover:border-green-300 text-xs sm:text-sm"
                  >
                    <Sparkles className="h-4 w-4 text-green-600" />
                    <span className="hidden sm:inline">Generate</span>
                  </Button>
                </div>
              </div>

              {/* Credentials Preview */}
              <div className="p-3 sm:p-4 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className="p-1.5 rounded-lg bg-green-100">
                    <KeyRound className="h-4 w-4 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-900 text-sm">Login Credentials</h4>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs sm:text-sm text-green-800">
                    <span className="text-green-600">Student ID:</span>{' '}
                    <span className="font-mono font-semibold">{formData.studentIdNumber || '---'}</span>
                  </p>
                  <p className="text-xs sm:text-sm text-green-800">
                    <span className="text-green-600">Password:</span>{' '}
                    <span className="font-mono font-semibold">{formData.password ? '••••••••' : '---'}</span>
                  </p>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 sm:h-14 rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all" 
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
