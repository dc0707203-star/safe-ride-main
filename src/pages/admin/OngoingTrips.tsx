import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, Clock, User, Car, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import campusBg from "@/assets/campus-bg.jpeg";

type ActiveTrip = {
  id: string;
  start_time: string;
  start_location_lat: number | null;
  start_location_lng: number | null;
  student: { full_name: string; student_id_number: string; course: string | null };
  driver: { full_name: string; tricycle_plate_number: string };
};

const OngoingTrips = () => {
  const navigate = useNavigate();
  const { user, loading, userRole } = useAuth();
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/login?type=admin");
      else if (userRole !== null && userRole !== "admin") navigate("/");
    }
  }, [user, loading, userRole, navigate]);

  const fetchActiveTrips = async () => {
    setIsLoadingTrips(true);
    try {
      // Fetch active trips
      const { data: tripsData, error: tripsError } = await supabase
        .from("trips" as any)
        .select("*")
        .eq("status", "active")
        .order("start_time", { ascending: false });

      if (tripsError) throw tripsError;

      if (!tripsData || tripsData.length === 0) {
        setTrips([]);
        setIsLoadingTrips(false);
        return;
      }

      // Get unique student and driver IDs
      const studentIds = [...new Set(tripsData.map((t: any) => t.student_id))];
      const driverIds = [...new Set(tripsData.map((t: any) => t.driver_id))];

      // Fetch students and drivers in parallel
      const [studentsRes, driversRes] = await Promise.all([
        supabase.from("students" as any).select("id, full_name, student_id_number, course").in("id", studentIds),
        supabase.from("drivers" as any).select("id, full_name, tricycle_plate_number").in("id", driverIds),
      ]);

      if (studentsRes.error) throw studentsRes.error;
      if (driversRes.error) throw driversRes.error;

      const studentsMap = new Map((studentsRes.data ?? []).map((s: any) => [s.id, s]));
      const driversMap = new Map((driversRes.data ?? []).map((d: any) => [d.id, d]));

      const formatted: ActiveTrip[] = tripsData.map((t: any) => ({
        id: t.id,
        start_time: t.start_time,
        start_location_lat: t.start_location_lat ?? null,
        start_location_lng: t.start_location_lng ?? null,
        student: studentsMap.get(t.student_id) ?? { full_name: "Unknown", student_id_number: "", course: null },
        driver: driversMap.get(t.driver_id) ?? { full_name: "Unknown", tricycle_plate_number: "" },
      }));

      setTrips(formatted);
    } catch (e: any) {
      console.error("Failed to load ongoing trips:", e);
      toast.error("Failed to load ongoing trips", { description: e?.message });
      setTrips([]);
    } finally {
      setIsLoadingTrips(false);
    }
  };

  useEffect(() => {
    if (!user || userRole !== "admin") return;

    fetchActiveTrips();

    const channel = supabase
      .channel("admin-ongoing-trips")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => fetchActiveTrips()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, userRole]);

  const empty = useMemo(() => !isLoadingTrips && trips.length === 0, [isLoadingTrips, trips.length]);

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <header className="relative z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin")}
                className="rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg">
                  <Activity className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">Ongoing Trips</h1>
                  <p className="text-xs text-muted-foreground">Live rides currently in progress</p>
                </div>
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full">
              {trips.length} active
            </Badge>
          </div>
        </div>
      </header>

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-6">
        {isLoadingTrips ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading ongoing trips...</p>
            </div>
          </div>
        ) : empty ? (
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <CardTitle className="text-foreground">No ongoing trips</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Once a student scans a driver QR code, it will appear here.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {trips.map((t) => (
              <Card key={t.id} className="overflow-hidden border-white/20 bg-white/10 backdrop-blur-xl">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Student</p>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-foreground truncate">{t.student.full_name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {t.student.student_id_number}{t.student.course ? ` • ${t.student.course}` : ""}
                      </p>
                    </div>
                    <Badge className="rounded-full" variant="secondary">Active</Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Driver</p>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-foreground truncate">{t.driver.full_name}</p>
                      </div>
                      <p className="text-sm text-muted-foreground">Plate: {t.driver.tricycle_plate_number}</p>
                    </div>

                    <div className="rounded-xl bg-muted/30 p-3">
                      <p className="text-xs text-muted-foreground">Started</p>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary" />
                        <p className="font-semibold text-foreground">{new Date(t.start_time).toLocaleString()}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">Trip ID: {t.id}</p>
                    </div>
                  </div>

                  {(t.start_location_lat != null && t.start_location_lng != null) && (
                    <div className="rounded-xl bg-muted/30 p-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        <p className="text-sm text-foreground">Start location recorded</p>
                      </div>
                      <p className="text-xs text-muted-foreground">{t.start_location_lat}, {t.start_location_lng}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default OngoingTrips;
