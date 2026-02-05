import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, CheckCircle, Car, User, IdCard, FileText, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import { useIsMobile } from "@/hooks/use-mobile";
import campusBg from "@/assets/campus-bg.jpeg";
import isuLogo from "@/assets/isu-logo.png";

const VALID_ID_TYPES = [
  "Driver's License",
  "Passport",
  "UMID",
  "PhilHealth ID",
  "SSS ID",
  "Postal ID",
  "Voter's ID",
  "PRC ID",
  "National ID",
];

const LICENSE_TYPES = [
  "Professional",
  "Non-Professional",
];

const VEHICLE_TYPES = [
  "Tricycle",
  "Motorcycle",
  "Car",
  "Van",
  "Jeepney",
];

const RegisterDriver = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [registeredDriver, setRegisteredDriver] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    contactNumber: "",
    email: "",
    validIdType: "",
    idNumber: "",
    licenseNumber: "",
    licenseType: "",
    licenseExpiry: "",
    vehicleType: "",
    plateNumber: "",
    vehicleModel: "",
    vehicleYear: "",
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
          date_of_birth: formData.dateOfBirth || null,
          contact_number: formData.contactNumber,
          email: formData.email || null,
          valid_id_type: formData.validIdType || null,
          id_number: formData.idNumber || null,
          license_number: formData.licenseNumber || null,
          license_type: formData.licenseType || null,
          license_expiry: formData.licenseExpiry || null,
          vehicle_type: formData.vehicleType || null,
          tricycle_plate_number: formData.plateNumber,
          vehicle_model: formData.vehicleModel || null,
          vehicle_year: formData.vehicleYear ? parseInt(formData.vehicleYear) : null,
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
    setFormData({
      fullName: "",
      dateOfBirth: "",
      contactNumber: "",
      email: "",
      validIdType: "",
      idNumber: "",
      licenseNumber: "",
      licenseType: "",
      licenseExpiry: "",
      vehicleType: "",
      plateNumber: "",
      vehicleModel: "",
      vehicleYear: "",
    });
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
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">Register Driver</h1>
                <p className="text-xs text-white/60">Add new tricycle driver</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Scrollable Content */}
      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-6">
        <Card className={`border border-white/20 shadow-2xl bg-white/95 backdrop-blur-xl mx-auto ${isMobile ? 'max-w-md' : 'max-w-4xl'}`}>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-10 w-10 sm:h-12 sm:w-12 text-blue-600" />
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
            <CardTitle className="text-lg sm:text-xl">Driver Registration Form</CardTitle>
            <CardDescription className="text-xs sm:text-sm">Fill in all required details below</CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <IdCard className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Personal Information</h3>
                </div>
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
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
                    <Label htmlFor="dateOfBirth" className="text-xs sm:text-sm font-medium">Date of Birth *</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      required
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="h-10 sm:h-11 rounded-xl text-sm"
                    />
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

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs sm:text-sm font-medium">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="driver@email.com"
                      className="h-10 sm:h-11 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="validIdType" className="text-xs sm:text-sm font-medium">Valid ID Type *</Label>
                    <Select
                      value={formData.validIdType}
                      onValueChange={(value) => setFormData({ ...formData, validIdType: value })}
                      required
                    >
                      <SelectTrigger className="h-10 sm:h-11 rounded-xl text-sm">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VALID_ID_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="idNumber" className="text-xs sm:text-sm font-medium">ID Number *</Label>
                    <Input
                      id="idNumber"
                      required
                      value={formData.idNumber}
                      onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                      placeholder="Enter ID number"
                      className="h-10 sm:h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Driver's License Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <FileText className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Driver's License</h3>
                </div>
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
                  <div className="space-y-2">
                    <Label htmlFor="licenseNumber" className="text-xs sm:text-sm font-medium">License Number *</Label>
                    <Input
                      id="licenseNumber"
                      required
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="N01-23-456789"
                      className="h-10 sm:h-11 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseType" className="text-xs sm:text-sm font-medium">License Type *</Label>
                    <Select
                      value={formData.licenseType}
                      onValueChange={(value) => setFormData({ ...formData, licenseType: value })}
                      required
                    >
                      <SelectTrigger className="h-10 sm:h-11 rounded-xl text-sm">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {LICENSE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="licenseExpiry" className="text-xs sm:text-sm font-medium">Expiry Date *</Label>
                    <Input
                      id="licenseExpiry"
                      type="date"
                      required
                      value={formData.licenseExpiry}
                      onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                      className="h-10 sm:h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                  <Truck className="h-5 w-5 text-orange-600" />
                  <h3 className="font-semibold text-foreground text-sm sm:text-base">Vehicle Information</h3>
                </div>
                <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  <div className="space-y-2">
                    <Label htmlFor="vehicleType" className="text-xs sm:text-sm font-medium">Vehicle Type *</Label>
                    <Select
                      value={formData.vehicleType}
                      onValueChange={(value) => setFormData({ ...formData, vehicleType: value })}
                      required
                    >
                      <SelectTrigger className="h-10 sm:h-11 rounded-xl text-sm">
                        <SelectValue placeholder="Select vehicle type" />
                      </SelectTrigger>
                      <SelectContent>
                        {VEHICLE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="plateNumber" className="text-xs sm:text-sm font-medium">Plate Number *</Label>
                    <Input
                      id="plateNumber"
                      required
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      placeholder="ABC 1234"
                      className="h-10 sm:h-11 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel" className="text-xs sm:text-sm font-medium">Vehicle Model</Label>
                    <Input
                      id="vehicleModel"
                      value={formData.vehicleModel}
                      onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                      placeholder="e.g., Honda TMX"
                      className="h-10 sm:h-11 rounded-xl text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vehicleYear" className="text-xs sm:text-sm font-medium">Vehicle Year</Label>
                    <Input
                      id="vehicleYear"
                      type="number"
                      min="1990"
                      max="2025"
                      value={formData.vehicleYear}
                      onChange={(e) => setFormData({ ...formData, vehicleYear: e.target.value })}
                      placeholder="e.g., 2020"
                      className="h-10 sm:h-11 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 sm:h-14 rounded-xl text-sm sm:text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all" 
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
