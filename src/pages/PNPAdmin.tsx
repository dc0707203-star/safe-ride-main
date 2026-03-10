import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  LogOut,
  ChevronRight,
  Bell,
  Activity,
  TrendingUp,
  MapPin,
  User,
  FileText,
  Phone,
  Clipboard,
  Menu,
  X,
  Clock,
  Users as UsersIcon,
  CheckCircle,
  Zap,
  BarChart3,
  Settings,
  Maximize,
  Minimize,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { EmergencyAlertDialog } from "@/components/EmergencyAlertDialog";
import isuLogo from "@/assets/isu-logo.png";
import campusBg from "@/assets/campus-bg.jpeg";

interface ActiveAlert {
  id: string;
  created_at: string;
  level: string;
  student: { full_name: string; student_id_number: string; photo_url: string | null };
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  officer: string;
  details: string;
  type: 'dispatch' | 'resolve' | 'acknowledge' | 'assign';
}

const getAlertColor = (level: string) => {
  const levelLower = level?.toLowerCase() || 'medium';
  if (levelLower === 'critical') return { bg: 'from-orange-600/20 to-orange-700/10', border: 'border-orange-500/40', badge: 'bg-orange-600', dot: 'bg-orange-500', text: 'text-orange-400' };
  if (levelLower === 'high') return { bg: 'from-orange-500/20 to-orange-600/10', border: 'border-orange-500/40', badge: 'bg-orange-500', dot: 'bg-orange-400', text: 'text-orange-400' };
  if (levelLower === 'medium') return { bg: 'from-cyan-600/20 to-cyan-700/10', border: 'border-cyan-500/40', badge: 'bg-cyan-600', dot: 'bg-cyan-500', text: 'text-cyan-400' };
  return { bg: 'from-lime-600/20 to-lime-700/10', border: 'border-lime-500/40', badge: 'bg-lime-600', dot: 'bg-lime-500', text: 'text-lime-400' };
};

const PNPAdmin = () => {
  const navigate = useNavigate();
  const { user, loading, userRole } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [systemStatus, setSystemStatus] = useState('operational');
  const [onlineOfficers, setOnlineOfficers] = useState(12);
  const [stats, setStats] = useState({
    totalAlerts: 0,
    activeAlerts: 0,
    resolvedAlerts: 0,
    avgResponseTime: 0,
  });
  const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([]);
  const [currentHour] = useState(new Date().getHours());
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);
  const [availableOfficers, setAvailableOfficers] = useState(8);
  const [responseMetrics, setResponseMetrics] = useState({
    resolutionRate: 94,
    avgResponseTime: 0,
    successRate: 98,
  });

  const { ref: welcomeRef, isVisible: welcomeVisible } = useScrollAnimation();
  const { ref: statsRef, isVisible: statsVisible } = useScrollAnimation();
  const { ref: activityRef, isVisible: activityVisible } = useScrollAnimation();
  const { ref: actionsRef, isVisible: actionsVisible } = useScrollAnimation();

  const fetchStats = useCallback(async () => {
    try {
      const alertsRes = await supabase.from('alerts' as any).select('id, status, created_at, resolved_at', { count: 'exact', head: false });
      const data = alertsRes.data || [];
      
      const active = data.filter(a => a.status === 'active').length;
      const resolved = data.filter(a => a.status === 'resolved').length;
      const total = data.length;
      
      let avgResponseTime = 0;
      const resolvedAlerts = data.filter(a => a.status === 'resolved');
      if (resolvedAlerts.length > 0) {
        const totalTime = resolvedAlerts.reduce((sum, a) => {
          if (a.resolved_at) {
            return sum + (new Date(a.resolved_at).getTime() - new Date(a.created_at).getTime());
          }
          return sum;
        }, 0);
        avgResponseTime = Math.round(totalTime / resolvedAlerts.length / 1000);
      }

      // Calculate metrics
      const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
      const successRate = resolved > 0 ? 95 : 0;

      setStats({
        totalAlerts: data.length,
        activeAlerts: active,
        resolvedAlerts: resolved,
        avgResponseTime,
      });

      setResponseMetrics({
        resolutionRate,
        avgResponseTime,
        successRate,
      });

      if (active > 5) setSystemStatus('critical');
      else if (active > 2) setSystemStatus('warning');
      else setSystemStatus('operational');
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchActiveAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('alerts' as any)
        .select(`
          id,
          created_at,
          level,
          students(full_name, student_id_number, photo_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      const formatted = (data || []).map((alert: any) => ({
        id: alert.id,
        created_at: alert.created_at,
        level: alert.level,
        student: alert.students,
      }));

      setActiveAlerts(formatted);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/login?type=pnp');
      } else if (userRole && userRole !== 'pnp') {
        navigate('/');
      }
    }
  }, [user, loading, userRole, navigate]);

  useEffect(() => {
    fetchStats();
    fetchActiveAlerts();

    // Initialize activity log with mock data
    const mockActivityLog: ActivityLog[] = [
      {
        id: '1',
        action: 'Emergency Alert Received',
        timestamp: new Date(Date.now() - 2 * 60000).toISOString(),
        officer: 'System',
        details: 'SOS signal from Student ID: 2024-001',
        type: 'dispatch',
      },
      {
        id: '2',
        action: 'Unit Dispatched',
        timestamp: new Date(Date.now() - 90000).toISOString(),
        officer: 'Officer Cruz',
        details: 'Unit 01 assigned to Campus Ave',
        type: 'acknowledge',
      },
      {
        id: '3',
        action: 'Officer En Route',
        timestamp: new Date(Date.now() - 45000).toISOString(),
        officer: 'Officer Cruz',
        details: 'ETA: 2 minutes',
        type: 'assign',
      },
    ];
    setActivityLog(mockActivityLog);

    const channel = supabase
      .channel("pnp-admin-alerts")
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'alerts' 
      }, (payload) => {
        if (payload.new.status !== 'active') {
          fetchActiveAlerts();
          fetchStats();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats, fetchActiveAlerts]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alert deleted');
      setActiveAlerts(activeAlerts.filter(a => a.id !== alertId));
      fetchStats();
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        toast.success('Fullscreen enabled');
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        toast.success('Fullscreen disabled');
      }
    } catch (error) {
      toast.error('Failed to toggle fullscreen');
    }
  };

  // Handle fullscreen changes and close settings on outside click
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleOutsideClick = (e: MouseEvent) => {
      const settingsButton = document.querySelector('[data-settings-button]');
      const settingsDropdown = document.querySelector('[data-settings-dropdown]');
      
      if (
        settingsOpen &&
        !settingsDropdown?.contains(e.target as Node) &&
        !settingsButton?.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('click', handleOutsideClick);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [settingsOpen]);

  const menuItems = [
    {
      title: "Emergency Dashboard",
      description: "Monitor SOS alerts",
      icon: AlertCircle,
      route: '/pnp-dashboard',
      gradient: 'from-red-500 to-rose-600',
      badge: stats.activeAlerts > 0 ? stats.activeAlerts : null,
    },
    {
      title: "Alert History",
      description: "View resolved alerts",
      icon: FileText,
      route: '/pnp-history',
      gradient: 'from-blue-500 to-cyan-600',
    },
    {
      title: "Map View",
      description: "Track incidents",
      icon: MapPin,
      route: '/pnp-map',
      gradient: 'from-green-500 to-emerald-600',
    },
    {
      title: "Reports",
      description: "View analytics",
      icon: TrendingUp,
      route: '/pnp-reports',
      gradient: 'from-purple-500 to-pink-600',
    },
  ];

  const quickActions = [
    { icon: Zap, label: 'Dispatch Unit', color: 'from-cyan-500 to-cyan-600', desc: 'Send officers to location' },
    { icon: Bell, label: 'Request Backup', color: 'from-orange-500 to-orange-600', desc: 'Call for assistance' },
    { icon: Clipboard, label: 'Incident Report', color: 'from-lime-500 to-lime-600', desc: 'File a report' },
  ];

  return (
    <>
      <EmergencyAlertDialog onResolve={() => {}} />
      <div className="min-h-screen bg-white">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-white" />
        </div>

        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          {/* Top Status Bar */}
          <div className="border-b border-gray-100 bg-gray-50">
            <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className={`w-2 h-2 rounded-full ${systemStatus === 'operational' ? 'bg-lime-500' : systemStatus === 'warning' ? 'bg-orange-500' : 'bg-red-500'} animate-pulse`} />
                    <span className="capitalize">System {systemStatus}</span>
                  </div>
                  <div className="hidden md:flex items-center gap-2 text-gray-600">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Avg Response: {stats.avgResponseTime}s</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Header */}
          <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSidebarOpen(!sidebarOpen)} 
                  className="lg:hidden p-2 rounded-lg hover:bg-blue-500/20 transition-colors"
                >
                  {sidebarOpen ? <X className="h-5 w-5 text-white" /> : <Menu className="h-5 w-5 text-white" />}
                </button>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-cyan-500/30 to-cyan-600/20 rounded-xl border border-cyan-500/40">
                    <img src={isuLogo} alt="ISU Logo" className="h-8 w-8 rounded" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">PNP Emergency Command</h1>
                    <p className="text-xs text-gray-600 font-medium">Philippine National Police</p>
                  </div>
                </div>
              </div>

              {/* User Info & Settings */}
              <div className="flex items-center gap-4 relative">
                <div className="hidden sm:flex flex-col text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-600">Duty Officer</p>
                </div>
                
                {/* Settings Button */}
                <div className="relative">
                  <Button
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300 h-10 w-10 p-0"
                    title="Settings"
                    data-settings-button
                  >
                    <Settings className="h-5 w-5" />
                  </Button>

                  {/* Settings Dropdown */}
                  {settingsOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-top-2 duration-200" data-settings-dropdown>
                      <div className="py-2">
                        <button
                          onClick={handleToggleFullscreen}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3 transition-colors"
                        >
                          {isFullscreen ? (
                            <>
                              <Minimize className="h-4 w-4 text-cyan-400" />
                              <span>Exit Fullscreen</span>
                            </>
                          ) : (
                            <>
                              <Maximize className="h-4 w-4 text-cyan-400" />
                              <span>Enter Fullscreen</span>
                            </>
                          )}
                        </button>
                        <div className="border-t border-slate-700/30 my-1"></div>
                        <button
                          onClick={() => {
                            setSettingsOpen(false);
                            handleLogout();
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-orange-300 hover:bg-orange-600/20 flex items-center gap-3 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="relative z-10 pt-4">
          <div className="w-full px-4 sm:px-6 lg:px-8 pb-12">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
              <div 
                className="fixed inset-0 lg:hidden bg-black/50 z-40"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Sidebar - Mobile */}
            {sidebarOpen && (
              <div className="fixed left-0 top-32 bottom-0 w-64 bg-blue-950/95 backdrop-blur-xl border-r border-cyan-500/30 z-40 overflow-y-auto lg:hidden">
                <nav className="p-4 space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.route}
                      onClick={() => {
                        navigate(item.route);
                        setSidebarOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg hover:bg-cyan-500/20 text-cyan-100 transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 text-cyan-400" />
                        <span className="text-sm font-medium">{item.title}</span>
                      </div>
                      {item.badge && <span className="px-2 py-0.5 text-xs font-bold bg-red-600 text-white rounded-full">{item.badge}</span>}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Welcome Section */}
            <div
              ref={welcomeRef}
              className={`mb-8 transition-all duration-1000 ${
                welcomeVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                    {currentHour < 12
                      ? '🌅 Good Morning'
                      : currentHour < 18
                        ? '☀️ Good Afternoon'
                        : '🌙 Good Evening'}
                  </h2>
                  <p className="text-gray-600 text-sm font-medium">Response Center - ISU Campus Safety Operations</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => toast.info(`${action.label} feature coming soon`)}
                  className={`bg-gradient-to-br ${action.color} p-4 rounded-xl text-white font-semibold hover:shadow-xl hover:shadow-blue-500/30 transition-all group border border-white/10 hover:border-white/30`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                      <action.icon className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">{action.label}</p>
                      <p className="text-xs text-white/80">{action.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Stats Grid */}
            <div
              ref={statsRef}
              className={`mb-8 transition-all duration-1000 ${
                statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    title: 'Active Emergencies',
                    value: stats.activeAlerts,
                    icon: AlertCircle,
                    color: 'from-orange-500/20 to-orange-600/10',
                    border: 'border-orange-500/30',
                    iconColor: 'text-orange-400',
                    clickable: true,
                    trend: stats.activeAlerts > 0 ? '+' + stats.activeAlerts : 'All Clear',
                  },
                  {
                    title: 'Total Reports',
                    value: stats.totalAlerts,
                    icon: Bell,
                    color: 'from-cyan-500/20 to-cyan-600/10',
                    border: 'border-cyan-500/30',
                    iconColor: 'text-cyan-400',
                    trend: 'Today',
                  },
                  {
                    title: 'Resolved',
                    value: stats.resolvedAlerts,
                    icon: CheckCircle,
                    color: 'from-lime-500/20 to-lime-600/10',
                    border: 'border-lime-500/30',
                    iconColor: 'text-lime-400',
                    trend: 'Completed',
                  },
                  {
                    title: 'Response Time',
                    value: `${stats.avgResponseTime}s`,
                    icon: Clock,
                    color: 'from-cyan-500/20 to-cyan-600/10',
                    border: 'border-cyan-500/30',
                    iconColor: 'text-cyan-400',
                    trend: 'Average',
                  },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    onClick={() => stat.clickable && navigate('/pnp-dashboard')}
                    className={`bg-gradient-to-br ${stat.color} border ${stat.border} rounded-xl p-6 backdrop-blur-sm hover:border-cyan-300/50 hover:bg-gradient-to-br transition-all group ${stat.clickable ? 'cursor-pointer' : ''} overflow-hidden relative`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{stat.title}</p>
                        <stat.icon className={`h-5 w-5 ${stat.iconColor} group-hover:scale-125 transition-transform`} />
                      </div>
                      <div className="flex items-baseline justify-between">
                        <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                        <span className="text-xs text-gray-600 font-medium">{stat.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Cards */}
            <div
              ref={actionsRef}
              className={`mb-8 transition-all duration-1000 ${
                actionsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Response Tools</h3>
                <span className="text-xs text-gray-600">Quick Access</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {menuItems.map((item) => (
                  <button
                    key={item.route}
                    onClick={() => navigate(item.route)}
                    className={`bg-gradient-to-br ${item.gradient} p-5 rounded-xl hover:shadow-xl hover:shadow-cyan-500/40 transition-all group border border-white/10 hover:border-cyan-300/30 text-left relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative">
                      <div className="flex items-start justify-between mb-3">
                        <item.icon className="h-6 w-6 text-white group-hover:scale-125 transition-transform" />
                        {item.badge && (
                          <span className="px-2 py-1 text-xs font-bold rounded-lg bg-white/20 text-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-white text-sm mb-1">{item.title}</h4>
                      <p className="text-xs text-white/80 mb-3">{item.description}</p>
                      <div className="flex items-center gap-2 text-white/70 group-hover:text-white transition-colors text-xs font-medium">
                        <span>Access</span>
                        <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Alerts Section */}
            {activeAlerts.length > 0 && (
              <div
                ref={activityRef}
                className={`transition-all duration-1000 ${
                  activityVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-white">Active Incidents</h3>
                    <p className="text-xs text-cyan-300 mt-1">{activeAlerts.length} ongoing response{activeAlerts.length !== 1 ? 's' : ''}</p>
                  </div>
                  <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30">
                    🚨 Live
                  </span>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-cyan-950/50">
                  {activeAlerts.map((alert) => {
                    const colors = getAlertColor(alert.level);
                    const timeSince = Math.floor((Date.now() - new Date(alert.created_at).getTime()) / 1000);
                    const timeStr = timeSince < 60 ? `${timeSince}s` : timeSince < 3600 ? `${Math.floor(timeSince / 60)}m` : `${Math.floor(timeSince / 3600)}h`;
                    
                    return (
                      <div
                        key={alert.id}
                        className={`bg-gradient-to-r ${colors.bg} border ${colors.border} rounded-xl p-4 backdrop-blur-sm hover:border-cyan-300/40 hover:bg-gradient-to-r transition-all group relative overflow-hidden`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative">
                          <div className="flex items-center justify-between gap-4 mb-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              {alert.student?.photo_url ? (
                                <img
                                  src={alert.student.photo_url}
                                  alt={alert.student.full_name}
                                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0 ring-2 ring-white/20"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-cyan-500/30 flex items-center justify-center flex-shrink-0 ring-2 ring-white/20">
                                  <User className="h-6 w-6 text-cyan-300" />
                                </div>
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-sm truncate">{alert.student?.full_name}</p>
                                <p className="text-xs text-white/70">ID: {alert.student?.student_id_number}</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className={`px-2 py-1 text-xs font-bold rounded-lg ${colors.badge} text-white`}>
                                {alert.level?.toUpperCase() || 'HIGH'}
                              </span>
                              <p className="text-xs text-white/70 mt-1 font-medium">{timeStr} ago</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('/pnp-dashboard');
                              }}
                              className="flex-1 px-3 py-1.5 text-xs font-semibold text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteAlert(alert.id);
                              }}
                              className="px-3 py-1.5 text-xs font-semibold text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg transition-colors flex items-center gap-1"
                              title="Delete alert"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Two Column Layout for Operation Center */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Response Metrics */}
              <div className="bg-gradient-to-br from-blue-950/50 to-slate-900/30 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-cyan-400" />
                  Performance Metrics
                </h4>
                <div className="space-y-4">
                  {[
                    { label: 'Resolution Rate', value: `${responseMetrics.resolutionRate}%`, color: 'text-lime-400' },
                    { label: 'Success Rate', value: `${responseMetrics.successRate}%`, color: 'text-cyan-400' },
                    { label: 'Active Incidents', value: stats.activeAlerts, color: 'text-orange-400' },
                  ].map((metric, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white/70">{metric.label}</span>
                        <span className={`text-lg font-bold ${metric.color}`}>{metric.value}</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${idx === 0 ? 'bg-green-500' : idx === 1 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${typeof metric.value === 'number' ? Math.min(metric.value, 100) : metric.value.split('%')[0]}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Log Timeline */}
              <div className="bg-gradient-to-br from-blue-950/50 to-slate-900/30 border border-cyan-500/20 rounded-xl p-6 backdrop-blur-sm">
                <h4 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="h-5 w-5 text-cyan-400" />
                  Real-time Activity Log
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {activityLog.map((log, idx) => {
                    const actionIcons = {
                      dispatch: <AlertCircle className="h-4 w-4 text-orange-400" />,
                      acknowledge: <CheckCircle className="h-4 w-4 text-lime-400" />,
                      assign: <User className="h-4 w-4 text-cyan-400" />,
                      resolve: <CheckCircle className="h-4 w-4 text-lime-400" />,
                    };
                    const timeStr = new Date(log.timestamp).toLocaleTimeString();

                    return (
                      <div key={log.id} className="flex gap-3 pb-3 border-b border-white/10 last:border-b-0">
                        <div className="flex-shrink-0 mt-1">
                          {actionIcons[log.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold text-white">{log.action}</p>
                              <p className="text-xs text-white/60 mt-0.5">{log.details}</p>
                            </div>
                            <span className="text-xs text-white/50 whitespace-nowrap flex-shrink-0">{timeStr}</span>
                          </div>
                          <p className="text-xs text-blue-300 mt-1">by {log.officer}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 bg-gradient-to-r from-blue-950/80 to-blue-900/60 border-t border-cyan-500/30 backdrop-blur-xl mt-12">
          <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              {/* Contact Info */}
              <div>
                <p className="text-cyan-400 font-bold text-sm mb-2">CONTACT</p>
                <p className="text-cyan-100 text-xs">ISU Campus Safety</p>
                <p className="text-cyan-300/70 text-xs">Emergency: 911</p>
                <p className="text-cyan-300/70 text-xs">Hotline: +63 2 xxx xxxx</p>
              </div>

              {/* System Status */}
              <div>
                <p className="text-cyan-400 font-bold text-sm mb-2">SYSTEM STATUS</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 bg-lime-500 rounded-full animate-pulse"></span>
                  <p className="text-cyan-100">Operational</p>
                </div>
                <p className="text-cyan-300/70 text-xs mt-1">Real-time monitoring active</p>
              </div>

              {/* System Info */}
              <div>
                <p className="text-cyan-400 font-bold text-sm mb-2">CONNECTION</p>
                <p className="text-cyan-100 text-xs">Status: Connected</p>
                <p className="text-cyan-300/70 text-xs">Uptime: 99.9%</p>
                <p className="text-cyan-300/70 text-xs">Last sync: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>

            <div className="border-t border-cyan-500/20 pt-4">
              <p className="text-center text-cyan-300/60 text-xs">
                © 2025 ISU Safe Ride Emergency Response System. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
};

export default PNPAdmin;
