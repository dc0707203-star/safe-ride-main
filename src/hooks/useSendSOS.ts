import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SOSAlert {
  studentId: string;
  studentName: string;
  location: string;
  latitude: number;
  longitude: number;
  message: string;
  severity: "high" | "medium" | "low";
}

export const useSendSOS = () => {
  const sendSOS = useCallback(
    async (sosData: SOSAlert) => {
      try {
        // Create alert in database
        const { data, error } = await supabase.from("alerts").insert({
          student_id: sosData.studentId,
          message: `${sosData.location} - ${sosData.message}`,
          status: "active",
          level: sosData.severity,
          location_lat: sosData.latitude,
          location_lng: sosData.longitude,
          created_at: new Date().toISOString(),
        });

        if (error) throw error;

        toast.success("SOS sent to rescue team!");
        console.log("SOS Alert created:", data);

        return data;
      } catch (error) {
        console.error("Error sending SOS:", error);
        toast.error("Failed to send SOS - please try again");
        throw error;
      }
    },
    []
  );

  const sendEmergencyAlert = useCallback(
    async (studentId: string, location: string, latitude: number, longitude: number) => {
      return sendSOS({
        studentId,
        studentName: "Student", // Will be updated from actual user data
        location,
        latitude,
        longitude,
        message: "EMERGENCY - STUDENT NEEDS HELP",
        severity: "high",
      });
    },
    [sendSOS]
  );

  return {
    sendSOS,
    sendEmergencyAlert,
  };
};
