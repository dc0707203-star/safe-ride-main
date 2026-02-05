import { useState, useEffect } from "react";
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

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`student-location-${student.id}`)
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
          setLocationData({
            lat: payload.new.current_location_lat,
            lng: payload.new.current_location_lng,
            updatedAt: payload.new.location_updated_at,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [open, student?.id]);

  const handleRefresh = async () => {
    if (!student?.id) return;
    setIsRefreshing(true);

    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, current_location_lat, current_location_lng, location_updated_at')
        .eq('id', student.id)
        .single();

      if (error) {
        console.error('Error refreshing location:', error);
        toast.error('Failed to refresh location');
      } else if (data) {
        setLocationData({
          lat: data.current_location_lat,
          lng: data.current_location_lng,
          updatedAt: data.location_updated_at,
        });
        toast.success('Location refreshed');
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
              {/* Map Preview */}
              <div className="relative rounded-xl overflow-hidden border border-border bg-muted h-48 flex items-center justify-center">
                <iframe
                  key={`${locationData.lat},${locationData.lng}`}
                  title="Student Location Map"
                  src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${locationData.lat},${locationData.lng}&zoom=16`}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              {/* Location Info */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Navigation className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Coordinates</p>
                    <p className="text-sm font-mono">
                      {locationData.lat?.toFixed(6)}, {locationData.lng?.toFixed(6)}
                    </p>
                  </div>
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
