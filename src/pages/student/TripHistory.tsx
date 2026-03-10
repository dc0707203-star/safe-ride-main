import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, MapPin, Clock, User, Calendar, Car } from "lucide-react";
import { format } from "date-fns";
import isuLogo from "@/assets/isu-logo.png";
import campusBg from "@/assets/campus-bg.jpeg";

interface TripRecord {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  start_location_lat: number | null;
  start_location_lng: number | null;
  end_location_lat: number | null;
  end_location_lng: number | null;
  driver: {
    full_name: string;
    tricycle_plate_number: string;
    photo_url: string | null;
  } | null;
}

const TripHistory = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, userRole } = useAuth();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    } else if (!authLoading && userRole && userRole !== "student") {
      navigate("/");
    }
  }, [authLoading, user, userRole, navigate]);

  useEffect(() => {
    const fetchStudentAndTrips = async () => {
      if (!user) return;

      try {
        // Get student ID
        const { data: studentData, error: studentError } = await supabase
          .from("students" as any)
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle() as { data: { id: string } | null; error: any };

        if (studentError) throw studentError;
        if (!studentData) {
          navigate("/student-register");
          return;
        }

        setStudentId(studentData.id);

        // Fetch trips with driver info
        const { data: tripsData, error: tripsError } = await supabase
          .from("trips" as any)
          .select(`
            id,
            start_time,
            end_time,
            status,
            start_location_lat,
            start_location_lng,
            end_location_lat,
            end_location_lng,
            driver:drivers(full_name, tricycle_plate_number, photo_url)
          `)
          .eq("student_id", studentData.id)
          .order("start_time", { ascending: false }) as { data: any[]; error: any };

        if (tripsError) throw tripsError;
        setTrips(tripsData || []);
      } catch (error) {
        console.error("Error fetching trips:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      fetchStudentAndTrips();
    }
  }, [user, authLoading, navigate]);

  const formatDuration = (start: string, end: string | null) => {
    if (!end) return "In Progress";
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate.getTime() - startDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "active":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "cancelled":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={isuLogo} alt="ISU Logo" className="h-16 w-16 mx-auto animate-pulse" />
          <p className="text-white/70">Loading trip history...</p>
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
      <header className="relative z-10 sticky top-0 backdrop-blur-xl bg-white/10 border-b border-white/20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/student")}
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <img src={isuLogo} alt="ISU Logo" className="h-10 w-10" />
              <div>
                <h1 className="text-xl font-bold text-white">Trip History</h1>
                <p className="text-sm text-white/50">Your past rides</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 container mx-auto px-4 py-6 space-y-4">
        {trips.length === 0 ? (
          <Card className="bg-white/5 border-white/10">
            <CardContent className="py-12 text-center">
              <Car className="h-16 w-16 mx-auto text-white/30 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No trips yet</h3>
              <p className="text-white/50">Your trip history will appear here after your first ride.</p>
            </CardContent>
          </Card>
        ) : (
          trips.map((trip) => (
            <Card key={trip.id} className="bg-white/10 border-white/20 backdrop-blur-xl overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center overflow-hidden">
                      {trip.driver?.photo_url ? (
                        <img src={trip.driver.photo_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <User className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{trip.driver?.full_name || "Unknown Driver"}</p>
                      <p className="text-sm text-white/50">{trip.driver?.tricycle_plate_number || "N/A"}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(trip.status)}`}>
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-white/70">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <span>{format(new Date(trip.start_time), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <Clock className="h-4 w-4 text-amber-400" />
                    <span>{format(new Date(trip.start_time), "hh:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    <span>Duration: {formatDuration(trip.start_time, trip.end_time)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>
    </div>
  );
};

export default TripHistory;
