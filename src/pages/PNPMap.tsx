import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  User,
  Clock,
  Phone,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Zap,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import EmergencyAlertMap from "@/components/EmergencyAlertMap";
import campusBg from "@/assets/campus-bg.jpeg";
import { format } from "date-fns";

interface MapAlert {
  id: string;
  student_name: string;
  student_id: string;
  contact: string;
  photo_url: string | null;
  location_lat: number;
  location_lng: number;
  level: string;
  status: string;
  created_at: string;
  driver_name: string;
}

const PNPMap = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<MapAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<MapAlert | null>(null);
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const fetchAlerts = useCallback(async () => {
    try {
      let query = supabase
        .from("alerts" as any)
        .select(
          `
          *,
          students(full_name, student_id_number, contact_number, photo_url),
          drivers(full_name)
        `
        );

      if (showOnlyActive) {
        query = query.eq("status", "active");
      }

      const { data, error } = (await query.order("created_at", {
        ascending: false,
      })) as { data: any[]; error: any };

      if (error) throw error;

      const mapped = (data || [])
        .filter((a) => a.location_lat && a.location_lng)
        .map((a) => ({
          id: a.id,
          student_name: a.students?.full_name || "Unknown",
          student_id: a.students?.student_id_number || "N/A",
          contact: a.students?.contact_number || "N/A",
          photo_url: a.students?.photo_url || null,
          location_lat: a.location_lat,
          location_lng: a.location_lng,
          level: a.level || "HIGH",
          status: a.status,
          created_at: a.created_at,
          driver_name: a.drivers?.full_name || "Unassigned",
        }));

      console.log('Alerts with photos loaded:', mapped);
      setAlerts(mapped);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, [showOnlyActive]);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const getLevelColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return { bg: "from-orange-600/20 to-orange-700/10", border: "border-orange-500/40", icon: "text-orange-400", text: "#ff9d3f" };
      case "high":
        return { bg: "from-orange-500/20 to-orange-600/10", border: "border-orange-500/40", icon: "text-orange-400", text: "#ffa500" };
      case "medium":
        return { bg: "from-cyan-600/20 to-cyan-700/10", border: "border-cyan-500/40", icon: "text-cyan-400", text: "#00d9ff" };
      default:
        return { bg: "from-lime-600/20 to-lime-700/10", border: "border-lime-500/40", icon: "text-lime-400", text: "#00ff00" };
    }
  };

  const mapUrl =
    alerts.length > 0
      ? `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3862.0${alerts[0]?.location_lat || 14.8}!2d!3d${alerts[0]?.location_lng || 121.0}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sph!4v1234567890`
      : `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3862.802385892461!2d121.01761!3d14.877174!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sph!4v1234567890`;

  if (loading) {
    return (
      <div
        className="min-h-screen bg-cover bg-center bg-fixed"
        style={{ backgroundImage: `url(${campusBg})` }}
      >
        <div className="fixed inset-0 bg-gradient-to-br from-blue-950/70 via-slate-900/80 to-black/80 backdrop-blur-lg" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <MapPin className="h-12 w-12 text-cyan-400 mx-auto mb-4 animate-pulse" />
            <p className="text-cyan-200 font-semibold">Loading map data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img src={campusBg} alt="" className="w-full h-full object-cover blur-3xl opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/95 via-slate-900/90 to-slate-950/95" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-blue-950/60 backdrop-blur-xl border-b border-cyan-500/30 shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/pnp")}
              className="gap-2 text-cyan-100 hover:bg-cyan-500/20 border border-cyan-600/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Response Map</h1>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowOnlyActive(!showOnlyActive)}
              className={`text-white border-cyan-600/50 hover:bg-cyan-500/20 transition-all ${
                showOnlyActive ? "bg-orange-500/20 text-orange-300" : "bg-cyan-500/20 text-cyan-300"
              }`}
            >
              {showOnlyActive ? "🔴 Active Only" : "📋 All Alerts"}
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            <Card className="bg-blue-950/40 border border-cyan-500/30 h-[600px] rounded-xl shadow-lg shadow-cyan-500/10 relative" style={{ overflow: 'visible' }}>
              {selectedAlert ? (
                <EmergencyAlertMap 
                  alertId={selectedAlert.id}
                  initialAlert={{
                    student_name: selectedAlert.student_name,
                    photo_url: selectedAlert.photo_url,
                    contact_number: selectedAlert.contact,
                    student_id_number: selectedAlert.student_id,
                    level: selectedAlert.level,
                  }}
                />
              ) : alerts.length > 0 ? (
                <EmergencyAlertMap 
                  alertId={alerts[0].id}
                  initialAlert={{
                    student_name: alerts[0].student_name,
                    photo_url: alerts[0].photo_url,
                    contact_number: alerts[0].contact,
                    student_id_number: alerts[0].student_id,
                    level: alerts[0].level,
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-950 to-slate-950">
                  <div className="text-center">
                    <MapPin className="h-12 w-12 text-cyan-400/30 mx-auto mb-2" />
                    <p className="text-cyan-300/70">No alerts with location data</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* Alert List */}
          <div className="lg:col-span-1">
            <Card className="bg-blue-950/40 border border-cyan-500/30 overflow-hidden flex flex-col h-[600px] rounded-xl shadow-lg shadow-cyan-500/10">
              <div className="bg-gradient-to-r from-cyan-600/30 to-cyan-700/20 px-4 py-3 border-b border-cyan-500/30">
                <h3 className="font-bold text-cyan-100 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  📍 {alerts.length} Alert{alerts.length !== 1 ? "s" : ""}
                </h3>
              </div>
              <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-cyan-500/30 scrollbar-track-cyan-950/30">
                {alerts.length > 0 ? (
                  <div className="space-y-2 p-3">
                    {alerts.map((alert) => {
                      const colors = getLevelColor(alert.level);
                      return (
                        <div
                          key={alert.id}
                          onClick={() => setSelectedAlert(alert)}
                          className={`p-3 rounded-lg cursor-pointer transition-all border-l-4 ${
                            selectedAlert?.id === alert.id
                              ? `bg-gradient-to-r ${colors.bg} border-white/40`
                              : `bg-blue-950/40 hover:bg-blue-900/60 border-white/10`
                          }`}
                          style={{
                            borderLeftColor: colors.text,
                          }}
                        >
                          <div className="flex items-start justify-between mb-1 gap-2">
                            <p className="text-xs font-bold text-white truncate">
                              {alert.student_name}
                            </p>
                            <Badge
                              className="text-white text-[10px] font-bold whitespace-nowrap flex-shrink-0"
                              style={{
                                backgroundColor: colors.text + "40",
                                color: colors.text,
                              }}
                            >
                              {alert.level}
                            </Badge>
                          </div>
                          <p className="text-[10px] text-cyan-300/70 mb-1">
                            ID: {alert.student_id}
                          </p>
                          <p className="text-[10px] text-cyan-300/70 mb-1">
                            🚕 {alert.driver_name}
                          </p>
                          <p className="text-[10px] text-cyan-300/60">
                            {format(new Date(alert.created_at), "HH:mm:ss")}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <AlertTriangle className="h-8 w-8 text-cyan-400/30 mx-auto mb-2" />
                      <p className="text-cyan-300/70 text-sm">No alerts</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* Selected Alert Details */}
        {selectedAlert && (
          <div className="mt-6 bg-blue-950/40 border border-cyan-500/30 rounded-xl p-6 backdrop-blur-sm shadow-lg shadow-cyan-500/10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-cyan-400" />
                Alert Details
              </h3>
              <button
                onClick={() => setSelectedAlert(null)}
                className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-cyan-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-700/10 rounded-lg p-4 border border-cyan-500/30">
                <p className="text-xs text-cyan-300/70 font-bold mb-2 flex items-center gap-1">👤 Student</p>
                <p className="text-sm text-white font-semibold mb-1">
                  {selectedAlert.student_name}
                </p>
                <p className="text-xs text-cyan-300/70 mb-3">
                  ID: {selectedAlert.student_id}
                </p>
                {selectedAlert.contact !== "N/A" && (
                  <Button
                    size="sm"
                    className="w-full gap-2 bg-cyan-600/40 hover:bg-cyan-600/60 text-cyan-100 border border-cyan-500/30 text-xs"
                    onClick={() => window.open(`tel:${selectedAlert.contact}`)}
                  >
                    <Phone className="h-3 w-3" />
                    Call Student
                  </Button>
                )}
              </div>

              <div className="bg-gradient-to-br from-orange-600/20 to-orange-700/10 rounded-lg p-4 border border-orange-500/30">
                <p className="text-xs text-orange-300/70 font-bold mb-2 flex items-center gap-1">🚨 Severity</p>
                <p className="text-sm text-white font-semibold">{selectedAlert.level}</p>
                <div className="mt-3 h-2 bg-orange-950/50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-orange-400"
                    style={{width: selectedAlert.level?.toLowerCase() === 'critical' ? '100%' : '75%'}}
                  />
                </div>
                <p className="text-xs text-orange-300/70 mt-2">Alert Status</p>
              </div>

              <div className="bg-gradient-to-br from-lime-600/20 to-lime-700/10 rounded-lg p-4 border border-lime-500/30">
                <p className="text-xs text-lime-300/70 font-bold mb-2 flex items-center gap-1">🚕 Driver</p>
                <p className="text-sm text-white font-semibold">
                  {selectedAlert.driver_name}
                </p>
                <p className="text-xs text-lime-300/70 mt-2">Assigned Driver</p>
              </div>

              <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-700/10 rounded-lg p-4 border border-cyan-500/30">
                <p className="text-xs text-cyan-300/70 font-bold mb-2 flex items-center gap-1">⏰ Time</p>
                <p className="text-sm text-white">
                  {format(new Date(selectedAlert.created_at), "PPpp")}
                </p>
                <p className="text-xs text-cyan-300/70 mt-2">Alert Time</p>
              </div>
            </div>

            {/* Map Link */}
            <Button
              className="w-full mt-4 gap-2 bg-gradient-to-r from-lime-600/40 to-lime-700/30 hover:from-lime-600/60 hover:to-lime-700/50 text-lime-100 border border-lime-500/30 font-semibold"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps?q=${selectedAlert.location_lat},${selectedAlert.location_lng}`,
                  "_blank"
                )
              }
            >
              <MapPin className="h-4 w-4" />
              Open in Google Maps
            </Button>
          </div>
        )}
      </div>

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
  );
};

export default PNPMap;
