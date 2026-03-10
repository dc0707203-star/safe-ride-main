import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RideRequest {
  id: string;
  student_id: string;
  driver_id: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  pickup_location: string;
  dropoff_location: string | null;
  pickup_lat: number | null;
  pickup_lng: number | null;
  message: string;
  created_at: string;
  accepted_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  rejection_reason: string | null;
  students?: {
    full_name: string;
    student_id_number: string;
    photo_url: string | null;
    contact_number: string | null;
  };
}

interface UseRideRequestsOptions {
  driverId?: string;
  enabled?: boolean;
}

export const useRideRequests = ({ driverId, enabled = true }: UseRideRequestsOptions = {}) => {
  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
  const [acceptedRequests, setAcceptedRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial requests
  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    const fetchRequests = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('[useRideRequests] Fetching ride requests for driver:', driverId);

        // Fetch pending requests
        const { data: pending, error: pendingError } = await supabase
          .from('ride_requests')
          .select(`
            *,
            students(full_name, student_id_number, photo_url, contact_number)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false });

        if (pendingError) {
          console.error('[useRideRequests] Error fetching pending requests:', pendingError);
          throw pendingError;
        }

        console.log('[useRideRequests] Pending requests fetched:', pending?.length || 0);

        // Fetch requests accepted by this driver
        const { data: accepted, error: acceptedError } = await supabase
          .from('ride_requests')
          .select(`
            *,
            students(full_name, student_id_number, photo_url, contact_number)
          `)
          .eq('driver_id', driverId)
          .eq('status', 'accepted')
          .order('accepted_at', { ascending: false });

        if (acceptedError) {
          console.error('[useRideRequests] Error fetching accepted requests:', acceptedError);
          throw acceptedError;
        }

        console.log('[useRideRequests] Accepted requests fetched:', accepted?.length || 0);

        setPendingRequests((pending || []) as RideRequest[]);
        setAcceptedRequests((accepted || []) as RideRequest[]);
      } catch (error: any) {
        console.error('[useRideRequests] Fetch error:', error);
        setError(error.message || 'Failed to fetch ride requests');
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();

    // Subscribe to new requests
    let channel: any = null;
    
    try {
      channel = supabase
        .channel('ride_requests_changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ride_requests',
          },
          async (payload) => {
            const newRequest = payload.new as RideRequest;
            if (newRequest.status === 'pending') {
              // Fetch student data
              const { data: student } = await supabase
                .from('students')
                .select('full_name, student_id_number, photo_url, contact_number')
                .eq('id', newRequest.student_id)
                .single();

              setPendingRequests((prev) => [
                { ...newRequest, students: student },
                ...prev,
              ]);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'ride_requests',
          },
          async (payload) => {
            const updatedRequest = payload.new as RideRequest;

            // Remove from pending if it's resolved
            if (updatedRequest.status !== 'pending') {
              setPendingRequests((prev) =>
                prev.filter((r) => r.id !== updatedRequest.id)
              );
            }

            // Update accepted requests if it's for this driver
            if (updatedRequest.driver_id === driverId) {
              if (updatedRequest.status === 'accepted') {
                // Fetch student data if not already present
                const { data: student } = await supabase
                  .from('students')
                  .select('full_name, student_id_number, photo_url, contact_number')
                  .eq('id', updatedRequest.student_id)
                  .single();

                setAcceptedRequests((prev) => [
                  ...prev.filter((r) => r.id !== updatedRequest.id),
                  { ...updatedRequest, students: student },
                ]);
              } else if (
                updatedRequest.status === 'completed' ||
                updatedRequest.status === 'rejected'
              ) {
                setAcceptedRequests((prev) =>
                  prev.filter((r) => r.id !== updatedRequest.id)
                );
              }
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('✓ Realtime subscriptions ready');
          }
        });
    } catch (error) {
      console.warn('Realtime subscriptions not available (WebSocket may be disabled):', error);
      // Continue without realtime updates - polling will still work
    }

    return () => {
      if (channel) {
        try {
          channel.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing from channel:', error);
        }
      }
    };
  }, [enabled, driverId]);

  // Accept ride request
  const acceptRequest = useCallback(
    async (requestId: string) => {
      try {
        const { error } = await supabase
          .from('ride_requests')
          .update({
            driver_id: driverId,
            status: 'accepted',
            accepted_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (error) throw error;

        return true;
      } catch (error) {
        console.error('Error accepting request:', error);
        return false;
      }
    },
    [driverId]
  );

  // Reject ride request
  const rejectRequest = useCallback(
    async (requestId: string, reason?: string) => {
      try {
        const { error } = await supabase
          .from('ride_requests')
          .update({
            status: 'rejected',
            rejection_reason: reason || 'Driver declined',
          })
          .eq('id', requestId);

        if (error) throw error;

        return true;
      } catch (error) {
        console.error('Error rejecting request:', error);
        return false;
      }
    },
    []
  );

  // Complete ride
  const completeRide = useCallback(
    async (requestId: string) => {
      try {
        const { error } = await supabase
          .from('ride_requests')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', requestId);

        if (error) throw error;

        return true;
      } catch (error) {
        console.error('Error completing ride:', error);
        return false;
      }
    },
    []
  );

  return {
    pendingRequests,
    acceptedRequests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    completeRide,
  };
};
