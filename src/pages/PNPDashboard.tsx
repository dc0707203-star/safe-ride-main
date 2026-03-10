import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  AlertTriangle,
  MapPin,
  User,
  Clock,
  Phone,
  Car,
  Shield,
  CheckCircle2,
  Zap,
  AlertCircle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";
import { signOut } from "@/lib/auth";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import campusBg from "@/assets/campus-bg.jpeg";

const PNPDashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [alertTimers, setAlertTimers] = useState<{ [key: string]: number }>({});

  // Update timers
  useEffect(() => {
    const interval = setInterval(() => {
      setAlertTimers(prev => {
        const updated = { ...prev };
        alerts.filter(a => a.status === 'active').forEach(alert => {
          if (!updated[alert.id]) {
            updated[alert.id] = 0;
          }
          updated[alert.id] = Math.floor((Date.now() - new Date(alert.created_at).getTime()) / 1000);
        });
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [alerts]);

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("alerts" as any)
        .select(
          `
          *,
          students(full_name, student_id_number, photo_url, contact_number)
        `
        )
        .eq("status", "active")
        .order("created_at", { ascending: false }) as { data: any[]; error: any };

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error("Fetch alerts error:", error);
      toast.error("Failed to load SOS alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel("pnp-sos-alerts")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          if (payload.new.status === "active") {
            toast.error("🚨 NEW SOS ALERT!", {
              description: `Student ${payload.new.students?.full_name} needs help!`,
            });
            fetchAlerts();
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "alerts",
        },
        () => {
          fetchAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAlerts]);

  const getPriorityColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return { border: "border-red-500", badge: "bg-red-500/80", text: "text-red-400" };
      case "high":
        return { border: "border-orange-500", badge: "bg-orange-500/80", text: "text-orange-400" };
      case "medium":
        return { border: "border-yellow-500", badge: "bg-yellow-500/80", text: "text-yellow-400" };
      default:
        return { border: "border-blue-500", badge: "bg-blue-500/80", text: "text-blue-400" };
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading SOS alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      <div className="fixed inset-0 bg-gradient-to-br from-blue-950/70 via-blue-950/80 to-black/80 backdrop-blur-lg" />

      {/* Header */}
      <div className="z-10 sticky top-0 bg-black/60 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="gap-2 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-400" />
              <h1 className="text-xl font-bold text-white">PNP - SOS Dashboard</h1>
              {alerts.length > 0 && (
                <Badge className="animate-pulse text-sm px-3 py-1 bg-red-500/80 text-white">
                  {alerts.length} ACTIVE SOS
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-white/70 hidden sm:block">
                {new Date().toLocaleString()}
              </div>
              {isMobile ? (
                <Button
                  onClick={handleLogout}
                  className="gap-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              ) : null}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">
            <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <p className="text-xs text-red-300 font-bold uppercase">Active SOS</p>
              <p className="text-2xl font-bold text-white">{alerts.length}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <p className="text-xs text-blue-300 font-bold uppercase">Critical</p>
              <p className="text-2xl font-bold text-white">{alerts.filter(a => a.level?.toLowerCase() === 'critical').length}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <p className="text-xs text-orange-300 font-bold uppercase">High</p>
              <p className="text-2xl font-bold text-white">{alerts.filter(a => a.level?.toLowerCase() === 'high').length}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <p className="text-xs text-yellow-300 font-bold uppercase">Medium</p>
              <p className="text-2xl font-bold text-white">{alerts.filter(a => a.level?.toLowerCase() === 'medium').length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6">
        {alerts.length > 0 ? (
          <div className="grid gap-4">
            {alerts.map((alert) => {
              const colors = getPriorityColor(alert.level);
              const elapsedSeconds = alertTimers[alert.id] || 0;
              const mins = Math.floor(elapsedSeconds / 60);
              const secs = elapsedSeconds % 60;
              const isExpanded = expandedAlert === alert.id;

              return (
                <Card
                  key={alert.id}
                  className={`border-2 ${colors.border} bg-gradient-to-r from-slate-900/40 to-slate-950/60 shadow-lg shadow-slate-500/20 overflow-hidden hover:shadow-lg hover:shadow-slate-500/40 transition-all cursor-pointer`}
                  onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                >
                  <div className={`absolute top-0 left-0 right-0 h-1 ${colors.badge} animate-pulse`} />
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
                      {/* Student Info */}
                      <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="relative flex-shrink-0">
                          {alert.students?.photo_url ? (
                            <img
                              src={alert.students.photo_url}
                              alt={alert.students.full_name}
                              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-4 ring-blue-500/50"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-500/20 flex items-center justify-center ring-4 ring-blue-500/50">
                              <User className="h-8 w-8 sm:h-10 sm:w-10 text-blue-400" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center animate-pulse">
                            <AlertCircle className="h-3 w-3 text-white" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-lg sm:text-xl text-white truncate">
                              {alert.students?.full_name || "Unknown"}
                            </h3>
                            <Badge className={`${colors.badge} text-white text-xs font-bold uppercase`}>
                              {alert.level || "HIGH"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-2">
                            <p className="text-white/80 font-mono">
                              ID: {alert.students?.student_id_number || "N/A"}
                            </p>
                            <p className="text-white/80">
                              {alert.students?.year || "N/A"} - {alert.students?.course || "N/A"}
                            </p>
                          </div>
                          {alert.message && (
                            <p className="text-xs sm:text-sm font-medium text-red-200 bg-red-500/20 px-2 sm:px-3 py-1.5 rounded inline-block break-words mb-2">
                              "{alert.message}"
                            </p>
                          )}
                          <p className={`text-sm sm:text-base font-bold ${colors.text}`}>
                            ⏱ {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} ago
                          </p>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-col gap-2 w-full lg:w-48 flex-shrink-0">
                        {alert.students?.contact_number && (
                          <Button
                            size="sm"
                            className="w-full gap-2 bg-blue-500/80 hover:bg-blue-600 text-white text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${alert.students.contact_number}`);
                            }}
                          >
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                            Call Student
                          </Button>
                        )}
                        {alert.location_lat && alert.location_lng && (
                          <Button
                            size="sm"
                            className="w-full gap-2 bg-green-500/80 hover:bg-green-600 text-white text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`, '_blank');
                            }}
                          >
                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                            Track Location
                          </Button>
                        )}
                        {alert.drivers?.contact_number && (
                          <Button
                            size="sm"
                            className="w-full gap-2 bg-purple-500/80 hover:bg-purple-600 text-white text-xs sm:text-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(`tel:${alert.drivers.contact_number}`);
                            }}
                          >
                            <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                            Call Driver
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-white/20 space-y-3">
                        {/* Student Details Grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                            <p className="text-xs text-white/70 font-bold mb-1">📞 Contact</p>
                            <p className="text-sm text-white font-mono break-all">{alert.students?.contact_number || "N/A"}</p>
                          </div>
                          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                            <p className="text-xs text-white/70 font-bold mb-1">⏰ Time</p>
                            <p className="text-sm text-white font-mono">{new Date(alert.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>

                        {/* Location Info */}
                        {alert.location_lat && (
                          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                            <p className="text-xs text-white/70 font-bold mb-1">📍 Location</p>
                            <p className="text-sm text-white font-mono">{alert.location_lat.toFixed(4)}, {alert.location_lng.toFixed(4)}</p>
                          </div>
                        )}

                        {/* Driver Info */}
                        {alert.drivers && (
                          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                            <p className="text-xs text-white/70 font-bold mb-1">🚕 Assigned Driver</p>
                            <p className="text-sm text-white font-semibold">{alert.drivers.full_name}</p>
                            <p className="text-xs text-white/70">Plate: {alert.drivers.tricycle_plate_number}</p>
                            <p className="text-xs text-white/70">Contact: {alert.drivers.contact_number}</p>
                          </div>
                        )}

                        {/* Message */}
                        {alert.message && (
                          <div className="bg-black/40 rounded-lg p-3 border border-white/10">
                            <p className="text-xs text-white/70 font-bold mb-1">💬 Message</p>
                            <p className="text-sm text-white">{alert.message}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">All Clear</h3>
            <p className="text-white/70">No active SOS alerts at this time</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PNPDashboard;
