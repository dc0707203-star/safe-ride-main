import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader, AlertTriangle, MapPin, Clock, X, Maximize2 } from 'lucide-react';
import { format } from 'date-fns';
import { detectDeviceCapabilities, getOptimizedTimings } from '@/lib/performanceOptimization';

interface LocationData {
  id: string;
  tripId: string;
  studentName: string;
  studentNumber?: string;
  driverName: string;
  plateNumber: string;
  lat: number;
  lng: number;
  timestamp: string;
  type: 'active' | 'completed';
}

interface Bounds {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

interface LiveMapProps {
  isFullPage?: boolean;
}

const LiveMap = ({ isFullPage = false }: LiveMapProps) => {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string>('');
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(isFullPage);

  useEffect(() => {
    fetchLocations();
    // Use faster interval for live tracking (2 seconds, or 5 on low-spec)
    const capabilities = detectDeviceCapabilities();
    const timings = getOptimizedTimings(capabilities);
    // For emergency live tracking, use faster refresh: 2s normal, 5s low-spec
    const refreshInterval = capabilities.isLowSpec ? 5000 : 2000;
    const interval = setInterval(fetchLocations, refreshInterval);
    return () => clearInterval(interval);
  }, []);

  const fetchLocations = async () => {
    try {
      // Get active trips with real-time location data
      const { data: trips, error: tripsError } = await supabase
        .from('trips' as any)
        .select(`
          id,
          start_time,
          start_location_lat,
          start_location_lng,
          status,
          students!inner(id, full_name, student_id_number, photo_url),
          drivers!inner(id, full_name, tricycle_plate_number, photo_url)
        `)
        .eq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(50);

      if (tripsError) throw tripsError;

      // Fetch real-time locations for each trip
      const formattedLocations: LocationData[] = [];
      
      for (const trip of (trips || [])) {
        // Get latest location from trip_locations table
        const { data: locations } = await supabase
          .from('trip_locations' as any)
          .select('latitude, longitude, created_at')
          .eq('trip_id', trip.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Use latest trip location, fallback to start location
        const currentLat = locations?.[0]?.latitude || trip.start_location_lat || 14.5994;
        const currentLng = locations?.[0]?.longitude || trip.start_location_lng || 121.0829;
        const timestamp = locations?.[0]?.created_at || trip.start_time;

        formattedLocations.push({
          id: trip.id,
          tripId: trip.id,
          studentName: trip.students?.full_name || 'Unknown',
          studentNumber: trip.students?.student_id_number,
          driverName: trip.drivers?.full_name || 'Unknown',
          plateNumber: trip.drivers?.tricycle_plate_number || 'Unknown',
          lat: currentLat,
          lng: currentLng,
          timestamp: timestamp,
          type: 'active' as const,
        });
      }

      setLocations(formattedLocations);
      generateMapUrl(formattedLocations);
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching locations:', err);
      setError('Failed to load live map data');
      setLoading(false);
    }
  };

  const generateMapUrl = (locs: LocationData[]) => {
    if (locs.length === 0) {
      // Default to ISU Campus center (Iloilo, Philippines)
      setMapUrl('https://www.openstreetmap.org/export/embed.html?bbox=120.53%2C10.65%2C120.58%2C10.70&layer=mapnik&marker=10.68%2C120.55');
      return;
    }

    try {
      const bounds = calculateBounds(locs);
      
      // Create markers for each active trip
      let markerUrl = '';
      locs.forEach((loc, idx) => {
        if (idx < 10) { // Limit to first 10 markers
          markerUrl += `&marker=${loc.lat.toFixed(4)}%2C${loc.lng.toFixed(4)}`;
        }
      });

      const bbox = `${bounds.minLng.toFixed(4)}%2C${bounds.minLat.toFixed(4)}%2C${bounds.maxLng.toFixed(4)}%2C${bounds.maxLat.toFixed(4)}`;
      setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${markerUrl}`);
    } catch (err) {
      console.error('Error generating map URL:', err);
    }
  };

  const calculateBounds = (locs: LocationData[]): Bounds => {
    const lats = locs.map(l => l.lat);
    const lngs = locs.map(l => l.lng);
    const padding = 0.02;
    
    return {
      minLat: Math.min(...lats) - padding,
      maxLat: Math.max(...lats) + padding,
      minLng: Math.min(...lngs) - padding,
      maxLng: Math.max(...lngs) + padding,
    };
  };

  if (loading) {
    return (
      <div className={`${isFullPage ? 'w-full h-96' : 'w-full h-48'} bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-lime-500/30 flex items-center justify-center`}>
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin text-lime-500 mx-auto mb-2" />
          <p className="text-white/60 text-sm">Loading live map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${isFullPage ? 'w-full h-96' : 'w-full h-48'} bg-gradient-to-br from-red-900/30 to-red-800/30 rounded-2xl border border-red-500/30 flex items-center justify-center`}>
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-white text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen Map Modal (when in fullpage or clicked from compact) */}
      {isFullscreen && !isFullPage && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl rounded-2xl border border-lime-500/30 overflow-hidden shadow-2xl">
            {/* Map Container */}
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              src={mapUrl || 'https://www.openstreetmap.org/export/embed.html?bbox=120.53%2C10.65%2C120.58%2C10.70&layer=mapnik&marker=10.68%2C120.55'}
              style={{ border: 'none' }}
              title="Live Map of Active Trips"
            ></iframe>

            {/* Close Button */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 p-2.5 rounded-lg bg-black/70 hover:bg-black/90 border border-white/20 transition-all z-10"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-3 max-w-xs z-10 max-h-40 overflow-y-auto">
              <div className="text-lime-400 font-bold mb-2 text-sm">Active Trips ({locations.length})</div>
              <div className="space-y-1 text-xs">
                {locations.slice(0, 10).map((loc) => (
                  <div key={loc.id} className="text-white/80 border-l-2 border-lime-500 pl-2 py-0.5">
                    <div className="font-semibold text-lime-300">{loc.studentName}</div>
                    <div className="text-white/60 text-[10px]">{loc.plateNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compact Map View */}
      {!isFullPage && (
        <div className="w-full space-y-4">
          {/* Map Container - Compact Size */}
          <div
            onClick={() => setIsFullscreen(true)}
            className="relative w-full h-48 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-lime-500/30 overflow-hidden shadow-lg cursor-pointer group hover:border-lime-500/60 hover:shadow-lg hover:shadow-lime-500/20 transition-all"
          >
            {/* Map Embed */}
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              src={mapUrl || 'https://www.openstreetmap.org/export/embed.html?bbox=120.53%2C10.65%2C120.58%2C10.70&layer=mapnik&marker=10.68%2C120.55'}
              style={{ border: 'none' }}
              title="Live Map Preview"
              className="pointer-events-none"
            ></iframe>

            {/* Hover Overlay - Click to Expand */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex flex-col items-center gap-2 bg-black/70 px-4 py-2 rounded-lg backdrop-blur-md border border-white/20">
                <Maximize2 className="h-5 w-5 text-lime-400" />
                <span className="text-white text-xs font-semibold">Click to Expand</span>
              </div>
            </div>

            {/* Legend - Compact */}
            <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-md border border-white/20 rounded-lg p-2 z-10 text-xs">
              <div className="text-lime-400 font-bold">{locations.length} Active</div>
            </div>

            {/* Empty State */}
            {locations.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-5">
                <div className="text-center">
                  <MapPin className="h-8 w-8 text-white/40 mx-auto mb-1" />
                  <p className="text-white text-sm font-semibold">No Active Trips</p>
                </div>
              </div>
            )}
          </div>

          {/* Active Trips List */}
          {locations.length > 0 && (
            <div className="space-y-3">
              <div className="px-2">
                <h3 className="text-base font-bold text-white">Active Trips ({locations.length})</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                {locations.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => setSelectedTrip(selectedTrip === loc.id ? null : loc.id)}
                    className={`cursor-pointer p-3 rounded-lg border transition-all text-sm ${
                      selectedTrip === loc.id
                        ? 'bg-lime-500/20 border-lime-500 shadow-md shadow-lime-500/20'
                        : 'bg-slate-800/50 border-slate-700 hover:border-lime-500/50 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="space-y-1.5">
                      {/* Student Info */}
                      <div>
                        <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Student</p>
                        <p className="text-white font-bold text-sm">{loc.studentName}</p>
                        {loc.studentNumber && (
                          <p className="text-xs text-white/60">{loc.studentNumber}</p>
                        )}
                      </div>

                      {/* Driver Info */}
                      <div className="pt-1 border-t border-white/10">
                        <p className="text-[10px] text-white/50 uppercase tracking-widest font-semibold">Driver</p>
                        <p className="text-white font-bold text-sm">{loc.driverName}</p>
                        <p className="text-xs text-lime-400 font-mono tracking-wider mt-0.5">{loc.plateNumber}</p>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-1 text-xs text-white/60 pt-1 border-t border-white/10">
                        <Clock className="h-3 w-3" />
                        <span>{format(new Date(loc.timestamp), 'HH:mm')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Full Page Map View */}
      {isFullPage && (
        <div className="w-full space-y-4">
          {/* Full Size Map */}
          <div className="relative w-full h-screen bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl border border-lime-500/30 overflow-hidden shadow-2xl">
            {/* Map Embed */}
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              src={mapUrl || 'https://www.openstreetmap.org/export/embed.html?bbox=120.53%2C10.65%2C120.58%2C10.70&layer=mapnik&marker=10.68%2C120.55'}
              style={{ border: 'none' }}
              title="Live Map of Active Trips"
            ></iframe>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border border-white/20 rounded-xl p-4 max-w-sm z-10 max-h-60 overflow-y-auto">
              <div className="text-lime-400 font-bold mb-3 text-base">Active Trips ({locations.length})</div>
              <div className="space-y-2 text-sm">
                {locations.map((loc) => (
                  <div key={loc.id} className="text-white/80 border-l-2 border-lime-500 pl-3 py-1">
                    <div className="font-semibold text-lime-300">{loc.studentName}</div>
                    <div className="text-white/60 text-xs flex gap-2">
                      <span>{loc.driverName}</span>
                      <span className="text-lime-400 font-mono">{loc.plateNumber}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Empty State */}
            {locations.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div className="text-center">
                  <MapPin className="h-12 w-12 text-white/40 mx-auto mb-2" />
                  <p className="text-white text-xl font-semibold">No Active Trips</p>
                  <p className="text-white/60 text-sm mt-1">Active rides will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default LiveMap;

