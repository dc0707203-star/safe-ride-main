import { useState, useEffect, useRef } from "react";
import { MapPin, Navigation, ExternalLink, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface StudentLocationDialogProps {
  student: {
    id: string;
    full_name: string;
    current_location_lat?: number | null;
    current_location_lng?: number | null;
    location_updated_at?: string | null;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StudentLocationDialog = ({ student, open, onOpenChange }: StudentLocationDialogProps) => {
  const [locationData, setLocationData] = useState<{
    lat: number | null;
    lng: number | null;
    updatedAt: string | null;
  }>({
    lat: student?.current_location_lat ?? null,
    lng: student?.current_location_lng ?? null,
    updatedAt: student?.location_updated_at ?? null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const locationDataRef = useRef(locationData);

  // Keep ref in sync with state
  useEffect(() => {
    locationDataRef.current = locationData;
  }, [locationData]);

  // Subscribe to real-time location updates
  useEffect(() => {
    if (!open || !student?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Fetch initial location with explicit column selection
    const fetchLocation = async () => {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('id, current_location_lat, current_location_lng, location_updated_at')
          .eq('id', student.id)
          .single();

        if (error) {
          console.error('Error fetching location:', error);
          setLocationData({
            lat: null,
            lng: null,
            updatedAt: null,
          });
        } else if (data) {
          console.log('Location data:', data);
          setLocationData({
            lat: data.current_location_lat,
            lng: data.current_location_lng,
            updatedAt: data.location_updated_at,
          });
        }
      } catch (err) {
        console.error('Exception fetching location:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLocation();

    // Subscribe to real-time updates with longer timeout
    const channel = supabase
      .channel(`student-location-${student.id}-${Date.now()}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'students',
          filter: `id=eq.${student.id}`,
        },
        (payload: any) => {
          console.log('Location update received:', payload);
          // Only update if the new location is different or more recent
          const newLat = payload.new.current_location_lat;
          const newLng = payload.new.current_location_lng;
          const newUpdatedAt = payload.new.location_updated_at;

          if (
            newLat !== locationDataRef.current.lat ||
            newLng !== locationDataRef.current.lng ||
            (newUpdatedAt &&
              new Date(newUpdatedAt) > new Date(locationDataRef.current.updatedAt || 0))
          ) {
            setLocationData({
              lat: newLat,
              lng: newLng,
              updatedAt: newUpdatedAt,
            });
            // Update ref
            locationDataRef.current = { lat: newLat, lng: newLng, updatedAt: newUpdatedAt };
          }
        }
      )
      .subscribe((status) => {
        console.log('Location subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, student?.id]);

  const handleRefresh = async () => {
    if (!student?.id) return;
    setIsRefreshing(true);

    try {
      // Force fetch with cache bust by adding timestamp
      const { data, error } = await supabase
        .from('students')
        .select('id, current_location_lat, current_location_lng, location_updated_at')
        .eq('id', student.id)
        .single();

      if (error) {
        console.error('Error refreshing location:', error);
        toast.error('Failed to refresh location');
      } else if (data) {
        console.log('Location refreshed:', data);
        setLocationData({
          lat: data.current_location_lat,
          lng: data.current_location_lng,
          updatedAt: data.location_updated_at,
        });
        toast.success('Location updated');
      }
    } catch (err) {
      console.error('Exception refreshing location:', err);
      toast.error('Failed to refresh location');
    } finally {
      setIsRefreshing(false);
    }
  };

  const openInMaps = () => {
    if (locationData.lat && locationData.lng) {
      window.open(
        `https://www.google.com/maps?q=${locationData.lat},${locationData.lng}`,
        '_blank'
      );
    }
  };

  const hasLocation = locationData.lat !== null && locationData.lng !== null;
  
  // Check if location is stale (older than 1 hour)
  const isLocationStale = locationData.updatedAt 
    ? new Date().getTime() - new Date(locationData.updatedAt).getTime() > 3600000
    : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <span className="block">Student Location</span>
              <span className="text-sm font-normal text-muted-foreground">
                {student?.full_name}
              </span>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center animate-pulse">
                <MapPin className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">Loading location...</p>
            </div>
          ) : hasLocation ? (
            <>
              {/* Map Preview - Using Leaflet Map */}
              <div className="relative rounded-xl overflow-hidden border border-border bg-gradient-to-br from-blue-50 to-indigo-50 h-48">
                {hasLocation ? (
                  <div className="w-full h-full" id={`map-container-${student?.id}`}>
                    <img
                      src={`https://tile.openstreetmap.org/16/${Math.floor((locationData.lng || 0 + 180) / 360 * 65536)},${Math.floor((90 - (locationData.lat || 0)) / 180 * 65536)}.png`}
                      alt="Map"
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 flex flex-col items-center justify-between p-4 bg-gradient-to-b from-blue-400/20 to-transparent">
                      <div className="text-center pt-2">
                        <div className="inline-block bg-white/90 rounded-full p-2 shadow-lg">
                          <MapPin className="h-8 w-8 text-red-500" />
                        </div>
                      </div>
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-lg">
                        <p className="text-xs font-semibold text-gray-600">📍 Student Location</p>
                        <p className="text-xs text-gray-500">Tap "Open in Maps" to navigate</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="text-center">
                      <MapPin className="h-10 w-10 text-blue-500 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-gray-400">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Location Info */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                {isLocationStale && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
                    <p className="text-xs text-yellow-800 font-semibold">
                      ⚠️ Location is outdated
                    </p>
                    <p className="text-xs text-yellow-700 mt-1">
                      Ask the student to open the app, enable GPS, and move around to update their location.
                    </p>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Navigation className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">Coordinates</p>
                    <p className="text-sm font-mono font-bold text-blue-600">
                      {locationData.lat?.toFixed(6)}, {locationData.lng?.toFixed(6)}
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${locationData.lat?.toFixed(6)}, ${locationData.lng?.toFixed(6)}`);
                      toast.success('Coordinates copied');
                    }}
                    className="text-xs text-blue-500 hover:text-blue-600 font-medium"
                  >
                    Copy
                  </button>
                </div>

                {locationData.updatedAt && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium">
                        {format(new Date(locationData.updatedAt), 'MMM d, yyyy h:mm:ss a')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  onClick={openInMaps}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open in Maps
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Location updates automatically when the student's app is active
              </p>
            </>
          ) : !loading ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Location Not Available</h3>
              <p className="text-sm text-muted-foreground mb-4">
                The student's location is not currently being shared. This could mean:
              </p>
              <ul className="text-sm text-muted-foreground text-left list-disc list-inside space-y-1">
                <li>The student's app is not currently active</li>
                <li>Location permissions are not enabled</li>
                <li>GPS signal is unavailable</li>
              </ul>
              <Button
                variant="outline"
                className="mt-4 gap-2"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Check Again
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StudentLocationDialog;
