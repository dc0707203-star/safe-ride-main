import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, CheckCircle, Car, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import campusBg from "@/assets/campus-bg.jpeg";

const RegisterDriver = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [registeredDriver, setRegisteredDriver] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    age: "",
    contactNumber: "",
    plateNumber: "",
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

  const generateQRCode = (driverId: string, plateNumber: string) => {
    return `ISU-DRIVER-${plateNumber}-${driverId}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let photoUrl = "";

      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `driver-${Date.now()}.${fileExt}`;
        const filePath = `drivers/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, photoFile);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        
        photoUrl = data.publicUrl;
      }

      const { data: driver, error: insertError } = await supabase
        .from('drivers' as any)
        .insert({
          full_name: formData.fullName,
          age: parseInt(formData.age),
          contact_number: formData.contactNumber,
          tricycle_plate_number: formData.plateNumber,
          photo_url: photoUrl,
          qr_code: '',
        })
        .select()
        .single() as { data: any; error: any };

      if (insertError) throw insertError;

      const qrCode = generateQRCode(driver.id, formData.plateNumber);
      const { data: updatedDriver, error: updateError } = await supabase
        .from('drivers' as any)
        .update({ qr_code: qrCode })
        .eq('id', driver.id)
        .select()
        .single() as { data: any; error: any };

      if (updateError) throw updateError;

      toast.success("Driver registered successfully!");
      setRegisteredDriver({ ...updatedDriver, qr_code: qrCode });
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || "Failed to register driver");
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('driver-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 400;
      canvas.height = 500;
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 50, 30, 300, 300);
        ctx.fillStyle = 'black';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(registeredDriver.full_name, canvas.width / 2, 370);
        ctx.font = '18px Arial';
        ctx.fillText(`Plate: ${registeredDriver.tricycle_plate_number}`, canvas.width / 2, 400);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText('ISU SafeRide System', canvas.width / 2, 440);
        ctx.fillText('Scan before boarding', canvas.width / 2, 460);
        
        const link = document.createElement('a');
        link.download = `driver-qr-${registeredDriver.tricycle_plate_number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleRegisterAnother = () => {
    setRegisteredDriver(null);
    setFormData({ fullName: "", age: "", contactNumber: "", plateNumber: "" });
    setPhotoFile(null);
    setPhotoPreview("");
  };

  // Success screen
  if (registeredDriver) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-background to-emerald-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-600">Registration Successful!</CardTitle>
            <CardDescription>Driver has been added to the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="flex flex-col items-center">
              {registeredDriver.photo_url ? (
                <img 
                  src={registeredDriver.photo_url} 
                  alt={registeredDriver.full_name}
                  className="w-20 h-20 rounded-full object-cover mb-3 border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 border-4 border-white shadow-lg">
                  <User className="h-10 w-10 text-white" />
                </div>
              )}
              <h3 className="text-xl font-bold text-foreground">{registeredDriver.full_name}</h3>
              <p className="text-muted-foreground">Plate: {registeredDriver.tricycle_plate_number}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-green-200 inline-block">
              <QRCode 
                id="driver-qr-code"
                value={registeredDriver.qr_code} 
                size={180} 
              />
            </div>

            <p className="text-sm text-muted-foreground px-4">
              Download and print this QR code. Attach it to the tricycle for students to scan before boarding.
            </p>

            <div className="flex flex-col gap-3">
              <Button 
                onClick={downloadQRCode} 
                className="w-full h-12 rounded-xl gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
              >
                <Download className="h-5 w-5" />
                Download QR Code
              </Button>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRegisterAnother} className="flex-1 h-11 rounded-xl">
                  Register Another
                </Button>
                <Button variant="outline" onClick={() => navigate('/admin/drivers')} className="flex-1 h-11 rounded-xl">
                  View All Drivers
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Register Driver</h1>
                <p className="text-xs text-muted-foreground">Add new tricycle driver</p>
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
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-12 w-12 text-blue-600" />
                  )}
                </div>
                <Label htmlFor="photo" className="absolute -bottom-2 -right-2 cursor-pointer">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full shadow-lg hover:shadow-xl transition-shadow">
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
            <CardTitle className="text-xl">Driver Information</CardTitle>
            <CardDescription>Fill in all required details below</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name *</Label>
                  <Input
                    id="fullName"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Juan Dela Cruz"
                    className="h-11 rounded-xl border-border/50 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium">Age *</Label>
                  <Input
                    id="age"
                    type="number"
                    required
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="35"
                    className="h-11 rounded-xl border-border/50 focus:border-blue-500"
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
                    className="h-11 rounded-xl border-border/50 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plate" className="text-sm font-medium">Plate Number *</Label>
                  <Input
                    id="plate"
                    required
                    value={formData.plateNumber}
                    onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                    placeholder="ABC-123"
                    className="h-11 rounded-xl border-border/50 focus:border-blue-500"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Registering...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Register Driver
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

export default RegisterDriver;