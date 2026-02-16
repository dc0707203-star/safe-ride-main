import { useState, useEffect } from 'react';
import { MapPin, Send, AlertCircle, Loader } from 'lucide-react';
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
      <AlertDialogContent className="bg-white border-2 border-blue-500 max-w-md shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-blue-600 text-center text-2xl flex items-center justify-center gap-2">
            <MapPin className="h-6 w-6" />
            Request Tricycle Ride
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700 text-center text-sm">
            Send a ride request to all available drivers on campus
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {/* Available Drivers Info */}
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">{availableDrivers} drivers available</p>
              <p className="text-xs text-blue-700 mt-1">
                Your request will be sent to all available drivers
              </p>
            </div>
          </div>

          {/* Pickup Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Pickup Location
            </label>
            <input
              type="text"
              value={pickupLocation}
              onChange={(e) => setPickupLocation(e.target.value)}
              placeholder="e.g., Inside Campus, Main Gate, Library"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Additional Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any special requests or details..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              rows={3}
            />
          </div>

          {/* Location Status */}
          <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
            {latitude && longitude ? (
              <p>✓ Your location will be shared: {latitude.toFixed(4)}, {longitude.toFixed(4)}</p>
            ) : (
              <p>⚠ Location not available - drivers will see pickup location only</p>
            )}
          </div>
        </div>

        <AlertDialogFooter className="flex-row gap-3 sm:justify-end mt-4">
          <AlertDialogCancel className="flex-1 m-0 bg-gray-200 border-gray-300 text-gray-800 hover:bg-gray-300 hover:text-gray-900 font-semibold">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex-1 m-0 bg-blue-600 hover:bg-blue-700 text-white border-0 font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Request
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
