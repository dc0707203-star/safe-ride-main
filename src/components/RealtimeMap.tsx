import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader, AlertCircle, MapPin, AlertTriangle, Clock } from 'lucide-react';
import { detectDeviceCapabilities, getOptimizedTimings } from '@/lib/performanceOptimization';

// Fix Leaflet default icons
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.setIcon(DefaultIcon);

interface TripLocation {
  latitude: number;
  longitude: number;
  created_at: string;
  speed?: number;
}

interface Trip {
  id: string;
  start_time: string;
  status: string;
  is_sos?: boolean;
  end_location_lat?: number;
  end_location_lng?: number;
  start_location_lat?: number;
  start_location_lng?: number;
  student: {
    full_name: string;
    student_id_number: string;
    photo_url: string | null;
  };
  driver: {
    full_name: string;
    tricycle_plate_number: string;
  };
  trip_locations: TripLocation[];
}

interface RealtimeMapProps {
  isFullPage?: boolean;
}

const RealtimeMap = ({ isFullPage = false }: RealtimeMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const polylinesRef = useRef<Map<string, L.Polyline>>(new Map());
  const pickupMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const dropoffMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const sosMarkersRef = useRef<Map<string, L.CircleMarker>>(new Map());
  const safeZonesRef = useRef<Map<string, L.Circle>>(new Map());
  const heatmapLayerRef = useRef<L.Layer | null>(null);
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const initRef = useRef(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const timeDisplayRef = useRef<NodeJS.Timeout | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const notifiedTripsRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSafeZones, setShowSafeZones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);
  const [heatmapData, setHeatmapData] = useState<Array<[number, number, number]>>([]);

  // Helper: Calculate speed from consecutive locations
  const calculateSpeed = (loc1: TripLocation, loc2: TripLocation): number => {
    const R = 6371; // Earth's radius in km
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLng = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((loc1.latitude * Math.PI) / 180) * Math.cos((loc2.latitude * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    const time1 = new Date(loc1.created_at).getTime();
    const time2 = new Date(loc2.created_at).getTime();
    const timeHours = (time2 - time1) / (1000 * 60 * 60);
    
    return timeHours > 0 ? Math.round(distance / timeHours) : 0;
  };

  // Helper: Calculate total trip distance in km
  const calculateTotalDistance = (trip: Trip): number => {
    if (!trip.trip_locations || trip.trip_locations.length < 2) return 0;
    
    let totalDistance = 0;
    const R = 6371; // Earth's radius in km
    
    for (let i = 0; i < trip.trip_locations.length - 1; i++) {
      const loc1 = trip.trip_locations[i];
      const loc2 = trip.trip_locations[i + 1];
      
      const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
      const dLng = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((loc1.latitude * Math.PI) / 180) * Math.cos((loc2.latitude * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      totalDistance += R * c;
    }
    
    return totalDistance;
  };

  // Helper: Calculate ETA in minutes
  const calculateETA = (trip: Trip): number => {
    if (!trip.end_location_lat || !trip.end_location_lng || !trip.trip_locations.length) return 0;
    
    const lastLocation = trip.trip_locations[trip.trip_locations.length - 1];
    const avgSpeed = trip.trip_locations.length > 1
      ? calculateSpeed(trip.trip_locations[0], lastLocation)
      : 20; // Default speed if insufficient data
    
    const R = 6371;
    const dLat = ((trip.end_location_lat - lastLocation.latitude) * Math.PI) / 180;
    const dLng = ((trip.end_location_lng - lastLocation.longitude) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lastLocation.latitude * Math.PI) / 180) * Math.cos((trip.end_location_lat * Math.PI) / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.max(1, Math.round((distance / (avgSpeed || 20)) * 60));
  };

  // Helper: Get speed color
  const getSpeedColor = (speed: number): string => {
    if (speed > 60) return '#ef4444'; // Red - overspeeding
    if (speed > 40) return '#f97316'; // Orange - over limit
    return '#22c55e'; // Green - safe
  };

  // Helper: Get default safe zones (example campus areas)
  const getSafeZones = (): Array<{ lat: number; lng: number; radius: number; name: string }> => {
    return [
      { lat: 14.5995, lng: 120.9842, radius: 500, name: 'Campus Main' },
      { lat: 14.6010, lng: 120.9850, radius: 300, name: 'Health Center' },
      { lat: 14.5970, lng: 120.9800, radius: 400, name: 'East Gate' },
    ];
  };

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    console.log('[RealtimeMap] Initializing Leaflet map...');

    // Use requestAnimationFrame to ensure DOM is painted before initializing map
    const animationFrameId = requestAnimationFrame(() => {
      setTimeout(() => {
        const container = document.getElementById('realtime-map-container');
        if (!container) {
          console.error('[RealtimeMap] Container element not found in DOM');
          setError('Map container not found');
          setLoading(false);
          return;
        }

        try {
          console.log('[RealtimeMap] Container found, creating map...');
          // Initialize map using ID
          mapRef.current = L.map('realtime-map-container').setView([14.5995, 120.9842], 13);
          
          // Add OpenStreetMap tiles
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 19,
          }).addTo(mapRef.current);
          
          // Add safe zones
          if (showSafeZones) {
            getSafeZones().forEach((zone) => {
              const circle = L.circle([zone.lat, zone.lng], {
                color: '#22c55e',
                fillColor: '#22c55e',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '5, 5',
                radius: zone.radius,
              })
                .bindPopup(`<div class="text-xs"><strong>${zone.name}</strong><br/>Safe Zone (${zone.radius}m)</div>`)
                .addTo(mapRef.current);
              safeZonesRef.current.set(zone.name, circle);
            });
          }
          
          console.log('[RealtimeMap] Map initialized successfully');
          setMapReady(true);
          setLoading(false);
        } catch (err) {
          console.error('[RealtimeMap] Map initialization error:', err);
          setError('Failed to initialize map');
          setLoading(false);
          return;
        }

        // Fetch active trips with real-time location data
        const fetchTrips = async () => {
          try {
            setIsRefreshing(true);
            console.log('[RealtimeMap] Fetching trips with locations...');
            
            // Fetch all active trips
            const { data: tripsData, error: tripsError } = await supabase
              .from('trips')
              .select(`
                id,
                start_time,
                status,
                start_location_lat,
                start_location_lng,
                end_location_lat,
                end_location_lng,
                student:students(full_name, student_id_number, photo_url),
                driver:drivers(full_name, tricycle_plate_number)
              `)
              .eq('status', 'active')
              .order('start_time', { ascending: false });

            if (tripsError) {
              console.error('[RealtimeMap] Trips query error:', tripsError);
              setError(`Data load failed: ${tripsError.message}`);
              setIsRefreshing(false);
              return;
            }

            console.log('[RealtimeMap] ✅ Fetched trips:', tripsData?.length || 0);

            if (tripsData && tripsData.length > 0) {
              // Fetch trip locations for all active trips
              const tripIds = tripsData.map(t => t.id);
              const { data: locationsData, error: locError } = await supabase
                .from('trip_locations')
                .select('*')
                .in('trip_id', tripIds)
                .order('created_at', { ascending: true });

              if (locError) {
                console.error('[RealtimeMap] Location query error:', locError);
                // Continue without locations, fallback to start location
              }

              console.log('[RealtimeMap] ✅ Fetched locations:', locationsData?.length || 0);

              // Map locations by trip ID
              const locationsByTrip = new Map<string, TripLocation[]>();
              (locationsData || []).forEach((loc: any) => {
                if (!locationsByTrip.has(loc.trip_id)) {
                  locationsByTrip.set(loc.trip_id, []);
                }
                locationsByTrip.get(loc.trip_id)!.push({
                  latitude: Number(loc.latitude),
                  longitude: Number(loc.longitude),
                  created_at: loc.created_at,
                  speed: loc.speed || 0,
                });
              });

              // Build trips with locations
              const tripsWithLoc = tripsData.map((trip: any) => {
                let tripLocations = locationsByTrip.get(trip.id) || [];
                
                // If no locations in trip_locations table, use start location
                if (tripLocations.length === 0) {
                  const lat = trip.start_location_lat || 14.5995;
                  const lng = trip.start_location_lng || 120.9842;
                  tripLocations = [{
                    latitude: lat,
                    longitude: lng,
                    created_at: trip.start_time,
                    speed: 0
                  }];
                  console.warn(`[RealtimeMap] ⚠️ Trip ${trip.id} has no tracked locations, using start location`);
                }

                console.log(`[RealtimeMap] Trip ${trip.id}: ${trip.student?.full_name} - ${tripLocations.length} locations`);

                return {
                  ...trip,
                  trip_locations: tripLocations,
                  is_sos: false,
                } as Trip;
              });

              console.log('[RealtimeMap] ✅ All trips ready for display:', tripsWithLoc.length);
              
              setTrips(tripsWithLoc);
              if (mapRef.current) {
                updateMarkers(tripsWithLoc);
                // Update heatmap data
                const allLocations: Array<[number, number, number]> = [];
                tripsWithLoc.forEach((trip) => {
                  trip.trip_locations?.forEach((loc) => {
                    allLocations.push([loc.latitude, loc.longitude, 1]);
                  });
                });
                setHeatmapData(allLocations);
              }
            } else {
              console.log('[RealtimeMap] No active trips found');
              setTrips([]);
            }

            setLastUpdated(new Date());
            setError(null);
            setIsRefreshing(false);
          } catch (err) {
            console.error('[RealtimeMap] Error fetching trips:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch trips');
            setIsRefreshing(false);
          }
        };

        // Initial fetch
        fetchTrips();

        // Poll with optimized interval for device capability
        const capabilities = detectDeviceCapabilities();
        const timings = getOptimizedTimings(capabilities);
        pollIntervalRef.current = setInterval(fetchTrips, timings.mapPollInterval);

        // Setup real-time subscription for instant updates on trips
        console.log('[RealtimeMap] Setting up real-time subscriptions...');
        const tripsChannel = supabase
          .channel('live-trips')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'trips'
            },
            (payload: any) => {
              console.log('[RealtimeMap] ⚡ Trip update received!', {
                eventType: payload.eventType,
                tripId: payload.new?.id || payload.old?.id,
                status: payload.new?.status,
              });
              fetchTrips();
            }
          )
          .subscribe((status) => {
            console.log('[RealtimeMap] Trips subscription status:', status);
          });

        // Setup real-time subscription for trip locations (more important!)
        const locationsChannel = supabase
          .channel('live-locations')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'trip_locations'
            },
            (payload: any) => {
              console.log('[RealtimeMap] ⚡ New location received!', {
                tripId: payload.new?.trip_id,
                lat: payload.new?.latitude,
                lng: payload.new?.longitude,
              });
              // Fetch trips to get updated location data
              fetchTrips();
            }
          )
          .subscribe((status) => {
            console.log('[RealtimeMap] Locations subscription status:', status);
          });

        return () => {
          supabase.removeChannel(tripsChannel);
          supabase.removeChannel(locationsChannel);
        };
      }, 50);
    });

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (timeDisplayRef.current) {
        clearInterval(timeDisplayRef.current);
      }
    };
  }, []);

  // Update time display every second
  useEffect(() => {
    timeDisplayRef.current = setInterval(() => {
      if (lastUpdated) {
        setLastUpdated(new Date(lastUpdated));
      }
    }, 1000);

    return () => {
      if (timeDisplayRef.current) {
        clearInterval(timeDisplayRef.current);
      }
    };
  }, [lastUpdated]);

  // Initialize audio on component mount
  useEffect(() => {
    try {
      audioRef.current = new Audio('/airplane-chime-warning-beeps-jochi-sfx-1-00-03.mp3');
      audioRef.current.volume = 0.7;
      audioRef.current.preload = 'auto';
      console.log('[RealtimeMap] Audio initialized and preloaded');
    } catch (err) {
      console.error('[RealtimeMap] Failed to initialize audio:', err);
    }
  }, []);

  // Play sound notification when new trips are detected
  useEffect(() => {
    if (!soundEnabled || !audioRef.current) {
      console.log('[RealtimeMap] Sound disabled or audio not ready');
      return;
    }

    const previousTripCount = notifiedTripsRef.current.size;
    let newTripCount = 0;

    trips.forEach((trip) => {
      if (!notifiedTripsRef.current.has(trip.id)) {
        console.log('[RealtimeMap] NEW TRIP DETECTED:', trip.id, trip.student.full_name);
        notifiedTripsRef.current.add(trip.id);
        newTripCount++;
        playNotificationSound();
      }
    });

    console.log(`[RealtimeMap] Trip count - Previous: ${previousTripCount}, Current: ${trips.length}, New: ${newTripCount}`);
  }, [trips, soundEnabled]);

  const playNotificationSound = () => {
    try {
      if (!audioRef.current) {
        console.error('[RealtimeMap] Audio not initialized');
        return;
      }
      
      console.log('[RealtimeMap] Playing notification sound...');
      audioRef.current.currentTime = 0;
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[RealtimeMap] Sound played successfully');
          })
          .catch((err) => {
            console.error('[RealtimeMap] Error playing sound:', err.message);
          });
      }
    } catch (err) {
      console.error('[RealtimeMap] Unexpected error playing sound:', err);
    }
  };

  const updateMarkers = (trips: Trip[]) => {
    if (!mapRef.current) {
      console.warn('[RealtimeMap] Map not ready, cannot update markers');
      return;
    }

    console.log(`[RealtimeMap] 🗺️ Updating markers for ${trips.length} trips`);

    const bounds = L.latLngBounds([]);
    const usedTripIds = new Set<string>();
    let markersAdded = 0;

    trips.forEach((trip) => {
      usedTripIds.add(trip.id);

      // Get latest location
      const latestLocation = trip.trip_locations?.[trip.trip_locations.length - 1];
      if (!latestLocation) {
        console.warn(`[RealtimeMap] ⚠️ Trip ${trip.id} (${trip.student.full_name}) has NO locations!`);
        return;
      }

      markersAdded++;
      const lat = latestLocation.latitude;
      const lng = latestLocation.longitude;
      console.log(`[RealtimeMap] ✅ Adding marker for ${trip.student.full_name} at [${lat}, ${lng}]`);
      
      // Calculate speed and ETA
      const currentSpeed = trip.trip_locations.length > 1 
        ? calculateSpeed(trip.trip_locations[trip.trip_locations.length - 2], latestLocation)
        : 0;
      const eta = calculateETA(trip);
      const speedColor = getSpeedColor(currentSpeed);

      // === 1. ADD POLYLINE FOR TRIP ROUTE ===
      if (showRoutes && trip.trip_locations.length > 1) {
        if (polylinesRef.current.has(trip.id)) {
          polylinesRef.current.get(trip.id)?.remove();
        }
        
        const totalDistance = calculateTotalDistance(trip);
        const routePoints = trip.trip_locations.map((loc) => [loc.latitude, loc.longitude] as [number, number]);
        const polyline = L.polyline(routePoints, {
          color: speedColor,
          weight: 4,
          opacity: 0.85,
          dashArray: trip.is_sos ? '5, 5' : '',
          className: trip.is_sos ? 'sos-route' : '',
        })
          .bindPopup(`
            <div class="p-3 rounded-lg text-center" style="background: ${trip.is_sos ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)'}; border: 1px solid ${trip.is_sos ? 'rgba(239, 68, 68, 0.5)' : 'rgba(34, 197, 94, 0.5)'};  font-size: 14px;">
              <div style="font-weight: bold; color: ${trip.is_sos ? '#ef4444' : '#10b981'};">${trip.student.full_name}</div>
              <div style="margin-top: 6px; color: #666;">
                <div>📍 <strong>${totalDistance.toFixed(2)} km</strong></div>
                <div style="font-size: 12px; margin-top: 4px; color: #999;">Traveled Distance</div>
              </div>
            </div>
          `)
          .bindTooltip(`📍 ${totalDistance.toFixed(2)} km traveled`, { permanent: false })
          .addTo(mapRef.current);
        polylinesRef.current.set(trip.id, polyline);
      }

      // === 2. ADD PICKUP MARKER ===
      if (trip.start_location_lat && trip.start_location_lng) {
        const pickupKey = `${trip.id}-pickup`;
        if (pickupMarkersRef.current.has(pickupKey)) {
          pickupMarkersRef.current.get(pickupKey)?.remove();
        }
        
        const pickupIcon = L.divIcon({
          html: `<div class="flex items-center justify-center w-7 h-7 rounded-full bg-blue-500 border-2 border-white shadow-lg"><span class="text-xs">📍</span></div>`,
          iconSize: [28, 28],
          className: 'pickup-marker',
        });
        
        const pickupMarker = L.marker([trip.start_location_lat, trip.start_location_lng], { icon: pickupIcon })
          .bindPopup(`<div class="text-xs font-semibold text-blue-600">Pickup Location<br/>${trip.student.full_name}</div>`)
          .addTo(mapRef.current);
        pickupMarkersRef.current.set(pickupKey, pickupMarker);
      }

      // === 3. ADD DROPOFF MARKER ===
      if (trip.end_location_lat && trip.end_location_lng) {
        const dropoffKey = `${trip.id}-dropoff`;
        if (dropoffMarkersRef.current.has(dropoffKey)) {
          dropoffMarkersRef.current.get(dropoffKey)?.remove();
        }
        
        const dropoffIcon = L.divIcon({
          html: `<div class="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 border-2 border-white shadow-lg"><span class="text-xs">🎯</span></div>`,
          iconSize: [28, 28],
          className: 'dropoff-marker',
        });
        
        const dropoffMarker = L.marker([trip.end_location_lat, trip.end_location_lng], { icon: dropoffIcon })
          .bindPopup(`<div class="text-xs font-semibold text-orange-600">Dropoff Location<br/>ETA: ${eta}min</div>`)
          .addTo(mapRef.current);
        dropoffMarkersRef.current.set(dropoffKey, dropoffMarker);
      }

      // === 4. MAIN DRIVER MARKER WITH SOS HIGHLIGHTING ===
      const customIcon = L.divIcon({
        html: `
          <div class="flex items-center justify-center relative">
            ${trip.is_sos ? `
              <div class="absolute w-10 h-10 rounded-full border-2 border-red-500 opacity-50 animate-pulse"></div>
              <div class="flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-r from-red-500 to-red-600 border-2 border-white shadow-lg shadow-red-500/50">
                <span class="text-sm">⚠️</span>
              </div>
            ` : `
              <div class="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-lime-400 to-green-500 border-2 border-white shadow-lg">
                <span class="text-xs font-bold text-white">🚕</span>
              </div>
            `}
            ${currentSpeed > 60 ? `<div class="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-yellow-400 border border-yellow-600 flex items-center justify-center text-xs">⚡</div>` : ''}
          </div>
        `,
        iconSize: [40, 40],
        className: trip.is_sos ? 'sos-marker animate-bounce' : 'custom-marker',
      });

      // Update or create marker
      if (markersRef.current.has(trip.id)) {
        const marker = markersRef.current.get(trip.id);
        if (marker) {
          const currentLatLng = marker.getLatLng();
          const newLatLng = L.latLng(lat, lng);
          
          if (currentLatLng.lat !== lat || currentLatLng.lng !== lng) {
            const steps = 10;
            let step = 0;
            const startLat = currentLatLng.lat;
            const startLng = currentLatLng.lng;
            
            const animate = () => {
              step++;
              const progress = step / steps;
              const animatedLat = startLat + (lat - startLat) * progress;
              const animatedLng = startLng + (lng - startLng) * progress;
              marker.setLatLng([animatedLat, animatedLng]);
              
              if (step < steps) {
                setTimeout(animate, 50);
              }
            };
            animate();
          }
        }
      } else {
        const popupContent = `
          <div class="p-5 bg-gradient-to-br ${trip.is_sos ? 'from-red-950 via-red-900 to-slate-900' : 'from-green-950 via-green-900 to-slate-900'} text-white rounded-2xl min-w-max shadow-2xl border ${trip.is_sos ? 'border-red-400/40' : 'border-lime-400/40'}" style="max-width: 320px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;">
            ${trip.is_sos ? '<div class="mb-3 px-3 py-2 bg-red-500/30 rounded-lg border border-red-400/50 text-center"><span class="text-sm font-bold text-red-300">🔴 SOS ACTIVE</span></div>' : ''}
            <div class="mb-4 pb-4 border-b ${trip.is_sos ? 'border-red-400/20' : 'border-lime-400/20'}">
              <div class="flex items-start gap-3">
                ${trip.student.photo_url ? `<img src="${trip.student.photo_url}" alt="${trip.student.full_name}" class="w-16 h-16 object-cover rounded-xl border-2 ${trip.is_sos ? 'border-red-400' : 'border-lime-400'} shadow-lg ${trip.is_sos ? 'shadow-red-400/30' : 'shadow-lime-400/30'}">` : `<div class="w-16 h-16 rounded-xl bg-gradient-to-br from-${trip.is_sos ? 'red' : 'lime'}-400 to-${trip.is_sos ? 'red' : 'lime'}-500 flex items-center justify-center text-2xl font-bold shadow-lg shadow-${trip.is_sos ? 'red' : 'lime'}-400/30">👤</div>`}
                <div class="flex-1">
                  <p class="font-bold text-lg bg-gradient-to-r from-${trip.is_sos ? 'red' : 'lime'}-400 to-${trip.is_sos ? 'red' : 'lime'}-400 bg-clip-text text-transparent">${trip.student.full_name}</p>
                  <p class="text-xs text-white/50 mt-1 uppercase tracking-wider">Student ID</p>
                  <p class="text-sm font-semibold text-${trip.is_sos ? 'red' : 'lime'}-300">${trip.student.student_id_number}</p>
                </div>
              </div>
            </div>
            <div class="mb-4 pb-4 border-b ${trip.is_sos ? 'border-red-400/20' : 'border-lime-400/20'}">
              <p class="text-xs font-semibold ${trip.is_sos ? 'text-red-400/70' : 'text-lime-400/70'} uppercase tracking-widest mb-2">🚕 Driver</p>
              <div class="flex items-start gap-3">
                <div class="w-14 h-14 rounded-lg bg-gradient-to-br from-${trip.is_sos ? 'red' : 'green'}-400 to-${trip.is_sos ? 'red' : 'lime'}-400 flex items-center justify-center text-xl font-bold shadow-md">🚗</div>
                <div class="flex-1">
                  <p class="font-semibold text-white text-sm">${trip.driver.full_name}</p>
                  <p class="text-xs text-white/50 mt-0.5">Plate</p>
                  <p class="text-xs font-mono text-${trip.is_sos ? 'red' : 'green'}-300 font-bold">${trip.driver.tricycle_plate_number}</p>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2 mb-4">
              <div class="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p class="text-xs text-white/60">Speed</p>
                <p class="text-sm font-bold" style="color: ${speedColor}">${currentSpeed} km/h</p>
              </div>
              <div class="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p class="text-xs text-white/60">ETA</p>
                <p class="text-sm font-bold ${trip.is_sos ? 'text-red-300' : 'text-lime-300'}">${eta} min</p>
              </div>
              <div class="bg-white/5 rounded-lg p-2 text-center border border-white/10">
                <p class="text-xs text-white/60">Distance</p>
                <p class="text-sm font-bold text-blue-300">${calculateTotalDistance(trip).toFixed(2)} km</p>
              </div>
            </div>
            <div class="flex items-center justify-between bg-gradient-to-r from-${trip.is_sos ? 'red' : 'lime'}-500/30 to-${trip.is_sos ? 'red' : 'green'}-500/30 rounded-lg p-3 border ${trip.is_sos ? 'border-red-400/50' : 'border-lime-400/50'}">
              <span class="text-xs font-semibold text-white/80 uppercase tracking-wider">Status</span>
              <span class="flex items-center gap-1.5">
                <span class="relative flex h-2 w-2">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-${trip.is_sos ? 'red' : 'lime'}-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2 w-2 bg-${trip.is_sos ? 'red' : 'lime'}-400"></span>
                </span>
                <span class="text-xs font-bold text-${trip.is_sos ? 'red' : 'lime'}-300">${trip.is_sos ? 'SOS ALERT' : 'On Trip'}</span>
              </span>
            </div>
          </div>
        `;

        const marker = L.marker([lat, lng], { icon: customIcon })
          .bindPopup(popupContent)
          .bindTooltip(`<div style="background: rgba(${trip.is_sos ? '139, 0, 0' : '5, 150, 105'}, 0.95); color: white; padding: 8px 12px; border-radius: 8px; border: 1px solid rgba(${trip.is_sos ? '255, 99, 71' : '168, 255, 61'}, 0.5); font-weight: 500; font-size: 12px; white-space: nowrap;"><strong>${trip.student.full_name}</strong><br/>🚕 ${trip.driver.full_name}<br/>📍 ${trip.driver.tricycle_plate_number}<br/>⚡ ${currentSpeed} km/h</div>`, { 
            permanent: false, 
            direction: 'top',
            offset: [0, -10],
            className: 'driver-tooltip'
          })
          .addTo(mapRef.current);
        markersRef.current.set(trip.id, marker);
      }

      bounds.extend([lat, lng]);
    });

    markersRef.current.forEach((marker, tripId) => {
      if (!usedTripIds.has(tripId)) {
        mapRef.current?.removeLayer(marker);
        markersRef.current.delete(tripId);
      }
    });

    polylinesRef.current.forEach((polyline, tripId) => {
      if (!usedTripIds.has(tripId)) {
        polyline.remove();
        polylinesRef.current.delete(tripId);
      }
    });

    pickupMarkersRef.current.forEach((marker, key) => {
      const tripId = key.split('-')[0];
      if (!usedTripIds.has(tripId)) {
        marker.remove();
        pickupMarkersRef.current.delete(key);
      }
    });

    dropoffMarkersRef.current.forEach((marker, key) => {
      const tripId = key.split('-')[0];
      if (!usedTripIds.has(tripId)) {
        marker.remove();
        dropoffMarkersRef.current.delete(key);
      }
    });

    if (bounds.isValid() && isFullPage) {
      mapRef.current?.fitBounds(bounds, { padding: [50, 50] });
    }

    console.log(`[RealtimeMap] ✅ Markers updated: ${markersAdded} markers added, ${markersRef.current.size} total on map`);
  };

  return (
    <div className="space-y-4">
      {/* Live status header with controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-green-950/50 to-slate-900/50 rounded-lg border border-lime-400/30 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-400"></span>
            </span>
            <span className="text-sm font-semibold text-lime-400">
              {isRefreshing ? '🔄 Updating...' : '✓ Live • Auto Updating'}
            </span>
          </div>
          {lastUpdated && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">
                Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
              </span>
              <button
                onClick={() => {
                  const fetchTrips = async () => {
                    try {
                      setIsRefreshing(true);
                      console.log('[RealtimeMap] Manual refresh triggered...');
                      const { data, error: queryError } = await supabase
                        .from('trips')
                        .select(`
                          id,
                          start_time,
                          status,
                          start_location_lat,
                          start_location_lng,
                          end_location_lat,
                          end_location_lng,
                          student:students(full_name, student_id_number, photo_url),
                          driver:drivers(full_name, tricycle_plate_number)
                        `)
                        .eq('status', 'active')
                        .order('start_time', { ascending: false });

                      if (queryError) {
                        console.error('[RealtimeMap] Query error:', queryError);
                        setError(`Data load failed: ${queryError.message}`);
                        setIsRefreshing(false);
                        return;
                      }

                      if (data && data.length > 0) {
                        const tripsWithLoc = data.map((trip: any) => {
                          const lat = trip.start_location_lat || 14.5995;
                          const lng = trip.start_location_lng || 120.9842;

                          const tripLocations: TripLocation[] = [];
                          tripLocations.push({
                            latitude: lat,
                            longitude: lng,
                            created_at: trip.start_time,
                            speed: 0
                          });

                          return {
                            ...trip,
                            trip_locations: tripLocations,
                            is_sos: false,
                          } as Trip;
                        });

                        setTrips(tripsWithLoc);
                        if (mapRef.current) {
                          updateMarkers(tripsWithLoc);
                        }
                      } else {
                        setTrips([]);
                      }

                      setLastUpdated(new Date());
                      setError(null);
                      setIsRefreshing(false);
                    } catch (err) {
                      console.error('[RealtimeMap] Error:', err);
                      setError(err instanceof Error ? err.message : 'Failed to fetch trips');
                      setIsRefreshing(false);
                    }
                  };
                  fetchTrips();
                }}
                disabled={isRefreshing}
                className="px-2 py-1 text-xs rounded border border-lime-400/50 bg-lime-500/20 text-lime-300 hover:bg-lime-500/30 disabled:opacity-50 transition"
                title="Refresh now"
              >
                🔄
              </button>
            </div>
          )}
        </div>
        
        {/* Toggle Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowRoutes(!showRoutes)}
            className={`px-2 py-1 text-xs rounded border transition ${
              showRoutes
                ? 'bg-lime-500/30 border-lime-400/50 text-lime-300'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
            title="Toggle trip routes"
          >
            🛣️ Routes
          </button>
          <button
            onClick={() => setShowSafeZones(!showSafeZones)}
            className={`px-2 py-1 text-xs rounded border transition ${
              showSafeZones
                ? 'bg-green-500/30 border-green-400/50 text-green-300'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
            title="Toggle safe zones"
          >
            🛡️ Zones
          </button>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2 py-1 text-xs rounded border transition ${
              showHeatmap
                ? 'bg-orange-500/30 border-orange-400/50 text-orange-300'
                : 'bg-white/5 border-white/10 text-white/50'
            }`}
            title="Toggle heatmap"
          >
            🔥 Heat
          </button>
        </div>
      </div>

      <div className="relative">
        <div
          id="realtime-map-container"
          className={`rounded-xl border border-lime-400/30 overflow-hidden shadow-2xl bg-gradient-to-br from-green-950/80 to-slate-900/80 ${
            isFullPage ? 'h-[calc(100vh-200px)]' : 'h-[600px]'
          }`}
        />
        
        {!mapReady && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-20">
            <div className="text-center">
              <Loader className="h-8 w-8 text-lime-400 animate-spin mx-auto mb-2" />
              <p className="text-white/60 text-sm">Loading map...</p>
            </div>
          </div>
        )}
        
        {error && !mapReady && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-lg z-20">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-white font-semibold">Error Loading Map</p>
              <p className="text-white/60 text-sm mt-1">{error}</p>
              <p className="text-white/40 text-xs mt-2">Refresh the page to try again</p>
            </div>
          </div>
        )}
        
        {mapReady && loading && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <div className="text-center">
              <Loader className="h-6 w-6 text-lime-400 animate-spin mx-auto mb-2" />
              <p className="text-white/60 text-xs">Loading trip data...</p>
            </div>
          </div>
        )}

        {error && mapReady && (
          <div className="absolute top-4 left-4 right-4 bg-red-500/20 border border-red-500/40 rounded-lg p-2 z-10">
            <p className="text-red-300 text-xs">{error}</p>
          </div>
        )}
      </div>

      {trips.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-white/60 uppercase tracking-widest px-2">
            {trips.length} Active Trip{trips.length !== 1 ? 's' : ''} 
            {trips.filter(t => t.is_sos).length > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500/30 border border-red-400/50 rounded text-red-300">
                🔴 {trips.filter(t => t.is_sos).length} SOS
              </span>
            )}
          </p>
          <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
            {trips.map((trip) => {
              const currentSpeed = trip.trip_locations.length > 1 
                ? calculateSpeed(trip.trip_locations[trip.trip_locations.length - 2], trip.trip_locations[trip.trip_locations.length - 1])
                : 0;
              const eta = calculateETA(trip);
              const speedColor = getSpeedColor(currentSpeed);

              return (
                <div
                  key={trip.id}
                  className={`p-3 bg-white/5 border rounded-lg hover:bg-white/10 transition cursor-pointer ${
                    trip.is_sos 
                      ? 'border-red-400/50 bg-red-500/5' 
                      : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">
                          {trip.student.full_name}
                        </p>
                        {trip.is_sos && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-400/50 animate-pulse">
                            <span className="text-xs font-bold text-red-300">🔴 SOS</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/50">
                        ID: {trip.student.student_id_number}
                      </p>
                      <p className="text-xs text-white/60 mt-1">
                        🚕 {trip.driver.full_name}
                      </p>
                      <div className="flex gap-3 mt-2 text-xs">
                        <span style={{ color: speedColor }} className="font-semibold">⚡ {currentSpeed} km/h</span>
                        <span className="text-blue-300">⏱️ {eta}min ETA</span>
                        <span className="text-green-300">📍 {calculateTotalDistance(trip).toFixed(2)}km</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-lime-500/20 border border-lime-500/40">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-lime-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-lime-500"></span>
                      </span>
                      <span className="text-xs font-bold text-lime-300">Live</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mapReady && trips.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-white/60 text-sm">No active student trips at the moment</p>
        </div>
      )}
    </div>
  );
};

export default RealtimeMap;
