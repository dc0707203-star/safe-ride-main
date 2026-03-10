import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Bell, Car, Mail, Phone, MapPin, Clock, AlertCircle, CheckCircle, Download, QrCode, Settings, User, Smartphone, Check, Megaphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import QRCodeComponent from "react-qr-code";
import { RideRequestsPanel } from "@/components/RideRequestsPanel";
import campusBg from "@/assets/campus-bg.jpeg";
import isuLogo from "@/assets/isu-logo.png";
import { format } from "date-fns";
import { subscribeToPushNotifications } from "@/lib/notifications";
import { registerServiceWorker } from "@/lib/serviceWorker";
import { useCapacitorPush } from "@/hooks/useCapacitorPush";
import "./DriverDashboard.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Announcement {
  id: string;
  title: string;
  message: string;
  created_at: string;
  type: "info" | "warning" | "success";
}

interface Driver {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  vehicle_type: string;
  license_number: string;
  photo_url?: string;
  qr_code?: string;
  policy_accepted?: boolean;
}

interface ActiveTrip {
  id: string;
  student_id: string;
  driver_id: string;
  status: string;
  start_time: string;
  end_time?: string;
  start_location_lat?: number;
  start_location_lng?: number;
  end_location_lat?: number;
  end_location_lng?: number;
  student?: {
    id: string;
    full_name: string;
    photo_url?: string;
    contact_number?: string;
  };
}

const DriverDashboard = () => {
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [acceptingPolicy, setAcceptingPolicy] = useState(false);
  const [showInbox, setShowInbox] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [confirmingDelivery, setConfirmingDelivery] = useState<string | null>(null);
  const [deliveryCount, setDeliveryCount] = useState(0);
  const maxPassengers = 5;

  // Register Capacitor push notifications
  useCapacitorPush(driver?.user_id || (null as unknown as string), "driver");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          navigate("/driver-login");
          return;
        }

        // Get driver info
        const { data: driverData, error: driverError } = await supabase
          .from("drivers")
          .select("*")
          .eq("user_id", session.user.id)
          .single();

        if (driverError) {
          setAuthError("Driver profile not found");
          navigate("/driver-login");
          return;
        }

        setDriver(driverData);

        // Check if policy needs to be accepted
        if (!driverData.policy_accepted) {
          setShowPolicyModal(true);
        }

        console.log('[DriverDashboard] Driver loaded:', { id: driverData.id, full_name: driverData.full_name });

        // Register Service Worker and subscribe to push notifications
        try {
          await registerServiceWorker();
          await subscribeToPushNotifications(session.user.id, "driver");
          console.log("[DriverDashboard] Web push notifications enabled for driver");
        } catch (error) {
          console.log("[DriverDashboard] Web push setup skipped:", error);
        }

        // Get announcements - only for drivers
        const { data: announcementsData, error: announcementsError } = await supabase
          .from("announcements")
          .select("*")
          .or("user_type.eq.driver,user_type.eq.both")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!announcementsError && announcementsData) {
          setAnnouncements(announcementsData);
          setUnreadCount(announcementsData.length);
          console.log("[DriverDashboard] Loaded driver announcements:", announcementsData.length);
        }

        // Get active trips (all passengers the driver is currently transporting)
        try {
          const { data: tripData, error: tripError } = await supabase
            .from("trips")
            .select("id, student_id, driver_id, status, start_time, start_location_lat, start_location_lng, end_time")
            .eq("driver_id", driverData.id)
            .eq("status", "active")
            .order("start_time", { ascending: true });

          console.log(`[DriverDashboard] Trips query result:`, { tripData, tripError, driverId: driverData.id });

          if (!tripError && tripData) {
            console.log(`[DriverDashboard] Found ${tripData.length} active trips`);
            
            if (tripData.length > 0) {
              // Fetch all students for these trips
              const tripsWithStudents = await Promise.all(
                tripData.map(async (trip) => {
                  const { data: studentData } = await supabase
                    .from("students")
                    .select("id, full_name, photo_url, contact_number")
                    .eq("id", trip.student_id)
                    .single();
                  return {
                    ...trip,
                    student: studentData || undefined
                  };
                })
              );
              
              setActiveTrips(tripsWithStudents as ActiveTrip[]);
              console.log(`[DriverDashboard] Loaded ${tripsWithStudents.length} active trips with student data`);
            } else {
              console.log(`[DriverDashboard] No active trips found yet`);
              setActiveTrips([]);
            }
          } else {
            console.error(`[DriverDashboard] Trip query error:`, tripError);
            setActiveTrips([]);
          }
        } catch (tripError) {
          console.error("[DriverDashboard] Error fetching trips:", tripError);
          setActiveTrips([]);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setAuthError("Failed to load dashboard");
        navigate("/driver-login");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  // Real-time subscription for active trips
  useEffect(() => {
    if (!driver?.id) return;

    console.log('[DriverDashboard] Setting up real-time subscription for trips');

    const subscription = supabase
      .channel(`driver-trips-${driver.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips',
          filter: `driver_id=eq.${driver.id}`
        },
        async (payload) => {
          console.log('[DriverDashboard] Trip change detected:', payload);

          // If a trip was deleted or completed, remove it
          if (payload.eventType === 'DELETE' || (payload.new && (payload.new as any).status === 'completed')) {
            setActiveTrips(prev => prev.filter(t => t.id !== (payload.old?.id || payload.new?.id)));
            return;
          }

          // For INSERT or UPDATE, refresh the trip with student data
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const trip = payload.new as any;
            
            if (trip.status === 'active') {
              // Fetch student data
              const { data: studentData } = await supabase
                .from('students')
                .select('id, full_name, photo_url, contact_number')
                .eq('id', trip.student_id)
                .single();

              const updatedTrip = {
                ...trip,
                student: studentData || undefined
              };

              if (payload.eventType === 'INSERT') {
                // Add new trip
                setActiveTrips(prev => [...prev, updatedTrip]);
                console.log('[DriverDashboard] New passenger added:', trip.student_id);
              } else {
                // Update existing trip
                setActiveTrips(prev =>
                  prev.map(t => t.id === trip.id ? updatedTrip : t)
                );
                console.log('[DriverDashboard] Trip updated:', trip.id);
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [driver?.id]);

  const handleAcceptPolicy = async () => {
    try {
      setAcceptingPolicy(true);
      
      const { error } = await supabase
        .from("drivers")
        .update({ policy_accepted: true })
        .eq("id", driver?.id);

      if (error) {
        toast.error("Failed to accept policy");
        return;
      }

      setDriver(prev => prev ? { ...prev, policy_accepted: true } : null);
      setShowPolicyModal(false);
      toast.success("Policy accepted! Welcome to SafeRide");
    } catch (error) {
      console.error("Error accepting policy:", error);
      toast.error("Failed to accept policy");
    } finally {
      setAcceptingPolicy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const handleInboxOpen = (open: boolean) => {
    if (open) {
      setUnreadCount(0);
    }
  };

  const downloadQRCode = async () => {
    try {
      const canvas = document.querySelector("#driver-qr-code") as HTMLCanvasElement;
      if (!canvas) {
        toast.error("QR Code not found");
        return;
      }

      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = url;
      link.download = `driver-qr-${driver?.license_number}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("QR code downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download QR code");
    }
  };

  const handleDeliveryConfirmation = async (tripId: string) => {
    try {
      setConfirmingDelivery(tripId);
      
      // Mark trip as completed
      const { error } = await supabase
        .from("trips")
        .update({ status: "completed", end_time: new Date().toISOString() })
        .eq("id", tripId);

      if (error) {
        toast.error("Failed to confirm delivery");
        setConfirmingDelivery(null);
        return;
      }

      // Remove the trip from the list
      const studentName = activeTrips.find(t => t.id === tripId)?.student?.full_name || "Student";
      setActiveTrips(prev => prev.filter(trip => trip.id !== tripId));
      
      // Increment delivery counter
      setDeliveryCount(prev => prev + 1);

      toast.success(`✅ ${studentName} safely delivered home!`);
      
      console.log(`[DriverDashboard] Trip ${tripId} marked as completed`);
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast.error("Failed to confirm delivery");
    } finally {
      setConfirmingDelivery(null);
    }
  };

  const getAnnouncementIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      default:
        return <Bell className="h-5 w-5 text-blue-400" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 flex items-center justify-center">
        <div className="text-center">
          <Car className="h-12 w-12 text-[#CCFF00] mx-auto mb-4 animate-pulse" />
          <p className="text-white text-lg">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-red-500/10 border-red-500/50">
          <CardHeader>
            <CardTitle className="text-red-400">Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-white mb-4">{authError}</p>
            <Button onClick={() => navigate("/driver-login")} variant="outline" className="w-full">
              Go to Driver Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 relative overflow-x-hidden bg-slate-950">
      {/* Gradient Overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950" />

      {/* Mobile Header */}
      <div className="z-10 sticky top-0 bg-gradient-to-b from-slate-900 via-slate-800 to-transparent backdrop-blur-xl border-b border-[#CCFF00]/20 shadow-lg">
        <div className="px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#CCFF00] via-lime-300 to-green-400 p-2.5 rounded-xl shadow-[0_0_30px_rgba(204,255,0,0.5)]">
              <img src={isuLogo} alt="ISU Logo" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="text-lg font-black bg-gradient-to-r from-[#CCFF00] to-lime-300 bg-clip-text text-transparent">SafeRide</h1>
              <p className="text-xs text-white/60 font-medium">{driver?.full_name || 'Driver'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Inbox Button */}
            <button
              onClick={() => {
                handleInboxOpen(true);
                setShowInbox(true);
              }}
              title="Announcements"
              className="relative p-2.5 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:border-blue-500/60 hover:bg-blue-500/30 rounded-xl transition-all shadow-lg shadow-blue-500/10"
            >
              <Megaphone className="h-6 w-6 text-blue-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-lg">
                  {unreadCount}
                </span>
              )}
            </button>
            {/* Settings Button */}
            <button
              onClick={() => navigate("/driver-settings")}
              title="Settings"
              className="p-2.5 bg-gradient-to-br from-[#CCFF00]/20 to-green-400/20 border border-[#CCFF00]/30 hover:border-[#CCFF00]/60 hover:bg-[#CCFF00]/30 rounded-xl transition-all shadow-lg shadow-[#CCFF00]/10"
            >
              <Settings className="h-6 w-6 text-[#CCFF00]" />
            </button>
          </div>
        </div>
      </div>

      {/* Inbox Sidebar */}
      {showInbox && (
        <div className="fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowInbox(false)}
          />
          {/* Inbox Panel */}
          <div className="w-[90%] sm:max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-l border-[#CCFF00]/20 flex flex-col shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between gap-3 p-4 border-b border-[#CCFF00]/20 bg-gradient-to-r from-black/80 to-black/40 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-[#CCFF00] via-lime-300 to-green-400 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.4)]">
                  <Megaphone className="h-5 w-5 text-green-950" />
                </div>
                <h2 className="text-lg font-bold text-white">Announcements</h2>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowInbox(false)}
                title="Close"
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white/70" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-white/50">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No announcements yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="p-4 rounded-xl bg-white/5 border border-[#CCFF00]/20 hover:border-[#CCFF00]/50 hover:bg-white/10 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-[#CCFF00]/20 flex-shrink-0 mt-0.5">
                          <Megaphone className="h-4 w-4 text-[#CCFF00]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white text-sm">{announcement.title}</p>
                          <p className="text-xs text-white/70 mt-1.5 leading-relaxed">{announcement.message}</p>
                          <p className="text-xs text-[#CCFF00]/60 mt-2">
                            {format(new Date(announcement.created_at), 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Mobile First */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-6 w-full">
        {/* Passengers Section */}
        <div className="mb-8">
          {/* Header with passenger count */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-emerald-400 to-green-500 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.6)]">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-emerald-300 text-xs font-black uppercase tracking-widest">Your Passengers</p>
                <p className="text-white font-black text-base">{activeTrips.length} / {maxPassengers} Onboard</p>
              </div>
            </div>
            {deliveryCount > 0 && (
              <div className="text-right">
                <p className="text-emerald-400 text-xs font-semibold uppercase">Delivered</p>
                <p className="text-white font-bold text-lg">{deliveryCount}</p>
              </div>
            )}
          </div>

          {/* Passengers list or empty state */}
          {activeTrips.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-600/40 rounded-2xl p-8 text-center">
              <User className="h-12 w-12 text-slate-500 mx-auto mb-3 opacity-50" />
              <p className="text-slate-400 font-semibold mb-1">No passengers yet</p>
              <p className="text-slate-500 text-sm">Scan student QR codes to start accepting rides</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeTrips.map((trip) => (
                <div key={trip.id} className="group relative overflow-hidden rounded-2xl">
                  {/* Glow effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/40 via-green-400/40 to-emerald-500/40 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300" />
                  
                  <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-emerald-400/50 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center gap-4">
                      {/* Student Photo */}
                      <div className="flex-shrink-0">
                        {trip.student?.photo_url ? (
                          <img
                            src={trip.student.photo_url}
                            alt={trip.student.full_name}
                            className="h-16 w-16 rounded-xl object-cover border-3 border-emerald-400 shadow-lg"
                          />
                        ) : (
                          <div className="h-16 w-16 rounded-xl bg-emerald-500/40 flex items-center justify-center border-3 border-emerald-400 shadow-lg">
                            <User className="h-8 w-8 text-emerald-300" />
                          </div>
                        )}
                      </div>

                      {/* Student Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-base truncate">{trip.student?.full_name}</p>
                        {trip.student?.contact_number && (
                          <p className="text-emerald-300 text-xs flex items-center gap-1.5 mt-1">
                            <Phone className="h-3.5 w-3.5" />
                            {trip.student.contact_number}
                          </p>
                        )}
                        <p className="text-emerald-200 text-xs font-semibold mt-2 flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          Started {format(new Date(trip.start_time), 'h:mm a')}
                        </p>
                      </div>

                      {/* OK Button */}
                      <button
                        onClick={() => handleDeliveryConfirmation(trip.id)}
                        disabled={confirmingDelivery === trip.id}
                        className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-emerald-500/50 active:scale-95 flex items-center gap-2"
                      >
                        {confirmingDelivery === trip.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Confirming...
                          </>
                        ) : (
                          <>
                            <Check className="h-5 w-5" />
                            OK
                          </>
                        )}
                      </button>
                    </div>

                    {/* Pickup location */}
                    {trip.start_location_lat && (
                      <div className="mt-3 pt-3 border-t border-emerald-400/20 flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <p className="text-emerald-200 text-xs">Pickup: {trip.start_location_lat.toFixed(4)}, {trip.start_location_lng?.toFixed(4)}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ride Requests Section */}
        {driver?.id && (
          <div className="mb-8 bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-500/30 rounded-2xl p-6 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-lg bg-purple-500/20 border border-purple-500/30">
                <Car className="h-5 w-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-white">Tricycle Grab Requests</h2>
            </div>
            <RideRequestsPanel driverId={driver.id} />
          </div>
        )}

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {/* QR Code Button */}
          <button
            onClick={() => setShowQRModal(true)}
            className="group relative flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-white/8 via-white/3 to-black/50 border-2 border-[#CCFF00]/40 hover:border-[#CCFF00]/80 rounded-2xl transition-all duration-300 shadow-lg shadow-[#CCFF00]/10 hover:shadow-[#CCFF00]/30 active:scale-95 backdrop-blur-sm overflow-hidden"
          >
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#CCFF00]/0 to-[#CCFF00]/0 group-hover:from-[#CCFF00]/10 group-hover:to-[#CCFF00]/5 transition-all" />
            
            <div className="relative p-3.5 bg-gradient-to-br from-[#CCFF00] via-lime-300 to-green-400 rounded-xl shadow-[0_0_25px_rgba(204,255,0,0.5)] group-hover:shadow-[0_0_35px_rgba(204,255,0,0.7)] transition-all">
              <QrCode className="h-6 w-6 text-green-950" />
            </div>
            <span className="relative text-white text-sm font-bold group-hover:text-[#CCFF00] transition-colors">My QR Code</span>
          </button>

          {/* Status */}
          <div className="group relative flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-white/8 via-white/3 to-black/50 border-2 border-emerald-500/40 hover:border-emerald-400/80 rounded-2xl transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/30 backdrop-blur-sm overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-emerald-500/0 group-hover:from-emerald-500/10 group-hover:to-emerald-500/5 transition-all" />
            
            <div className="relative p-3.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-[0_0_25px_rgba(74,222,128,0.5)] animate-pulse group-hover:shadow-[0_0_35px_rgba(74,222,128,0.7)]">
              <Smartphone className="h-6 w-6 text-green-950" />
            </div>
            <div className="relative text-center">
              <span className="text-white text-sm font-bold block group-hover:text-emerald-400 transition-colors">Online</span>
              <span className="text-emerald-400 text-xs font-semibold group-hover:text-emerald-300 transition-colors">Ready</span>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Agreement Modal */}
      <Dialog open={showPolicyModal} onOpenChange={setShowPolicyModal}>
        <DialogContent className="bg-gradient-to-br from-amber-50 via-white to-emerald-50 border-none text-slate-900 max-w-2xl w-[calc(100%-2rem)] mx-auto rounded-3xl shadow-2xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="sticky top-0 z-50 border-b border-emerald-200 bg-white/80 backdrop-blur-md px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-full bg-gradient-to-br from-[#CCFF00] to-lime-300 shadow-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-emerald-950" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900">SafeRide Driver Agreement</h2>
                <p className="text-sm text-slate-600">Please read and accept to continue</p>
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
            {/* Intro Box */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-2 border-emerald-200 rounded-2xl p-4 shadow-sm">
              <p className="text-slate-700 text-sm leading-relaxed font-medium">
                Before accessing your driver dashboard, please read and accept our Driver Terms of Service and Community Guidelines. Your compliance is essential to maintaining safety and professionalism.
              </p>
            </div>

            {/* Terms List */}
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-emerald-900 font-bold text-base flex items-center gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#CCFF00] to-lime-300 flex items-center justify-center text-xs font-black text-emerald-950">1</span>
                  Safety Commitment
                </h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  I commit to maintaining a safe and respectful environment for all students. I will follow all traffic laws and safety regulations.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-emerald-900 font-bold text-base flex items-center gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#CCFF00] to-lime-300 flex items-center justify-center text-xs font-black text-emerald-950">2</span>
                  Professional Conduct
                </h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  I agree to conduct myself professionally at all times. Any form of harassment, discrimination, or inappropriate behavior is strictly prohibited.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-emerald-900 font-bold text-base flex items-center gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#CCFF00] to-lime-300 flex items-center justify-center text-xs font-black text-emerald-950">3</span>
                  Service Reliability
                </h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  I commit to providing reliable and punctual service. I will update my availability status and communicate any changes promptly.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-emerald-900 font-bold text-base flex items-center gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#CCFF00] to-lime-300 flex items-center justify-center text-xs font-black text-emerald-950">4</span>
                  Data Privacy
                </h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  I understand that student data is confidential and protected. I will not share any personal information with unauthorized parties.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-emerald-900 font-bold text-base flex items-center gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#CCFF00] to-lime-300 flex items-center justify-center text-xs font-black text-emerald-950">5</span>
                  Vehicle Maintenance
                </h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  I commit to maintaining my vehicle in good condition and following all maintenance requirements set by SafeRide.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-emerald-900 font-bold text-base flex items-center gap-2 mb-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#CCFF00] to-lime-300 flex items-center justify-center text-xs font-black text-emerald-950">6</span>
                  Compliance & Accountability
                </h3>
                <p className="text-slate-700 text-xs leading-relaxed">
                  I agree to comply with all SafeRide policies and procedures. Violation of these terms may result in account suspension or termination.
                </p>
              </div>
            </div>

            {/* Warning Box */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-100 border-2 border-amber-300 rounded-2xl p-4 shadow-sm mt-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900 text-sm">Important Notice</p>
                  <p className="text-xs text-amber-800 mt-1">
                    By clicking "Accept and Continue", you confirm that you have read, understood, and agree to comply with all terms and conditions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer - Sticky */}
          <div className="sticky bottom-0 border-t border-emerald-200 bg-white/80 backdrop-blur-md px-6 py-4 space-y-3">
            <Button
              onClick={handleAcceptPolicy}
              disabled={acceptingPolicy}
              className="w-full h-12 rounded-xl gap-2 text-base font-bold bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg transition-all disabled:opacity-50"
            >
              {acceptingPolicy ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Accept and Continue
                </span>
              )}
            </Button>
            <Button
              onClick={() => navigate("/driver-login")}
              variant="outline"
              className="w-full h-10 rounded-xl border-emerald-300 text-slate-900 hover:bg-emerald-50 font-semibold"
            >
              Decline
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* QR Code Modal */}
      <Dialog open={showQRModal} onOpenChange={setShowQRModal}>
        <DialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-[#CCFF00]/20 text-white max-w-sm w-[calc(100%-2rem)] mx-auto rounded-3xl shadow-2xl shadow-black/80">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-black">Your QR Code</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-5 py-4">
            <p className="text-white/80 text-sm text-center leading-relaxed font-semibold">
              📱 Students scan this code when boarding your tricycle
            </p>

            <div className="bg-white p-6 rounded-3xl shadow-2xl shadow-[#CCFF00]/30 border-2 border-[#CCFF00]/50">
              {driver?.qr_code && (
                <QRCodeComponent
                  id="driver-qr-code"
                  value={driver.qr_code}
                  size={200}
                  level="H"
                />
              )}
            </div>

            <Button
              onClick={downloadQRCode}
              className="w-full gap-2 bg-gradient-to-r from-[#CCFF00] to-[#a8e600] text-green-950 hover:shadow-lg hover:shadow-[#CCFF00]/50 font-bold rounded-2xl transition-all text-sm py-3"
            >
              <Download className="h-5 w-5" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DriverDashboard;
