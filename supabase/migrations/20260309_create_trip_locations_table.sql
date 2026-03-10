-- Create trip_locations table for real-time location tracking
CREATE TABLE public.trip_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  speed numeric DEFAULT 0,
  accuracy numeric,
  heading numeric,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for faster queries
CREATE INDEX idx_trip_locations_trip_id ON public.trip_locations(trip_id);
CREATE INDEX idx_trip_locations_student_id ON public.trip_locations(student_id);
CREATE INDEX idx_trip_locations_created_at ON public.trip_locations(created_at DESC);

-- Enable RLS
ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

-- Admins can view all trip locations
CREATE POLICY "Admins can view all trip locations"
ON public.trip_locations FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Students can view their own trip locations
CREATE POLICY "Students can view their own trip locations"
ON public.trip_locations FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = trip_locations.student_id AND students.user_id = auth.uid()
  )
);

-- Students can insert their own trip locations
CREATE POLICY "Students can insert their own trip locations"
ON public.trip_locations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.students 
    WHERE students.id = trip_locations.student_id AND students.user_id = auth.uid()
  )
);

-- Drivers can insert trip locations for their trips
CREATE POLICY "Drivers can insert trip locations"
ON public.trip_locations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.trips
    WHERE trips.id = trip_locations.trip_id
    AND trips.driver_id IN (
      SELECT id FROM public.drivers WHERE user_id = auth.uid()
    )
  )
);

-- Grant permissions
GRANT SELECT, INSERT ON public.trip_locations TO authenticated;
