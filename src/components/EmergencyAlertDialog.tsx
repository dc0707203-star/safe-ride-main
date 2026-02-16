import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  MapPin,
  User,
  Phone,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEmergencySiren } from "@/hooks/useEmergencySiren";
import { useAuth } from "@/hooks/useAuth";

interface EmergencyAlertDialogProps {
  onResolve?: (alertId: string) => void;
  filterByRole?: boolean; // If true, filter alerts based on user role
}

export const EmergencyAlertDialog = ({ onResolve, filterByRole = true }: EmergencyAlertDialogProps) => {
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const { start: startSiren, stop: stopSiren } = useEmergencySiren();

  const fetchLatestActiveAlert = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select(
          `
          id,
          status,
          alert_type,
          message,
          level,
          location_lat,
          location_lng,
          created_at,
          student_id,
          students(id, full_name, student_id_number, photo_url, contact_number)
        `
        )
        .eq("status", "active")
        .eq("alert_type", "incident")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("[EmergencyAlertDialog] Query error:", error);
        throw error;
      }

      if (data) {
        console.log("[EmergencyAlertDialog] Fetched alert:", data);
        console.log("[EmergencyAlertDialog] Student data:", data.students);
        setActiveAlert(data);
        setOpen(true);
        startSiren();
      } else {
        setActiveAlert(null);
        setOpen(false);
        stopSiren();
      }
    } catch (error: any) {
      console.error("[EmergencyAlertDialog] Fetch alert error:", error);
      setActiveAlert(null);
      setOpen(false);
    }
  }, [startSiren, stopSiren, user?.role, filterByRole]);

  useEffect(() => {
    fetchLatestActiveAlert();

    const channel = supabase
      .channel("emergency-alert-dialog-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "alerts",
        },
        (payload) => {
          console.log("🚨 NEW EMERGENCY ALERT!", payload);
          
          // Check if this alert should be shown based on user role
          const alertMessage = payload.new.message || "";
          const isPNPAlert = alertMessage.includes("THEFT") || alertMessage.includes("HARASSMENT");
          const shouldShow = filterByRole 
            ? (user?.role === "pnp" ? isPNPAlert : !isPNPAlert)
            : true;

          if (shouldShow) {
            // Play siren and show dialog
            startSiren();
            
            toast.error("🚨 EMERGENCY SOS ALERT!", {
              id: payload.new.id,
              duration: 15000,
              description: "A student needs immediate help!",
            });

            setActiveAlert(payload.new);
            setOpen(true);
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
          fetchLatestActiveAlert();
        }
      )
      .subscribe((status) => {
        console.log("EmergencyAlertDialog subscription:", status);
      });

    return () => {
      supabase.removeChannel(channel);
      stopSiren();
    };
  }, [fetchLatestActiveAlert, startSiren, stopSiren, user?.role, filterByRole]);

  const handleResolve = async () => {
    if (!activeAlert) return;
    
    try {
      stopSiren();
      
      // Update alert status in database
      const { error } = await supabase
        .from('alerts')
        .update({ 
          status: 'resolved',
          resolved_at: new Date().toISOString()
        })
        .eq('id', activeAlert.id);
      
      if (error) throw error;
      
      toast.success('Alert resolved successfully');
      setOpen(false);
      setActiveAlert(null);
      
      if (onResolve) {
        onResolve(activeAlert.id);
      }
    } catch (error: any) {
      console.error('Error resolving alert:', error);
      toast.error('Failed to resolve alert');
    }
  };

  const handleDismiss = () => {
    stopSiren();
    setOpen(false);
  };

  if (!activeAlert) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) handleDismiss();
    }}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden border-0 shadow-2xl bg-white rounded-2xl">
        {/* Modern Header */}
        <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-full animate-pulse backdrop-blur-sm">
            <AlertTriangle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Emergency Alert</h2>
            <p className="text-red-100 text-xs font-medium mt-1 opacity-90">Immediate Action Required</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Student Info Card */}
          <div className="flex items-start gap-4">
            {activeAlert.students?.photo_url ? (
              <img
                src={activeAlert.students.photo_url}
                alt={activeAlert.students.full_name}
                className="w-16 h-16 rounded-xl object-cover bg-gray-100 border-2 border-red-100 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-red-50 border-2 border-red-100 flex items-center justify-center flex-shrink-0 text-red-300">
                <User className="h-8 w-8" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-gray-900 leading-tight">
                {activeAlert.students?.full_name || "Unknown Student"}
              </h3>
              <p className="text-sm text-gray-500 font-medium mt-0.5">
                ID: {activeAlert.students?.student_id_number || "N/A"}
              </p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 bg-red-50 text-red-700 border-red-200">
                  {activeAlert.level?.toUpperCase() || "CRITICAL"}
                </Badge>
                <Badge variant="outline" className="text-xs font-bold px-2 py-0.5 bg-gray-50 text-gray-600 border-gray-200">
                  {activeAlert.alert_type || "INCIDENT"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Incident Message */}
          {activeAlert.message && (
            <div className="bg-red-50 border border-red-100 rounded-xl p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Incident Report</p>
              </div>
              <p className="text-sm font-medium text-gray-800 leading-relaxed">{activeAlert.message}</p>
            </div>
          )}

          {/* Location & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            {activeAlert.location_lat && activeAlert.location_lng && (
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-xs font-bold text-gray-500 uppercase">Location</span>
                  </div>
                  <span className="text-xs font-mono text-gray-900 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                    {activeAlert.location_lat.toFixed(4)}, {activeAlert.location_lng.toFixed(4)}
                  </span>
                </div>
                <Button asChild className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm h-8 text-xs font-semibold" size="sm">
                  <a
                    href={`https://www.google.com/maps?q=${activeAlert.location_lat},${activeAlert.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open in Google Maps
                  </a>
                </Button>
              </div>
            )}
            
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="h-3.5 w-3.5 text-gray-500" />
                <span className="text-xs font-bold text-gray-500 uppercase">Time</span>
              </div>
              <p className="text-sm font-bold text-gray-900">{new Date(activeAlert.created_at).toLocaleTimeString()}</p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <Phone className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-bold text-blue-600 uppercase">Contact</span>
              </div>
              <p className="text-sm font-bold text-gray-900 truncate">
                {activeAlert.students?.contact_number || "N/A"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2 border-t border-gray-100 mt-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 h-11 font-semibold text-gray-700 border-gray-300 hover:bg-gray-50"
            >
              Dismiss
            </Button>
            <Button
              onClick={handleResolve}
              className="flex-1 gap-2 bg-red-600 hover:bg-red-700 text-white h-11 font-bold shadow-md shadow-red-200"
            >
              <CheckCircle2 className="h-5 w-5" />
              Resolve Alert
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyAlertDialog;
