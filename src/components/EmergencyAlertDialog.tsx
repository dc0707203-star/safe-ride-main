import { useEffect, useState, useCallback } from "react";
import {
  AlertTriangle,
  MapPin,
  User,
  Phone,
  CheckCircle2,
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

interface EmergencyAlertDialogProps {
  onResolve?: (alertId: string) => void;
}

export const EmergencyAlertDialog = ({ onResolve }: EmergencyAlertDialogProps) => {
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const { start: startSiren, stop: stopSiren } = useEmergencySiren();

  const fetchLatestActiveAlert = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select(
          `
          *,
          students(full_name, student_id_number, photo_url, contact_number),
          drivers(full_name, tricycle_plate_number, contact_number)
        `
        )
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setActiveAlert(data);
        setOpen(true);
        startSiren();
      } else {
        setActiveAlert(null);
        setOpen(false);
        stopSiren();
      }
    } catch (error: any) {
      console.error("Fetch alert error:", error);
    }
  }, [startSiren, stopSiren]);

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
          
          // Play siren and show dialog
          startSiren();
          
          toast.error("🚨 EMERGENCY SOS ALERT!", {
            id: payload.new.id,
            duration: 15000,
            description: "A student needs immediate help!",
          });

          fetchLatestActiveAlert();
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
  }, [fetchLatestActiveAlert, startSiren, stopSiren]);

  const handleResolve = async () => {
    if (!activeAlert) return;
    
    stopSiren();
    setOpen(false);
    
    if (onResolve) {
      onResolve(activeAlert.id);
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
      <DialogContent className="max-w-md border-destructive border-2 bg-gradient-to-br from-background to-destructive/5">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-6 w-6 animate-pulse" />
            EMERGENCY ALERT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Student Info */}
          <div className="flex items-center gap-4">
            {activeAlert.students?.photo_url ? (
              <img
                src={activeAlert.students.photo_url}
                alt={activeAlert.students.full_name}
                className="w-16 h-16 rounded-full object-cover ring-4 ring-destructive/50"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center ring-4 ring-destructive/50">
                <User className="h-8 w-8 text-destructive" />
              </div>
            )}
            <div>
              <h3 className="font-bold text-lg">
                {activeAlert.students?.full_name || "Unknown Student"}
              </h3>
              <p className="text-sm text-muted-foreground">
                ID: {activeAlert.students?.student_id_number || "N/A"}
              </p>
              <Badge variant="destructive" className="mt-1">
                {activeAlert.level?.toUpperCase() || "CRITICAL"}
              </Badge>
            </div>
          </div>

          {/* Contact */}
          {activeAlert.students?.contact_number && (
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
              <Phone className="h-4 w-4 text-primary" />
              <span className="text-sm">{activeAlert.students.contact_number}</span>
            </div>
          )}

          {/* Message */}
          {activeAlert.message && (
            <div className="bg-destructive/10 rounded-lg p-3">
              <p className="text-sm font-medium">{activeAlert.message}</p>
            </div>
          )}

          {/* Location */}
          {activeAlert.location_lat && activeAlert.location_lng ? (
            <Button asChild className="w-full gap-2" variant="outline">
              <a
                href={`https://www.google.com/maps?q=${activeAlert.location_lat},${activeAlert.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="h-4 w-4" />
                View Location on Maps
              </a>
            </Button>
          ) : (
            <Button className="w-full gap-2" variant="outline" disabled>
              <MapPin className="h-4 w-4" />
              Location Unavailable
            </Button>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1"
            >
              Dismiss
            </Button>
            <Button
              onClick={handleResolve}
              className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              Resolve
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyAlertDialog;
