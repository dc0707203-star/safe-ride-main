import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Car, Route, AlertCircle, LogOut, UserPlus, 
  ChevronRight, Bell, Activity, TrendingUp, Clock, History, Megaphone, Send,
  MapPin, User, X, Settings, LogOut as LogOutIcon, Maximize, Minimize,
  Server, Database, Zap, HelpCircle, Bug, Mail, BookOpen, Download, FileText, Logs
} from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { sendPushNotifications, playNotificationSound } from "@/lib/notifications";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { EmergencyAlertDialog } from "@/components/EmergencyAlertDialog";
import isuLogo from "@/assets/isu-logo.png";
import riseCenter from "@/assets/rise-center.png";
import campusBg from "@/assets/campus-bg.jpeg";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


interface ActiveTrip {
  id: string;
  start_time: string;
  student: { full_name: string; student_id_number: string; photo_url: string | null; course: string | null };
  driver: { full_name: string; tricycle_plate_number: string; photo_url: string | null };
}

interface Activity {
  type: 'student_registration' | 'trip_completed' | 'driver_approved' | 'alert_triggered';
  title: string;
  description: string;
  timestamp: Date;
  icon: 'UserPlus' | 'Route' | 'Car' | 'AlertCircle';
  color: 'blue' | 'green' | 'amber' | 'red';
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading, userRole } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalDrivers: 0,
    activeTrips: 0,
    activeAlerts: 0,
  });
  const [showAnnouncementDialog, setShowAnnouncementDialog] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showDriverAnnouncementDialog, setShowDriverAnnouncementDialog] = useState(false);
  const [driverAnnouncementTitle, setDriverAnnouncementTitle] = useState("");
  const [driverAnnouncementMessage, setDriverAnnouncementMessage] = useState("");
  const [driverAnnouncementType, setDriverAnnouncementType] = useState<"info" | "warning" | "success">("info");
  const [isSendingDriver, setIsSendingDriver] = useState(false);
  const [driverSendOption, setDriverSendOption] = useState<"all" | "selected">("all");
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<Set<string>>(new Set());
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentHour] = useState(new Date().getHours());
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [systemMetrics, setSystemMetrics] = useState({
    uptime: '99.8%',
    lastSync: new Date(),
    responseTime: 45,
    activeSessions: 1,
  });

  const [showIsuLogo, setShowIsuLogo] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowIsuLogo(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Scroll animation refs
  const { ref: welcomeRef, isVisible: welcomeVisible } = useScrollAnimation();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: activityRef, isVisible: activityVisible } = useScrollAnimation();
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollAnimation();
  const { ref: footerRef, isVisible: footerVisible } = useScrollAnimation();

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login?type=admin');
      } else if (userRole !== null && userRole !== 'admin') {
        navigate('/');
      }
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const studentsRes = await supabase.from('students' as any).select('id', { count: 'exact', head: true });
        const driversRes = await supabase.from('drivers' as any).select('id', { count: 'exact', head: true });
        const tripsRes = await supabase.from('trips' as any).select('id', { count: 'exact', head: true }).eq('status', 'active');
        const alertsRes = await supabase.from('alerts' as any).select('id', { count: 'exact', head: true }).eq('status', 'active');

        setStats({
          totalStudents: studentsRes.count || 0,
          totalDrivers: driversRes.count || 0,
          activeTrips: tripsRes.count || 0,
          activeAlerts: alertsRes.count || 0,
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    const fetchActiveTrips = async () => {
      try {
        const { data, error } = await supabase
          .from('trips' as any)
          .select(`
            id,
            start_time,
            students!inner(full_name, student_id_number, photo_url, course),
            drivers!inner(full_name, tricycle_plate_number, photo_url)
          `)
          .eq('status', 'active')
          .order('start_time', { ascending: false });

        if (error) throw error;

        const formatted = (data || []).map((trip: any) => ({
          id: trip.id,
          start_time: trip.start_time,
          student: trip.students,
          driver: trip.drivers,
        }));
        setActiveTrips(formatted);
      } catch (error) {
        console.error('Error fetching active trips:', error);
      }
    };

    if (user && userRole === 'admin') {
      fetchStats();
      fetchActiveTrips();
      fetchRecentActivities();

      // Real-time updates
      const channel = supabase
        .channel('admin-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, () => {
          fetchStats();
          fetchRecentActivities();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
          fetchStats();
          fetchRecentActivities();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
          fetchStats();
          fetchActiveTrips();
          fetchRecentActivities();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, () => {
          fetchStats();
          fetchRecentActivities();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, userRole]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
    }
  };

  // Send FCM notification via Edge Function
  const sendFCMNotification = async (userType: "driver" | "student" | "both", title: string, body: string) => {
    try {
      console.log("[Admin] Sending FCM notification to", userType, "...");
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke('send-fcm-notifications', {
        body: {
          userType,
          title,
          body,
          data: {
            type: 'announcement',
            timestamp: new Date().toISOString(),
          },
        },
      });

      if (response.error) {
        console.error("[Admin] FCM error:", response.error);
        return false;
      }

      console.log("[Admin] FCM response:", response.data);
      return true;
    } catch (error) {
      console.error("[Admin] Error sending FCM:", error);
      return false;
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    setIsSending(true);
    try {
      console.log("[Admin] Sending STUDENT announcement:", announcementTitle);
      
      const { data, error } = await supabase.from('announcements' as any).insert({
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        created_by: user?.id,
        is_active: true,
        user_type: 'student',
      }).select();

      if (error) throw error;

      console.log("[Admin] Student announcement inserted:", data);

      // Send FCM notifications to all students
      try {
        console.log("[Admin] Triggering FCM notifications for students...");
        const fcmResult = await sendFCMNotification("student", announcementTitle, announcementMessage);
        console.log("[Admin] FCM result:", fcmResult);
        
        // Also try web push as fallback
        try {
          const pushResult = await sendPushNotifications("student", announcementTitle, announcementMessage);
          console.log("[Admin] Web push result:", pushResult);
        } catch (pushError) {
          console.error("[Admin] Web push failed:", pushError);
        }
      } catch (pushError) {
        console.error("[Admin] FCM notification failed:", pushError);
      }

      toast.success("Announcement sent to all users!");
      playNotificationSound('success');
      setAnnouncementTitle("");
      setAnnouncementMessage("");
      setShowAnnouncementDialog(false);
    } catch (error) {
      console.error('Error sending announcement:', error);
      toast.error("Failed to send announcement");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendDriverAnnouncement = async () => {
    if (!driverAnnouncementTitle.trim() || !driverAnnouncementMessage.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    if (driverSendOption === "selected" && selectedDrivers.size === 0) {
      toast.error("Please select at least one driver");
      return;
    }

    setIsSendingDriver(true);
    try {
      if (!user?.id) {
        toast.error("User ID not found");
        return;
      }

      console.log("[Admin] Sending DRIVER announcement:", driverAnnouncementTitle);

      const { data, error } = await supabase
        .from('announcements')
        .insert([{
          title: driverAnnouncementTitle.trim(),
          message: driverAnnouncementMessage.trim(),
          created_by: user.id,
          is_active: true,
          user_type: 'driver',
        }])
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log("[Admin] Driver announcement inserted:", data);

      // Send FCM notifications to all drivers
      try {
        console.log("[Admin] Triggering FCM notifications for drivers...");
        const fcmResult = await sendFCMNotification("driver", driverAnnouncementTitle, driverAnnouncementMessage);
        console.log("[Admin] FCM result:", fcmResult);
        
        // Also try web push as fallback
        try {
          const pushResult = await sendPushNotifications("driver", driverAnnouncementTitle, driverAnnouncementMessage, {
            type: driverAnnouncementType,
          });
          console.log("[Admin] Web push result:", pushResult);
        } catch (pushError) {
          console.error("[Admin] Web push failed:", pushError);
        }
      } catch (pushError) {
        console.error("[Admin] FCM notification failed:", pushError);
      }

      const targetCount = driverSendOption === "all" ? allDrivers.length : selectedDrivers.size;
      toast.success(`Announcement sent to ${targetCount} driver${targetCount !== 1 ? 's' : ''}!`);
      playNotificationSound('success');
      setDriverAnnouncementTitle("");
      setDriverAnnouncementMessage("");
      setDriverAnnouncementType("info");
      setDriverSendOption("all");
      setSelectedDrivers(new Set());
      setShowDriverAnnouncementDialog(false);
    } catch (error) {
      console.error('Error sending driver announcement:', error);
      toast.error("Failed to send announcement");
    } finally {
      setIsSendingDriver(false);
    }
  };

  const fetchAllDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const { data, error } = await supabase
        .from("drivers")
        .select("*")
        .order("full_name");

      if (error) throw error;
      setAllDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error("Failed to load drivers");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const toggleDriverSelection = (driverId: string) => {
    const newSelected = new Set(selectedDrivers);
    if (newSelected.has(driverId)) {
      newSelected.delete(driverId);
    } else {
      newSelected.add(driverId);
    }
    setSelectedDrivers(newSelected);
  };

  const toggleAllDrivers = () => {
    if (selectedDrivers.size === allDrivers.length) {
      setSelectedDrivers(new Set());
    } else {
      setSelectedDrivers(new Set(allDrivers.map(d => d.id)));
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setShowSearchResults(true);
    try {
      const searchTerm = `%${query}%`;
      
      // Search students
      const { data: students } = await supabase
        .from('students' as any)
        .select('id, full_name, student_id_number, course')
        .ilike('full_name', searchTerm)
        .limit(5);

      // Search drivers
      const { data: drivers } = await supabase
        .from('drivers' as any)
        .select('id, full_name, tricycle_plate_number')
        .ilike('full_name', searchTerm)
        .limit(5);

      // Search trips by student or driver
      const { data: trips } = await supabase
        .from('trips' as any)
        .select(`
          id,
          start_time,
          status,
          students!inner(full_name, student_id_number),
          drivers!inner(full_name, tricycle_plate_number)
        `)
        .or(`students.full_name.ilike.${searchTerm},drivers.full_name.ilike.${searchTerm}`)
        .limit(5);

      const results: any[] = [];
      
      if (students && Array.isArray(students)) {
        results.push(...students.map((s: any) => ({ type: 'student', ...s })));
      }
      
      if (drivers && Array.isArray(drivers)) {
        results.push(...drivers.map((d: any) => ({ type: 'driver', ...d })));
      }
      
      if (trips && Array.isArray(trips)) {
        results.push(...trips.map((t: any) => ({ type: 'trip', ...t })));
      }

      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      // Fetch recent students
      const { data: recentStudents } = await supabase
        .from('students' as any)
        .select('id, full_name, student_id_number, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      // Fetch completed trips
      const { data: completedTrips } = await supabase
        .from('trips' as any)
        .select(`
          id,
          start_time,
          end_time,
          students!inner(full_name),
          drivers!inner(full_name)
        `)
        .eq('status', 'completed')
        .order('end_time', { ascending: false })
        .limit(2);

      // Fetch recent drivers
      const { data: recentDrivers } = await supabase
        .from('drivers' as any)
        .select('id, full_name, tricycle_plate_number, created_at')
        .order('created_at', { ascending: false })
        .limit(2);

      // Fetch recent alerts
      const { data: recentAlerts } = await supabase
        .from('alerts' as any)
        .select(`
          id,
          created_at,
          status,
          students!inner(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(2);

      const activities: Activity[] = [];

      // Add student registrations
      if (recentStudents && Array.isArray(recentStudents)) {
        recentStudents.forEach((student: any) => {
          if (student?.full_name && student?.student_id_number) {
            activities.push({
              type: 'student_registration',
              title: 'New student registered',
              description: `${student.full_name} - Student ID: ${student.student_id_number}`,
              timestamp: new Date(student.created_at),
              icon: 'UserPlus',
              color: 'blue'
            });
          }
        });
      }

      // Add completed trips
      if (completedTrips && Array.isArray(completedTrips)) {
        completedTrips.forEach((trip: any) => {
          if (trip?.end_time && trip?.start_time && trip?.students && trip?.drivers) {
            const duration = Math.round(
              (new Date(trip.end_time).getTime() - new Date(trip.start_time).getTime()) / 60000
            );
            activities.push({
              type: 'trip_completed',
              title: 'Trip completed',
              description: `${trip.students.full_name} → Driver: ${trip.drivers.full_name} (${duration} mins)`,
              timestamp: new Date(trip.end_time),
              icon: 'Route',
              color: 'green'
            });
          }
        });
      }

      // Add driver approvals
      if (recentDrivers && Array.isArray(recentDrivers)) {
        recentDrivers.forEach((driver: any) => {
          if (driver?.full_name && driver?.tricycle_plate_number) {
            activities.push({
              type: 'driver_approved',
              title: 'New driver approved',
              description: `${driver.full_name} - Tricycle: ${driver.tricycle_plate_number}`,
              timestamp: new Date(driver.created_at),
              icon: 'Car',
              color: 'amber'
            });
          }
        });
      }

      // Add alerts
      if (recentAlerts && Array.isArray(recentAlerts)) {
        recentAlerts.forEach((alert: any) => {
          if (alert?.students?.full_name && alert?.created_at) {
            activities.push({
              type: 'alert_triggered',
              title: 'Safety alert triggered',
              description: `${alert.students.full_name} reported feeling unsafe`,
              timestamp: new Date(alert.created_at),
              icon: 'AlertCircle',
              color: 'red'
            });
          }
        });
      }

      // Sort by timestamp and take 4 most recent
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setRecentActivities(activities.slice(0, 4));
    } catch (error) {
      console.error('Error fetching recent activities:', error);
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts' as any)
        .update({ status: 'resolved', resolved_at: new Date().toISOString() })
        .eq('id', alertId);

      if (error) throw error;
      toast.success("Alert resolved successfully");
    } catch (error: any) {
      toast.error("Failed to resolve alert");
    }
  };

  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diffMs = now - start;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ${mins % 60}m`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={showIsuLogo ? 'isu' : 'rise'}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5 }}
              >
                {showIsuLogo ? (
                  <img src={isuLogo} alt="ISU Logo" className="h-14 w-14" />
                ) : (
                  <img src={riseCenter} alt="RISE Center Logo" className="h-14 w-14 object-cover rounded-full" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <p className="text-white/70 text-lg">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "Register Driver",
      description: "Add new tricycle driver",
      icon: Car,
      route: '/admin/register-driver',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      title: "Register Student",
      description: "Add new student account",
      icon: UserPlus,
      route: '/admin/register-student',
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      title: "Drivers List",
      description: "View all drivers",
      icon: Car,
      route: '/admin/drivers',
      gradient: 'from-violet-500 to-purple-500',
    },
    {
      title: "Students List",
      description: "Manage students",
      icon: Users,
      route: '/admin/students',
      gradient: 'from-pink-500 to-rose-500',
    },
    {
      title: "Ongoing Trips",
      description: "Monitor trips",
      icon: Route,
      route: '/admin/trips',
      gradient: 'from-orange-500 to-amber-500',
    },
    {
      title: "Emergency Alerts",
      description: "View alerts",
      icon: AlertCircle,
      route: '/admin/alerts',
      gradient: 'from-red-500 to-rose-600',
      badge: stats.activeAlerts > 0 ? stats.activeAlerts : null,
    },
    {
      title: "Announcements",
      description: "View history",
      icon: History,
      route: '/admin/announcements',
      gradient: 'from-amber-500 to-yellow-500',
    },
  ];

  return (
    <>
      <EmergencyAlertDialog onResolve={handleResolveAlert} />
      <div className="min-h-screen relative">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <img src={campusBg} alt="" className="w-full h-full object-cover blur-xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-green-950/90 via-green-900/85 to-green-950/90" />
        </div>
        
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-green-900/40 border-b border-[#CCFF00]/10">
          <div className="w-full px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white/80 rounded-full shadow-lg backdrop-blur-sm hover:bg-white/90 transition-all">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={showIsuLogo ? 'isu' : 'rise'}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.5 }}
                    >
                      {showIsuLogo ? (
                        <img src={isuLogo} alt="ISU Logo" className="h-9 w-9 sm:h-11 sm:w-11" />
                      ) : (
                        <img src={riseCenter} alt="RISE Center Logo" className="h-9 w-9 sm:h-11 sm:w-11 object-cover rounded-full" />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#CCFF00] via-lime-300 to-green-400 bg-clip-text text-transparent">SafeRide ISU</h1>
                  <p className="text-xs sm:text-sm text-white/50">Admin Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Search Bar */}
                <div className="hidden md:relative md:flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-3 py-2 backdrop-blur-xl">
                  <MapPin className="h-4 w-4 text-[#CCFF00]" />
                  <Input
                    type="text"
                    placeholder="Search students, drivers, trips..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    onFocus={() => searchQuery && setShowSearchResults(true)}
                    className="bg-transparent border-none text-white placeholder:text-white/40 focus:outline-none h-8 text-sm w-48"
                  />
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border border-white/20 rounded-xl backdrop-blur-xl z-50 max-h-64 overflow-y-auto">
                      {searchResults.map((result, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 text-white/80 text-sm border-b border-white/10 hover:bg-white/10 cursor-pointer transition"
                          onClick={() => {
                            if (result.type === 'student') {
                              navigate(`/admin/students?id=${result.id}`);
                            } else if (result.type === 'driver') {
                              navigate(`/admin/drivers?id=${result.id}`);
                            } else if (result.type === 'trip') {
                              navigate(`/admin/trips?id=${result.id}`);
                            }
                            setSearchQuery("");
                            setShowSearchResults(false);
                          }}
                        >
                          {result.type === 'student' && `👤 ${result.full_name} (${result.student_id_number})`}
                          {result.type === 'driver' && `🚙 ${result.full_name} (${result.tricycle_plate_number})`}
                          {result.type === 'trip' && `🛣️ ${result.students?.full_name} → ${result.drivers?.full_name}`}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Dialog open={showDriverAnnouncementDialog} onOpenChange={setShowDriverAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl px-4 sm:px-5 h-11 font-semibold shadow-lg shadow-blue-500/30 transition-all hover:shadow-blue-500/40 active:scale-95">
                      <Car className="h-5 w-5" />
                      <span className="hidden sm:inline">Drivers</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/20 text-white shadow-2xl rounded-2xl mx-auto w-[calc(100%-2rem)] sm:w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 rounded-2xl pointer-events-none" />
                    <DialogHeader className="relative space-y-3 pb-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 shadow-lg shadow-blue-500/40">
                          <Car className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                            Driver Announcement
                          </DialogTitle>
                          <DialogDescription className="text-white/60 text-sm mt-1">
                            Broadcast a message to all or selected drivers
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="relative space-y-3 py-2 max-h-[60vh] overflow-y-auto pr-4">
                      {/* Send Option */}
                      <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/30 transition">
                        <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-blue-400" />
                          Send to:
                        </label>
                        <div className="space-y-1.5">
                          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-500/10 transition">
                            <input
                              type="radio"
                              name="sendOption"
                              value="all"
                              checked={driverSendOption === "all"}
                              onChange={() => {
                                setDriverSendOption("all");
                                setSelectedDrivers(new Set());
                              }}
                              className="w-4 h-4 accent-blue-500"
                            />
                            <div className="flex-1">
                              <span className="text-white text-xs font-medium">All Drivers</span>
                              <span className="text-white/50 text-xs ml-2">({allDrivers.length})</span>
                            </div>
                          </label>
                          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-blue-500/10 transition">
                            <input
                              type="radio"
                              name="sendOption"
                              value="selected"
                              checked={driverSendOption === "selected"}
                              onChange={() => {
                                setDriverSendOption("selected");
                                if (allDrivers.length === 0) {
                                  fetchAllDrivers();
                                }
                              }}
                              className="w-4 h-4 accent-blue-500"
                            />
                            <div className="flex-1">
                              <span className="text-white text-xs font-medium">Selected Drivers</span>
                              <span className="text-white/50 text-xs ml-2">({selectedDrivers.size})</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Driver Selection List */}
                      {driverSendOption === "selected" && (
                        <div className="space-y-2 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-blue-500/30 transition">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 text-blue-400" />
                              Select:
                            </label>
                            {allDrivers.length > 0 && (
                              <button
                                onClick={toggleAllDrivers}
                                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition px-2 py-1 rounded-lg hover:bg-blue-500/20"
                              >
                                {selectedDrivers.size === allDrivers.length ? "Deselect All" : "Select All"}
                              </button>
                            )}
                          </div>
                          {loadingDrivers ? (
                            <div className="text-center py-3">
                              <div className="inline-block h-4 w-4 border-2 border-white/30 border-t-blue-400 rounded-full animate-spin" />
                              <p className="text-white/60 text-xs mt-1">Loading...</p>
                            </div>
                          ) : allDrivers.length === 0 ? (
                            <div className="text-center py-3 text-white/60">
                              <p className="text-xs">No drivers found</p>
                            </div>
                          ) : (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {allDrivers.map((driver) => (
                                <label key={driver.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedDrivers.has(driver.id)}
                                    onChange={() => toggleDriverSelection(driver.id)}
                                    className="w-4 h-4"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-sm font-medium truncate">{driver.full_name}</p>
                                    <p className="text-white/50 text-xs truncate">{driver.license_number}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                          <Bell className="h-3.5 w-3.5 text-blue-400" />
                          Title
                        </label>
                        <Input
                          placeholder="Safety Update, Route Change..."
                          value={driverAnnouncementTitle}
                          onChange={(e) => setDriverAnnouncementTitle(e.target.value)}
                          maxLength={100}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 h-9 text-xs rounded-xl transition"
                        />
                        <div className="text-xs text-white/40">{driverAnnouncementTitle.length}/100</div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                          <AlertCircle className="h-3.5 w-3.5 text-blue-400" />
                          Type
                        </label>
                        <select
                          value={driverAnnouncementType}
                          onChange={(e) => setDriverAnnouncementType(e.target.value as any)}
                          className="w-full bg-white/10 border border-white/20 text-white rounded-xl px-3 py-2 focus:border-blue-500/50 focus:ring-blue-500/20 transition text-xs"
                        >
                          <option value="info">ℹ️ Information</option>
                          <option value="warning">⚠️ Warning</option>
                          <option value="success">✅ Success</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-white/90 flex items-center gap-2">
                          <Send className="h-3.5 w-3.5 text-blue-400" />
                          Message
                        </label>
                        <Textarea
                          placeholder="Type your message for drivers here..."
                          value={driverAnnouncementMessage}
                          onChange={(e) => setDriverAnnouncementMessage(e.target.value)}
                          rows={3}
                          maxLength={500}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-blue-500/50 focus:ring-blue-500/20 resize-none text-xs rounded-xl transition"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/40">💡 Keep it clear and concise</span>
                          <span className={`font-medium ${driverAnnouncementMessage.length > 450 ? 'text-blue-400' : 'text-white/40'}`}>
                            {driverAnnouncementMessage.length}/500
                          </span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="relative gap-3 pt-6 border-t border-white/10">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowDriverAnnouncementDialog(false);
                          setSelectedDrivers(new Set());
                          setDriverSendOption("all");
                        }}
                        className="border-gray-600 text-gray-400 hover:bg-gray-900 hover:text-gray-300 hover:border-gray-500 rounded-xl h-10 px-6 font-medium transition"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSendDriverAnnouncement}
                        disabled={isSendingDriver || !driverAnnouncementTitle.trim() || !driverAnnouncementMessage.trim()}
                        className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg shadow-blue-500/40 rounded-xl h-11 px-8 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-blue-500/50 active:scale-95"
                      >
                        {isSendingDriver ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending to drivers...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Send Announcement
                          </span>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl px-3 sm:px-4 h-10 shadow-lg shadow-amber-500/20">
                      <Megaphone className="h-4 w-4" />
                      <span className="hidden sm:inline">Announce</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/20 text-white shadow-2xl mx-auto w-[calc(100%-2rem)] sm:w-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 rounded-lg pointer-events-none" />
                    <DialogHeader className="relative">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/30">
                          <Megaphone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <DialogTitle className="text-xl font-bold text-white">
                            Send Announcement
                          </DialogTitle>
                          <DialogDescription className="text-white/60 mt-1">
                            Broadcast a message to all students instantly
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    <div className="relative space-y-5 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                          <Bell className="h-4 w-4 text-amber-400" />
                          Title
                        </label>
                        <Input
                          placeholder="e.g., Important Notice, Service Update..."
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                          maxLength={100}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-amber-500/50 focus:ring-amber-500/20 h-12 text-base rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-white/90 flex items-center gap-2">
                          <Send className="h-4 w-4 text-amber-400" />
                          Message
                        </label>
                        <Textarea
                          placeholder="Type your announcement message here..."
                          value={announcementMessage}
                          onChange={(e) => setAnnouncementMessage(e.target.value)}
                          rows={5}
                          maxLength={500}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-amber-500/50 focus:ring-amber-500/20 resize-none text-base rounded-xl"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/40">Tip: Keep it short and clear</span>
                          <span className={`font-medium ${announcementMessage.length > 450 ? 'text-amber-400' : 'text-white/40'}`}>
                            {announcementMessage.length}/500
                          </span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter className="relative gap-3 sm:gap-3">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowAnnouncementDialog(false)} 
                        className="border-white/20 text-white/80 hover:bg-white/10 hover:text-white rounded-xl h-11 px-5"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSendAnnouncement} 
                        disabled={isSending || !announcementTitle.trim() || !announcementMessage.trim()}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/30 rounded-xl h-11 px-6 font-semibold disabled:opacity-50"
                      >
                        {isSending ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Send to All
                          </span>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button 
                  onClick={() => navigate('/admin/live-map')}
                  className="flex items-center gap-2 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white rounded-xl px-3 sm:px-4 h-10 shadow-lg shadow-lime-500/20 transition-all active:scale-95"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Live Map</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white transition-colors rounded-xl px-3 sm:px-4 h-10"
                    >
                      <Settings className="h-4 w-4" />
                      <span className="hidden sm:inline">Settings</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-56 bg-slate-800 border-white/20 text-white z-50"
                  >
                    <DropdownMenuLabel className="text-white/70">View</DropdownMenuLabel>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 cursor-pointer hover:bg-white/10 focus:bg-white/10"
                      onClick={toggleFullscreen}
                    >
                      {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/10" />
                    <DropdownMenuLabel className="text-white/70">Account</DropdownMenuLabel>
                    <DropdownMenuItem 
                      className="flex items-center gap-2 text-red-400 cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 focus:text-red-400"
                      onClick={handleLogout}
                    >
                      <LogOutIcon className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">
          {/* Welcome Section with System Status */}
          <div ref={welcomeRef} className={`relative z-10 space-y-4 transition-all duration-500 ${welcomeVisible ? 'scroll-fade-in' : 'opacity-0'}`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-3xl font-black text-white mb-2">
                  {currentHour < 12 ? '🌅 Good Morning' : currentHour < 18 ? '🌤️ Good Afternoon' : '🌙 Good Evening'}, Admin
                </h2>
                <p className="text-white/60 font-medium text-sm sm:text-base">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
                <div className="hidden">
                  <p className="text-green-300 text-xs font-bold uppercase tracking-widest">System Online</p>
                  <p className="text-green-200/70 text-[10px] font-medium">All Systems Operational</p>
                </div>
              </div>
            </div>
          </div>
          {/* Dashboard Overview Section */}
          <div className="space-y-4 relative z-10">
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-1 bg-gradient-to-b from-[#CCFF00] to-[#9acd00] rounded-full" />
              <h2 className="text-2xl font-bold text-white">Dashboard Overview</h2>
            </div>
          </div>

          {/* Stats Grid */}
          <div ref={statsRef} className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative z-10 transition-all duration-500 ${statsVisible ? 'scroll-fade-in' : 'opacity-0'}`}>
            <div className={`relative overflow-hidden bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent backdrop-blur-2xl rounded-2xl border border-blue-400/30 p-4 hover:border-blue-400/60 hover:shadow-[0_12px_40px_rgba(59,130,246,0.25)] transition-all group ${statsVisible ? 'scroll-fade-in scroll-fade-in-delay-1' : 'opacity-0'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 rounded-full blur-3xl -mr-8 -mt-8 group-hover:bg-blue-500/30 transition-colors" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/40">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-4xl font-black text-white tracking-tighter">{stats.totalStudents}</div>
                  <p className="text-xs text-blue-200/80 font-semibold mt-0.5">Registered Students</p>
                </div>
              </div>
            </div>
            
            <div className={`relative overflow-hidden bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent backdrop-blur-2xl rounded-2xl border border-emerald-400/30 p-4 hover:border-emerald-400/60 hover:shadow-[0_12px_40px_rgba(16,185,129,0.25)] transition-all group ${statsVisible ? 'scroll-fade-in scroll-fade-in-delay-2' : 'opacity-0'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/20 rounded-full blur-3xl -mr-8 -mt-8 group-hover:bg-emerald-500/30 transition-colors" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/40">
                    <Car className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <TrendingUp className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-4xl font-black text-white tracking-tighter">{stats.totalDrivers}</div>
                  <p className="text-xs text-emerald-200/80 font-semibold mt-0.5">Registered Drivers</p>
                </div>
              </div>
            </div>
            
            <div className={`relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent backdrop-blur-2xl rounded-2xl border border-amber-400/30 p-4 hover:border-amber-400/60 hover:shadow-[0_12px_40px_rgba(245,158,11,0.25)] transition-all group ${statsVisible ? 'scroll-fade-in scroll-fade-in-delay-3' : 'opacity-0'}`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/20 rounded-full blur-3xl -mr-8 -mt-8 group-hover:bg-amber-500/30 transition-colors" />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/40">
                    <Route className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-300 text-xs font-bold animate-pulse">
                    <Activity className="h-3 w-3" />
                  </div>
                </div>
                <div>
                  <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-4xl font-black text-amber-400 tracking-tighter">{stats.activeTrips}</div>
                  <p className="text-xs text-amber-200/80 font-semibold mt-0.5">Active Trips</p>
                </div>
              </div>
            </div>
            
            <div className={`relative overflow-hidden rounded-2xl border p-4 transition-all group backdrop-blur-2xl ${statsVisible ? 'scroll-fade-in scroll-fade-in-delay-4' : 'opacity-0'} ${
              stats.activeAlerts > 0 
                ? 'bg-gradient-to-br from-red-500/30 via-red-500/20 to-transparent border-red-400/50 hover:border-red-400/70 hover:shadow-[0_12px_40px_rgba(239,68,68,0.35)] animate-pulse' 
                : 'bg-gradient-to-br from-red-500/15 via-red-500/10 to-transparent border-red-400/20 hover:border-red-400/50 hover:shadow-[0_12px_40px_rgba(239,68,68,0.2)]'
            }`}>
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl -mr-8 -mt-8 transition-colors ${
                stats.activeAlerts > 0 ? 'bg-red-500/30 group-hover:bg-red-500/40' : 'bg-red-500/15 group-hover:bg-red-500/25'
              }`} />
              <div className="relative z-10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2.5 rounded-lg shadow-lg ${
                    stats.activeAlerts > 0 
                      ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/50' 
                      : 'bg-gradient-to-br from-red-500/70 to-rose-600/70 shadow-red-500/30'
                  }`}>
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  {stats.activeAlerts > 0 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/40 text-red-200 text-xs font-bold animate-pulse">
                      <Bell className="h-3 w-3" />
                    </div>
                  )}
                </div>
                <div className={`text-3xl sm:text-4xl lg:text-5xl xl:text-4xl font-black tracking-tighter ${stats.activeAlerts > 0 ? 'text-red-400' : 'text-white'}`}>
                  {stats.activeAlerts}
                </div>
                <p className="text-xs text-red-200/80 font-semibold">Emergency Alerts</p>
              </div>
            </div>
          </div>

          {/* Recent Activity Feed Section */}
          <div ref={activityRef} className={`space-y-4 relative z-10 pt-6 border-t border-[#CCFF00]/10 transition-all duration-500 ${activityVisible ? 'scroll-fade-in' : 'opacity-0'}`}>
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-1 bg-gradient-to-b from-[#CCFF00] to-[#9acd00] rounded-full" />
              <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
            </div>
            
            <div className="grid gap-3">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => {
                  const colorMap: any = {
                    blue: { border: 'from-blue-400 to-blue-600', bg: 'bg-blue-500/30', text: 'text-blue-400' },
                    green: { border: 'from-green-400 to-emerald-600', bg: 'bg-emerald-500/30', text: 'text-emerald-300' },
                    amber: { border: 'from-amber-400 to-orange-600', bg: 'bg-amber-500/30', text: 'text-amber-300' },
                    red: { border: 'from-red-400 to-rose-600', bg: 'bg-red-500/30', text: 'text-red-300' }
                  };
                  const colors = colorMap[activity.color] || colorMap.blue;
                  const iconMap: any = {
                    UserPlus: UserPlus,
                    Route: Route,
                    Car: Car,
                    AlertCircle: AlertCircle
                  };
                  const IconComponent = iconMap[activity.icon] || UserPlus;
                  
                  return (
                    <div key={idx} className="relative overflow-hidden bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-3 hover:border-[#CCFF00]/40 hover:bg-white/15 transition-all group">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.border}`} />
                      <div className="flex items-start gap-3 pl-2">
                        <div className={`p-2 rounded-lg ${colors.bg} mt-0.5 shrink-0`}>
                          <IconComponent className={`h-4 w-4 ${colors.text}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">{activity.title}</p>
                          <p className="text-xs text-white/60 mt-0.5 line-clamp-2">{activity.description}</p>
                          <p className="text-xs text-white/40 mt-1">
                            {(() => {
                              const now = new Date();
                              const diff = Math.floor((now.getTime() - activity.timestamp.getTime()) / 1000);
                              if (diff < 60) return 'Just now';
                              if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
                              if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
                              return `${Math.floor(diff / 86400)}d ago`;
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-white/50">
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Section */}
          <div ref={actionsRef} className={`space-y-4 relative z-10 pt-6 border-t border-[#CCFF00]/10 transition-all duration-500 ${actionsVisible ? 'scroll-fade-in' : 'opacity-0'}`}>
            <div className="flex items-center gap-3 px-2">
              <div className="h-8 w-1 bg-gradient-to-b from-[#CCFF00] to-[#9acd00] rounded-full" />
              <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
            </div>
          </div>

          {/* Actions Grid */}
          <div className="relative z-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {menuItems.map((item) => {
                const gradientClasses = `bg-gradient-to-br ${item.gradient}`;
                return (
                <button
                  key={item.title}
                  onClick={() => navigate(item.route)}
                  className={`relative overflow-hidden backdrop-blur-2xl rounded-2xl border p-4 hover:shadow-[0_12px_40px_rgba(0,0,0,0.3)] transition-all text-left group ${
                    item.badge 
                      ? `${gradientClasses}/30 border-white/30 hover:border-white/60` 
                      : `bg-white/10 border-white/20 hover:border-white/40 hover:bg-white/15`
                  }`}
                >
                  <div className="absolute inset-0 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-black px-2.5 py-1 rounded-full shadow-lg shadow-red-500/50 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  <div className="relative z-10 space-y-2">
                    <div className={`p-2.5 rounded-lg bg-gradient-to-br ${item.gradient} shadow-lg w-fit`}>
                      <item.icon className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm">{item.title}</p>
                      <p className="text-xs text-white/70 font-medium">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="absolute right-3 bottom-3 h-4 w-4 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              );})}
            </div>
          </div>

          {/* Footer Section */}
          <div ref={footerRef} className={`space-y-6 relative z-10 pt-12 border-t border-[#CCFF00]/20 mt-16 transition-all duration-500 ${footerVisible ? 'scroll-fade-in' : 'opacity-0'}`}>
            {/* Footer Main Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Brand Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-[#CCFF00] to-[#9acd00] shadow-lg shadow-[#CCFF00]/20">
                    <img src={isuLogo} alt="ISU Logo" className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-white text-lg">SafeRide ISU</h3>
                </div>
                <p className="text-white/60 text-sm leading-relaxed">
                  Ensuring student safety through intelligent transportation management
                </p>
              </div>

              {/* Quick Links */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Navigation</h4>
                <ul className="space-y-2">
                  <li><a href="#" className="text-white/60 hover:text-[#CCFF00] text-sm transition-colors duration-200">Dashboard</a></li>
                  <li><a href="#" className="text-white/60 hover:text-[#CCFF00] text-sm transition-colors duration-200">Documentation</a></li>
                  <li><a href="#" className="text-white/60 hover:text-[#CCFF00] text-sm transition-colors duration-200">Support Center</a></li>
                  <li><a href="#" className="text-white/60 hover:text-[#CCFF00] text-sm transition-colors duration-200">Settings</a></li>
                </ul>
              </div>

              {/* System Info */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">System</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2 text-white/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                    Status: Online
                  </li>
                  <li className="text-white/60">Uptime: 99.8%</li>
                  <li className="text-white/60">Response: 45ms</li>
                  <li className="text-white/60">Version: 2.1.0</li>
                </ul>
              </div>

              {/* System Status Card */}
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 border border-green-400/30 p-4">
                <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/20 rounded-full blur-3xl -mr-8 -mt-8" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-green-300 font-semibold text-sm">All Systems Operational</span>
                  </div>
                  <p className="text-green-200/70 text-xs">Last sync: Just now</p>
                </div>
              </div>
            </div>

            {/* Footer Bottom */}
            <div className="border-t border-white/10 pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-white/40 text-sm">© 2025 SafeRide ISU. All rights reserved.</p>
                <div className="flex items-center gap-4 text-white/40 text-sm">
                  <a href="#" className="hover:text-[#CCFF00] transition-colors">Privacy Policy</a>
                  <span>•</span>
                  <a href="#" className="hover:text-[#CCFF00] transition-colors">Terms of Service</a>
                  <span>•</span>
                  <a href="#" className="hover:text-[#CCFF00] transition-colors">Contact</a>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Admin;
