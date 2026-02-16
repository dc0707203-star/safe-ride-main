import { useEffect } from 'react';
import { MapPin, Phone, User, Clock, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { useRideRequests, type RideRequest } from '@/hooks/useRideRequests';

interface RideRequestsPanelProps {
  driverId: string;
}

export const RideRequestsPanel: React.FC<RideRequestsPanelProps> = ({ driverId }) => {
  const {
    pendingRequests,
    acceptedRequests,
    loading,
    acceptRequest,
    rejectRequest,
    completeRide,
  } = useRideRequests({ driverId, enabled: !!driverId });

  const handleAccept = async (requestId: string) => {
    const success = await acceptRequest(requestId);
    if (success) {
      toast.success('Ride accepted! Navigate to pickup location');
    } else {
      toast.error('Failed to accept ride');
    }
  };

  const handleReject = async (requestId: string) => {
    const success = await rejectRequest(requestId, 'Driver declined');
    if (success) {
      toast.success('Ride declined');
    } else {
      toast.error('Failed to decline ride');
    }
  };

  const handleComplete = async (requestId: string) => {
    const success = await completeRide(requestId);
    if (success) {
      toast.success('Ride completed!');
    } else {
      toast.error('Failed to complete ride');
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">Loading ride requests...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Available Requests ({pendingRequests.length})
            </h2>
          </div>

          <div className="grid gap-4">
            {pendingRequests.map((request) => (
              <RideRequestCard
                key={request.id}
                request={request}
                onAccept={() => handleAccept(request.id)}
                onReject={() => handleReject(request.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Active Rides */}
      {acceptedRequests.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Your Active Rides ({acceptedRequests.length})
            </h2>
          </div>

          <div className="grid gap-4">
            {acceptedRequests.map((request) => (
              <ActiveRideCard
                key={request.id}
                request={request}
                onComplete={() => handleComplete(request.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No Requests */}
      {pendingRequests.length === 0 && acceptedRequests.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">No ride requests at this time</p>
          <p className="text-sm text-gray-500 mt-2">
            You will be notified when students request rides
          </p>
        </div>
      )}
    </div>
  );
};

interface RideRequestCardProps {
  request: RideRequest;
  onAccept: () => void;
  onReject: () => void;
}

const RideRequestCard: React.FC<RideRequestCardProps> = ({
  request,
  onAccept,
  onReject,
}) => {
  return (
    <Card className="bg-white border-2 border-orange-200 hover:border-orange-400 transition-all shadow-md">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Student Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {request.students?.photo_url ? (
              <img
                src={request.students.photo_url}
                alt={request.students.full_name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-orange-600" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">
                {request.students?.full_name || 'Unknown Student'}
              </p>
              <p className="text-sm text-gray-600">
                ID: {request.students?.student_id_number || 'N/A'}
              </p>

              {/* Pickup Location */}
              <div className="flex items-start gap-2 mt-3">
                <MapPin className="h-4 w-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {request.pickup_location}
                  </p>
                  {request.message && (
                    <p className="text-xs text-gray-600 mt-1">{request.message}</p>
                  )}
                </div>
              </div>

              {/* Time Info */}
              <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>

          {/* Contact & Actions */}
          <div className="flex flex-col sm:flex-col gap-2 sm:justify-between sm:min-w-max">
            {request.students?.contact_number && (
              <a
                href={`tel:${request.students.contact_number}`}
                className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-sm transition-colors"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={onReject}
                className="text-xs flex-1 gap-1"
              >
                <X className="h-3 w-3" />
                Decline
              </Button>
              <Button
                size="sm"
                className="flex-1 gap-1 bg-green-600 hover:bg-green-700 text-xs"
                onClick={onAccept}
              >
                <CheckCircle className="h-3 w-3" />
                Accept
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface ActiveRideCardProps {
  request: RideRequest;
  onComplete: () => void;
}

const ActiveRideCard: React.FC<ActiveRideCardProps> = ({ request, onComplete }) => {
  return (
    <Card className="bg-white border-2 border-green-200 hover:border-green-400 transition-all shadow-md">
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Student Info */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {request.students?.photo_url ? (
              <img
                src={request.students.photo_url}
                alt={request.students.full_name}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <User className="h-6 w-6 text-green-600" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-gray-900 truncate">
                  {request.students?.full_name || 'Unknown Student'}
                </p>
                <Badge className="bg-green-100 text-green-800 text-xs">🚗 On Trip</Badge>
              </div>

              <p className="text-sm text-gray-600 mb-3">
                ID: {request.students?.student_id_number || 'N/A'}
              </p>

              {/* Pickup Location */}
              <div className="flex items-start gap-2 mb-2">
                <MapPin className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
                    Pickup Location
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {request.pickup_location}
                  </p>
                </div>
              </div>

              {/* Time Accepted */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                Accepted{' '}
                {request.accepted_at
                  ? formatDistanceToNow(new Date(request.accepted_at), { addSuffix: true })
                  : 'recently'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 sm:justify-center">
            {request.students?.contact_number && (
              <a
                href={`tel:${request.students.contact_number}`}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-sm transition-colors flex-shrink-0"
              >
                <Phone className="h-4 w-4" />
                Call
              </a>
            )}

            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-sm gap-2 flex-shrink-0"
              onClick={onComplete}
            >
              <CheckCircle className="h-4 w-4" />
              Complete Ride
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
