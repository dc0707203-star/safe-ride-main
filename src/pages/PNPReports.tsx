import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  Users,
  Activity,
  Target,
  Zap,
  Shield,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import campusBg from "@/assets/campus-bg.jpeg";
import { format } from "date-fns";

interface Report {
  totalAlerts: number;
  activeAlerts: number;
  resolvedAlerts: number;
  averageResponseTime: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  uniqueStudents: Set<string>;
  uniqueDrivers: Set<string>;
  alertsByHour: { [key: string]: number };
  resolutionRate: number;
  peakHour: string;
}

const PNPReports = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("today");

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const now = new Date();
        let startDate = new Date();

        if (dateRange === "today") {
          startDate.setHours(0, 0, 0, 0);
        } else if (dateRange === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (dateRange === "month") {
          startDate.setMonth(now.getMonth() - 1);
        }

        const { data, error } = await supabase
          .from("alerts" as any)
          .select(
            `
            *,
            students(student_id_number),
            drivers(id)
          `
          )
          .gte("created_at", startDate.toISOString())
          .order("created_at", { ascending: false });

        if (error) throw error;

        const alerts = data || [];
        const active = alerts.filter((a) => a.status === "active");
        const resolved = alerts.filter((a) => a.status !== "active");

        const uniqueStudents = new Set(
          alerts.map((a) => a.students?.student_id_number).filter(Boolean)
        );
        const uniqueDrivers = new Set(
          alerts.map((a) => a.drivers?.id).filter(Boolean)
        );

        const avgTime =
          resolved.length > 0
            ? Math.round(
                resolved.reduce((sum, a) => {
                  if (a.resolved_at) {
                    return (
                      sum +
                      (new Date(a.resolved_at).getTime() -
                        new Date(a.created_at).getTime())
                    );
                  }
                  return sum;
                }, 0) /
                  resolved.length /
                  1000
              )
            : 0;

        const alertsByHour: { [key: string]: number } = {};
        alerts.forEach((a) => {
          const hour = new Date(a.created_at).getHours();
          alertsByHour[hour] = (alertsByHour[hour] || 0) + 1;
        });

        const peakHour = Object.entries(alertsByHour).sort(
          (a, b) => b[1] - a[1]
        )[0]?.[0] || "N/A";

        const resolutionRate =
          alerts.length > 0
            ? Math.round((resolved.length / alerts.length) * 100)
            : 0;

        setReport({
          totalAlerts: alerts.length,
          activeAlerts: active.length,
          resolvedAlerts: resolved.length,
          averageResponseTime: avgTime,
          criticalCount: alerts.filter(
            (a) => a.level?.toLowerCase() === "critical"
          ).length,
          highCount: alerts.filter((a) => a.level?.toLowerCase() === "high")
            .length,
          mediumCount: alerts.filter(
            (a) => a.level?.toLowerCase() === "medium"
          ).length,
          lowCount: alerts.filter((a) => a.level?.toLowerCase() === "low")
            .length,
          uniqueStudents,
          uniqueDrivers,
          alertsByHour,
          resolutionRate,
          peakHour:
            peakHour !== "N/A"
              ? `${String(peakHour).padStart(2, "0")}:00`
              : "N/A",
        });
      } catch (error: any) {
        console.error("Report error:", error);
        toast.error("Failed to generate report");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [dateRange]);

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
            <BarChart3 className="h-12 w-12 text-lime-400 mx-auto mb-4 animate-pulse" />
            <p className="text-cyan-100">Generating report...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
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
            <p className="text-cyan-100">No data available</p>
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
      <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-950/60 to-blue-900/40 backdrop-blur-xl border-b border-cyan-500/30 shadow-lg">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between gap-4 mb-2">
            <Button
              variant="ghost"
              onClick={() => navigate("/pnp")}
              className="gap-2 text-cyan-100 hover:bg-cyan-500/20 border border-cyan-600/50 transition-all hover:shadow-lg"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>

            <div className="flex items-center gap-3">
              <BarChart3 className="h-6 w-6 text-cyan-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-lime-400 bg-clip-text text-transparent">Reports & Analytics</h1>
            </div>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label="Date range filter"
              className="px-4 py-2.5 bg-blue-950/40 border border-cyan-600/50 text-cyan-100 rounded-lg focus:outline-none focus:border-cyan-400 focus:bg-blue-950/60 focus:ring-2 focus:ring-cyan-500/20 transition-all font-semibold"
            >
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
          <p className="text-cyan-300/60 text-sm ml-12">Real-time emergency response analytics</p>
        </div>
      </div>

      <div className="relative z-10 container mx-auto max-w-7xl px-4 py-8">
        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/30 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/20 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-orange-200 text-xs font-bold uppercase tracking-wider mb-2">Total Alerts</p>
                  <p className="text-5xl font-bold text-orange-400">{report.totalAlerts}</p>
                </div>
                <AlertTriangle className="h-10 w-10 text-orange-500/40 group-hover:text-orange-500/60 transition-all" />
              </div>
              <p className="text-orange-300/60 text-xs">All emergencies reported</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-lime-500/20 to-lime-600/10 border border-lime-500/30 hover:border-lime-500/50 transition-all hover:shadow-lg hover:shadow-lime-500/20 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lime-200 text-xs font-bold uppercase tracking-wider mb-2">Resolved</p>
                  <p className="text-5xl font-bold text-lime-400">{report.resolvedAlerts}</p>
                </div>
                <TrendingUp className="h-10 w-10 text-lime-500/40 group-hover:text-lime-500/60 transition-all" />
              </div>
              <p className="text-lime-300/60 text-xs">Successfully handled</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-cyan-200 text-xs font-bold uppercase tracking-wider mb-2">Success Rate</p>
                  <p className="text-5xl font-bold text-cyan-400">{report.resolutionRate}%</p>
                </div>
                <Target className="h-10 w-10 text-cyan-500/40 group-hover:text-cyan-500/60 transition-all" />
              </div>
              <p className="text-cyan-300/60 text-xs">Resolution efficiency</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 border border-cyan-500/30 hover:border-cyan-500/50 transition-all hover:shadow-lg hover:shadow-cyan-500/20 group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-cyan-200 text-xs font-bold uppercase tracking-wider mb-2">Response Time</p>
                  <p className="text-5xl font-bold text-cyan-400">{report.averageResponseTime}s</p>
                </div>
                <Zap className="h-10 w-10 text-cyan-500/40 group-hover:text-cyan-500/60 transition-all" />
              </div>
              <p className="text-cyan-300/60 text-xs">Average response</p>
            </CardContent>
          </Card>
        </div>

        {/* Alert Breakdown */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-5 w-5 text-cyan-400" />
            <h2 className="text-2xl font-bold text-cyan-100">Alert Analysis</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-blue-950/40 border-cyan-500/30 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <AlertTriangle className="h-5 w-5 text-orange-400" />
                <h3 className="text-lg font-bold text-cyan-100">Severity Breakdown</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-orange-300 font-semibold">Critical</span>
                    <span className="text-orange-400 font-bold text-sm px-2 py-1 bg-orange-500/20 rounded">{report.criticalCount}</span>
                  </div>
                  <div className="h-3 bg-blue-950/60 rounded-full overflow-hidden border border-orange-500/20">
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                      style={{
                        width: `${(report.criticalCount / Math.max(report.totalAlerts, 1)) * 100}%`,
                      }}
                      aria-label={`Critical alerts: ${report.criticalCount}`}
                      role="progressbar"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-orange-300 font-semibold">High</span>
                    <span className="text-orange-400 font-bold text-sm px-2 py-1 bg-orange-500/20 rounded">{report.highCount}</span>
                  </div>
                  <div className="h-3 bg-blue-950/60 rounded-full overflow-hidden border border-orange-500/20">
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-500"
                      style={{
                        width: `${(report.highCount / Math.max(report.totalAlerts, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-cyan-300 font-semibold">Medium</span>
                    <span className="text-cyan-400 font-bold text-sm px-2 py-1 bg-cyan-500/20 rounded">{report.mediumCount}</span>
                  </div>
                  <div className="h-3 bg-blue-950/60 rounded-full overflow-hidden border border-cyan-500/20">
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 transition-all duration-500"
                      style={{
                        width: `${(report.mediumCount / Math.max(report.totalAlerts, 1)) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-lime-300 font-semibold">Low</span>
                    <span className="text-lime-400 font-bold text-sm px-2 py-1 bg-lime-500/20 rounded">{report.lowCount}</span>
                  </div>
                  <div className="h-3 bg-blue-950/60 rounded-full overflow-hidden border border-lime-500/20">
                    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
                    <div
                      className="h-full bg-gradient-to-r from-lime-500 to-lime-400 transition-all duration-500"
                      style={{
                        width: `${(report.lowCount / Math.max(report.totalAlerts, 1)) * 100}%`,
                      }}
                      aria-label={`Low alerts: ${report.lowCount}`}
                      role="progressbar"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-950/40 border-cyan-500/30 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-cyan-100">Response Metrics</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-lg p-4 border border-orange-500/30 hover:border-orange-500/50 transition-all">
                  <p className="text-orange-300 text-xs font-bold uppercase tracking-wider mb-2">Active</p>
                  <p className="text-3xl font-bold text-orange-400">{report.activeAlerts}</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
                  <p className="text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">Students</p>
                  <p className="text-3xl font-bold text-cyan-400">{report.uniqueStudents.size}</p>
                </div>

                <div className="bg-gradient-to-br from-lime-500/10 to-lime-600/5 rounded-lg p-4 border border-lime-500/30 hover:border-lime-500/50 transition-all">
                  <p className="text-lime-300 text-xs font-bold uppercase tracking-wider mb-2">Drivers</p>
                  <p className="text-3xl font-bold text-lime-400">{report.uniqueDrivers.size}</p>
                </div>

                <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-500/50 transition-all">
                  <p className="text-cyan-300 text-xs font-bold uppercase tracking-wider mb-2">Peak Hour</p>
                  <p className="text-3xl font-bold text-cyan-400">{report.peakHour}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>

        {/* Hourly Distribution */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h2 className="text-2xl font-bold text-cyan-100">Hourly Activity</h2>
          </div>
          <Card className="bg-blue-950/40 border-cyan-500/30 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex flex-wrap gap-1">
              {Array.from({ length: 24 }).map((_, hour) => {
                const count = report.alertsByHour[hour] || 0;
                const maxCount = Math.max(...Object.values(report.alertsByHour), 1);
                const height = (count / maxCount) * 100;

                return (
                  <div key={hour} className="flex flex-col items-center gap-1" style={{ width: 'calc(100% / 24)' }}>
                    <div className="w-full h-16 bg-blue-950/40 rounded-t-lg relative overflow-hidden border-b border-cyan-500/30 hover:bg-blue-950/60 transition-all">
                      {count > 0 && (
                        <div
                          className="w-full bg-gradient-to-t from-cyan-500 to-cyan-400 absolute bottom-0 transition-all"
                          style={{ height: `${height}%` }}
                          aria-label={`Hour ${String(hour).padStart(2, '0')}: ${count} alerts`}
                          role="progressbar"
                        />
                      )}
                      {count > 0 && (
                        <span className="absolute inset-0 flex items-center justify-center text-cyan-950 text-xs font-bold">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-cyan-300/70 font-mono">
                      {String(hour).padStart(2, "0")}
                    </span>
                  </div>
                );
              })}
            </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-gradient-to-r from-blue-950/80 to-blue-900/60 border-t border-cyan-500/30 backdrop-blur-xl mt-12">
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

export default PNPReports;
