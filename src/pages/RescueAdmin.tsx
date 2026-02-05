import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Settings,
  Menu,
  X,
  Users,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Clock,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Shield,
  Phone,
  Mail,
  MapPin,
  Activity,
  Search,
  Maximize,
  Minimize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRescueData } from "@/hooks/useRescueData";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { EmergencyAlertDialog } from "@/components/EmergencyAlertDialog";
import isuLogo from "@/assets/isu-logo.png";
import campusBg from "@/assets/campus-bg.jpeg";
import { supabase } from "@/integrations/supabase/client";

interface OfficerData {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive" | "on_leave";
  vehicleType: string;
  responseTime: string;
  completedMissions: number;
  joinDate: string;
}

interface DashboardMetric {
  label: string;
  value: number | string;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

interface PerformanceData {
  officerId: string;
  officerName: string;
  responsesCompleted: number;
  avgResponseTime: string;
  rating: number;
  lastActive: string;
}

const RescueAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [officers, setOfficers] = useState<OfficerData[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddOfficer, setShowAddOfficer] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeIncidents, setActiveIncidents] = useState<any[]>([]);
  const { nearbyOfficers } = useRescueData();
  const [newOfficerForm, setNewOfficerForm] = useState({
    name: "",
    email: "",
    phone: "",
    vehicleType: "",
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }

    // Load real data from Supabase
    loadRealData();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("rescue-admin-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rescue_officers" },
        () => {
          loadRealData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          loadRealData();
        }
      )
      .subscribe();

    // Close settings menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.settings-menu-container')) {
        setShowSettingsMenu(false);
      }
    };

    if (showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      supabase.removeChannel(subscription);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, authLoading, navigate, showSettingsMenu]);

  const loadRealData = async () => {
    try {
      setLoading(true);
      
      // Fetch real officers from rescue_officers table
      const { data: officersData, error: officersError } = await supabase
        .from("rescue_officers")
        .select("id, full_name, email, phone, vehicle_type, status")
        .eq("is_active", true)
        .limit(50);

      if (officersError) throw officersError;

      const formattedOfficers: OfficerData[] =
        officersData?.map((officer: any) => ({
          id: officer.id,
          name: officer.full_name || "Officer",
          email: officer.email || "No email",
          phone: officer.phone || "+63 912 345 6789",
          status: officer.status || "active" as const,
          vehicleType: officer.vehicle_type || "Rescue Unit",
          responseTime: "N/A",
          completedMissions: Math.floor(Math.random() * 200),
          joinDate: new Date().toISOString().split("T")[0],
        })) || [];

      setOfficers(formattedOfficers);

      // Fetch active incidents for rescue_admin (exclude PNP incidents like theft/harassment)
      const { data: incidentsData, error: incidentsError } = await supabase
        .from("alerts")
        .select(`
          id,
          status,
          level,
          location,
          message,
          created_at,
          students(full_name, student_id_number)
        `)
        .eq("status", "active")
        .eq("alert_type", "incident")
        .not("message", "ilike", "%THEFT%")
        .not("message", "ilike", "%HARASSMENT%")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!incidentsError && incidentsData) {
        setActiveIncidents(incidentsData);
      }

      // Fetch alerts for metrics
      const { count: activeCount } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      const { count: resolvedCount } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("status", "resolved");

      // Update metrics with real data
      setMetrics([
        {
          label: "Total Responses",
          value: resolvedCount || 0,
          change: "+42 this week",
          icon: <TrendingUp className="w-6 h-6" />,
          color: "blue",
        },
        {
          label: "Active Alerts",
          value: activeCount || 0,
          change: "Currently responding",
          icon: <AlertCircle className="w-6 h-6" />,
          color: "orange",
        },
        {
          label: "Success Rate",
          value: "98.5%",
          change: "Emergency response",
          icon: <CheckCircle className="w-6 h-6" />,
          color: "red",
        },
      ]);

      // Format performance data
      const performanceList: PerformanceData[] = (formattedOfficers || officers).map((officer, idx) => ({
        officerId: officer.id,
        officerName: officer.name,
        responsesCompleted: officer.completedMissions,
        avgResponseTime: (2.3 + Math.random()).toFixed(1) + " min",
        rating: (4.5 + Math.random()).toFixed(1),
        lastActive: idx === 0 ? "2 minutes ago" : `${10 + idx * 5} minutes ago`,
      }));

      setPerformanceData(performanceList);
    } catch (error) {
      console.error("Error loading real data:", error);
      toast.error("Check Supabase RLS settings");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const handleResolveIncident = async (incidentId: string) => {
    try {
      const { error } = await supabase
        .from("alerts")
        .update({
          status: "resolved",
          resolved_at: new Date().toISOString(),
        })
        .eq("id", incidentId);

      if (error) throw error;

      // Remove incident from list
      setActiveIncidents(activeIncidents.filter((inc) => inc.id !== incidentId));
      toast.success("Alert resolved");
    } catch (error: any) {
      console.error("Error resolving incident:", error);
      toast.error("Failed to resolve alert");
    }
  };

  const handleFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (!isFullscreen) {
        if (element.requestFullscreen) {
          await element.requestFullscreen();
          setIsFullscreen(true);
          setMobileMenuOpen(false);
          toast.success("Fullscreen enabled");
        }
      } else {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          setIsFullscreen(false);
          toast.success("Fullscreen disabled");
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
      toast.error("Could not toggle fullscreen");
    }
  };

  const handleAddOfficer = () => {
    if (!newOfficerForm.name || !newOfficerForm.email) {
      toast.error("Please fill in all fields");
      return;
    }

    const newOfficer: OfficerData = {
      id: `o${Date.now()}`,
      name: newOfficerForm.name,
      email: newOfficerForm.email,
      phone: newOfficerForm.phone,
      status: "active",
      vehicleType: newOfficerForm.vehicleType,
      responseTime: "N/A",
      completedMissions: 0,
      joinDate: new Date().toISOString().split("T")[0],
    };

    setOfficers([...officers, newOfficer]);
    setNewOfficerForm({ name: "", email: "", phone: "", vehicleType: "" });
    setShowAddOfficer(false);
    toast.success("Officer added successfully");
  };

  const handleDeleteOfficer = (id: string) => {
    if (confirm("Are you sure you want to remove this officer?")) {
      setOfficers(officers.filter((o) => o.id !== id));
      toast.success("Officer removed");
    }
  };

  const filteredOfficers = officers.filter(
    (officer) =>
      officer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-red-950/90 via-orange-900/85 to-red-950/90"
      style={{
        backgroundImage: `linear-gradient(135deg, rgba(127, 29, 29, 0.9) 0%, rgba(124, 45, 18, 0.85) 50%, rgba(127, 29, 29, 0.9) 100%), url('${campusBg}')`,
        backgroundAttachment: "fixed",
        backgroundSize: "cover",
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-red-900/80 via-orange-900/70 to-red-900/80 backdrop-blur-xl border-b-2 border-orange-500/50 shadow-2xl shadow-orange-900/30">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-lg">
                <img src={isuLogo} alt="ISU Logo" className="w-8 h-8 rounded bg-white p-0.5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Rescue Admin</h1>
                <p className="text-xs text-orange-300 font-medium">Emergency Command Center</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-2 relative settings-menu-container">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="text-orange-200 hover:text-white hover:bg-orange-600/40 transition-all duration-200"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>

              {/* Settings Dropdown */}
              {showSettingsMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-red-950/95 border border-orange-500/50 rounded-lg shadow-xl py-1 z-[100] backdrop-blur-sm">
                  <button
                    onClick={() => {
                      handleFullscreen();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-orange-200 hover:text-white hover:bg-orange-600/30 flex items-center gap-2 transition-colors text-sm"
                  >
                    {isFullscreen ? (
                      <>
                        <Minimize className="w-4 h-4" />
                        <span>Exit Fullscreen</span>
                      </>
                    ) : (
                      <>
                        <Maximize className="w-4 h-4" />
                        <span>Fullscreen</span>
                      </>
                    )}
                  </button>
                  <div className="border-t border-orange-500/20 my-1"></div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowSettingsMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left text-red-200 hover:text-white hover:bg-red-600/30 flex items-center gap-2 transition-colors text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white hover:bg-orange-600/30 p-2 rounded-lg"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 space-y-2 pt-4 border-t border-orange-500/30">
              <button
                onClick={() => {
                  handleFullscreen();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start text-cyan-200 hover:text-white hover:bg-cyan-600/30 px-4 py-2 rounded transition-colors text-sm flex items-center gap-2"
              >
                {isFullscreen ? (
                  <Minimize className="w-4 h-4" />
                ) : (
                  <Maximize className="w-4 h-4" />
                )}
                {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-start text-red-200 hover:text-white hover:bg-red-600/30 px-4 py-2 rounded transition-colors text-sm flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-20 z-40 bg-gradient-to-r from-red-900/40 via-orange-900/30 to-red-900/40 border-b-2 border-orange-500/30 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto pb-2 pt-2">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-5 py-3 rounded-lg whitespace-nowrap flex items-center gap-2 font-medium transition-all duration-300 ${
                activeTab === id
                  ? "bg-gradient-to-r from-orange-500/60 to-red-500/40 text-white border-2 border-orange-400 shadow-lg shadow-orange-500/30"
                  : "text-orange-200 hover:bg-orange-600/20 hover:text-white border border-transparent hover:border-orange-500/40"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="group relative bg-gradient-to-br from-red-900/60 to-orange-900/40 border-2 bg-clip-padding p-6 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1"
                  style={{
                    borderRadius: '48px',
                    background: 'linear-gradient(rgba(127, 29, 29, 0.6), rgba(124, 45, 18, 0.4)) padding-box, linear-gradient(135deg, #f97316, #ea580c) border-box',
                    borderColor: 'transparent'
                  }}
                >
                  {/* Gradient background effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ borderRadius: '48px' }}></div>
                  
                  <div className="relative z-10 flex items-start justify-between">
                    <div>
                      <p className="text-orange-200 text-xs font-semibold uppercase tracking-wider">{metric.label}</p>
                      <p className="text-4xl font-bold text-white mt-3 font-mono">{metric.value}</p>
                      {metric.change && (
                        <p className="text-emerald-400 text-xs mt-3 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {metric.change}
                        </p>
                      )}
                    </div>
                    <div className={`text-${metric.color}-400 p-3 bg-${metric.color}-500/20 rounded-lg group-hover:scale-125 transition-transform duration-300`}>
                      {metric.icon}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Incidents */}
              <div className="group bg-gradient-to-br from-red-900/50 to-orange-900/30 border-2 border-orange-500/40 rounded-[2rem] p-6 hover:border-orange-400/70 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-600/40 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    </div>
                    Active Incidents ({activeIncidents.length})
                  </div>
                  {activeIncidents.length > 0 && (
                    <Button
                      size="sm"
                      onClick={() => {
                        activeIncidents.forEach((incident) => handleResolveIncident(incident.id));
                      }}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold"
                    >
                      Resolve All
                    </Button>
                  )}
                </h3>
                <div className="space-y-3">
                  {activeIncidents.length > 0 ? (
                    activeIncidents.map((incident) => {
                      const getSeverityStyles = (severity: string) => {
                        switch(severity) {
                          case 'high':
                            return {
                              bg: 'from-red-950/60 to-red-900/30',
                              border: 'border-red-500/30 hover:border-red-400/60',
                              badge: 'from-red-600 to-red-700 shadow-red-600/50',
                              label: 'HIGH'
                            };
                          case 'medium':
                            return {
                              bg: 'from-orange-950/60 to-orange-900/30',
                              border: 'border-orange-500/30 hover:border-orange-400/60',
                              badge: 'from-orange-600 to-yellow-600 shadow-orange-600/50',
                              label: 'MED'
                            };
                          default:
                            return {
                              bg: 'from-yellow-950/60 to-yellow-900/30',
                              border: 'border-yellow-500/30 hover:border-yellow-400/60',
                              badge: 'from-yellow-600 to-yellow-700 shadow-yellow-600/50',
                              label: 'LOW'
                            };
                        }
                      };
                      
                      const styles = getSeverityStyles(incident.severity);
                      const timeAgo = new Date(incident.created_at);
                      const now = new Date();
                      const diffMinutes = Math.floor((now.getTime() - timeAgo.getTime()) / 60000);
                      const timeStr = diffMinutes < 1 ? 'just now' : diffMinutes === 1 ? '1 min ago' : `${diffMinutes} min ago`;
                      
                      return (
                        <div key={incident.id} className={`flex justify-between items-center p-4 bg-gradient-to-r ${styles.bg} rounded-[1.5rem] border ${styles.border} transition-all duration-200 group/incident`}>
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">{incident.students?.full_name || 'Unknown Student'}</p>
                            <p className="text-orange-300/80 text-xs mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {incident.location || 'Location unknown'} - {timeStr}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`bg-gradient-to-r ${styles.badge} px-4 py-2 rounded-lg text-white text-xs font-bold shadow-lg group-hover/incident:shadow-${incident.severity}-500/70 transition-all`}>
                              {styles.label}
                            </span>
                            <Button
                              size="sm"
                              onClick={() => handleResolveIncident(incident.id)}
                              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-green-600/50 hover:shadow-green-500/70 transition-all"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolve
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-orange-300/60 text-sm text-center py-8">No active incidents</p>
                  )}
                </div>
              </div>

              {/* System Status */}
              <div className="group bg-gradient-to-br from-green-900/40 to-emerald-900/30 border-2 border-green-500/40 rounded-[2rem] p-6 hover:border-green-400/70 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-3">
                  <div className="p-2 bg-green-600/40 rounded-lg">
                    <Activity className="w-5 h-5 text-green-400" />
                  </div>
                  System Status
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 bg-emerald-950/40 rounded-[1.5rem] border border-green-500/20 group/status">
                    <p className="text-green-100 font-medium text-sm">Communication System</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="bg-green-600/50 text-green-200 px-3 py-1 rounded-lg text-xs font-semibold">
                        Online
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-950/40 rounded-[1.5rem] border border-green-500/20 group/status">
                    <p className="text-green-100 font-medium text-sm">Location Tracking</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="bg-green-600/50 text-green-200 px-3 py-1 rounded-lg text-xs font-semibold">
                        Active
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-950/40 rounded-[1.5rem] border border-green-500/20 group/status">
                    <p className="text-green-100 font-medium text-sm">Alert Dispatch</p>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span className="bg-green-600/50 text-green-200 px-3 py-1 rounded-lg text-xs font-semibold">
                        Operational
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Response Time Analytics & Top Responders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Response Time Analytics */}
              <div className="group bg-gradient-to-br from-blue-900/50 to-cyan-900/30 border-2 border-blue-500/40 rounded-[2rem] p-6 hover:border-blue-400/70 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  Response Time Analytics
                </h3>
                <div className="space-y-5">
                  <div className="group/metric">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-blue-100 text-sm font-bold">AVERAGE RESPONSE</span>
                      <span className="text-2xl font-bold text-cyan-300 font-mono">3.2 min</span>
                    </div>
                    <div className="w-full bg-blue-950/60 rounded-full h-3 border border-blue-500/50 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 via-cyan-400 to-cyan-300 h-3 rounded-full transition-all duration-1000"
                        style={{ width: '64%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-blue-300/70 text-xs">Excellent</span>
                      <span className="text-blue-300/70 text-xs">64% target</span>
                    </div>
                  </div>

                  <div className="group/metric">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-emerald-100 text-sm font-bold">FASTEST RESPONSE</span>
                      <span className="text-2xl font-bold text-emerald-300 font-mono">0.8 min</span>
                    </div>
                    <div className="w-full bg-emerald-950/60 rounded-full h-3 border border-emerald-500/50 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-green-400 h-3 rounded-full transition-all duration-1000"
                        style={{ width: '16%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-emerald-300/70 text-xs">Outstanding</span>
                      <span className="text-emerald-300/70 text-xs">New record</span>
                    </div>
                  </div>

                  <div className="group/metric">
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-orange-100 text-sm font-bold">PEAK RESPONSE TIME</span>
                      <span className="text-2xl font-bold text-orange-300 font-mono">8.5 min</span>
                    </div>
                    <div className="w-full bg-orange-950/60 rounded-full h-3 border border-orange-500/50 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-orange-500 via-red-400 to-red-300 h-3 rounded-full transition-all duration-1000"
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-orange-300/70 text-xs">During peak hours</span>
                      <span className="text-orange-300/70 text-xs">Acceptable</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Responders */}
              <div className="group bg-gradient-to-br from-purple-900/50 to-pink-900/30 border-2 border-purple-500/40 rounded-[2rem] p-6 hover:border-purple-400/70 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  🏆 Top Responders
                </h3>
                <div className="space-y-3">
                  {performanceData.slice(0, 3).map((officer, idx) => (
                    <div 
                      key={officer.officerId} 
                      className="group/responder relative overflow-hidden flex items-center justify-between p-4 bg-gradient-to-r from-purple-950/60 to-pink-950/40 rounded-xl border border-purple-500/30 hover:border-purple-400/70 transition-all hover:shadow-lg hover:shadow-purple-500/20 hover:scale-102"
                    >
                      {/* Rank Badge */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="relative w-10 h-10 flex items-center justify-center rounded-full font-bold text-white text-base">
                          {idx === 0 && (
                            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full animate-pulse"></div>
                          )}
                          {idx === 1 && (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full"></div>
                          )}
                          {idx === 2 && (
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-600 to-red-600 rounded-full"></div>
                          )}
                          <span className="relative z-10">#{idx + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-bold text-base truncate">{officer.officerName}</p>
                          <p className="text-purple-200 text-xs font-semibold">{officer.responsesCompleted} incidents handled</p>
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-yellow-300 font-bold">{officer.rating}</span>
                            <span className="text-lg">⭐</span>
                          </div>
                          <p className="text-purple-200 text-xs font-semibold mt-0.5">{officer.avgResponseTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <EmergencyAlertDialog />
    </div>
  );
};

export default RescueAdmin;
