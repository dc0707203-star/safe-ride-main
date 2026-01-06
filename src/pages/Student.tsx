import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, AlertCircle, History, LogOut, Phone, MapPin, Megaphone, X, Bell, CheckCircle, User, Clock, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";
import isuLogo from "@/assets/isu-logo.png";
import Agreement from "@/pages/student/Agreement";
import campusBg from "@/assets/campus-bg.jpeg";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const Student = () => {
  const navigate = useNavigate();
  const { user, loading, userRole } = useAuth();
  const [currentTrip, setCurrentTrip] = useState<unknown>(null);
  const [studentData, setStudentData] = useState<unknown>(null);
  const [isSending, setIsSending] = useState(false);
  const [announcements, setAnnouncements] = useState<unknown[]>([]);
  const [unreadCount, setUnreadCount] = useState<unknown>(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login?type=student');
      } else if (userRole !== null && userRole !== 'student') {
        navigate('/');
      }
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    const checkRegistration = async () => {
      if (!user || loading || userRole !== "student") return;

      const { data: student, error } = (await supabase
        .from("students" as unknown)
        .select("id, is_registered, is_approved, agreement_accepted, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: unknown; error: unknown };

      if (error) {
        console.error("Error checking registration:", error);
        return;
      }

      if (!student || !student.is_registered) {
        navigate("/student-register");
      }
    };

    checkRegistration();
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || loading || userRole !== "student") return;

      try {
        const { data: student, error: studentError } = (await supabase
          .from("students" as unknown)
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()) as { data: unknown; error: unknown };

        if (studentError) throw studentError;

        setStudentData(student);

        if (student) {
          await supabase.from("students" as unknown).update({ is_active: true }).eq("id", student.id);

          const { data: trip, error: tripError } = (await supabase
            .from("trips" as unknown)
            .select("*, drivers(*)")
            .eq("student_id", student.id)
            .eq("status", "active")
            .order("start_time", { ascending: false })
            .limit(1)
            .maybeSingle()) as { data: unknown; error: unknown };

          if (tripError) throw tripError;

          setCurrentTrip(trip);
        } else {
          setCurrentTrip(null);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();
  }, [user, loading, userRole]);

  // Fetch announcements and subscribe to realtime updates
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements' as unknown)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10) as { data: unknown[] | null };
      
      if (data) {
        setAnnouncements(data);
        setUnreadCount(data.length);
      }
    };

    fetchAnnouncements();

    // Subscribe to new announcements
    const channel = supabase
      .channel('announcements-channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'announcements' },
        (payload) => {
          setAnnouncements((prev) => [payload.new as unknown, ...prev].slice(0, 10));
          setUnreadCount((prev) => prev + 1);
          toast.info("New Announcement!", { description: (payload.new as unknown).title });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Mark announcements as read when sheet opens
  const handleAnnouncementSheetOpen = useCallback((open: boolean) => {
    if (open) {
      setUnreadCount(0);
    }
  }, []);

  // Handle QR code scan result
  const handleQRScan = async (result: string) => {
    setIsScanning(false);
    
    console.log('QR Code scanned:', result);
    
    // Expected format: ISU-DRIVER-{plateNumber}-{driverId}
    if (!result.startsWith('ISU-DRIVER-')) {
      toast.error("Invalid QR Code", { description: "This is not a valid driver QR code. Expected format: ISU-DRIVER-XXX" });
      return;
    }

    // Split and get driver ID (last segment which is a UUID)
    const parts = result.split('-');
    // UUID is the last 5 parts joined by dashes (e.g., 004d1c40-3dbd-49e2-817e-ee45b13314b2)
    const driverId = parts.slice(-5).join('-');
    
    console.log('Extracted driver ID:', driverId);

    try {
      setIsCreatingTrip(true);

      // Check if driver exists
      const { data: driver, error: driverError } = await supabase
        .from('drivers' as unknown)
        .select('*')
        .eq('id', driverId)
        .maybeSingle() as { data: unknown; error: unknown };

      console.log('Driver lookup result:', driver, driverError);

      if (driverError) {
        console.error('Driver lookup error:', driverError);
        toast.error("Error Finding Driver", { description: driverError.message });
        setIsCreatingTrip(false);
        return;
      }
      
      if (!driver) {
        toast.error("Driver Not Found", { description: `Driver ID ${driverId} is not registered in the system` });
        setIsCreatingTrip(false);
        return;
      }

      // Check for existing active trip
      if (currentTrip) {
        toast.error("Active Trip Exists", { description: "You already have an active trip. Please end it first." });
        setIsCreatingTrip(false);
        return;
      }

      if (!studentData?.id) {
        toast.error("Student profile not loaded", { description: "Please wait a moment and scan again." });
        setIsCreatingTrip(false);
        return;
      }

      // Get current location
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 60000
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoError) {
        console.log('Location unavailable, creating trip without location');
      }

      // Create the trip
      const { data: newTrip, error: tripError } = await supabase
        .from('trips' as unknown)
        .insert({
          student_id: studentData.id,
          driver_id: driver.id,
          status: 'active',
          start_location_lat: latitude,
          start_location_lng: longitude,
        })
        .select('*, drivers(*)')
        .single() as { data: unknown; error: unknown };

      if (tripError) throw tripError;

      setCurrentTrip(newTrip);
      toast.success("Trip Started!", { 
        description: `You're now riding with ${driver.full_name} (${driver.tricycle_plate_number})` 
      });

    } catch (error: unknown) {
      console.error('Error creating trip:', error);
      toast.error("Failed to start trip", { description: error.message });
    } finally {
      setIsCreatingTrip(false);
    }
  };

  // End current trip
  const handleEndTrip = async () => {
    if (!currentTrip) return;

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (geoError) {
        console.log('Location unavailable');
      }

      const { error } = await supabase
        .from('trips' as unknown)
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          end_location_lat: latitude,
          end_location_lng: longitude,
        })
        .eq('id', currentTrip.id);

      if (error) throw error;

      setCurrentTrip(null);
      toast.success("Trip Ended", { description: "Your trip has been completed safely" });

    } catch (error: unknown) {
      toast.error("Failed to end trip", { description: error.message });
    }
  };

  // Show SOS confirmation dialog
  const handleSOSButtonPress = () => {
    if (!studentData || isSending) return;
    setShowSOSConfirm(true);
  };

  // Confirmed SOS - send alert
  const handleSOSConfirm = async () => {
    setShowSOSConfirm(false);
    if (!studentData || isSending) return;
    
    setIsSending(true);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 15000,
              maximumAge: 0
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          console.log('GPS Location captured:', latitude, longitude);
        } catch (geoError: unknown) {
          console.error('Geolocation error:', geoError);
          toast.warning("Location Unavailable", { 
            description: "Could not get your GPS location. Alert sent without location." 
          });
        }
      } else {
        toast.warning("Geolocation Not Supported", { 
          description: "Your browser does not support location services." 
        });
      }

      const { error } = await supabase.from('alerts' as unknown).insert({
        student_id: studentData.id,
        trip_id: currentTrip?.id || null,
        driver_id: currentTrip?.driver_id || null,
        status: 'active',
        level: 'critical',
        message: 'Emergency SOS triggered by student',
        location_lat: latitude,
        location_lng: longitude,
      });

      if (error) {
        throw error;
      }

      toast.success("SOS Alert Sent!", { 
        description: latitude ? "Your location has been shared with admin." : "Alert sent to admin." 
      });

      setTimeout(() => {
        setIsSending(false);
      }, 3000);

    } catch (error: unknown) {
      console.error('Error sending emergency alert:', error);
      toast.error("Failed to send SOS", { description: error.message });
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (studentData) {
        await supabase
          .from('students' as unknown)
          .update({ is_active: false })
          .eq('id', studentData.id);
      }
      
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/5 flex items-center justify-center safe-area-inset">
        <div className="text-center">
          <img src={isuLogo} alt="ISU Logo" className="h-16 w-16 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show pending approval screen
  if (studentData && !studentData.is_approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-background to-amber-50 flex flex-col safe-area-inset">
        <header className="border-b bg-card/80 backdrop-blur-lg sticky top-0 z-10 safe-area-top shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-xl bg-primary/10 border border-primary/20">
                  <img src={isuLogo} alt="ISU Logo" className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-base font-bold text-foreground">SafeRide ISU</h1>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    {studentData?.full_name || 'Student'}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9">
                <LogOut className="h-5 w-5 text-muted-foreground" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-sm">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="h-12 w-12 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Account Pending Approval</h2>
            <p className="text-muted-foreground mb-6">
              Your registration has been submitted successfully. Please wait for an administrator to approve your account.
            </p>
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Bell className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-amber-800">What happens next?</p>
                    <p className="text-xs text-amber-600 mt-1">
                      An admin will review your registration details. You'll be able to access the full app once approved.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Button 
              variant="outline" 
              onClick={handleLogout} 
              className="mt-6 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show agreement screen if approved but not yet accepted agreement
  if (studentData && studentData.is_approved && !studentData.agreement_accepted) {
    return (
      <Agreement 
        studentId={studentData.id} 
        onAccepted={() => {
          // Refresh student data after accepting agreement
          setStudentData((prev: unknown) => ({ ...prev, agreement_accepted: true }));
        }} 
      />
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative safe-area-inset"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      <div className="fixed inset-0 bg-black/40 pointer-events-none" />
      {/* Header */}
      <header className="relative z-20 border-b border-[#CCFF00]/20 bg-[#001209]/80 backdrop-blur-xl top-0 safe-area-top shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-xl bg-[#CCFF00]/10 border border-[#CCFF00]/30 shadow-[0_0_15px_rgba(204,255,0,0.2)]">
                <img src={isuLogo} alt="ISU Logo" className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white">SafeRide ISU</h1>
                <p className="text-[11px] text-[#CCFF00]/70 leading-tight">
                  {studentData?.full_name || 'Student'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Announcements Sheet */}
              <Sheet onOpenChange={handleAnnouncementSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 hover:bg-[#CCFF00]/10">
                    <Bell className="h-5 w-5 text-[#CCFF00]" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[90%] sm:max-w-md bg-[#001209]/95 backdrop-blur-xl border-[#CCFF00]/20">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-white">
                      <Megaphone className="h-5 w-5 text-[#CCFF00]" />
                      Announcements
                    </SheetTitle>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-4 pr-4">
                    {announcements.length === 0 ? (
                      <div className="text-center py-12 text-white/50">
                        <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p>No announcements yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className="p-4 rounded-xl bg-white/5 border border-[#CCFF00]/20"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-[#CCFF00]/20">
                                <Megaphone className="h-4 w-4 text-[#CCFF00]" />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-white">{announcement.title}</p>
                                <p className="text-sm text-white/70 mt-1">{announcement.message}</p>
                                <p className="text-xs text-[#CCFF00]/60 mt-2">
                                  {format(new Date(announcement.created_at), 'MMM d, yyyy • h:mm a')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              {/* Settings Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-[#CCFF00]/10">
                    <Settings className="h-5 w-5 text-[#CCFF00]" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#001209]/95 backdrop-blur-xl border-[#CCFF00]/20 z-50">
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-4 py-4 safe-area-bottom">
        {/* Active Trip Banner */}
        {currentTrip && (
          <div className="mb-4 p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-white/20">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Currently On Trip</p>
                  <p className="text-xs opacity-90">
                    {currentTrip.drivers?.full_name} • {currentTrip.drivers?.tricycle_plate_number}
                  </p>
                </div>
              </div>
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={handleEndTrip}
                className="bg-white/20 hover:bg-white/30 text-white border-0"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                End Trip
              </Button>
            </div>
          </div>
        )}

        {/* SOS Section - Main Focus */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-4">
          <p className="text-sm text-white/70 mb-8 text-center px-8">
            Press the button below if you need <span className="text-red-400 font-bold">immediate help</span>
          </p>
          
          {/* Giant SOS Button */}
          <button
            onClick={handleSOSButtonPress}
            disabled={isSending}
            className={`
              relative w-48 h-48 sm:w-56 sm:h-56 rounded-full 
              flex flex-col items-center justify-center 
              transition-all duration-150 
              touch-manipulation select-none
              ${isSending 
                ? 'bg-destructive scale-110 animate-pulse' 
                : 'bg-gradient-to-br from-red-500 via-red-600 to-red-700 active:scale-95 hover:scale-105'
              }
            `}
            style={{
              boxShadow: isSending 
                ? '0 0 60px 20px rgba(239, 68, 68, 0.6), 0 0 100px 40px rgba(239, 68, 68, 0.3)'
                : '0 10px 40px rgba(239, 68, 68, 0.5), 0 4px 15px rgba(0,0,0,0.2), inset 0 2px 10px rgba(255,255,255,0.15)'
            }}
          >
            <AlertCircle className={`h-16 w-16 sm:h-20 sm:w-20 text-white mb-1 ${isSending ? 'animate-bounce' : ''}`} />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-wider">
              {isSending ? 'SENDING' : 'SOS'}
            </span>
            
            {/* Pulse rings when sending */}
            {isSending && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" />
                <div className="absolute inset-[-10px] rounded-full border-2 border-red-400/30 animate-ping" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </button>

          <p className="text-xs text-white/60 mt-8 text-center max-w-[220px]">
            {isSending 
              ? '🚨 Alert sent! Help is on the way!'
              : 'Your location will be sent automatically'
            }
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className={`cursor-pointer transition-all touch-manipulation bg-white/10 backdrop-blur-xl border border-[#CCFF00]/20 hover:border-[#CCFF00]/50 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] rounded-2xl p-4 ${isCreatingTrip ? 'opacity-50' : ''}`}
              onClick={() => !isCreatingTrip && setIsScanning(true)}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#CCFF00]/20">
                  <QrCode className="h-6 w-6 text-[#CCFF00]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Scan QR</p>
                  <p className="text-[11px] text-white/60">Start ride</p>
                </div>
              </div>
            </div>

            <div 
              className="cursor-pointer transition-all touch-manipulation bg-white/10 backdrop-blur-xl border border-[#CCFF00]/20 hover:border-[#CCFF00]/50 hover:shadow-[0_0_20px_rgba(204,255,0,0.15)] rounded-2xl p-4"
              onClick={() => navigate('/student/history')}
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#CCFF00]/20">
                  <History className="h-6 w-6 text-[#CCFF00]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">History</p>
                  <p className="text-[11px] text-white/60">Past trips</p>
                </div>
              </div>
            </div>
          </div>

          {/* Emergency Hotline */}
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-red-400" />
                <span className="text-sm text-white/70">Emergency Hotline</span>
              </div>
              <a href="tel:09XXXXXXXXX" className="text-sm font-bold text-[#CCFF00] hover:underline">
                09XX-XXX-XXXX
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={isScanning}
        onClose={() => setIsScanning(false)}
        onScan={handleQRScan}
      />

      {/* SOS Confirmation Dialog */}
      <AlertDialog open={showSOSConfirm} onOpenChange={setShowSOSConfirm}>
        <AlertDialogContent className="bg-[#001209]/95 backdrop-blur-xl border-red-500/30 max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-center text-xl flex items-center justify-center gap-2">
              <AlertCircle className="h-6 w-6 text-red-500" />
              Emergency SOS
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/70 text-center">
              Are you sure you want to send an emergency alert? Your location will be shared with the admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-4">
            <AlertDialogCancel className="flex-1 m-0 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white">
              No, Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSOSConfirm}
              className="flex-1 m-0 bg-red-600 hover:bg-red-700 text-white border-0"
            >
              Yes, Send SOS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Student;