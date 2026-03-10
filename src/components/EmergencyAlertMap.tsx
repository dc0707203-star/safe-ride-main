import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader, MapPin, AlertCircle, Navigation, Clock, Phone, User } from 'lucide-react';
import { detectDeviceCapabilities, getOptimizedTimings } from '@/lib/performanceOptimization';

interface EmergencyLocation {
  latitude: number;
  longitude: number;
  created_at: string;
}

interface EmergencyAlert {
  id: string;
  student_id: string;
  student_name: string;
  student_id_number: string;
  contact_number: string;
  photo_url?: string;
  location_lat: number;
  location_lng: number;
  level: string;
  status: string;
  created_at: string;
  driver_name: string;
  message: string;
}

interface EmergencyAlertMapProps {
  alertId: string;
  initialAlert?: {
    student_name?: string;
    photo_url?: string | null;
    contact_number?: string;
    student_id_number?: string;
    level?: string;
  };
  onAlertUpdate?: (alert: EmergencyAlert) => void;
}

const EmergencyAlertMap = ({ alertId, initialAlert, onAlertUpdate }: EmergencyAlertMapProps) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const pulseCircleRef = useRef<L.CircleMarker | null>(null);
  const locationHistoryRef = useRef<L.Polyline | null>(null);
  const initRef = useRef(false);

  const [alert, setAlert] = useState<EmergencyAlert | null>(() => {
    if (initialAlert) {
      return {
        id: alertId,
        student_id: '',
        student_name: initialAlert.student_name || 'Unknown',
        student_id_number: initialAlert.student_id_number || 'N/A',
        contact_number: initialAlert.contact_number || 'N/A',
        photo_url: initialAlert.photo_url || null,
        location_lat: 14.5995,
        location_lng: 120.9842,
        level: initialAlert.level || 'HIGH',
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        driver_name: 'Loading...',
        message: '',
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(!initialAlert);
  const [error, setError] = useState<string | null>(null);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isLive, setIsLive] = useState(true);

  // Get optimized timing for device
  const capabilities = detectDeviceCapabilities();
  const timings = getOptimizedTimings(capabilities);

  // Fetch alert with location data
  const fetchAlert = useCallback(async () => {
    try {
      const { data: alertData, error: alertError } = await supabase
        .from('alerts' as any)
        .select(
          `
          *,
          students(full_name, student_id_number, contact_number, photo_url, id),
          drivers(full_name)
        `
        )
        .eq('id', alertId)
        .single();

      if (alertError) {
        console.error('Alert fetch error:', alertError);
        throw alertError;
      }

      if (!alertData) {
        setError('Alert not found');
        return;
      }

      // Start with alert location
      let finalLocation = {
        lat: alertData.location_lat || 14.5995,
        lng: alertData.location_lng || 120.9842,
      };

      // Try to fetch latest location from trip_locations if student has active trip
      if (alertData.students?.id) {
        try {
          const { data: tripData } = await supabase
            .from('trips')
            .select('*')
            .eq('student_id', alertData.students.id)
            .eq('status', 'active')
            .order('start_time', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (tripData?.id) {
            // Fetch latest location from this trip
            const { data: locationData } = await supabase
              .from('trip_locations')
              .select('latitude, longitude, created_at')
              .eq('trip_id', tripData.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (locationData) {
              finalLocation.lat = locationData.latitude;
              finalLocation.lng = locationData.longitude;
              console.log('Latest location from trip:', locationData);
            }
          }
        } catch (err) {
          console.error('Failed to fetch latest location from trip:', err);
          // Continue with alert location
        }
      }

      const student = alertData.students;
      const mappedAlert = {
        id: alertData.id,
        student_id: alertData.student_id,
        student_name: student?.full_name || alertData.student_name || 'Unknown Student',
        student_id_number: student?.student_id_number || 'N/A',
        contact_number: student?.contact_number || 'N/A',
        photo_url: student?.photo_url || null,
        location_lat: finalLocation.lat,
        location_lng: finalLocation.lng,
        level: alertData.level || 'HIGH',
        status: alertData.status || 'ACTIVE',
        created_at: alertData.created_at || new Date().toISOString(),
        driver_name: alertData.drivers?.full_name || 'Unassigned',
        message: alertData.message || '',
      };

      console.log('Alert data loaded:', mappedAlert);
      setAlert(mappedAlert);
      setLastUpdate(new Date());
      onAlertUpdate?.(mappedAlert);

      // If no photo found in relationship, try fetching directly from students table
      if (!mappedAlert.photo_url && alertData.student_id) {
        const { data: studentData } = await supabase
          .from('students')
          .select('photo_url, full_name, student_id_number, contact_number')
          .eq('id', alertData.student_id)
          .single();

        if (studentData) {
          console.log('Student data fetched separately:', studentData);
          setAlert(prev => prev ? {
            ...prev,
            photo_url: studentData.photo_url || prev.photo_url,
            student_name: studentData.full_name || prev.student_name,
            student_id_number: studentData.student_id_number || prev.student_id_number,
            contact_number: studentData.contact_number || prev.contact_number,
          } : null);
        }
      }
    } catch (err: any) {
      console.error('Fetch alert error:', err);
      setError('Failed to load alert: ' + (err?.message || 'Unknown error'));
    }
  }, [alertId, onAlertUpdate]);

  // Initialize map
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initMap = async () => {
      await fetchAlert();

      // Wait a bit for DOM to be ready
      await new Promise(resolve => setTimeout(resolve, 100));

      const container = document.getElementById('emergency-alert-map-container');
      if (!container) {
        setError('Map container not found');
        setLoading(false);
        return;
      }

      try {
        // Initialize map
        mapRef.current = L.map('emergency-alert-map-container', {
          touchZoom: true,
          scrollWheelZoom: false,
        }).setView([14.5995, 120.9842], 16);

        // Add map tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(mapRef.current);

        setLoading(false);
      } catch (err) {
        console.error('Map init error:', err);
        setError('Failed to initialize map');
        setLoading(false);
      }
    };

    initMap();
  }, [fetchAlert]);

  // Update location
  useEffect(() => {
    if (!mapRef.current || !alert) return;

    const lat = alert.location_lat;
    const lng = alert.location_lng;

    // Remove old marker and pulse
    if (markerRef.current) {
      markerRef.current.remove();
    }
    if (pulseCircleRef.current) {
      pulseCircleRef.current.remove();
    }

    // Make alert level color
    const getLevelColor = () => {
      switch (alert.level?.toLowerCase()) {
        case 'critical':
          return '#ff6b6b';
        case 'high':
          return '#ff9500';
        case 'medium':
          return '#ffd700';
        default:
          return '#ff4444';
      }
    };

    const levelColor = getLevelColor();

    // Create pulsing circle (animated indicator)
    if (isLive) {
      pulseCircleRef.current = L.circleMarker([lat, lng], {
        radius: 20,
        fillColor: levelColor,
        color: levelColor,
        weight: 2,
        opacity: 0.3,
        fillOpacity: 0.1,
        className: 'pulse-circle',
      }).addTo(mapRef.current);

      // Add CSS for pulsing animation if not already added
      if (!document.getElementById('pulse-animation')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation';
        style.innerHTML = `
          .pulse-circle {
            animation: pulse 2s infinite;
          }
          @keyframes pulse {
            0% {
              r: 20px;
              opacity: 0.3;
            }
            100% {
              r: 40px;
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }
    }

    // Create custom marker with student profile
    const markerHtml = `
      <div style="
        width: 70px;
        height: auto;
        background: linear-gradient(135deg, ${levelColor}dd 0%, ${levelColor}aa 100%);
        border-radius: 12px;
        padding: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 20px ${levelColor}66;
        border: 2px solid white;
        text-align: center;
        transform: translateY(-50%);
      ">
        ${alert.photo_url ? `
          <img src="${alert.photo_url}" style="
            width: 50px;
            height: 50px;
            border-radius: 8px;
            border: 2px solid white;
            object-fit: cover;
            margin-bottom: 4px;
          " alt="Student" />
        ` : `
          <div style="
            width: 50px;
            height: 50px;
            background: rgba(255,255,255,0.2);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 4px;
            border: 2px solid white;
            font-size: 24px;
          ">👤</div>
        `}
        <div style="
          font-size: 10px;
          font-weight: bold;
          color: white;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        ">${alert.student_name.split(' ')[0]}</div>
        <div style="
          font-size: 8px;
          color: rgba(255,255,255,0.8);
        ">${alert.level}</div>
      </div>
    `;

    const customIcon = L.divIcon({
      html: markerHtml,
      iconSize: [70, 80],
      iconAnchor: [35, 75],
      popupAnchor: [0, -75],
      className: 'emergency-marker',
    });

    // Create marker
    markerRef.current = L.marker([lat, lng], {
      icon: customIcon,
      title: alert.student_name,
    })
      .bindPopup(createPopupContent(alert), {
        maxWidth: 300,
        className: 'emergency-popup',
      })
      .addTo(mapRef.current);

    // Open popup automatically
    markerRef.current.openPopup();

    // Center map on alert
    mapRef.current.setView([lat, lng], 16);
  }, [alert, isLive]);

  // Poll for location updates
  useEffect(() => {
    if (!alertId || !isLive) return;

    fetchAlert();
    const interval = setInterval(fetchAlert, timings.locationUpdateInterval);

    return () => clearInterval(interval);
  }, [alertId, isLive, timings.locationUpdateInterval, fetchAlert]);

  // Update elapsed time
  useEffect(() => {
    if (!alert) return;

    const timer = setInterval(() => {
      setSecondsElapsed(
        Math.floor((Date.now() - new Date(alert.created_at).getTime()) / 1000)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [alert]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-950 to-slate-950">
        <div className="text-center">
          <Loader className="h-10 w-10 text-red-400 mx-auto mb-3 animate-spin" />
          <p className="text-red-300 font-semibold">Loading emergency alert...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-950 to-slate-950">
        <div className="text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-300 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col relative" style={{ overflow: 'visible' }}>
      {/* Map Container */}
      <div
        id="emergency-alert-map-container"
        className="flex-1 min-h-0"
        style={{ zIndex: 1, overflow: 'visible' }}
      />

      {/* Alert Info Card (Overlay) - Always visible and prominent */}
      {alert && (
        <div
          className="absolute bottom-4 left-4 right-4 max-w-xl bg-gradient-to-br from-white via-slate-50 to-blue-50 backdrop-blur-xl rounded-2xl border border-white/80 shadow-2xl overflow-hidden"
          style={{ zIndex: 100 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-red-600 px-5 py-4 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-400"></span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-white">🚨 ACTIVE EMERGENCY</p>
                <p className="text-xs text-white/90">
                  {secondsElapsed < 60
                    ? `${secondsElapsed}s ago`
                    : `${Math.floor(secondsElapsed / 60)}m ${secondsElapsed % 60}s ago`}
                </p>
              </div>
              <button
                onClick={() => setIsLive(!isLive)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title={isLive ? "Live tracking" : "Paused"}
              >
                {isLive ? (
                  <Navigation className="h-4 w-4 text-white" />
                ) : (
                  <Clock className="h-4 w-4 text-white/80" />
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            {/* Student Info - Large and Prominent */}
            <div className="flex gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100/50">
              <div className="flex-shrink-0">
                {alert.photo_url ? (
                  <img
                    src={alert.photo_url}
                    alt={alert.student_name}
                    className="w-24 h-24 rounded-xl border-3 border-white object-cover shadow-lg shadow-blue-200"
                    onError={(e) => {
                      console.error('Photo load error:', e);
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl border-3 border-white bg-gradient-to-br from-blue-200 to-indigo-200 flex items-center justify-center text-5xl shadow-lg shadow-blue-200">
                    👤
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900 text-lg leading-tight">{alert.student_name}</p>
                <div className="space-y-2 mt-3">
                  <p className="text-sm text-slate-700 flex items-center gap-2 font-medium">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs font-bold">ID</span>
                    <span className="font-mono text-sm text-slate-800">{alert.student_id_number}</span>
                  </p>
                  <p className="text-sm text-slate-700 flex items-center gap-2 font-medium">
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-lg text-xs font-bold">📞</span>
                    <span className="font-mono text-sm text-slate-800">{alert.contact_number}</span>
                  </p>
                  <div className="flex gap-2 mt-2">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-md ${
                      alert.level?.toLowerCase() === 'critical'
                        ? 'bg-gradient-to-r from-red-500 to-red-600'
                        : alert.level?.toLowerCase() === 'high'
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600'
                        : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                    }`}>
                      {alert.level}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert Message */}
            {alert.message && (
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-lg p-3.5">
                <p className="text-xs font-bold text-orange-700 uppercase tracking-wide mb-1">📋 Message</p>
                <p className="text-sm text-slate-800 leading-relaxed">{alert.message}</p>
              </div>
            )}

            {/* Location & Driver */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-3">
                <p className="text-slate-600 font-bold mb-1 text-xs uppercase tracking-wide">📍 Coords</p>
                <p className="text-slate-900 font-mono text-xs font-bold">
                  {alert.location_lat.toFixed(4)}, {alert.location_lng.toFixed(4)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-3">
                <p className="text-slate-600 font-bold mb-1 text-xs uppercase tracking-wide">🚕 Driver</p>
                <p className="text-slate-900 truncate font-bold text-sm">{alert.driver_name}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2.5 pt-2">
              <a
                href={`tel:${alert.contact_number}`}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-500/30 active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <Phone className="h-5 w-5" />
                Call Student
              </a>
              <a
                href={`https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-orange-500/30 active:scale-95 flex items-center justify-center gap-2 text-sm"
              >
                <MapPin className="h-5 w-5" />
                Navigate
              </a>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .emergency-popup .leaflet-popup-content-wrapper {
          background: linear-gradient(135deg, rgba(159, 18, 57, 0.95) 0%, rgba(120, 10, 40, 0.95) 100%);
          border-radius: 12px;
          border: 2px solid #ff4444;
          box-shadow: 0 8px 24px rgba(255, 68, 68, 0.4);
        }
        .emergency-popup .leaflet-popup-content {
          color: white;
          font-size: 12px;
          margin: 0;
        }
        .emergency-popup .leaflet-popup-tip-container .leaflet-popup-tip {
          background: #9f1239;
          border-color: #ff4444;
        }
      `}</style>
    </div>
  );
};

function createPopupContent(alert: EmergencyAlert): string {
  return `
    <div style="min-width: 250px;">
      <div style="display: flex; gap: 12px; margin-bottom: 12px;">
        ${alert.photo_url ? `
          <img src="${alert.photo_url}" style="
            width: 60px;
            height: 60px;
            border-radius: 8px;
            border: 2px solid #ff4444;
            object-fit: cover;
          " alt="Student" />
        ` : `
          <div style="
            width: 60px;
            height: 60px;
            border-radius: 8px;
            border: 2px solid #ff4444;
            background: rgba(255,68,68,0.2);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
          ">👤</div>
        `}
        <div>
          <div style="font-weight: bold; font-size: 14px; color: #fff;">${alert.student_name}</div>
          <div style="font-size: 12px; color: #ffcccc; margin-top: 2px;">
            <strong>Level:</strong> ${alert.level}
          </div>
          <div style="font-size: 11px; color: #ffcccc; margin-top: 2px;">
            ID: ${alert.student_id_number}
          </div>
        </div>
      </div>
      <div style="border-top: 1px solid rgba(255,68,68,0.3); padding-top: 8px; font-size: 11px; color: #ffcccc;">
        <div style="margin-bottom: 4px;"><strong>Contact:</strong> ${alert.contact_number}</div>
        <div style="margin-bottom: 4px;"><strong>Driver:</strong> ${alert.driver_name}</div>
        <div><strong>Coordinates:</strong><br/>${alert.location_lat.toFixed(4)}, ${alert.location_lng.toFixed(4)}</div>
      </div>
    </div>
  `;
}

export default EmergencyAlertMap;
