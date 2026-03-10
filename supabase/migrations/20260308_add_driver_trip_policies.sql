-- Add RLS policies for drivers to view and update their trips
-- Allow drivers to view their assigned trips
CREATE POLICY "Drivers can view their assigned trips"
ON public.trips
FOR SELECT
TO authenticated
USING (
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

-- Allow drivers to update their trips (to mark completed)
CREATE POLICY "Drivers can update their assigned trips"
ON public.trips
FOR UPDATE
TO authenticated
USING (
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  driver_id IN (
    SELECT id FROM drivers WHERE user_id = auth.uid()
  )
);

-- Grant necessary permissions to authenticated users
GRANT SELECT ON public.trips TO authenticated;
GRANT UPDATE (status, end_time, end_location_lat, end_location_lng) ON public.trips TO authenticated;
