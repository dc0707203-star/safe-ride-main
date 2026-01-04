import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, QrCode, Phone, User, Edit, X, Check, Download, Car, UserPlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCode from "react-qr-code";
import campusBg from "@/assets/campus-bg.jpeg";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const DriversList = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRole } = useAuth();
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    age: "",
    contact_number: "",
    tricycle_plate_number: "",
  });
  const [saving, setSaving] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login?type=admin');
    } else if (userRole !== null && userRole !== 'admin') {
      navigate('/');
    }
  }, [user, authLoading, userRole, navigate]);

  useEffect(() => {
    if (!authLoading && user && userRole === 'admin') {
      fetchDrivers();
    }
  }, [user, userRole, authLoading]);

  const fetchDrivers = async () => {
    try {
      console.log('Fetching drivers as admin...');
      const { data, error } = await supabase
        .from('drivers' as any)
        .select('*')
        .order('created_at', { ascending: false }) as { data: any[]; error: any };

      console.log('Drivers fetch result:', { data, error });

      if (error) throw error;
      setDrivers(data || []);
    } catch (error: any) {
      console.error('Error fetching drivers:', error);
      toast.error("Failed to load drivers: " + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (driver: any) => {
    setEditingDriver(driver);
    setEditForm({
      full_name: driver.full_name || "",
      age: driver.age?.toString() || "",
      contact_number: driver.contact_number || "",
      tricycle_plate_number: driver.tricycle_plate_number || "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingDriver) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('drivers' as any)
        .update({
          full_name: editForm.full_name,
          age: parseInt(editForm.age),
          contact_number: editForm.contact_number,
          tricycle_plate_number: editForm.tricycle_plate_number,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDriver.id);

      if (error) throw error;

      toast.success("Driver updated successfully!");
      setEditingDriver(null);
      fetchDrivers();
    } catch (error: any) {
      console.error('Error updating driver:', error);
      toast.error(error.message || "Failed to update driver");
    } finally {
      setSaving(false);
    }
  };

  const handleShowQR = (driver: any) => {
    setSelectedDriver(driver);
    setShowQRDialog(true);
  };

  const handleDeleteDriver = async () => {
    if (!driverToDelete) return;
    setIsDeleting(true);

    try {
      const { error } = await supabase
        .from('drivers' as any)
        .delete()
        .eq('id', driverToDelete.id);

      if (error) throw error;

      toast.success("Driver deleted successfully!");
      setDriverToDelete(null);
      fetchDrivers();
    } catch (error: any) {
      console.error('Error deleting driver:', error);
      toast.error(error.message || "Failed to delete driver");
    } finally {
      setIsDeleting(false);
    }
  };

  const downloadQRCode = () => {
    if (!selectedDriver) return;

    const svg = document.getElementById('driver-qr-code-list');
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
        ctx.fillText(selectedDriver.full_name, canvas.width / 2, 370);
        ctx.font = '18px Arial';
        ctx.fillText(`Plate: ${selectedDriver.tricycle_plate_number}`, canvas.width / 2, 400);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText('ISU SafeRide System', canvas.width / 2, 440);
        ctx.fillText('Scan before boarding', canvas.width / 2, 460);
        
        const link = document.createElement('a');
        link.download = `driver-qr-${selectedDriver.tricycle_plate_number}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      }
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading drivers...</p>
        </div>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-lg">
                  <Car className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Drivers</h1>
                  <p className="text-xs text-muted-foreground">{drivers.length} registered</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/admin/register-driver')}
              className="rounded-xl gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              <span className="hidden sm:inline">Add Driver</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-6">
        {drivers.length === 0 ? (
          <Card className="text-center py-12 border-dashed">
            <CardContent>
              <Car className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Drivers Yet</h3>
              <p className="text-muted-foreground mb-4">Register your first driver to get started</p>
              <Button onClick={() => navigate('/admin/register-driver')} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Register Driver
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {drivers.map((driver) => (
              <Card key={driver.id} className="group hover:shadow-2xl transition-all duration-300 border-white/20 bg-white/10 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-0">
                  {/* Top Section */}
                  <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/10 p-4 border-b border-border/50">
                    <div className="flex items-start gap-4">
                      {driver.photo_url ? (
                        <img
                          src={driver.photo_url}
                          alt={driver.full_name}
                          className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center border-2 border-white shadow-md">
                          <span className="text-xl font-bold text-white">{driver.full_name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground truncate">{driver.full_name}</h3>
                        <Badge variant="outline" className="text-xs font-mono mt-1 bg-white/50">
                          {driver.tricycle_plate_number}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">Age: {driver.age}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8"
                          onClick={() => handleEditClick(driver)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDriverToDelete(driver)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Section */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{driver.contact_number}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowQR(driver)}
                      className="w-full rounded-xl gap-2 h-10"
                    >
                      <QrCode className="h-4 w-4" />
                      View QR Code
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingDriver} onOpenChange={() => setEditingDriver(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-primary" />
              Edit Driver
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-age">Age</Label>
              <Input
                id="edit-age"
                type="number"
                value={editForm.age}
                onChange={(e) => setEditForm({ ...editForm, age: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-contact">Contact Number</Label>
              <Input
                id="edit-contact"
                value={editForm.contact_number}
                onChange={(e) => setEditForm({ ...editForm, contact_number: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-plate">Plate Number</Label>
              <Input
                id="edit-plate"
                value={editForm.tricycle_plate_number}
                onChange={(e) => setEditForm({ ...editForm, tricycle_plate_number: e.target.value })}
                className="rounded-xl"
              />
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <Button variant="outline" onClick={() => setEditingDriver(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={handleSaveEdit} disabled={saving} className="rounded-xl gap-2">
                <Check className="h-4 w-4" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Driver QR Code</DialogTitle>
          </DialogHeader>
          {selectedDriver && (
            <div className="space-y-4 py-4">
              <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-primary/20 inline-block">
                <QRCode 
                  id="driver-qr-code-list"
                  value={selectedDriver.qr_code} 
                  size={180} 
                />
              </div>
              <div>
                <p className="font-bold text-lg">{selectedDriver.full_name}</p>
                <p className="text-muted-foreground">Plate: {selectedDriver.tricycle_plate_number}</p>
              </div>
              <Button onClick={downloadQRCode} className="gap-2 rounded-xl w-full h-11">
                <Download className="h-4 w-4" />
                Download QR Code
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!driverToDelete} onOpenChange={() => setDriverToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Driver</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{driverToDelete?.full_name}</strong>? 
              This action cannot be undone and will remove all associated trip records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDriver}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DriversList;