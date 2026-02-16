-- Create ride_requests table for Tricycle Grab feature
-- Allows students to request rides when no driver is available on campus

CREATE TYPE ride_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled', 'completed');

CREATE TABLE public.ride_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  driver_id uuid REFERENCES public.drivers(id) ON DELETE SET NULL,
  status ride_request_status DEFAULT 'pending',
  pickup_location text NOT NULL,
  dropoff_location text,
  pickup_lat numeric,
  pickup_lng numeric,
  dropoff_lat numeric,
  dropoff_lng numeric,
  message text,
  created_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  rejection_reason text
);

-- Enable Row-Level Security
ALTER TABLE public.ride_requests ENABLE ROW LEVEL SECURITY;

-- Students can view their own ride requests
CREATE POLICY "Students can view their own ride requests"
ON public.ride_requests FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM students WHERE id = ride_requests.student_id
  )
);

-- Students can create ride requests
CREATE POLICY "Students can create ride requests"
ON public.ride_requests FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM students WHERE id = ride_requests.student_id
  )
);

-- Students can cancel their own pending requests
CREATE POLICY "Students can cancel their own requests"
ON public.ride_requests FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM students WHERE id = ride_requests.student_id
  )
  AND status = 'pending'
)
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM students WHERE id = ride_requests.student_id
  )
);

-- Drivers can view all pending/accepted ride requests
CREATE POLICY "Drivers can view ride requests"
ON public.ride_requests FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'driver'
  )
);

-- Drivers can accept/reject ride requests
CREATE POLICY "Drivers can accept ride requests"
ON public.ride_requests FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role = 'driver'
  )
  AND status = 'pending'
);

-- Drivers can mark requests as completed
CREATE POLICY "Drivers can mark requests completed"
ON public.ride_requests FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT user_id FROM drivers WHERE id = ride_requests.driver_id
  )
);

-- Admins can view all ride requests
CREATE POLICY "Admins can view all ride requests"
ON public.ride_requests FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Create index for faster queries
CREATE INDEX idx_ride_requests_student_id ON public.ride_requests(student_id);
CREATE INDEX idx_ride_requests_driver_id ON public.ride_requests(driver_id);
CREATE INDEX idx_ride_requests_status ON public.ride_requests(status);
CREATE INDEX idx_ride_requests_created_at ON public.ride_requests(created_at DESC);

-- Enable realtime for ride requests
ALTER TABLE public.ride_requests REPLICA IDENTITY FULL;
