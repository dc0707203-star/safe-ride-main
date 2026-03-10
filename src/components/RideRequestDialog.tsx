import { useState, useEffect } from 'react';
import { MapPin, Send, AlertCircle, Loader, Car, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface RideRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
}

export const RideRequestDialog: React.FC<RideRequestDialogProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
}) => {
  const [pickupLocation, setPickupLocation] = useState('Inside Campus');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [availableDrivers, setAvailableDrivers] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
          },
          (error) => {
            console.warn('Could not get location:', error);
          }
        );
      }

      // Check available drivers
      checkAvailableDrivers();
    }
  }, [isOpen]);

  const checkAvailableDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id')
        .eq('is_active', true);

      if (error) throw error;
      setAvailableDrivers(data?.length || 0);
    } catch (error) {
      console.error('Error checking drivers:', error);
    }
  };

  const handleSubmit = async () => {
    if (!pickupLocation.trim()) {
      toast.error('Please enter pickup location');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.from('ride_requests').insert({
        student_id: studentId,
        pickup_location: pickupLocation,
        pickup_lat: latitude,
        pickup_lng: longitude,
        message: message || `Ride request from ${studentName}`,
        status: 'pending',
      });

      if (error) throw error;

      toast.success('Ride request sent!', {
        description: `Available drivers (${availableDrivers}) will be notified`,
      });

      // Reset form
      setPickupLocation('Inside Campus');
      setMessage('');
      onClose();
    } catch (error: any) {
      console.error('Error sending ride request:', error);
      toast.error('Failed to send ride request', {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-emerald-500/30 max-w-md w-[calc(100%-2rem)] mx-auto shadow-2xl shadow-black/80 rounded-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-center text-3xl font-black text-white flex items-center justify-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full shadow-lg shadow-emerald-500/50">
              <MapPin className="h-6 w-6 text-white" />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">Request Ride</span>
          </AlertDialogTitle>
          <AlertDialogDescription className="text-white/80 text-center text-sm font-medium leading-relaxed">
            Send a ride request to all available drivers on campus
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-5 py-4">
          {/* Available Drivers Info */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-green-500/10 border border-emerald-500/40 hover:border-emerald-500/60 transition-all shadow-lg shadow-emerald-500/10">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/30 rounded-lg flex-shrink-0">
                <Car className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-bold text-emerald-300 text-base">{availableDrivers} Drivers Available</p>
                <p className="text-xs text-emerald-200/80 mt-1.5">
                  Your request will be sent to all available drivers
                </p>
              </div>
            </div>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-sm font-bold text-white mb-2.5 uppercase tracking-wide">
              Pickup Location
            </label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g., Inside Campus, Main Gate, Library"
              className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-white/50 font-medium hover:bg-white/10 transition-all backdrop-blur-sm shadow-lg shadow-emerald-500/5"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-bold text-white mb-2.5 uppercase tracking-wide">
              Additional Message <span className="text-emerald-400">(Optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any special requests or details..."
              className="w-full px-4 py-3 border border-white/20 rounded-xl bg-white/5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white placeholder-white/50 font-medium hover:bg-white/10 transition-all resize-none backdrop-blur-sm shadow-lg shadow-emerald-500/5"
              rows={3}
            />
          </div>

          {/* Location Status */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-300 font-medium">
              {latitude && longitude ? (
                <>✓ Location shared: {latitude.toFixed(2)}°, {longitude.toFixed(2)}°</>
              ) : (
                <>⚠ Location not available - drivers will see pickup location only</>
              )}
            </p>
          </div>
        </div>

        <AlertDialogFooter className="flex-row gap-3 sm:justify-center mt-6 flex-wrap">
          <AlertDialogCancel className="flex-1 min-w-[120px] m-0 bg-gradient-to-r from-gray-600 to-gray-700 border-gray-700 text-white hover:from-gray-700 hover:to-gray-800 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 min-w-[120px] m-0 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white border-0 font-bold rounded-xl transition-all shadow-lg hover:shadow-xl hover:shadow-emerald-500/40 disabled:opacity-50 disabled:hover:shadow-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="h-5 w-5 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <Send className="h-5 w-5" />
                <span>Send Request</span>
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
