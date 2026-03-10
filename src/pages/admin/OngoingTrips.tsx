import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Activity, Clock, User, Car, MapPin, X, Phone, MessageSquare, LogOut, ChevronDown, ChevronUp, Zap } from "lucide-react";
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
  student: { full_name: string; student_id_number: string; course: string | null; year_level: string | null; contact_number: string | null };
  driver: { full_name: string; tricycle_plate_number: string };
};

type GroupedTrip = {
  driver: { full_name: string; tricycle_plate_number: string };
  students: { full_name: string; student_id_number: string; course: string | null; year_level: string | null; contact_number: string | null; trip_id: string; start_time: string; start_location_lat: number | null; start_location_lng: number | null }[];
};

const OngoingTrips = () => {
  const navigate = useNavigate();
  const { user, loading, userRole } = useAuth();
  const [trips, setTrips] = useState<ActiveTrip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [expandedDrivers, setExpandedDrivers] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'most' | 'least' | 'recent'>('most');
  const [filterBy, setFilterBy] = useState<'all' | 'full' | 'available'>('all');
  const MAX_CAPACITY = 5;

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
        supabase.from("students" as any).select("id, full_name, student_id_number, course, year_level, contact_number").in("id", studentIds),
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
        student: studentsMap.get(t.student_id) ?? { full_name: "Unknown", student_id_number: "", course: null, year_level: null, contact_number: null },
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

  // Group trips by driver
  const groupedTrips = useMemo(() => {
    const grouped = new Map<string, GroupedTrip>();
    
    trips.forEach((trip) => {
      const driverKey = trip.driver.tricycle_plate_number;
      if (!grouped.has(driverKey)) {
        grouped.set(driverKey, {
          driver: trip.driver,
          students: [],
        });
      }
      grouped.get(driverKey)!.students.push({
        full_name: trip.student.full_name,
        student_id_number: trip.student.student_id_number,
        course: trip.student.course,
        year_level: trip.student.year_level || null,
        contact_number: trip.student.contact_number || null,
        trip_id: trip.id,
        start_time: trip.start_time,
        start_location_lat: trip.start_location_lat,
        start_location_lng: trip.start_location_lng,
      });
    });
    
    let result = Array.from(grouped.values());

    // Apply sorting
    if (sortBy === 'most') {
      result.sort((a, b) => b.students.length - a.students.length);
    } else if (sortBy === 'least') {
      result.sort((a, b) => a.students.length - b.students.length);
    } else if (sortBy === 'recent') {
      result.sort((a, b) => new Date(b.students[0]?.start_time || 0).getTime() - new Date(a.students[0]?.start_time || 0).getTime());
    }

    // Apply filtering
    if (filterBy === 'full') {
      result = result.filter((g) => g.students.length >= MAX_CAPACITY);
    } else if (filterBy === 'available') {
      result = result.filter((g) => g.students.length < MAX_CAPACITY);
    }

    return result;
  }, [trips, sortBy, filterBy]);

  const toggleDriverExpand = (driverKey: string) => {
    const newExpanded = new Set(expandedDrivers);
    if (newExpanded.has(driverKey)) {
      newExpanded.delete(driverKey);
    } else {
      newExpanded.add(driverKey);
    }
    setExpandedDrivers(newExpanded);
  };

  // Calculate stats
  const stats = useMemo(() => {
    return {
      totalDrivers: groupedTrips.length,
      totalPassengers: groupedTrips.reduce((sum, g) => sum + g.students.length, 0),
      fullDrivers: groupedTrips.filter((g) => g.students.length >= MAX_CAPACITY).length,
      availableDrivers: groupedTrips.filter((g) => g.students.length < MAX_CAPACITY).length,
    };
  }, [groupedTrips]);

  // Map View Dialog Component
  const MapViewDialog = ({ location, onClose }: { location: { lat: number; lng: number; name: string }; onClose: () => void }) => {
    const GOOGLE_MAPS_KEY = "AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8";

    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl bg-card border-white/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white">{location.name}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              src={`https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_KEY}&q=${location.lat},${location.lng}&zoom=16`}
              className="w-full h-96 rounded-lg"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="p-4 bg-muted/50">
              <p className="text-xs text-muted-foreground">
                Coordinates: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: `url(${campusBg})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/60 via-black/70 to-emerald-900/60 backdrop-blur-md" />
      <header className="z-10 bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 shadow-lg">
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
              {groupedTrips.length} drivers
            </Badge>
          </div>
        </div>
      </header>

      <main className="relative z-10 w-full px-4 sm:px-6 lg:px-8 py-6">
        {isLoadingTrips ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading ongoing trips...</p>
            </div>
          </div>
        ) : empty ? (
          <Card className="border-dashed bg-white/5 backdrop-blur-xl border-white/20">
            <CardHeader className="text-center py-12">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <CardTitle className="text-foreground text-2xl">No Ongoing Trips</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground pb-8">
              <p className="mb-2">Once a student scans a driver QR code, active trips will appear here.</p>
              <p className="text-sm text-muted-foreground/70">Drivers will be grouped by their tricycle plate number with all passengers listed together.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Summary Dashboard */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="bg-black/40 backdrop-blur-xl border-white/20">
                <CardContent className="p-4">
                  <p className="text-xs text-blue-300 font-semibold uppercase mb-1">Total Drivers</p>
                  <p className="text-2xl font-bold text-white">{stats.totalDrivers}</p>
                </CardContent>
              </Card>
              <Card className="bg-black/40 backdrop-blur-xl border-white/20">
                <CardContent className="p-4">
                  <p className="text-xs text-cyan-300 font-semibold uppercase mb-1">Total Passengers</p>
                  <p className="text-2xl font-bold text-white">{stats.totalPassengers}</p>
                </CardContent>
              </Card>
              <Card className="bg-black/40 backdrop-blur-xl border-white/20">
                <CardContent className="p-4">
                  <p className="text-xs text-red-300 font-semibold uppercase mb-1">Full Drivers</p>
                  <p className="text-2xl font-bold text-white">{stats.fullDrivers}</p>
                </CardContent>
              </Card>
              <Card className="bg-black/40 backdrop-blur-xl border-white/20">
                <CardContent className="p-4">
                  <p className="text-xs text-green-300 font-semibold uppercase mb-1">Available</p>
                  <p className="text-2xl font-bold text-white">{stats.availableDrivers}</p>
                </CardContent>
              </Card>
            </div>

            {/* Sorting & Filtering */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex items-center gap-2 px-2">
                <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
                <h2 className="text-lg font-bold text-white">Active Drivers ({groupedTrips.length})</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm backdrop-blur-xl hover:bg-white/20 transition-colors"
                >
                  <option value="most" className="text-black">Most Passengers</option>
                  <option value="least" className="text-black">Least Passengers</option>
                  <option value="recent" className="text-black">Recently Added</option>
                </select>
                <select
                  value={filterBy}
                  onChange={(e) => setFilterBy(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm backdrop-blur-xl hover:bg-white/20 transition-colors"
                >
                  <option value="all" className="text-black">All Drivers</option>
                  <option value="full" className="text-black">Full Drivers</option>
                  <option value="available" className="text-black">Available Drivers</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-max">
            {groupedTrips.map((group, idx) => {
              const isExpanded = expandedDrivers.has(group.driver.tricycle_plate_number);
              const capacityPercent = (group.students.length / MAX_CAPACITY) * 100;
              let capacityColor = 'bg-green-500/80'; // 1-3
              if (group.students.length === 4) capacityColor = 'bg-yellow-500/80'; // 4
              if (group.students.length >= MAX_CAPACITY) capacityColor = 'bg-red-500/80'; // 5
              
              return (
              <Card key={`driver-${group.driver.tricycle_plate_number}`} className="overflow-hidden border border-white/20 bg-black/40 backdrop-blur-xl hover:border-white/40 transition-all">
                <CardHeader className="px-3 py-2 bg-black/60 backdrop-blur-sm border-b border-white/10">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <Zap className="h-3 w-3 text-yellow-400 animate-pulse" />
                        <p className="text-[9px] text-yellow-300 font-bold">LIVE</p>
                      </div>
                      <p className="text-[10px] font-semibold text-amber-300 uppercase tracking-tight">Driver</p>
                      <p className="text-sm font-bold text-white break-words">{group.driver.full_name}</p>
                      <p className="text-[10px] text-amber-300">Plate: <span className="font-mono font-bold text-amber-200">{group.driver.tricycle_plate_number}</span></p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={`rounded-full ${capacityColor} text-white font-semibold text-[10px] whitespace-nowrap h-fit`}>
                        {group.students.length}/{MAX_CAPACITY}P
                      </Badge>
                      {group.students.length >= MAX_CAPACITY && (
                        <Badge className="rounded-full bg-red-500/80 text-white font-semibold text-[9px] whitespace-nowrap h-fit">
                          Full
                        </Badge>
                      )}
                    </div>
                  </div>
                  {/* Capacity Bar */}
                  <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full transition-all ${capacityColor}`} style={{ width: `${capacityPercent}%` }} />
                  </div>
                </CardHeader>

                <CardContent className={`p-2 space-y-1 transition-all ${isExpanded ? '' : 'max-h-0 overflow-hidden p-0'}`}>
                  <p className="text-xs text-white font-bold uppercase tracking-tight mb-2">Passengers ({group.students.length})</p>
                  <div className="space-y-2">
                    {group.students.map((student) => (
                      <div key={student.trip_id} className="rounded text-xs bg-black/50 backdrop-blur-sm border border-white/20 p-3 space-y-1.5">
                        <div className="flex items-start justify-between gap-1">
                          <p className="font-bold text-white break-words flex-1 text-sm">{student.full_name}</p>
                          {student.start_location_lat != null && student.start_location_lng != null && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-[8px] whitespace-nowrap flex-shrink-0"
                              onClick={() => setSelectedLocation({ lat: student.start_location_lat!, lng: student.start_location_lng!, name: student.full_name })}
                            >
                              <MapPin className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                        <div className="space-y-1 text-white/90">
                          <p className="text-xs">ID: <span className="font-mono font-semibold text-white">{student.student_id_number}</span></p>
                          {student.course && (
                            <p className="text-xs">Course: <span className="font-semibold text-white">{student.course}</span></p>
                          )}
                          {student.year_level && (
                            <p className="text-xs">Year: <span className="font-semibold text-white">{student.year_level}</span></p>
                          )}
                          {student.contact_number && (
                            <p className="text-xs">📱 <span className="font-mono font-semibold text-white">{student.contact_number}</span></p>
                          )}
                          <p className="text-white/70 text-xs">⏱ Started: {new Date(student.start_time).toLocaleString()}</p>
                        </div>
                        {/* Quick Actions */}
                        <div className="flex gap-1 mt-2 pt-2 border-t border-blue-400/30">
                          {student.contact_number && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs flex-1 font-semibold text-white"
                              onClick={() => window.open(`tel:${student.contact_number}`)}
                            >
                              <Phone className="h-3 w-3 mr-1" />
                              Call
                            </Button>
                          )}
                          {student.contact_number && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-6 px-2 text-xs flex-1 font-semibold text-white"
                              onClick={() => window.open(`sms:${student.contact_number}`)}
                            >
                              <MessageSquare className="h-3 w-3 mr-1" />
                              SMS
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Expandable Button */}
                <div className="px-3 py-2 bg-black/60 border-t border-white/10">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-7 text-xs text-blue-300 hover:text-blue-200 hover:bg-white/10 font-semibold"
                    onClick={() => toggleDriverExpand(group.driver.tricycle_plate_number)}
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Hide Passengers
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Show Passengers ({group.students.length})
                      </>
                    )}
                  </Button>
                </div>
              </Card>
              );
            })}
            </div>
          </div>
        )}
      </main>

      {/* Map View Dialog */}
      {selectedLocation && (
        <MapViewDialog location={selectedLocation} onClose={() => setSelectedLocation(null)} />
      )}
    </div>
  );
};

export default OngoingTrips;
