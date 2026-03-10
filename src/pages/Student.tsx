import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QrCode, AlertCircle, History, LogOut, Phone, MapPin, Megaphone, X, Bell, CheckCircle, User, Clock, Settings, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useOfflineSupport } from "@/hooks/useOfflineSupport";
import { signOut } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useLocationTracker } from "@/hooks/useLocationTracker";
import { useVolumeButtonSOS } from "@/hooks/useVolumeButtonSOS";
import { format } from "date-fns";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";
import NotificationBell from "@/components/NotificationBell";
import { RideRequestDialog } from "@/components/RideRequestDialog";
import isuLogo from "@/assets/isu-logo.png";
import Agreement from "@/pages/student/Agreement";
import campusBg from "@/assets/campus-bg.jpeg";
import { subscribeToPushNotifications } from "@/lib/notifications";
import { registerServiceWorker } from "@/lib/serviceWorker";
import { useCapacitorPush } from "@/hooks/useCapacitorPush";
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
  const [currentTrip, setCurrentTrip] = useState<any>(null);
  const [studentData, setStudentData] = useState<any>(null);
  const [isSending, setIsSending] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [showSOSConfirm, setShowSOSConfirm] = useState(false);
  const [showAccidentConfirm, setShowAccidentConfirm] = useState(false);
  const [showEmergencyMenu, setShowEmergencyMenu] = useState(false);
  const [showRideRequest, setShowRideRequest] = useState(false);
  const [incidentType, setIncidentType] = useState<string>("accident");

  const INCIDENT_TYPES = [
    { value: "accident", label: "Vehicle Accident" },
    { value: "medical", label: "Medical Emergency" },
    { value: "theft", label: "Theft/Robbery" },
    { value: "harassment", label: "Harassment/Assault" },
    { value: "mechanical", label: "Vehicle Breakdown" },
    { value: "fire", label: "Fire" },
    { value: "flood", label: "Flood" },
    { value: "other", label: "Other Emergency" },
  ];

  // Register Capacitor push notifications
  useCapacitorPush(user?.id || (null as unknown as string), "student");

  // Get offline support
  const { isOnline, queueSOSAlert } = useOfflineSupport();

  // Send SOS alert function (moved up for volume button trigger)
  const sendSOSAlert = useCallback(async () => {
    if (!studentData || isSending) return;
    
    setIsSending(true);
    // No siren on student side - only admin hears the siren

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (navigator.geolocation) {
        try {
          const position = await Promise.race([
            new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 30000
              });
            }),
            new Promise<GeolocationPosition>((_, reject) => 
              setTimeout(() => reject(new Error('Location timeout')), 4000)
            )
          ]);
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
          console.log('GPS Location captured:', latitude, longitude);
        } catch (geoError: any) {
          console.warn('Could not get location:', geoError);
          // Continue without location - don't block the alert
        }
      }

      const sosData = {
        student_id: studentData.id,
        student_full_name: studentData.full_name || 'Unknown Student',
        student_id_number: studentData.student_id_number || null,
        trip_id: currentTrip?.id || null,
        driver_id: currentTrip?.driver_id || null,
        status: 'active',
        level: 'critical',
        alert_type: 'critical',
        message: 'Emergency SOS triggered by student',
        location_lat: latitude,
        location_lng: longitude,
      };

      console.log('[Student] Sending SOS with data:', sosData);

      // Try to send directly - if it fails, we'll queue it as backup
      // This way, even with small data/KB that can reach Supabase, it will work
      // (like Facebook - works with captive portal as long as Supabase is reachable)
      try {
        const result = await Promise.race([
          supabase.from('alerts' as any).insert(sosData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Send timeout')), 3000)
          )
        ]) as any;

        if (result?.error) {
          console.error('[Student] Supabase insert error:', result.error);
          throw result.error;
        }

        console.log('[Student] SOS Alert sent successfully');

        toast.success("SOS Alert Sent!", { 
          description: latitude ? "Your location has been shared with admin." : "Alert sent to admin." 
        });

        setTimeout(() => {
          setIsSending(false);
        }, 3000);
        return;
      } catch (directError) {
        console.log('[Student] Direct send failed, queuing SOS:', directError);
        // Direct send failed, queue it for offline retry
        queueSOSAlert(sosData);
        setTimeout(() => {
          setIsSending(false);
        }, 1500);
        return;
      }

    } catch (error: any) {
      console.error('Error sending emergency alert:', error);
      
      // Any error = queue it for offline retry
      console.log('[Student] Error caught - queuing SOS as backup');
      // For this outer catch, we need to create sosData again since we can't access the inner one
      const fallbackSosData = {
        student_id: studentData.id,
        student_full_name: studentData.full_name || 'Unknown Student',
        student_id_number: studentData.student_id_number || null,
        trip_id: currentTrip?.id || null,
        driver_id: currentTrip?.driver_id || null,
        status: 'active',
        level: 'critical',
        alert_type: 'critical',
        message: 'Emergency SOS triggered by student',
        location_lat: null,
        location_lng: null,
      };
      queueSOSAlert(fallbackSosData);
      toast.success("SOS Alert Queued", { 
        description: "Will be sent to admin when connection stabilizes." 
      });
      
      setIsSending(false);
    }
  }, [studentData, isSending, currentTrip, isOnline, queueSOSAlert]);

  // Send Accident Alert function
  const sendAccidentAlert = useCallback(async () => {
    if (!studentData || isSending) return;
    
    setIsSending(true);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      // Try to get location with longer timeout and don't block if it fails
      if (navigator.geolocation) {
        try {
          const position = await Promise.race([
            new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 30000
              });
            }),
            new Promise<GeolocationPosition>((_, reject) => 
              setTimeout(() => reject(new Error('Location timeout')), 4000)
            )
          ]);
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.warn('Could not get location:', error);
          // Continue without location - don't block the alert
        }
      }

      // Determine severity and map to valid alert type
      const getAlertType = (type: string) => {
        // Map all incident types to valid database alert types
        if (['theft', 'harassment', 'medical', 'accident', 'fire', 'flood', 'mechanical', 'other'].includes(type)) {
          return 'incident'; // Valid type in database
        }
        return 'incident';
      };

      const getSeverity = (type: string) => {
        if (['theft', 'harassment', 'medical', 'accident', 'fire', 'flood'].includes(type)) {
          return 'high';
        }
        return 'medium';
      };

      const { error } = await supabase
        .from('alerts')
        .insert({
          student_id: studentData.id,
          student_full_name: studentData.full_name || 'Unknown Student',
          student_id_number: studentData.student_id_number || null,
          status: 'active',
          level: getSeverity(incidentType) === 'high' ? 'high' : 'medium',
          alert_type: getAlertType(incidentType),
          message: `${INCIDENT_TYPES.find(t => t.value === incidentType)?.label || 'Incident'} - ${incidentType.toUpperCase()} reported by student`,
          location_lat: latitude,
          location_lng: longitude,
        });

      if (error) {
        console.error('[Student] Incident alert error:', error);
        throw error;
      }

      console.log('[Student] Incident alert sent successfully');

      toast.success("Alert Sent!", { 
        description: latitude ? "Your location has been shared with admin." : "Alert sent to admin." 
      });

      setTimeout(() => {
        setIsSending(false);
      }, 3000);

    } catch (error: any) {
      console.error('Error sending alert:', error);
      toast.error("Failed to send alert", { description: error.message });
      setIsSending(false);
    }
  }, [studentData, isSending, incidentType]);

  const handleAccidentConfirm = async () => {
    setShowAccidentConfirm(false);
    await sendAccidentAlert();
  };

  // Track student location continuously
  useLocationTracker({
    studentId: studentData?.id || null,
    tripId: currentTrip?.id || null, // Pass active trip ID for real-time map tracking
    enabled: !!studentData?.id && !!studentData?.is_approved,
    // intervalMs is now automatically optimized based on device capabilities
  });

  // Volume button SOS trigger (press 4 times quickly = emergency alert)
  const handleVolumeSOSTrigger = useCallback(() => {
    if (!studentData || isSending) return;
    toast.error("🚨 EMERGENCY ALERT SENT!", { description: "SOS activated! Notifying admins..." });
    sendSOSAlert();
  }, [studentData, isSending, sendSOSAlert]);

  useVolumeButtonSOS({
    onTrigger: handleVolumeSOSTrigger,
    enabled: !!studentData?.is_approved && !isSending,
  });

  // Expose global SOS handlers that native code can call
  // This MUST be available even if the component is disabled
  useEffect(() => {
    console.log("[Student] Exposing global SOS handlers to window");
    
    // Handler for widget/tile SOS triggers
    (window as any).volumeButtonSOSTriggered = () => {
      console.log("[Student] volumeButtonSOSTriggered called from native code");
      console.log("[Student] studentData state:", studentData ? "loaded" : "NOT loaded");
      console.log("[Student] isSending state:", isSending);
      
      if (!studentData) {
        console.warn("[Student] studentData not loaded yet - buffering SOS request via pendingWidgetSOS flag");
        (window as any).pendingWidgetSOS = true;
        return;
      }
      
      if (!studentData.is_approved) {
        console.warn("[Student] SOS ignored - student not approved");
        return;
      }
      
      if (isSending) {
        console.warn("[Student] SOS ignored - already sending an alert");
        return;
      }
      
      console.log("[Student] ✅ Calling handleVolumeSOSTrigger from handler");
      handleVolumeSOSTrigger();
    };

    // Handler for incident triggers
    (window as any).triggerIncidentReport = () => {
      console.log("[Student] triggerIncidentReport called from native code");
      if (!studentData) {
        console.warn("[Student] studentData not loaded yet - buffering incident request");
        (window as any).pendingIncidentReport = true;
        return;
      }
      
      if (!studentData.is_approved || isSending) {
        console.warn("[Student] Incident report ignored - student not approved or already sending");
        return;
      }
      
      handleIncidentReportPress();
    };

    // Handler for ride request triggers
    (window as any).triggerRideRequest = () => {
      console.log("[Student] triggerRideRequest called from native code");
      if (!studentData) {
        console.warn("[Student] studentData not loaded yet - buffering ride request");
        (window as any).pendingRideRequest = true;
        return;
      }
      
      if (!studentData.is_approved || isSending) {
        console.warn("[Student] Ride request ignored - student not approved or already sending");
        return;
      }
      
      console.log("[Student] Ride request triggered");
    };

    return () => {
      // Keep handlers available - don't delete them
    };
  }, [studentData?.is_approved, isSending]);

  // Check for pending widget SOS when Student page loads
  useEffect(() => {
    console.log("[Student] Checking for pending requests (SOS/Incident/Ride)");
    console.log("[Student] studentData loaded:", !!studentData);
    console.log("[Student] studentData.is_approved:", studentData?.is_approved);
    console.log("[Student] isSending:", isSending);
    
    // IMPORTANT: Check for pending requests REGARDLESS of approval status or isSending state
    // The handlers themselves will verify approval and sending status
    
    // If there's a pending SOS flag from widget/native code, trigger it now
    if ((window as any).pendingWidgetSOS) {
      console.log("[Student] ✅ Found pending widget SOS, triggering now");
      (window as any).pendingWidgetSOS = false;
      
      // Only trigger if student is loaded, approved, and not already sending
      if (studentData?.is_approved && !isSending) {
        handleVolumeSOSTrigger();
      } else {
        console.warn("[Student] Cannot trigger pending SOS - not approved or already sending");
      }
      return; // Don't process other requests if we triggered SOS
    }
    
    // If there's a pending incident report
    if ((window as any).pendingIncidentReport) {
      console.log("[Student] ✅ Found pending incident report, triggering now");
      (window as any).pendingIncidentReport = false;
      
      // Only trigger if student is loaded, approved, and not already sending
      if (studentData?.is_approved && !isSending) {
        handleIncidentReportPress();
      } else {
        console.warn("[Student] Cannot trigger pending incident - not approved or already sending");
      }
      return;
    }
    
    // If there's a pending ride request
    if ((window as any).pendingRideRequest) {
      console.log("[Student] ✅ Found pending ride request, triggering now");
      (window as any).pendingRideRequest = false;
      
      if (studentData?.id && studentData?.is_approved && !isSending) {
        setShowRideRequest(true);
      }
      return;
    }
  }, [studentData, isSending]);

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
        .from("students" as any)
        .select("id, is_registered, is_approved, agreement_accepted, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()) as { data: any; error: any };

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
    let subscription: any = null;

    const fetchStudentData = async () => {
      if (!user || loading || userRole !== "student") return;

      try {
        const { data: student, error: studentError } = (await supabase
          .from("students" as any)
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()) as { data: any; error: any };

        if (studentError) throw studentError;

        setStudentData(student);

        if (student) {
          await supabase.from("students" as any).update({ is_active: true }).eq("id", student.id);

          // Register Service Worker and subscribe to push notifications
          try {
            await registerServiceWorker();
            await subscribeToPushNotifications(user.id, "student");
            console.log("Push notifications enabled for student");
          } catch (error) {
            console.log("Push notifications setup skipped:", error);
          }

          const { data: trip, error: tripError } = (await supabase
            .from("trips" as any)
            .select("*, drivers(*)")
            .eq("student_id", student.id)
            .eq("status", "active")
            .order("start_time", { ascending: false })
            .limit(1)
            .maybeSingle()) as { data: any; error: any };

          if (tripError) throw tripError;

          setCurrentTrip(trip);

          // Subscribe to real-time trip updates
          subscription = supabase
            .channel(`trips-${student.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'trips',
                filter: `student_id=eq.${student.id}`
              },
              (payload: any) => {
                console.log('[Student] 🔄 Trip update received:', payload.eventType, 'Status:', payload.new?.status);
                
                if (payload.eventType === 'UPDATE') {
                  if (payload.new.status === 'completed' || payload.new.status === 'cancelled') {
                    console.log('[Student] ✅ Trip ended, clearing current trip display');
                    setCurrentTrip(null);
                  } else if (payload.new.status === 'active') {
                    // Fetch the full trip data with driver info
                    const refreshTrip = async () => {
                      const { data } = await supabase
                        .from('trips' as any)
                        .select('*, drivers(*)')
                        .eq('id', payload.new.id)
                        .single();
                      if (data) setCurrentTrip(data);
                    };
                    refreshTrip();
                  }
                }
              }
            )
            .subscribe();
        } else {
          setCurrentTrip(null);
        }
      } catch (error) {
        console.error("Error fetching student data:", error);
      }
    };

    fetchStudentData();

    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
    };
  }, [user, loading, userRole]);

  // Fetch announcements and subscribe to realtime updates
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const { data } = await supabase
        .from('announcements' as any)
        .select('*')
        .eq('is_active', true)
        .or("user_type.eq.student,user_type.eq.both")
        .order('created_at', { ascending: false })
        .limit(10) as { data: any[] | null };
      
      if (data) {
        setAnnouncements(data);
        setUnreadCount(data.length);
        console.log("[StudentDashboard] Loaded student announcements:", data.length);
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
          setAnnouncements((prev) => [payload.new as any, ...prev].slice(0, 10));
          setUnreadCount((prev) => prev + 1);
          toast.info("New Announcement!", { description: (payload.new as any).title });
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
        .from('drivers' as any)
        .select('*')
        .eq('id', driverId)
        .maybeSingle() as { data: any; error: any };

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

      // Check driver capacity (max 5 students)
      const { data: activeTrips, error: countError } = await supabase
        .from('trips' as any)
        .select('id')
        .eq('driver_id', driver.id)
        .eq('status', 'active');

      if (countError) throw countError;

      const MAX_CAPACITY = 5;
      if ((activeTrips?.length || 0) >= MAX_CAPACITY) {
        toast.error("Driver Capacity Full", { 
          description: `This driver has reached the maximum capacity of ${MAX_CAPACITY} students. Please find another driver.` 
        });
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
        .from('trips' as any)
        .insert({
          student_id: studentData.id,
          driver_id: driver.id,
          status: 'active',
          start_location_lat: latitude,
          start_location_lng: longitude,
        })
        .select('*, drivers(*)')
        .single() as { data: any; error: any };

      if (tripError) throw tripError;

      setCurrentTrip(newTrip);
      toast.success("Trip Started!", { 
        description: `You're now riding with ${driver.full_name} (${driver.tricycle_plate_number})` 
      });

    } catch (error: any) {
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

      console.log('[Student] Ending trip:', currentTrip.id);
      const { error } = await supabase
        .from('trips' as any)
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          end_location_lat: latitude,
          end_location_lng: longitude,
        })
        .eq('id', currentTrip.id);

      if (error) {
        console.error('[Student] Error ending trip:', error);
        throw error;
      }

      console.log('[Student] Trip ended successfully, clearing current trip');
      setCurrentTrip(null);
      toast.success("Trip Ended", { description: "Your trip has been completed safely" });

    } catch (error: any) {
      console.error('[Student] Failed to end trip:', error);
      toast.error("Failed to end trip", { description: error.message });
    }
  };

  // Handle emergency button press - direct SOS without menu
  const handleEmergencyButtonPress = () => {
    if (!studentData || isSending) return;
    setShowSOSConfirm(true);
  };

  // Handle incident button press - direct incident report without menu
  const handleIncidentReportPress = () => {
    if (!studentData || isSending) return;
    setShowAccidentConfirm(true);
  };

  // Show SOS confirmation dialog
  const handleSOSButtonPress = () => {
    if (!studentData || isSending) return;
    setShowSOSConfirm(true);
  };

  // Confirmed SOS - send alert (calls the sendSOSAlert function defined earlier)
  const handleSOSConfirm = () => {
    setShowSOSConfirm(false);
    sendSOSAlert();
  };

  const handleLogout = async () => {
    try {
      if (studentData) {
        await supabase
          .from('students' as any)
          .update({ is_active: false })
          .eq('id', studentData.id);
      }
      
      await signOut();
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
          setStudentData((prev: any) => ({ ...prev, agreement_accepted: true }));
        }} 
      />
    );
  }

  return (
    <div 
      className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative overflow-hidden"
      style={{ 
        backgroundImage: `url(${campusBg})`,
        backgroundColor: '#0f0a1a'
      }}
    >
      {/* Green Gradient Overlay - Matching Admin Design */}
      <div className="fixed inset-0 bg-gradient-to-b from-green-950/90 via-green-900/85 to-green-950/90 pointer-events-none" />
      
      {/* Animated lime-green accent */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#CCFF00]/5 via-transparent to-emerald-500/5 pointer-events-none" />
      
      {/* Header */}
      <header className="z-20 border-b border-[#CCFF00]/10 bg-green-900/40 backdrop-blur-xl sticky top-0 safe-area-top shadow-[0_8px_32px_rgba(204,255,0,0.1)]">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 bg-white/80 rounded-full shadow-lg backdrop-blur-sm hover:bg-white/90 transition-all">
                <img src={isuLogo} alt="ISU Logo" className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-base font-bold bg-gradient-to-r from-[#CCFF00] via-lime-300 to-green-400 bg-clip-text text-transparent">SafeRide ISU</h1>
                <p className="text-[11px] text-white/60 leading-tight">
                  {studentData?.full_name || 'Student'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* System Notifications */}
              {user && <NotificationBell userId={user.id} />}
              
              {/* Announcements Sheet */}
              <Sheet onOpenChange={handleAnnouncementSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative h-10 w-10 hover:bg-white/10 transition-colors">
                    <Megaphone className="h-5 w-5 text-amber-400" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full text-[10px] text-black flex items-center justify-center font-bold shadow-lg shadow-amber-500/50">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[90%] sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-xl border-l border-white/10 p-0">
                  <SheetHeader className="px-6 py-4 border-b border-white/10 sticky top-0 z-10 bg-gradient-to-r from-black/40 to-black/20 backdrop-blur-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full shadow-lg shadow-amber-500/50">
                          <Megaphone className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <SheetTitle className="text-white font-black text-lg">Announcements</SheetTitle>
                          <p className="text-xs text-white/60 font-semibold">From Admin</p>
                        </div>
                      </div>
                      {announcements.length > 0 && (
                        <Badge className="bg-gradient-to-r from-amber-600 to-orange-700 text-white font-bold shadow-lg">
                          {announcements.length}
                        </Badge>
                      )}
                    </div>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)]">
                    {announcements.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="p-4 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full border border-amber-500/40 mb-4">
                          <Megaphone className="h-8 w-8 text-amber-400" />
                        </div>
                        <h3 className="font-bold text-white text-base mb-1">No Announcements</h3>
                        <p className="text-white/60 text-sm">
                          Check back later for updates from admin.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 p-4">
                        {announcements.map((announcement) => (
                          <div
                            key={announcement.id}
                            className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 transition-all backdrop-blur-xl hover:border-amber-500/50 hover:bg-amber-500/15 cursor-pointer group"
                          >
                            <div className="flex gap-3">
                              <div className="flex-shrink-0 p-2.5 bg-white/10 rounded-lg group-hover:bg-white/20 transition-all">
                                <Megaphone className="h-5 w-5 text-amber-400" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-white group-hover:text-amber-400 transition-colors text-base">{announcement.title}</p>
                                <p className="text-sm text-white/70 mt-2 leading-relaxed break-words">{announcement.message}</p>
                                <p className="text-xs text-white/50 mt-3 font-semibold">
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

              {/* Settings Button */}
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/student/settings')}
                className="h-10 w-10 hover:bg-[#CCFF00]/10"
              >
                <Settings className="h-5 w-5 text-[#CCFF00]" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-4 py-6 safe-area-bottom bg-gradient-to-b from-transparent via-green-900/5 to-green-950/20">
        {/* Active Trip Banner */}
        {currentTrip && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 backdrop-blur-sm text-white shadow-[0_8px_32px_rgba(6,182,212,0.35)] border border-cyan-300/40 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm">
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
                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
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
          
          {/* Giant EMERGENCY Button - For Critical Emergencies */}
          <button
            onClick={handleEmergencyButtonPress}
            disabled={isSending}
            className={`
              relative w-48 h-48 sm:w-56 sm:h-56 rounded-full 
              flex flex-col items-center justify-center 
              transition-all duration-150 
              touch-manipulation select-none group
              ${isSending 
                ? 'bg-red-600 scale-110 animate-pulse' 
                : 'bg-red-600 hover:bg-red-700 active:scale-95 hover:scale-105'
              }
            `}
            style={{
              boxShadow: isSending 
                ? '0 0 60px 20px rgba(220, 38, 38, 0.8), 0 0 100px 40px rgba(220, 38, 38, 0.4)'
                : '0 15px 50px rgba(220, 38, 38, 0.6), 0 8px 20px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <AlertCircle className={`h-16 w-16 sm:h-20 sm:w-20 text-white mb-2 transition-all ${isSending ? 'animate-bounce' : 'group-hover:scale-110'}`} />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-wider leading-tight">
              {isSending ? 'SENDING' : 'EMERGENCY'}
            </span>
            
            {/* Pulse rings when sending */}
            {isSending && (
              <>
                <div className="absolute inset-0 rounded-full border-4 border-white/40 animate-ping" />
                <div className="absolute inset-[-10px] rounded-full border-2 border-white/20 animate-ping" style={{ animationDelay: '0.2s' }} />
              </>
            )}
          </button>

          <p className="text-xs text-white/50 mt-5 text-center max-w-[220px] font-medium">
            {isSending 
              ? '🚨 Alert sent! Help is on the way!'
              : 'For immediate threats'
            }
          </p>

          {/* Separate INCIDENT Report Button */}
          <button
            onClick={handleIncidentReportPress}
            disabled={isSending}
            className="
              relative w-44 h-16 rounded-2xl 
              flex flex-col items-center justify-center gap-1
              transition-all duration-150 
              touch-manipulation select-none mt-8 group
              bg-amber-500 hover:bg-amber-600 active:scale-95 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed
            "
            style={{
              boxShadow: '0 12px 40px rgba(217, 119, 6, 0.5), 0 6px 15px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)'
            }}
          >
            <AlertCircle className="h-6 w-6 text-white transition-all group-hover:scale-110" />
            <span className="text-base font-bold text-white tracking-wide">
              INCIDENT
            </span>
          </button>

          <p className="text-xs text-white/50 mt-3 text-center max-w-[220px] font-medium">
            Report accidents or incidents
          </p>
        </div>

        {/* Bottom Actions */}
        <div className="mt-auto space-y-4 pb-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              className={`relative group overflow-hidden cursor-pointer transition-all duration-300 touch-manipulation bg-gradient-to-br from-blue-600/20 to-blue-900/40 backdrop-blur-xl border border-blue-500/30 hover:border-blue-400/60 rounded-3xl p-5 text-left ${isCreatingTrip ? 'opacity-50' : 'active:scale-95'}`}
              onClick={() => !isCreatingTrip && setIsScanning(true)}
            >
              <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300">
                  <QrCode className="h-6 w-6 text-white" />
                </div>
                <p className="text-base font-bold text-white mb-0.5">Scan QR</p>
                <p className="text-xs text-blue-200/70 font-medium">Start a new ride</p>
              </div>
            </button>

            <button 
              className="relative group overflow-hidden cursor-pointer transition-all duration-300 touch-manipulation bg-gradient-to-br from-emerald-600/20 to-emerald-900/40 backdrop-blur-xl border border-emerald-500/30 hover:border-emerald-400/60 rounded-3xl p-5 text-left active:scale-95"
              onClick={() => navigate('/student/history')}
            >
              <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                  <History className="h-6 w-6 text-white" />
                </div>
                <p className="text-base font-bold text-white mb-0.5">History</p>
                <p className="text-xs text-emerald-200/70 font-medium">View past trips</p>
              </div>
            </button>
          </div>

          {/* Request Tricycle Grab Button */}
          <button 
            className="w-full relative group overflow-hidden cursor-pointer transition-all duration-300 touch-manipulation bg-gradient-to-br from-purple-600/20 to-purple-900/40 backdrop-blur-xl border border-purple-500/30 hover:border-purple-400/60 rounded-3xl p-5 text-left active:scale-95"
            onClick={() => setShowRideRequest(true)}
          >
            <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <Car className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-base font-bold text-white mb-0.5">Request Tricycle</p>
                <p className="text-xs text-purple-200/70 font-medium">Get a ride from available drivers</p>
              </div>
            </div>
          </button>

          {/* Emergency Hotline */}
          <a 
            href="tel:911"
            className="block relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-900/40 to-red-900/40 backdrop-blur-xl border border-rose-500/30 p-1 group active:scale-98 transition-transform"
          >
            <div className="absolute inset-0 bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors" />
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/30">
                  <Phone className="h-5 w-5 text-rose-400 animate-pulse" />
                </div>
                <div>
                  <p className="text-sm font-bold text-rose-100">Emergency Hotline</p>
                  <p className="text-xs text-rose-300/70">Tap to call authorities</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-rose-500 px-4 py-1.5 rounded-full shadow-lg shadow-rose-900/20">
                <span className="text-lg font-black text-white">911</span>
              </div>
            </div>
          </a>
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
        <AlertDialogContent className="bg-white border-2 border-red-500 max-w-sm w-[calc(100%-2rem)] mx-auto shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 text-center text-2xl flex items-center justify-center gap-2">
              <AlertCircle className="h-7 w-7 text-red-600 animate-pulse" />
              Emergency SOS
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-800 text-center text-base font-semibold">
              Are you sure you want to send an emergency alert? Your location will be shared with the admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-4">
            <AlertDialogCancel className="flex-1 m-0 bg-gray-200 border-gray-300 text-gray-800 hover:bg-gray-300 hover:text-gray-900 font-semibold">
              No, Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSOSConfirm}
              className="flex-1 m-0 bg-red-600 hover:bg-red-700 text-white border-0 font-semibold"
            >
              Yes, Send SOS
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Accident Confirmation Dialog */}
      <AlertDialog open={showAccidentConfirm} onOpenChange={setShowAccidentConfirm}>
        <AlertDialogContent className="bg-gradient-to-br from-amber-50 via-white to-orange-50 border-2 border-orange-300 max-w-sm w-[calc(100%-2rem)] mx-auto shadow-2xl shadow-orange-500/30 rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-3xl font-black text-orange-600 flex items-center justify-center gap-2.5 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg shadow-orange-500/50">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              Report Incident
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-700 text-center text-base font-semibold leading-relaxed">
              What type of incident are you reporting? Your location will be shared with the admin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {/* Incident Type Dropdown */}
          <div className="px-6 py-5 bg-gradient-to-br from-orange-100/40 to-amber-100/40 backdrop-blur-xl rounded-2xl border-2 border-orange-200/60 shadow-xl shadow-orange-500/5 hover:shadow-2xl hover:shadow-orange-500/15 hover:border-orange-300/80 transition-all duration-300">
            <label htmlFor="incident-type" className="block text-sm font-bold text-orange-900 mb-3 uppercase tracking-widest drop-shadow-sm">Select Incident Type</label>
            <select
              id="incident-type"
              value={incidentType}
              onChange={(e) => setIncidentType(e.target.value)}
              className="w-full px-4 py-3 border-2 border-orange-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white/90 backdrop-blur-sm text-gray-900 font-semibold text-base hover:border-orange-300 transition-all cursor-pointer shadow-md shadow-orange-500/10"
            >
              {INCIDENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-6 flex-wrap">
            <AlertDialogCancel className="flex-1 min-w-[120px] m-0 bg-gradient-to-r from-gray-200 to-gray-300 border-gray-300 text-gray-800 hover:from-gray-300 hover:to-gray-400 hover:text-gray-900 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl">
              No, Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAccidentConfirm}
              className="flex-1 min-w-[120px] m-0 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white border-0 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-orange-500/40"
            >
              Yes, Report
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ride Request Dialog */}
      <RideRequestDialog
        isOpen={showRideRequest}
        onClose={() => setShowRideRequest(false)}
        studentId={studentData?.id || ''}
        studentName={studentData?.full_name || 'Student'}
      />

    </div>
  );
};

export default Student;
