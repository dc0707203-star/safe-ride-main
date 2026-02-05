import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  User,
  Clock,
  MapPin,
  Phone,
  Search,
  Filter,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import campusBg from "@/assets/campus-bg.jpeg";
import { format } from "date-fns";

const PNPHistory = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterDate, setFilterDate] = useState("all");

  const fetchAlerts = useCallback(async () => {
    try {
      let query = supabase
        .from("alerts" as any)
        .select(
          `
          *,
          students(full_name, student_id_number, photo_url, contact_number, course),
          drivers(full_name, tricycle_plate_number, contact_number)
        `
        )
        .eq("status", "resolved")
        .order("resolved_at", { ascending: false });

      const { data, error } = (await query) as { data: any[]; error: any };

      if (error) throw error;

      let filtered = data || [];

      // Filter by level
      if (filterLevel !== "all") {
        filtered = filtered.filter(
          (a) => a.level?.toLowerCase() === filterLevel.toLowerCase()
        );
      }

      // Filter by date
      if (filterDate !== "all") {
        const now = new Date();
        const startDate = new Date();

        if (filterDate === "today") {
          startDate.setHours(0, 0, 0, 0);
        } else if (filterDate === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (filterDate === "month") {
          startDate.setMonth(now.getMonth() - 1);
        }

        filtered = filtered.filter((a) => {
          const alertDate = new Date(a.created_at);
          return alertDate >= startDate;
        });
      }

      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.students?.full_name?.toLowerCase().includes(query) ||
            a.students?.student_id_number?.toLowerCase().includes(query) ||
            a.drivers?.full_name?.toLowerCase().includes(query)
        );
      }

      setAlerts(filtered);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  }, [filterLevel, filterDate, searchQuery]);

  useEffect(() => {
    fetchAlerts();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('alerts-changes')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'alerts',
        },
        (payload) => {
          // Remove deleted alert from state
          setAlerts((prev) => prev.filter((a) => a.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAlerts]);

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast.success('Alert deleted');
      // Don't need to manually remove from state anymore - subscription will handle it
    } catch (error) {
      console.error('Error deleting alert:', error);
      toast.error('Failed to delete alert');
    }
  };

  const getRowColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "border-l-4 border-orange-500";
      case "high":
        return "border-l-4 border-orange-500";
      case "medium":
        return "border-l-4 border-cyan-500";
      default:
        return "border-l-4 border-lime-500";
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level?.toLowerCase()) {
      case "critical":
        return "bg-orange-600/80";
      case "high":
        return "bg-orange-500/80";
      case "medium":
        return "bg-cyan-500/80";
      default:
        return "bg-lime-500/80";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950">
        {/* Background */}
        <div className="fixed inset-0 -z-10">
          <img src={campusBg} alt="" className="w-full h-full object-cover blur-3xl opacity-15" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/95 via-slate-900/90 to-slate-950/95" />
        </div>
        <div className="fixed inset-0 bg-gradient-to-br from-blue-950/70 via-slate-900/80 to-black/80 backdrop-blur-lg" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <CheckCircle2 className="h-12 w-12 text-lime-400 mx-auto mb-4 animate-pulse" />
            <p className="text-lime-200 font-semibold">Loading alert history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 -z-10">
        <img src={campusBg} alt="" className="w-full h-full object-cover blur-3xl opacity-15" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-950/95 via-slate-900/90 to-slate-950/95" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-blue-950/60 backdrop-blur-xl border-b border-cyan-500/30 shadow-lg">
        <div className="container mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/pnp")}
              className="gap-2 text-cyan-100 hover:bg-cyan-500/20 border border-cyan-600/50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Alert History</h1>
            </div>

            <div className="w-8" />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-cyan-400/50" />
              <Input
                placeholder="Search by name, ID, or driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-blue-950/40 border-cyan-600/50 text-cyan-100 placeholder:text-cyan-400/50 focus:border-cyan-400 focus:bg-blue-950/60"
              />
            </div>

            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-4 py-2 bg-blue-950/40 border border-cyan-600/50 text-cyan-100 rounded-lg focus:outline-none focus:border-cyan-400 focus:bg-blue-950/60"
            >
              <option value="all" className="bg-blue-950">
                All Levels
              </option>
              <option value="critical" className="bg-blue-950">
                🔴 Critical
              </option>
              <option value="high" className="bg-blue-950">
                🟠 High
              </option>
              <option value="medium" className="bg-blue-950">
                🟡 Medium
              </option>
              <option value="low" className="bg-blue-950">
                🔵 Low
              </option>
            </select>

            <select
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="px-4 py-2 bg-blue-950/40 border border-cyan-600/50 text-cyan-100 rounded-lg focus:outline-none focus:border-cyan-400 focus:bg-blue-950/60"
            >
              <option value="all" className="bg-blue-950">
                All Dates
              </option>
              <option value="today" className="bg-blue-950">
                Today
              </option>
              <option value="week" className="bg-blue-950">
                Last 7 Days
              </option>
              <option value="month" className="bg-blue-950">
                Last 30 Days
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-6 flex-1">
        {alerts.length > 0 ? (
          <div className="grid gap-3">
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                className={`${getRowColor(alert.level)} bg-blue-950/40 border-t border-r border-b border-cyan-500/30 hover:bg-blue-950/60 transition-all`}
              >
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                    {/* Student */}
                    <div className="flex items-center gap-3">
                      {alert.students?.photo_url ? (
                        <img
                          src={alert.students.photo_url}
                          alt={alert.students.full_name}
                          className="w-10 h-10 rounded-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-cyan-400/50" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-cyan-100 truncate">
                          {alert.students?.full_name || "Unknown"}
                        </p>
                        <p className="text-xs text-cyan-300/70">
                          {alert.students?.student_id_number || "N/A"}
                        </p>
                      </div>
                    </div>

                    {/* Course & Contact */}
                    <div className="hidden md:block">
                      <p className="text-xs text-cyan-300/70 mb-1">Course</p>
                      <p className="text-sm text-cyan-100">
                        {alert.students?.course || "N/A"}
                      </p>
                      {alert.students?.contact_number && (
                        <a
                          href={`tel:${alert.students.contact_number}`}
                          className="text-xs text-lime-400 hover:text-lime-300 mt-1 flex items-center gap-1"
                        >
                          <Phone className="h-3 w-3" />
                          Call
                        </a>
                      )}
                    </div>

                    {/* Level & Status */}
                    <div className="flex items-center gap-2">
                      <Badge className={`${getLevelBadgeColor(alert.level)} text-white uppercase text-xs font-bold`}>
                        {alert.level || "HIGH"}
                      </Badge>
                      <Badge className="bg-lime-600/80 text-white text-xs font-bold">
                        ✅ Resolved
                      </Badge>
                    </div>

                    {/* Timing */}
                    <div className="hidden lg:block">
                      <p className="text-xs text-cyan-300/70 mb-1">Response Time</p>
                      <p className="text-sm text-cyan-100 font-mono">
                        {alert.resolved_at
                          ? Math.round(
                              (new Date(alert.resolved_at).getTime() -
                                new Date(alert.created_at).getTime()) /
                                1000
                            ) + "s"
                          : "N/A"}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="text-xs text-cyan-300/70">
                      {format(new Date(alert.created_at), "MMM dd, HH:mm")}
                    </div>

                    {/* Delete Button */}
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-orange-400 hover:bg-orange-500/20 border border-orange-600/50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <CheckCircle2 className="h-16 w-16 text-lime-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-cyan-100 mb-2">
              No Resolved Alerts
            </h3>
            <p className="text-cyan-300/70">
              {searchQuery
                ? "No alerts match your search criteria"
                : "No resolved alerts found"}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="sticky bottom-0 z-10 bg-gradient-to-r from-blue-950/80 to-blue-900/60 border-t border-cyan-500/30 backdrop-blur-xl mt-12">
        <div className="container mx-auto max-w-7xl px-4 py-6">
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

export default PNPHistory;
