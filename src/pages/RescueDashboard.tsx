import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  Settings,
  Menu,
  X,
  MapPin,
  Users,
  TrendingUp,
  Truck,
  Bell,
  FileText,
  CheckSquare,
  MessageSquare,
  ChevronDown,
  Clock,
  Phone,
  Loader,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useRescueData } from "@/hooks/useRescueData";
import { useRescueNotifications } from "@/hooks/useRescueNotifications";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import isuLogo from "@/assets/isu-logo.png";
import campusBg from "@/assets/campus-bg.jpeg";

interface Alert {
  id: string;
  studentName: string;
  location: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
  status: "active" | "resolved";
  latitude?: number;
  longitude?: number;
}

interface RescueOfficer {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "available" | "responding" | "busy";
  distance?: number;
  latitude?: number;
  longitude?: number;
  vehicleType?: string;
}

interface Metric {
  label: string;
  value: number | string;
  subtext?: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "alert" | "update" | "info";
  read: boolean;
}

interface IncidentReport {
  id: string;
  alertId: string;
  studentName: string;
  location: string;
  responders: string[];
  resolutionTime: string;
  status: string;
  date: string;
}

interface ChecklistItem {
  id: string;
  title: string;
  completed: boolean;
  alertId?: string;
}

interface ChatMessage {
  id: string;
  senderName: string;
  senderId: string;
  message: string;
  timestamp: string;
  alertId?: string;
}

const RescueDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAlertPopup, setShowAlertPopup] = useState(false);
  const [newAlertData, setNewAlertData] = useState<Alert | null>(null);
  const [lastAlertId, setLastAlertId] = useState<string | null>(null);

  // Use real data hooks
  const {
    alerts,
    nearbyOfficers,
    metrics,
    incidents,
    loading: dataLoading,
  } = useRescueData();
  
  const {
    notifications,
    chatMessages,
    sendChatMessage,
    subscribeToChatMessages,
  } = useRescueNotifications();

  // Show popup when new alerts arrive
  useEffect(() => {
    if (alerts && alerts.length > 0) {
      const latestAlert = alerts[0];
      
      // If this is a new alert (different from the last one we showed)
      if (lastAlertId !== latestAlert.id) {
        setNewAlertData(latestAlert);
        setShowAlertPopup(true);
        setLastAlertId(latestAlert.id);
        
        // Auto-close popup after 8 seconds
        const timer = setTimeout(() => {
          setShowAlertPopup(false);
        }, 8000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [alerts, lastAlertId]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
      return;
    }
  }, [user, authLoading, navigate]);

  // Initialize checklist when active alert changes
  useEffect(() => {
    if (activeChecklistId) {
      const defaultChecklist: ChecklistItem[] = [
        { id: "c1", title: "Assess patient condition", completed: false, alertId: activeChecklistId },
        { id: "c2", title: "Call medical team if needed", completed: false, alertId: activeChecklistId },
        { id: "c3", title: "Secure area perimeter", completed: false, alertId: activeChecklistId },
        { id: "c4", title: "Document incident details", completed: false, alertId: activeChecklistId },
        { id: "c5", title: "Prepare for transport", completed: false, alertId: activeChecklistId },
      ];
      setChecklist(defaultChecklist);
      subscribeToChatMessages(activeChecklistId);
    }
  }, [activeChecklistId, subscribeToChatMessages]);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
    }
  };

  const [activeTab, setActiveTab] = useState("overview");
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeChecklistId, setActiveChecklistId] = useState<string | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedAlertForChat, setSelectedAlertForChat] = useState<string | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markNotificationsAsRead = () => {
    // Notifications are managed by the hook
  };

  const toggleChecklist = (id: string) => {
    setChecklist(
      checklist.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedAlertForChat) return;
    
    await sendChatMessage(newMessage, selectedAlertForChat);
    setNewMessage("");
    toast.success("Message sent");
  };

  const handleDispatch = (alertId: string, officerId: string) => {
    toast.success("Officer dispatched to incident");
  };

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
      <header className="sticky top-0 z-50 bg-red-900/40 backdrop-blur-md border-b border-orange-500/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={isuLogo} alt="ISU Logo" className="w-10 h-10 rounded-full bg-white p-1" />
              <div>
                <h1 className="text-xl font-bold text-white">Rescue Dashboard</h1>
                <p className="text-xs text-orange-200">Emergency Response Team</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <button
                type="button"
                aria-label="Toggle notifications"
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) markNotificationsAsRead();
                }}
                className="relative text-orange-200 hover:text-white hover:bg-orange-600/30 p-2 rounded-lg transition"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/rescue/settings")}
                className="text-orange-200 hover:text-white hover:bg-orange-600/30"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-red-200 hover:text-white hover:bg-red-600/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              title={mobileMenuOpen ? "Close menu" : "Open menu"}
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
                  setShowNotifications(!showNotifications);
                  markNotificationsAsRead();
                }}
                className="w-full text-left px-4 py-2 text-orange-200 hover:text-white hover:bg-orange-600/30 rounded-lg flex items-center gap-2 relative"
              >
                <Bell className="w-4 h-4" />
                Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/rescue/settings")}
                className="w-full justify-start text-orange-200 hover:text-white hover:bg-orange-600/30"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-red-200 hover:text-white hover:bg-red-600/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          )}

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute top-20 right-4 md:right-auto md:top-auto md:mt-2 w-80 bg-red-900/90 border border-orange-500/50 rounded-lg shadow-2xl z-40">
              <div className="p-4 border-b border-orange-500/30">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications
                </h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 border-b border-orange-500/20 hover:bg-orange-600/20 transition"
                    >
                      <div className="flex gap-2">
                        <div
                          className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                            notif.type === "alert"
                              ? "bg-red-500"
                              : notif.type === "update"
                              ? "bg-blue-500"
                              : "bg-green-500"
                          }`}
                        />
                        <div className="flex-1">
                          <p className="text-white font-sm font-medium">{notif.title}</p>
                          <p className="text-orange-200 text-xs">{notif.message}</p>
                          <p className="text-orange-300/60 text-xs mt-1">{notif.timestamp}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-orange-200 text-sm">No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-20 z-40 bg-red-900/30 border-b border-orange-500/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 flex gap-2 overflow-x-auto pb-2 pt-2">
          {[
            { id: "overview", label: "Overview", icon: TrendingUp },
            { id: "map", label: "Live Map", icon: MapPin },
            { id: "officers", label: "Officers", icon: Users },
            { id: "incidents", label: "Incidents", icon: FileText },
            { id: "checklist", label: "Checklist", icon: CheckSquare },
            { id: "chat", label: "Communications", icon: MessageSquare },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap flex items-center gap-2 transition ${
                activeTab === id
                  ? "bg-orange-500/40 text-white border border-orange-400"
                  : "text-orange-200 hover:bg-orange-600/20"
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
          <div className="space-y-6">
            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-red-900/40 border border-orange-400/30 rounded-lg p-6 hover:border-orange-400/60 transition"
                >
                  <p className="text-orange-200 text-sm font-medium">{metric.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">{metric.value}</p>
                  {metric.subtext && (
                    <p className="text-orange-300/60 text-xs mt-1">{metric.subtext}</p>
                  )}
                </div>
              ))}
            </div>

            {/* Active Alerts */}
            <div className="bg-red-900/30 border border-orange-400/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Active Alerts ({alerts.length})
              </h2>
              {alerts.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-orange-400/40 mx-auto mb-3" />
                  <p className="text-orange-200 font-medium">Walang active alerts</p>
                  <p className="text-orange-300/60 text-sm mt-1">Maghihintay para sa student SOS</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <div key={alert.id} className="bg-red-950/50 border border-orange-500/30 rounded-lg p-4 hover:border-orange-400 transition">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg">{alert.studentName}</h3>
                          <p className="text-orange-200 text-sm flex items-center gap-2 mt-2">
                            <MapPin className="w-4 h-4" />
                            {alert.location || "Location not available"}
                          </p>
                          <p className="text-orange-300/60 text-xs mt-1">Updated: {alert.timestamp}</p>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              alert.severity === "high"
                                ? "bg-red-600 text-white"
                                : alert.severity === "medium"
                                ? "bg-orange-600 text-white"
                                : "bg-yellow-600 text-white"
                            }`}
                          >
                            {alert.severity.toUpperCase()}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              onClick={() => {
                                if (alert.latitude && alert.longitude) {
                                  window.open(`https://maps.google.com/?q=${alert.latitude},${alert.longitude}`, '_blank');
                                }
                              }}
                            >
                              View Location
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            >
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* MAP TAB */}
        {activeTab === "map" && (
          <div className="bg-red-900/30 border border-orange-400/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Live Emergency Map
            </h2>
            <div className="bg-red-950/50 rounded-lg p-8 text-center h-96 flex items-center justify-center border-2 border-dashed border-orange-500/30">
              <div>
                <MapPin className="w-12 h-12 text-orange-400 mx-auto mb-3" />
                <p className="text-orange-200 font-medium">
                  Map Integration Ready
                </p>
                <p className="text-orange-300/60 text-sm mt-2">
                  Connect your mapping service (Google Maps, Mapbox, etc.)
                </p>
                <div className="mt-4 space-y-2 text-left text-orange-300/60 text-xs">
                  <p>• Shows active emergency locations</p>
                  <p>• Rescue officer real-time positions</p>
                  <p>• Route optimization for responders</p>
                  <p>• Zone coverage heatmap</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* OFFICERS TAB */}
        {activeTab === "officers" && (
          <div className="space-y-6">
            <div className="bg-red-900/30 border border-orange-400/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Nearby Rescue Officers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {nearbyOfficers.length === 0 ? (
                  <div className="col-span-full text-center py-8">
                    <Users className="w-12 h-12 text-orange-400/40 mx-auto mb-3" />
                    <p className="text-orange-200 font-medium">Walang available officers</p>
                    <p className="text-orange-300/60 text-sm mt-1">Lahat ay occupied sa ibang calls</p>
                  </div>
                ) : (
                  nearbyOfficers.map((officer) => (
                    <div
                      key={officer.id}
                      className="bg-red-950/50 border border-orange-500/30 rounded-lg p-4 hover:border-orange-400 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-white font-semibold">{officer.name}</h3>
                          <p className="text-orange-200 text-xs">{officer.vehicleType}</p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            officer.status === "available"
                              ? "bg-green-600 text-white"
                              : officer.status === "responding"
                              ? "bg-orange-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        >
                          {officer.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm mb-4">
                        <div className="flex items-center gap-2 text-orange-200">
                          <Phone className="w-4 h-4" />
                          <a href={`tel:${officer.phone}`} className="hover:text-orange-100">
                            {officer.phone}
                          </a>
                        </div>
                        <div className="text-orange-200">
                          <span className="text-orange-400 font-semibold">{officer.distance} km</span>{" "}
                          away
                        </div>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href = `mailto:${officer.email}`;
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                      >
                        Contact Officer
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* INCIDENTS TAB */}
        {activeTab === "incidents" && (
          <div className="bg-red-900/30 border border-orange-400/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Incident History & Reports
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-orange-200">
                <thead>
                  <tr className="border-b border-orange-500/30">
                    <th className="text-left py-3 px-4 text-orange-300">Student</th>
                    <th className="text-left py-3 px-4 text-orange-300">Location</th>
                    <th className="text-left py-3 px-4 text-orange-300">Responders</th>
                    <th className="text-left py-3 px-4 text-orange-300">Resolution Time</th>
                    <th className="text-left py-3 px-4 text-orange-300">Status</th>
                    <th className="text-left py-3 px-4 text-orange-300">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8">
                        <p className="text-orange-200 font-medium">Walang incident history</p>
                        <p className="text-orange-300/60 text-sm mt-1">Resolved incidents ay lalabas dito</p>
                      </td>
                    </tr>
                  ) : (
                    incidents.map((incident) => (
                      <tr key={incident.id} className="border-b border-orange-500/20 hover:bg-red-950/30">
                        <td className="py-3 px-4">{incident.studentName}</td>
                        <td className="py-3 px-4">{incident.location}</td>
                        <td className="py-3 px-4">{incident.responders.join(", ")}</td>
                        <td className="py-3 px-4">
                          <span className="flex items-center gap-1 text-blue-300">
                            <Clock className="w-4 h-4" />
                            {incident.resolutionTime}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded bg-green-600/30 text-green-300 text-xs font-semibold">
                            {incident.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-orange-300/60">{incident.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHECKLIST TAB */}
        {activeTab === "checklist" && (
          <div className="space-y-6">
            {alerts.map((alert) => (
              <div key={alert.id} className="bg-red-900/30 border border-orange-400/30 rounded-lg p-6">
                <div
                  className="flex justify-between items-center cursor-pointer mb-4"
                  onClick={() =>
                    setActiveChecklistId(
                      activeChecklistId === alert.id ? null : alert.id
                    )
                  }
                >
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    Response Checklist - {alert.studentName}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-orange-400 transition ${
                      activeChecklistId === alert.id ? "rotate-180" : ""
                    }`}
                  />
                </div>

                {activeChecklistId === alert.id && (
                  <div className="space-y-3">
                    {checklist.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-3 p-3 bg-red-950/50 rounded-lg hover:bg-red-950/70 cursor-pointer transition"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklist(item.id)}
                          className="w-5 h-5 rounded accent-orange-500"
                        />
                        <span
                          className={`text-sm ${
                            item.completed
                              ? "line-through text-orange-300/60"
                              : "text-orange-200"
                          }`}
                        >
                          {item.title}
                        </span>
                      </label>
                    ))}

                    <div className="mt-4 pt-4 border-t border-orange-500/20">
                      <p className="text-orange-200 text-sm font-semibold">
                        {checklist.filter((i) => i.completed).length} of{" "}
                        {checklist.length} completed
                      </p>
                      <div className="w-full bg-red-950/50 rounded-full h-2 mt-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-orange-500 to-red-600 h-full transition-all"
                          style={{
                            width: `${
                              (checklist.filter((i) => i.completed).length /
                                checklist.length) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CHAT TAB */}
        {activeTab === "chat" && (
          <div className="bg-red-900/30 border border-orange-400/30 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Team Communications
            </h2>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Alert Selection */}
              <div>
                <p className="text-orange-300 font-semibold mb-3 text-sm">Active Incidents</p>
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => setSelectedAlertForChat(alert.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition ${
                        selectedAlertForChat === alert.id
                          ? "bg-orange-600/40 border border-orange-400"
                          : "bg-red-950/50 border border-orange-500/20 hover:border-orange-400/50"
                      }`}
                    >
                      <p className="text-white text-sm font-medium">{alert.studentName}</p>
                      <p className="text-orange-200 text-xs">{alert.location}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Area */}
              <div className="lg:col-span-3 flex flex-col bg-red-950/50 rounded-lg border border-orange-500/20">
                {selectedAlertForChat ? (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
                      {chatMessages
                        .filter((m) => m.alertId === selectedAlertForChat)
                        .map((msg) => (
                          <div key={msg.id} className="flex gap-2">
                            <div className="flex-1">
                              <p className="text-orange-300 text-xs font-semibold">
                                {msg.senderName}
                              </p>
                              <div className="bg-orange-600/20 rounded px-3 py-2 mt-1 border-l-2 border-orange-500">
                                <p className="text-orange-100 text-sm">{msg.message}</p>
                                <p className="text-orange-300/60 text-xs mt-1">
                                  {msg.timestamp}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="border-t border-orange-500/20 p-3 flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleSendMessage();
                        }}
                        placeholder="Type message..."
                        className="flex-1 bg-red-950/50 border border-orange-500/30 rounded px-3 py-2 text-orange-100 placeholder-orange-400/50 focus:outline-none focus:border-orange-400"
                      />
                      <Button
                        onClick={handleSendMessage}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        Send
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center p-8 text-center">
                    <div>
                      <MessageSquare className="w-12 h-12 text-orange-500/40 mx-auto mb-3" />
                      <p className="text-orange-200">Select an incident to start communication</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Emergency Alert Popup */}
      {showAlertPopup && newAlertData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-red-500/50 rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.4)] max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-red-600/10 border-b border-red-500/30 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-ping absolute inset-0" />
                  <div className="w-3 h-3 rounded-full bg-red-500 relative" />
                </div>
                <span className="text-red-100 font-bold text-sm tracking-wider uppercase">SOS Signal Received</span>
              </div>
              <button>
                onClick={() => setShowAlertPopup(false)}
                className="text-red-400 hover:text-white transition-colors"
              
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-5">
              {/* Student Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-red-900/30 flex items-center justify-center border border-red-500/30 text-red-400">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide">Student</p>
                  <p className="text-white font-bold text-lg leading-tight">{newAlertData.studentName}</p>
                </div>
              </div>

              {/* Location Box */}
              <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-orange-500 font-bold uppercase mb-1">Current Location</p>
                    <p className="text-sm text-gray-200 leading-snug">{newAlertData.location}</p>
                    {newAlertData.latitude && (
                      <p className="text-[10px] text-gray-500 mt-1.5 font-mono bg-white/5 inline-block px-1.5 py-0.5 rounded">
                        {newAlertData.latitude.toFixed(4)}, {newAlertData.longitude?.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Time & Severity */}
              <div className="flex items-center justify-between text-sm border-t border-white/10 pt-4">
                <div className="flex items-center gap-2 text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{newAlertData.timestamp}</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                  newAlertData.severity === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}>
                  {newAlertData.severity} Priority
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 pt-0 flex gap-3">
              <Button
                onClick={() => {
                  setShowAlertPopup(false);
                  setActiveChecklistId(newAlertData.id);
                  setActiveTab("alerts");
                }}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold h-10 border-0 shadow-lg shadow-red-900/20"
              >
                Respond
              </Button>
              <Button
                onClick={() => setShowAlertPopup(false)}
                variant="ghost"
                className="flex-1 border border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white h-10"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RescueDashboard;
