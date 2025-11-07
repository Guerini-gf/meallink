-- Add canteen_code to canteens table for chef access control
ALTER TABLE canteens ADD COLUMN IF NOT EXISTS canteen_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_canteens_code ON canteens(canteen_code);

-- Add column for push notification tokens
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Create index for push tokens
CREATE INDEX IF NOT EXISTS idx_profiles_push_token ON profiles(push_token);

-- Update RLS policy to allow chef registration with valid canteen code
CREATE POLICY "Users can insert profile with valid canteen code"
ON profiles
FOR INSERT
WITH CHECK (
  auth.uid() = id AND (
    role = 'customer' OR
    (role = 'chef' AND canteen_id IN (
      SELECT id FROM canteens WHERE canteen_code IS NOT NULL
    ))
  )
);