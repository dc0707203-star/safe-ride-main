import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  LogOut,
  Shield,
  Activity,
  TrendingUp,
  Users,
  Map,
  Settings,
  HelpCircle,
  BarChart3,
  Clock,
  CheckCircle2,
  Phone,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useIsMobile } from "@/hooks/use-mobile";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import isuLogo from "@/assets/isu-logo.png";
import campusBg from "@/assets/campus-bg.jpeg";
import { format } from "date-fns";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  avgResponseTime: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
}

interface RecentAlert {
  id: string;
  student_name: string;
  student_id: string;
  location: string;
  created_at: string;
  status: string;
  level: string;
}

const PNPPortal = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user, loading, userRole } = useAuth();
  const [stats, setStats] = useState<AlertStats>({
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
    avgResponseTime: 0,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
  });
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [currentHour] = useState(new Date().getHours());

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login?type=pnp");
      } else if (userRole && userRole !== "pnp") {
        navigate("/");
      }
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data, error } = await supabase
          .from("alerts" as any)
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);

        if (error) throw error;

        const alerts = data || [];
        const active = alerts.filter((a) => a.status === "active");
        const resolved = alerts.filter((a) => a.status !== "active");
        const critical = alerts.filter(
          (a) => a.level?.toLowerCase() === "critical"
        );
        const high = alerts.filter((a) => a.level?.toLowerCase() === "high");
        const medium = alerts.filter(
          (a) => a.level?.toLowerCase() === "medium"
        );

        const avgTime =
          resolved.length > 0
            ? Math.round(
                resolved.reduce((sum, a) => {
                  if (a.resolved_at) {
                    return (
                      sum +
                      (new Date(a.resolved_at).getTime() -
                        new Date(a.created_at).getTime())
                    );
                  }
                  return sum;
                }, 0) /
                  resolved.length /
                  1000
              )
            : 0;

        setStats({
          totalAlerts: alerts.length,
          activeAlerts: active.length,
          resolvedAlerts: resolved.length,
          avgResponseTime: avgTime,
          criticalCount: critical.length,
          highCount: high.length,
          mediumCount: medium.length,
        });

        // Get recent alerts with student info
        const { data: recentData } = await supabase
          .from("alerts" as any)
          .select(
            `
            id,
            status,
            level,
            created_at,
            location_lat,
            location_lng,
            students(full_name, student_id_number)
          `
          )
          .order("created_at", { ascending: false })
          .limit(5);

        const formatted = (recentData || []).map((alert: any) => ({
          id: alert.id,
          student_name: alert.students?.full_name || "Unknown",
          student_id: alert.students?.student_id_number || "N/A",
          location: alert.location_lat
            ? `${alert.location_lat.toFixed(3)}, ${alert.location_lng.toFixed(3)}`
            : "Unknown",
          created_at: alert.created_at,
          status: alert.status,
          level: alert.level,
        }));

        setRecentAlerts(formatted);
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();

    const interval = setInterval(fetchStats, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  const LogoutButton = () => (
    <Button
      onClick={handleLogout}
      className="gap-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg"
    >
      <LogOut className="h-4 w-4" />
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );

  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 18
        ? "Good Afternoon"
        : "Good Evening";

  const menuItems = [
    {
      title: "Real-time Alerts",
      description: "View active SOS",
      icon: AlertTriangle,
      route: "/pnp-dashboard",
      gradient: "from-red-500 to-rose-600",
      badge: stats.activeAlerts > 0 ? stats.activeAlerts : null,
    },
    {
      title: "Alert History",
      description: "Resolved alerts",
      icon: CheckCircle2,
      route: "/pnp-history",
      gradient: "from-green-500 to-emerald-600",
    },
    {
      title: "Response Map",
      description: "Track incidents",
      icon: MapPin,
      route: "/pnp-map",
      gradient: "from-blue-500 to-cyan-600",
    },
    {
      title: "Reports",
      description: "Analytics & stats",
      icon: BarChart3,
      route: "/pnp-reports",
      gradient: "from-purple-500 to-pink-600",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen relative">
        {/* Background Image */}
        <div className="fixed inset-0 z-0">
          <img
            src={campusBg}
            alt=""
            className="w-full h-full object-cover blur-xl"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/90 via-blue-900/85 to-blue-950/90" />
        </div>

        {/* Header */}
        <div className="z-10 sticky top-0 bg-gradient-to-r from-blue-950/95 via-blue-900/95 to-blue-950/95 backdrop-blur-xl border-b border-blue-400/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-400/20 rounded-lg border border-blue-400/30 backdrop-blur-sm">
                  <Shield className="h-6 w-6 text-blue-300" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">PNP Portal</h1>
                  <p className="text-xs text-blue-300">Safe Ride Emergency System</p>
                </div>
              </div>

              {/* Header Stats */}
              <div className="hidden md:flex items-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">
                    Active SOS
                  </p>
                  <p className={`text-3xl font-bold ${stats.activeAlerts > 0 ? 'text-red-400 animate-pulse' : 'text-blue-300'}`}>
                    {stats.activeAlerts}
                  </p>
                </div>
                <div className="w-px h-10 bg-blue-400/20" />
                <div className="text-center">
                  <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">
                    Today's Alerts
                  </p>
                  <p className="text-3xl font-bold text-blue-300">
                    {stats.totalAlerts}
                  </p>
                </div>
                <div className="w-px h-10 bg-blue-400/20" />
                <div className="text-center">
                  <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">
                    Avg Response
                  </p>
                  <p className="text-3xl font-bold text-emerald-400">
                    {stats.avgResponseTime}s
                  </p>
                </div>
              </div>

              {/* User Menu */}
              {isMobile ? (
                <LogoutButton />
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-2 text-blue-200 hover:bg-blue-400/20 border border-blue-400/30 rounded-lg"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">{user?.email?.split("@")[0] || "Officer"}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                      {user?.email}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => navigate("/pnp-settings")}
                      className="gap-2 cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/help")}
                      className="gap-2 cursor-pointer"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="gap-2 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white mb-2">
              {greeting}, Officer
            </h2>
            <p className="text-blue-200 text-lg">
              Monitor and respond to emergency SOS alerts in real-time
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Active Alerts Card */}
            <div className="bg-gradient-to-br from-red-500/30 to-red-600/20 border border-red-400/40 rounded-xl p-6 backdrop-blur-md hover:border-red-400/60 hover:shadow-lg hover:shadow-red-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-200 text-sm font-semibold uppercase tracking-wide">
                    Active Alerts
                  </p>
                  <p className={`text-4xl font-bold mt-2 ${stats.activeAlerts > 0 ? 'text-red-300 animate-pulse' : 'text-red-400'}`}>
                    {stats.activeAlerts}
                  </p>
                </div>
                <div className="p-3 bg-red-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <AlertTriangle className="h-8 w-8 text-red-400" />
                </div>
              </div>
              <p className="text-red-300/70 text-xs mt-3">Click to view active emergencies</p>
            </div>

            {/* Critical Level Card */}
            <div className="bg-gradient-to-br from-orange-500/30 to-orange-600/20 border border-orange-400/40 rounded-xl p-6 backdrop-blur-md hover:border-orange-400/60 hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm font-semibold uppercase tracking-wide">
                    Critical Cases
                  </p>
                  <p className="text-4xl font-bold text-orange-400 mt-2">
                    {stats.criticalCount}
                  </p>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-8 w-8 text-orange-400" />
                </div>
              </div>
              <p className="text-orange-300/70 text-xs mt-3">High priority incidents</p>
            </div>

            {/* Resolved Today Card */}
            <div className="bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-400/40 rounded-xl p-6 backdrop-blur-md hover:border-emerald-400/60 hover:shadow-lg hover:shadow-emerald-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-200 text-sm font-semibold uppercase tracking-wide">
                    Resolved Today
                  </p>
                  <p className="text-4xl font-bold text-emerald-400 mt-2">
                    {stats.resolvedAlerts}
                  </p>
                </div>
                <div className="p-3 bg-emerald-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
              <p className="text-emerald-300/70 text-xs mt-3">Successfully handled</p>
            </div>

            {/* Avg Response Card */}
            <div className="bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 border border-cyan-400/40 rounded-xl p-6 backdrop-blur-md hover:border-cyan-400/60 hover:shadow-lg hover:shadow-cyan-500/20 transition-all duration-300 group">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-200 text-sm font-semibold uppercase tracking-wide">
                    Avg Response
                  </p>
                  <p className="text-4xl font-bold text-cyan-400 mt-2">
                    {stats.avgResponseTime}s
                  </p>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded-lg group-hover:scale-110 transition-transform">
                  <Clock className="h-8 w-8 text-cyan-400" />
                </div>
              </div>
              <p className="text-cyan-300/70 text-xs mt-3">Time to response</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {menuItems.map((item) => (
                <button
                  key={item.route}
                  onClick={() => navigate(item.route)}
                  className="group relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-white/8 to-white/0 border border-white/20 hover:border-white/40 transition-all duration-300 text-left hover:scale-105 hover:shadow-xl hover:shadow-blue-500/20"
                >
                  {/* Gradient Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-25 transition-opacity duration-300`}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                        <item.icon className="h-6 w-6 text-white" />
                      </div>
                      {item.badge && (
                        <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-white/70">{item.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recent Alerts */}
          <div className="bg-gradient-to-br from-blue-950/40 to-blue-900/20 border border-blue-400/30 rounded-xl overflow-hidden backdrop-blur-md shadow-lg">
            <div className="bg-gradient-to-r from-blue-600/40 to-blue-700/20 px-6 py-5 border-b border-blue-400/30">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="h-5 w-5 text-cyan-400" />
                Recent SOS Alerts
              </h3>
            </div>
            <div className="divide-y divide-blue-400/20">
              {recentAlerts.length > 0 ? (
                recentAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="px-6 py-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-white">
                            {alert.student_name}
                          </h4>
                          <span
                            className={`text-xs font-bold px-2 py-1 rounded ${
                              alert.level?.toLowerCase() === "critical"
                                ? "bg-red-500/80 text-white"
                                : alert.level?.toLowerCase() === "high"
                                  ? "bg-orange-500/80 text-white"
                                  : "bg-yellow-500/80 text-white"
                            }`}
                          >
                            {alert.level || "HIGH"}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              alert.status === "active"
                                ? "bg-red-500/30 text-red-200"
                                : "bg-green-500/30 text-green-200"
                            }`}
                          >
                            {alert.status === "active" ? "🔴 Active" : "✅ Resolved"}
                          </span>
                        </div>
                        <p className="text-sm text-white/70">
                          ID: {alert.student_id} • {alert.location}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          {format(new Date(alert.created_at), "PPpp")}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => navigate("/pnp-dashboard")}
                      >
                        <MapPin className="h-4 w-4" />
                        View
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <Shield className="h-8 w-8 text-white/30 mx-auto mb-2" />
                  <p className="text-white/70 text-sm">No alerts yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PNPPortal;
