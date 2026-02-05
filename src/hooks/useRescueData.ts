import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

export const useRescueData = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [nearbyOfficers, setNearbyOfficers] = useState<RescueOfficer[]>([]);
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch active alerts (both incident and critical SOS alerts)
  const fetchAlerts = async () => {
    try {
      console.log("[useRescueData] Fetching alerts...");
      
      const { data, error } = await supabase
        .from("alerts")
        .select(
          `
          id,
          message,
          status,
          level,
          alert_type,
          location_lat,
          location_lng,
          created_at,
          student_id,
          students (full_name)
        `
        )
        .eq("status", "active")
        .in("alert_type", ["incident", "critical"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[useRescueData] Error fetching alerts:", error);
        throw error;
      }

      console.log("[useRescueData] Raw data from DB:", data);

      const formattedAlerts: Alert[] =
        data?.map((alert: any) => {
          console.log("[useRescueData] Formatting alert:", alert.students?.full_name, alert.message);
          return {
            id: alert.id,
            studentName: alert.students?.full_name || "Unknown Student",
            location: alert.message || "Unknown Location",
            severity: (alert.level || "medium") as "high" | "medium" | "low",
            timestamp: new Date(alert.created_at).toLocaleTimeString(),
            status: (alert.status || "active") as "active" | "resolved",
            latitude: alert.location_lat,
            longitude: alert.location_lng,
          };
        }) || [];

      console.log("[useRescueData] Formatted alerts:", formattedAlerts);
      setAlerts(formattedAlerts);
      console.log("[useRescueData] Alert state updated with", formattedAlerts.length, 'alerts');
    } catch (error) {
      console.error("[useRescueData] Error in fetchAlerts:", error);
      toast.error("Failed to load alerts");
    }
  };

  // Fetch rescue officers (from dedicated rescue_officers table)
  const fetchRescueOfficers = async () => {
    try {
      const { data, error } = await supabase
        .from("rescue_officers")
        .select(
          `
          id,
          full_name,
          email,
          phone,
          vehicle_type,
          status,
          latitude,
          longitude
        `
        )
        .eq("is_active", true)
        .limit(50);

      if (error) {
        console.error("Error fetching officers from rescue_officers table:", error);
        // Use fallback empty array if fetch fails
        setNearbyOfficers([]);
        return;
      }

      const formattedOfficers: RescueOfficer[] =
        data?.map((officer: any) => ({
          id: officer.id,
          name: officer.full_name || "Officer",
          phone: officer.phone || "+63 912 345 6789",
          email: officer.email || "",
          status: officer.status as "available" | "responding" | "busy",
          distance: Math.random() * 5 + 0.5,
          latitude: officer.latitude,
          longitude: officer.longitude,
          vehicleType: officer.vehicle_type || "Rescue Unit",
        })) || [];

      setNearbyOfficers(formattedOfficers);
    } catch (error) {
      console.error("Error fetching rescue officers:", error);
      setNearbyOfficers([]);
    }
  };

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      // Active alerts count
      const { count: activeCount, error: activeError } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("status", "active");

      // Resolved today count
      const today = new Date().toISOString().split("T")[0];
      const { count: resolvedCount, error: resolvedError } = await supabase
        .from("alerts")
        .select("id", { count: "exact", head: true })
        .eq("status", "resolved")
        .gte("resolved_at", `${today}T00:00:00`);

      if (activeError || resolvedError) throw activeError || resolvedError;

      setMetrics([
        { label: "Active Alerts", value: activeCount || 0, subtext: "Responding" },
        { label: "Resolved Today", value: resolvedCount || 0, subtext: "24 hour rate" },
        { label: "Avg Response Time", value: "3.2 min", subtext: "Current average" },
        { label: "Available Officers", value: `${nearbyOfficers.length} of 12`, subtext: "On duty" },
      ]);
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  // Fetch incident history
  const fetchIncidents = async () => {
    try {
      const { data, error } = await supabase
        .from("alerts")
        .select(
          `
          id,
          message,
          status,
          resolved_at,
          student_id,
          students (full_name)
        `
        )
        .eq("status", "resolved")
        .order("resolved_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      const formattedIncidents: IncidentReport[] =
        data?.map((incident: any) => ({
          id: incident.id,
          alertId: incident.id,
          studentName: incident.students?.full_name || "Unknown",
          location: incident.message || "Unknown Location",
          responders: ["Officer A", "Officer B"], // Placeholder
          resolutionTime: "4.5 min", // Placeholder
          status: "Resolved",
          date: new Date(incident.resolved_at).toLocaleDateString(),
        })) || [];

      setIncidents(formattedIncidents);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    }
  };

  // Setup real-time subscriptions
  const setupSubscriptions = () => {
    // Subscribe to alerts changes
    const alertsSubscription = supabase
      .channel("alerts-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerts" },
        () => {
          fetchAlerts();
          fetchMetrics();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsSubscription);
    };
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAlerts(),
        fetchRescueOfficers(),
        fetchIncidents(),
      ]);
      setLoading(false);
    };

    loadData();

    // Set up real-time subscriptions
    const unsubscribe = setupSubscriptions();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Fetch metrics after officers are loaded
  useEffect(() => {
    fetchMetrics();
  }, [nearbyOfficers]);

  return {
    alerts,
    nearbyOfficers,
    metrics,
    notifications,
    incidents,
    loading,
    refetch: async () => {
      await Promise.all([
        fetchAlerts(),
        fetchRescueOfficers(),
        fetchMetrics(),
        fetchIncidents(),
      ]);
    },
  };
};
