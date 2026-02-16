import { useEffect, useState, useCallback, useRef } from "react";
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
  Volume2,
  X,
  MessageSquare,
  Send,
  TrendingUp,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmergencySiren } from "@/hooks/useEmergencySiren";
import campusBg from "@/assets/campus-bg.jpeg";

const EmergencyAlerts = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'resolved'>('active');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [responseNotes, setResponseNotes] = useState<{ [key: string]: string }>({});
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [alertTimers, setAlertTimers] = useState<{ [key: string]: number }>({});

  const { start: startSiren, stop: stopSiren } = useEmergencySiren();

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
      // Fetch alerts first
      const { data: alertsData, error: alertsError } = await supabase
        .from("alerts" as any)
        .select("*")
        .order("created_at", { ascending: false }) as { data: any[]; error: any };

      if (alertsError) throw alertsError;

      if (!alertsData || alertsData.length === 0) {
        setAlerts([]);
        return;
      }

      // Get unique student_ids and driver_ids
      const studentIds = [...new Set(alertsData.map(a => a.student_id).filter(Boolean))];
      const driverIds = [...new Set(alertsData.map(a => a.driver_id).filter(Boolean))];

      // Fetch student data separately
      let studentDataMap: { [key: string]: any } = {};
      if (studentIds.length > 0) {
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select("id, full_name, student_id_number, photo_url, contact_number")
          .in("id", studentIds);

        if (studentsError) {
          console.warn("Failed to fetch student data:", studentsError);
        } else {
          studentDataMap = (studentsData || []).reduce((acc, student) => {
            acc[student.id] = student;
            return acc;
          }, {});
        }
      }

      // Fetch driver data separately
      let driverDataMap: { [key: string]: any } = {};
      if (driverIds.length > 0) {
        const { data: driversData, error: driversError } = await supabase
          .from("drivers")
          .select("id, full_name, tricycle_plate_number, contact_number")
          .in("id", driverIds);

        if (driversError) {
          console.warn("Failed to fetch driver data:", driversError);
        } else {
          driverDataMap = (driversData || []).reduce((acc, driver) => {
            acc[driver.id] = driver;
            return acc;
          }, {});
        }
      }

      // Merge the data
      const alertsWithData = alertsData.map(alert => ({
        ...alert,
        students: studentDataMap[alert.student_id] || null,
        drivers: driverDataMap[alert.driver_id] || null,
      }));

      setAlerts(alertsWithData);
    } catch (error: any) {
      console.error("Fetch alerts error:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();

    const channel = supabase
      .channel("emergency-alerts-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        async (payload) => {
          console.log("🚨 NEW EMERGENCY ALERT RECEIVED!", payload);

          if (!isSoundMuted) {
            startSiren();
          }

          toast.error("🚨 EMERGENCY SOS ALERT!", {
            id: payload.new.id,
            duration: 15000,
            description: "A student needs immediate help!",
          });

          // Fetch the full alert data with student/driver relations
          try {
            const { data: fullAlert } = await supabase
              .from("alerts" as any)
              .select(
                `
                *,
                students(full_name, student_id_number, photo_url, contact_number),
                drivers(full_name, tricycle_plate_number, contact_number)
              `
              )
              .eq("id", payload.new.id)
              .single();

            if (fullAlert) {
              setAlerts((prev) => [fullAlert as any, ...prev]);
            } else {
              setAlerts((prev) => [payload.new as any, ...prev]);
            }
          } catch (error) {
            console.error("Error fetching full alert data:", error);
            setAlerts((prev) => [payload.new as any, ...prev]);
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
      .subscribe((status) => {
        console.log("Realtime subscription status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
      stopSiren();
    };
  }, [fetchAlerts, startSiren, stopSiren, isSoundMuted]);

  const getAlertColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case 'critical': return { border: 'border-red-500', bg: 'bg-white', text: 'text-red-600', badge: 'bg-red-500' };
      case 'high': return { border: 'border-orange-500', bg: 'bg-white', text: 'text-orange-600', badge: 'bg-orange-500' };
      case 'medium': return { border: 'border-yellow-500', bg: 'bg-white', text: 'text-yellow-600', badge: 'bg-yellow-500' };
      default: return { border: 'border-blue-500', bg: 'bg-white', text: 'text-blue-600', badge: 'bg-blue-500' };
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("alerts" as any)
        .update({ acknowledged_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alert acknowledged");
      fetchAlerts();
    } catch (error: any) {
      toast.error("Failed to acknowledge alert");
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      stopSiren();
      const { error } = await supabase
        .from("alerts" as any)
        .update({ status: "resolved", resolved_at: new Date().toISOString(), resolution_notes: responseNotes[alertId] })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alert resolved successfully");
      setResponseNotes(prev => {
        const updated = { ...prev };
        delete updated[alertId];
        return updated;
      });
      fetchAlerts();
    } catch (error: any) {
      toast.error("Failed to resolve alert");
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const resolvedAlerts = alerts.filter((a) => a.status !== "active");

  const stats = {
    total: alerts.length,
    active: activeAlerts.length,
    resolved: resolvedAlerts.length,
    avgResponseTime: resolvedAlerts.length > 0
      ? Math.round(resolvedAlerts.reduce((sum, a) => {
        if (a.resolved_at) {
          return sum + (new Date(a.resolved_at).getTime() - new Date(a.created_at).getTime());
        }
        return sum;
      }, 0) / resolvedAlerts.length / 1000)
      : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading emergency alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      <div className="fixed inset-0 bg-gradient-to-br from-emerald-950/70 via-emerald-950/80 to-black/80 backdrop-blur-lg" />

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-black/60 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="gap-2 text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500 animate-pulse" />
              <h1 className="text-xl font-bold text-white">Emergency Center</h1>
              {activeAlerts.length > 0 && (
                <Badge className="animate-pulse text-sm px-3 py-1 bg-red-500/80 text-white">
                  {activeAlerts.length} ACTIVE
                </Badge>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                className="gap-2 text-white border-white/20 hover:bg-white/10"
              >
                {isSoundMuted ? <Pause className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                {isSoundMuted ? 'Muted' : 'Sound'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={startSiren}
                className="gap-2 text-white border-white/20 hover:bg-white/10"
              >
                <Volume2 className="h-4 w-4" />
                Test
              </Button>
            </div>
          </div>

          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <p className="text-xs text-red-300 font-bold uppercase">Active</p>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <p className="text-xs text-green-300 font-bold uppercase">Resolved</p>
              <p className="text-2xl font-bold text-white">{stats.resolved}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <p className="text-xs text-blue-300 font-bold uppercase">Total</p>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
            </div>
            <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-lg p-3">
              <p className="text-xs text-yellow-300 font-bold uppercase">Avg Response</p>
              <p className="text-2xl font-bold text-white">{stats.avgResponseTime}s</p>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'active'
              ? 'bg-red-500/80 text-white'
              : 'bg-black/40 text-white/70 hover:bg-black/60 border border-white/20'
              }`}
          >
            🚨 Active ({activeAlerts.length})
          </button>
          <button
            onClick={() => setActiveTab('resolved')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${activeTab === 'resolved'
              ? 'bg-green-500/80 text-white'
              : 'bg-black/40 text-white/70 hover:bg-black/60 border border-white/20'
              }`}
          >
            ✅ Resolved ({resolvedAlerts.length})
          </button>
        </div>

        {/* Active Alerts */}
        {activeTab === 'active' && (
          <div>
            {activeAlerts.length > 0 ? (
              <div className="grid gap-4">
                {activeAlerts.map((alert) => {
                  const colors = getAlertColor(alert.level);
                  const elapsedSeconds = alertTimers[alert.id] || 0;
                  const mins = Math.floor(elapsedSeconds / 60);
                  const secs = elapsedSeconds % 60;
                  const isExpanded = expandedAlert === alert.id;

                  return (
                    <Card
                      key={alert.id}
                      className={`group border-2 ${colors.border} ${colors.bg} shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer duration-300 hover:border-opacity-100 border-opacity-100`}
                      onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${colors.badge} animate-pulse`} />
                      <CardContent className="p-5 sm:p-7">
                        {/* Header with Student Info */}
                        <div className="flex flex-col lg:flex-row lg:items-start gap-5 sm:gap-6">
                          {/* Student Card */}
                          <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className="relative flex-shrink-0">
                              {alert.students?.photo_url ? (
                                <img
                                  src={alert.students.photo_url}
                                  alt={alert.students.full_name}
                                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-gray-300 shadow-lg group-hover:ring-gray-400 transition-all"
                                  loading="lazy"
                                />
                              ) : (
                                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-gray-300 to-gray-200 flex items-center justify-center ring-4 ring-gray-300 shadow-lg group-hover:ring-gray-400 transition-all">
                                  <User className="h-10 w-10 sm:h-12 sm:w-12 text-gray-600" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 pt-1">
                              <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                                <div className="flex-1">
                                  <h3 className="font-bold text-lg sm:text-2xl text-gray-900 truncate group-hover:text-gray-700 transition-colors">
                                    {alert.students?.full_name || "Unknown"}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-600 font-mono mt-0.5">
                                    📌 {alert.students?.student_id_number || "N/A"}
                                  </p>
                                </div>
                                <Badge className={`${colors.badge} text-white text-xs font-bold uppercase px-3 py-1 rounded-full shadow-lg flex-shrink-0`}>
                                  🚨 {alert.level || "HIGH"}
                                </Badge>
                              </div>

                              {alert.message && (
                                <div className="mb-3 p-2.5 sm:p-3 bg-gray-100 border border-gray-300 rounded-xl">
                                  <p className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">
                                    <span className="text-red-600 font-bold">Incident:</span> {alert.message}
                                  </p>
                                </div>
                              )}

                              <div className={`flex items-center gap-2 font-bold text-base sm:text-lg ${colors.text}`}>
                                <Clock className="h-4 w-4" />
                                {mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} ago
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2.5 w-full lg:w-auto lg:flex-shrink-0 sm:flex-row lg:flex-col">
                            {alert.students?.contact_number && (
                              <Button
                                size="sm"
                                className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 rounded-xl py-2 px-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`tel:${alert.students.contact_number}`);
                                }}
                              >
                                <Phone className="h-4 w-4" />
                                <span className="hidden sm:inline">Call Student</span>
                                <span className="sm:hidden">Call</span>
                              </Button>
                            )}
                            <Button
                              size="sm"
                              className={`gap-2 font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 rounded-xl py-2 px-4 ${alert.acknowledged_at
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                                : 'bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-gray-900'
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!alert.acknowledged_at) {
                                  acknowledgeAlert(alert.id);
                                }
                              }}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="hidden sm:inline">{alert.acknowledged_at ? 'Acknowledged' : 'Acknowledge'}</span>
                              <span className="sm:hidden">{alert.acknowledged_at ? '✓' : 'Ack'}</span>
                            </Button>
                            {alert.location_lat && alert.location_lng && (
                              <Button
                                size="sm"
                                className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 rounded-xl py-2 px-4"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`, '_blank');
                                }}
                              >
                                <MapPin className="h-4 w-4" />
                                <span className="hidden sm:inline">Track</span>
                                <span className="sm:hidden">Map</span>
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                          <div className="mt-6 pt-6 border-t border-gray-300 space-y-4 animate-in slide-in-from-top-2 duration-300">
                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {alert.drivers && (
                                <div className="sm:col-span-2 bg-gray-50 rounded-xl p-3.5 border border-gray-300 hover:border-gray-400 transition-all">
                                  <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-2">👤 Current Driver</p>
                                  <p className="text-sm text-gray-900 font-semibold">{alert.drivers.full_name}</p>
                                  <p className="text-xs text-gray-700 mt-1">🚕 {alert.drivers.tricycle_plate_number}</p>
                                  {alert.drivers.contact_number && (
                                    <p className="text-xs text-gray-700">📞 {alert.drivers.contact_number}</p>
                                  )}
                                </div>
                              )}
                              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-300 hover:border-gray-400 transition-all">
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-2">⏰ Alert Time</p>
                                <p className="text-sm text-gray-900 font-mono font-semibold">{new Date(alert.created_at).toLocaleTimeString()}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(alert.created_at).toLocaleDateString()}</p>
                              </div>
                              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-300 hover:border-gray-400 transition-all">
                                <p className="text-xs text-gray-600 font-bold uppercase tracking-wide mb-2">📍 Location</p>
                                <p className="text-sm text-gray-900 font-mono font-semibold">{alert.location_lat ? `${alert.location_lat.toFixed(3)}, ${alert.location_lng.toFixed(3)}` : 'N/A'}</p>
                              </div>
                            </div>

                            {/* Response Notes Section */}
                            <div className="space-y-2">
                              <label className="text-xs text-gray-700 font-bold uppercase tracking-wide flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-blue-600" />
                                Response Notes
                              </label>
                              <textarea
                                value={responseNotes[alert.id] || ''}
                                onChange={(e) => setResponseNotes(prev => ({ ...prev, [alert.id]: e.target.value }))}
                                placeholder="Add response notes, actions taken, follow-up needed..."
                                className="w-full bg-gray-50 border border-gray-300 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none"
                                rows={3}
                              />
                            </div>

                            {/* Resolve Button - Full Width */}
                            <Button
                              className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold text-sm shadow-lg hover:shadow-xl transition-all active:scale-95 rounded-xl py-3"
                              onClick={(e) => {
                                e.stopPropagation();
                                resolveAlert(alert.id);
                              }}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                              Resolve Alert & Close
                            </Button>
                          </div>
                        )}

                        {/* Expand Hint */}
                        {!isExpanded && (
                          <div className="mt-3 text-center">
                            <p className="text-xs text-gray-600 font-medium group-hover:text-gray-700 transition-colors">
                              Click card to view details →
                            </p>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-2">All Clear</h3>
                <p className="text-gray-600">No active emergencies at this time</p>
              </div>
            )}
          </div>
        )}

        {/* Resolved Alerts */}
        {activeTab === 'resolved' && (
          <div>
            {resolvedAlerts.length > 0 ? (
              <div className="grid gap-3">
                {resolvedAlerts.map((alert) => (
                  <Card key={alert.id} className="bg-white border border-gray-300 hover:border-gray-400 transition-all shadow-sm">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {alert.students?.photo_url ? (
                            <img
                              src={alert.students.photo_url}
                              alt={alert.students.full_name}
                              className="w-10 h-10 rounded-full object-cover opacity-80"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900 truncate text-sm">
                              {alert.students?.full_name || "Unknown"}
                            </p>
                            <p className="text-xs text-gray-600">
                              {new Date(alert.created_at).toLocaleString()}
                            </p>
                            {alert.resolution_notes && (
                              <p className="text-xs text-gray-700 mt-1">{alert.resolution_notes}</p>
                            )}
                          </div>
                        </div>
                        <Badge className="text-green-400 border-green-400/50 bg-transparent text-xs font-bold whitespace-nowrap flex-shrink-0">
                          ✅ Resolved
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No resolved alerts yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyAlerts;

