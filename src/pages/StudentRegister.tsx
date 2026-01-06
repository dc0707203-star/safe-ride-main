import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const StudentRegister = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  
  const [formData, setFormData] = useState({
    studentIdNumber: "",
    fullName: "",
    course: "",
    yearLevel: "",
    section: "",
    address: "",
    contactNumber: "",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login?type=student");
      return;
    }
    if (userRole && userRole !== "student") {
      navigate(userRole === "admin" ? "/admin" : "/");
    }
  }, [authLoading, user, userRole, navigate]);
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
    if (!user) return;

    setLoading(true);
    try {
      let photoUrl = "";

      // Upload photo if provided
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const filePath = `${user.id}/profile.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, photoFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        
        photoUrl = data.publicUrl;
      }

      // Upsert student data (insert or update if exists)
      const { error: upsertError } = await supabase
        .from('students')
        .upsert({
          user_id: user.id,
          student_id_number: formData.studentIdNumber,
          full_name: formData.fullName,
          course: formData.course,
          year_level: formData.yearLevel,
          section: formData.section,
          address: formData.address,
          contact_number: formData.contactNumber,
          photo_url: photoUrl,
          is_registered: true,
        } as any, {
          onConflict: 'user_id'
        });

      if (upsertError) throw upsertError;

      // Add student role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role: 'student',
        });

      if (roleError && !roleError.message.includes('duplicate')) throw roleError;

      toast.success("Registration successful!");
      navigate('/student');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Failed to register");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-3xl">Student Registration</CardTitle>
          <CardDescription>Complete your profile to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Photo Upload */}
            <div className="flex flex-col items-center gap-4">
              <div className="w-32 h-32 rounded-full border-4 border-primary/20 overflow-hidden bg-muted flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <Label htmlFor="photo" className="cursor-pointer">
                <div className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  Upload Photo
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

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID Number *</Label>
                <Input
                  id="studentId"
                  required
                  value={formData.studentIdNumber}
                  onChange={(e) => setFormData({ ...formData, studentIdNumber: e.target.value })}
                  placeholder="e.g., 2024-12345"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="course">Course *</Label>
                <Select
                  value={formData.course}
                  onValueChange={(value) => setFormData({ ...formData, course: value })}
                >
                  <SelectTrigger id="course">
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
                <Label htmlFor="yearLevel">Year Level *</Label>
                <Select
                  value={formData.yearLevel}
                  onValueChange={(value) => setFormData({ ...formData, yearLevel: value })}
                >
                  <SelectTrigger id="yearLevel">
                    <SelectValue placeholder="Select year" />
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
                <Label htmlFor="section">Section *</Label>
                <Select
                  value={formData.section}
                  onValueChange={(value) => setFormData({ ...formData, section: value })}
                >
                  <SelectTrigger id="section">
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

              <div className="space-y-2">
                <Label htmlFor="contact">Contact Number *</Label>
                <Input
                  id="contact"
                  type="tel"
                  required
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="09XX XXX XXXX"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address *</Label>
                <Input
                  id="address"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Barangay, Municipality, Province"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Registering..." : "Complete Registration"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentRegister;
