-- Add policy_accepted column to drivers table
ALTER TABLE drivers
ADD COLUMN IF NOT EXISTS policy_accepted BOOLEAN DEFAULT false;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_drivers_policy_accepted ON drivers(policy_accepted);

-- Add comment
COMMENT ON COLUMN drivers.policy_accepted IS 'Whether the driver has accepted the SafeRide Driver Agreement';

-- Allow drivers to update their own policy_accepted field
CREATE POLICY "Drivers can update their own policy_accepted"
ON drivers
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

