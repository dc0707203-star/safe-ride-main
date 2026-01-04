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
  Volume2,
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

  const { start: startSiren, stop: stopSiren } = useEmergencySiren();

  const fetchAlerts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("alerts" as any)
        .select(
          `
          *,
          students(full_name, student_id_number, photo_url, contact_number),
          drivers(full_name, tricycle_plate_number, contact_number)
        `
        )
        .order("created_at", { ascending: false }) as { data: any[]; error: any };

      if (error) throw error;
      setAlerts(data || []);
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
        (payload) => {
          console.log("🚨 NEW EMERGENCY ALERT RECEIVED!", payload);

          // Always play siren for a new alert (reliable start/stop handled by hook)
          startSiren();

          toast.error("🚨 EMERGENCY SOS ALERT!", {
            id: payload.new.id, // prevent dedupe when message repeats
            duration: 15000,
            description: "A student needs immediate help!",
          });

          setAlerts((prev) => [payload.new as any, ...prev]);
          fetchAlerts();
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
  }, [fetchAlerts, startSiren, stopSiren]);

  const resolveAlert = async (alertId: string) => {
    try {
      stopSiren();
      const { error } = await supabase
        .from("alerts" as any)
        .update({ status: "resolved", resolved_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;
      toast.success("Alert resolved successfully");
      fetchAlerts();
    } catch (error: any) {
      toast.error("Failed to resolve alert");
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === "active");
  const resolvedAlerts = alerts.filter((a) => a.status !== "active");

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="container mx-auto max-w-6xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <h1 className="text-xl font-bold">Emergency Center</h1>
              {activeAlerts.length > 0 && (
                <Badge
                  variant="destructive"
                  className="animate-pulse text-sm px-3 py-1"
                >
                  {activeAlerts.length} ACTIVE
                </Badge>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={startSiren}
              className="gap-2"
            >
              <Volume2 className="h-4 w-4" />
              Test Sound
            </Button>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto max-w-6xl px-4 py-6">
        {/* Active Alerts Section */}
        {activeAlerts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-3 w-3 rounded-full bg-destructive animate-ping" />
              <h2 className="text-lg font-semibold text-destructive">
                Active Emergencies
              </h2>
            </div>

            <div className="grid gap-4">
              {activeAlerts.map((alert) => (
                <Card
                  key={alert.id}
                  className="border-2 border-destructive bg-gradient-to-r from-destructive/10 via-destructive/5 to-transparent shadow-lg shadow-destructive/20 overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-destructive animate-pulse" />
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                      {/* Student Info */}
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          {alert.students?.photo_url ? (
                            <img
                              src={alert.students.photo_url}
                              alt={`${alert.students.full_name} student photo`}
                              className="w-20 h-20 rounded-full object-cover ring-4 ring-destructive/50"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center ring-4 ring-destructive/50">
                              <User className="h-10 w-10 text-destructive" />
                            </div>
                          )}
                          <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-destructive flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-destructive-foreground" />
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-xl">
                              {alert.students?.full_name || "Unknown Student"}
                            </h3>
                            <Badge variant="destructive" className="uppercase">
                              {alert.level || "HIGH"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            ID: {alert.students?.student_id_number || "N/A"}
                          </p>
                          {alert.message && (
                            <p className="mt-2 text-sm font-medium text-destructive bg-destructive/10 px-3 py-1.5 rounded-md inline-block">
                              {alert.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-4 lg:w-80">
                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                          <Phone className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Contact</p>
                            <p className="text-sm font-medium">
                              {alert.students?.contact_number || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3">
                          <Clock className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">Time</p>
                            <p className="text-sm font-medium">
                              {new Date(alert.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>

                        {alert.drivers && (
                          <div className="flex items-center gap-2 bg-background/50 rounded-lg p-3 col-span-2">
                            <Car className="h-4 w-4 text-primary" />
                            <div>
                              <p className="text-xs text-muted-foreground">Driver</p>
                              <p className="text-sm font-medium">
                                {alert.drivers.full_name} • {alert.drivers.tricycle_plate_number}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2 lg:w-40">
                        {alert.location_lat && alert.location_lng && (
                          <Button asChild className="w-full gap-2">
                            <a
                              href={`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <MapPin className="h-4 w-4" />
                              View Location
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          onClick={() => resolveAlert(alert.id)}
                          className="w-full gap-2 border-success text-success hover:bg-success/10"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Resolve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeAlerts.length === 0 && (
          <div className="text-center py-16 mb-8">
            <Shield className="h-16 w-16 text-success mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-success mb-2">All Clear</h3>
            <p className="text-muted-foreground">No active emergencies at this time</p>
          </div>
        )}

        {resolvedAlerts.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Resolved Alerts
            </h2>
            <div className="grid gap-3">
              {resolvedAlerts.map((alert) => (
                <Card key={alert.id} className="bg-muted/30 border-muted">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {alert.students?.photo_url ? (
                          <img
                            src={alert.students.photo_url}
                            alt={`${alert.students.full_name} student photo`}
                            className="w-10 h-10 rounded-full object-cover opacity-70"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">
                            {alert.students?.full_name || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-success border-success"
                      >
                        Resolved
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyAlerts;

