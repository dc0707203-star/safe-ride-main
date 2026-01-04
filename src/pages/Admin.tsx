import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Car, Route, AlertCircle, LogOut, UserPlus, 
  ChevronRight, Bell, Activity, TrendingUp, Clock, History, Megaphone, Send,
  MapPin, User, X, Settings, LogOut as LogOutIcon, Maximize, Minimize
} from "lucide-react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmergencyAlertDialog } from "@/components/EmergencyAlertDialog";
import isuLogo from "@/assets/isu-logo.png";
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
  const [activeTrips, setActiveTrips] = useState<ActiveTrip[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

      // Real-time updates
      const channel = supabase
        .channel('admin-dashboard')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'students' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, fetchStats)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
          fetchStats();
          fetchActiveTrips();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'alerts' }, fetchStats)
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
      navigate('/');
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      toast.error("Please fill in both title and message");
      return;
    }

    setIsSending(true);
    try {
      const { error } = await supabase.from('announcements' as any).insert({
        title: announcementTitle.trim(),
        message: announcementMessage.trim(),
        created_by: user?.id,
      });

      if (error) throw error;

      toast.success("Announcement sent to all users!");
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
            <img src={isuLogo} alt="ISU Logo" className="h-14 w-14" />
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
          <img src={campusBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-900/95" />
        </div>
        
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/60 border-b border-white/10">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-2xl shadow-lg">
                  <img src={isuLogo} alt="ISU Logo" className="h-9 w-9 sm:h-11 sm:w-11" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-white">SafeRide ISU</h1>
                  <p className="text-xs sm:text-sm text-white/50">Admin Dashboard</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Dialog open={showAnnouncementDialog} onOpenChange={setShowAnnouncementDialog}>
                  <DialogTrigger asChild>
                    <Button className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl px-3 sm:px-4 h-10 shadow-lg shadow-amber-500/20">
                      <Megaphone className="h-4 w-4" />
                      <span className="hidden sm:inline">Announce</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-white/20 text-white shadow-2xl">
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
        <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
            <div className="relative overflow-hidden bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-5 hover:border-blue-400/50 hover:shadow-[0_8px_32px_rgba(59,130,246,0.15)] transition-all group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/30 shadow-lg shadow-blue-500/20">
                    <Users className="h-6 w-6 text-blue-300" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <TrendingUp className="h-3 w-3" />
                    Active
                  </div>
                </div>
                <div className="text-4xl font-bold text-white tracking-tight">{stats.totalStudents}</div>
                <p className="text-sm text-blue-200/70 mt-1 font-medium">Registered Students</p>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-5 hover:border-emerald-400/50 hover:shadow-[0_8px_32px_rgba(16,185,129,0.15)] transition-all group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-emerald-500/30 shadow-lg shadow-emerald-500/20">
                    <Car className="h-6 w-6 text-emerald-300" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
                    <TrendingUp className="h-3 w-3" />
                    Active
                  </div>
                </div>
                <div className="text-4xl font-bold text-white tracking-tight">{stats.totalDrivers}</div>
                <p className="text-sm text-emerald-200/70 mt-1 font-medium">Registered Drivers</p>
              </div>
            </div>
            
            <div className="relative overflow-hidden bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-5 hover:border-amber-400/50 hover:shadow-[0_8px_32px_rgba(245,158,11,0.15)] transition-all group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-amber-500/30 shadow-lg shadow-amber-500/20">
                    <Route className="h-6 w-6 text-amber-300" />
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                    <Activity className="h-3 w-3 animate-pulse" />
                    Live
                  </div>
                </div>
                <div className="text-4xl font-bold text-amber-400 tracking-tight">{stats.activeTrips}</div>
                <p className="text-sm text-amber-200/70 mt-1 font-medium">Active Trips</p>
              </div>
            </div>
            
            <div className={`relative overflow-hidden rounded-2xl border p-5 transition-all group backdrop-blur-2xl ${
              stats.activeAlerts > 0 
                ? 'bg-red-500/20 border-red-500/40 animate-pulse hover:shadow-[0_8px_32px_rgba(239,68,68,0.25)]' 
                : 'bg-white/10 border-white/20 hover:border-red-400/50 hover:shadow-[0_8px_32px_rgba(239,68,68,0.15)]'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-2xl -mr-8 -mt-8" />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl shadow-lg ${
                    stats.activeAlerts > 0 
                      ? 'bg-red-500/50 shadow-red-500/30' 
                      : 'bg-red-500/30 shadow-red-500/20'
                  }`}>
                    <AlertCircle className="h-6 w-6 text-red-300" />
                  </div>
                  {stats.activeAlerts > 0 && (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/30 text-red-300 text-xs font-medium animate-pulse">
                      <Bell className="h-3 w-3 animate-bounce" />
                      Urgent
                    </div>
                  )}
                </div>
                <div className={`text-4xl font-bold tracking-tight ${stats.activeAlerts > 0 ? 'text-red-400' : 'text-white'}`}>
                  {stats.activeAlerts}
                </div>
                <p className="text-sm text-red-200/70 mt-1 font-medium">Emergency Alerts</p>
              </div>
            </div>
          </div>

          {/* Active Trips Section - Real-time trip cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/20">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">Live Trips</h2>
                  <p className="text-sm text-white/50">Students currently riding</p>
                </div>
              </div>
              {activeTrips.length > 0 && (
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/admin/trips')}
                  className="text-white/70 hover:text-white hover:bg-white/10 rounded-xl"
                >
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>

            {activeTrips.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 text-center">
                <Route className="h-12 w-12 mx-auto text-white/20 mb-3" />
                <p className="text-white/50">No active trips at the moment</p>
                <p className="text-sm text-white/30 mt-1">Trip cards will appear here when students scan QR codes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeTrips.map((trip) => (
                  <div 
                    key={trip.id}
                    className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden hover:border-emerald-500/50 transition-all group"
                  >
                    {/* Status bar */}
                    <div className="bg-emerald-500/20 px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-medium text-emerald-400">Active Trip</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-white/60">
                        <Clock className="h-3 w-3" />
                        {getElapsedTime(trip.start_time)}
                      </div>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* Student Info */}
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden ring-2 ring-white/20">
                          {trip.student.photo_url ? (
                            <img src={trip.student.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-lg font-bold text-white">{trip.student.full_name.charAt(0)}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{trip.student.full_name}</p>
                          <p className="text-sm text-white/50 truncate">{trip.student.student_id_number}</p>
                          {trip.student.course && (
                            <p className="text-xs text-white/40 truncate">{trip.student.course}</p>
                          )}
                        </div>
                      </div>

                      {/* Divider with arrow */}
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <div className="p-1 rounded-full bg-white/10">
                          <ChevronRight className="h-4 w-4 text-white/40" />
                        </div>
                        <div className="flex-1 h-px bg-white/10"></div>
                      </div>

                      {/* Driver Info */}
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center overflow-hidden ring-2 ring-white/20">
                          {trip.driver.photo_url ? (
                            <img src={trip.driver.photo_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <Car className="h-6 w-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white truncate">{trip.driver.full_name}</p>
                          <div className="flex items-center gap-1 text-sm text-amber-400">
                            <Car className="h-3 w-3" />
                            <span>{trip.driver.tricycle_plate_number}</span>
                          </div>
                        </div>
                      </div>

                      {/* Trip start time */}
                      <div className="flex items-center gap-2 text-xs text-white/40 pt-2 border-t border-white/10">
                        <Clock className="h-3 w-3" />
                        Started {format(new Date(trip.start_time), "h:mm a")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions Menu */}
          <div className="space-y-5 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 shadow-lg shadow-violet-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Quick Actions</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.title}
                  onClick={() => navigate(item.route)}
                  className="relative overflow-hidden bg-white/10 backdrop-blur-2xl rounded-2xl border border-white/20 p-5 hover:border-white/40 hover:bg-white/15 hover:shadow-[0_8px_32px_rgba(255,255,255,0.1)] transition-all text-left group"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {item.badge && (
                    <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-red-500/30 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                  <div className={`relative inline-flex p-3 rounded-xl bg-gradient-to-r ${item.gradient} shadow-lg mb-4`}>
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="relative font-bold text-white mb-1">{item.title}</h3>
                  <p className="relative text-sm text-white/50">{item.description}</p>
                  <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default Admin;
