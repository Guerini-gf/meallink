-- Fix infinite recursion in profiles RLS policy
-- Create SECURITY DEFINER function to get user's canteen
CREATE OR REPLACE FUNCTION public.get_user_canteen(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT canteen_id FROM profiles WHERE id = _user_id;
$$;

-- Drop the problematic policy
DROP POLICY IF EXISTS "Staff can view profiles in their canteen" ON profiles;

-- Recreate with function to avoid recursion
CREATE POLICY "Staff can view profiles in their canteen"
ON profiles FOR SELECT
USING (
  canteen_id = get_user_canteen(auth.uid())
  AND (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'chef'))
);

-- Create table reservation system
CREATE TABLE IF NOT EXISTS public.table_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id uuid NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reservation_date date NOT NULL,
  time_slot varchar(20) NOT NULL CHECK (time_slot IN ('12:00-12:30', '12:30-13:00', '13:00-13:30', '13:30-14:00')),
  table_number integer NOT NULL,
  guests integer DEFAULT 1 CHECK (guests >= 1 AND guests <= 4),
  status varchar(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(canteen_id, reservation_date, time_slot, table_number)
);

-- Enable RLS
ALTER TABLE public.table_reservations ENABLE ROW LEVEL SECURITY;

-- RLS policies for table reservations
CREATE POLICY "Users can view their own reservations"
ON table_reservations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create their own reservations"
ON table_reservations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reservations"
ON table_reservations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own reservations"
ON table_reservations FOR DELETE
USING (user_id = auth.uid());

CREATE POLICY "Staff can view all reservations in their canteen"
ON table_reservations FOR SELECT
USING (
  canteen_id = get_user_canteen(auth.uid())
  AND (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'chef'))
);

CREATE POLICY "Staff can manage all reservations in their canteen"
ON table_reservations FOR ALL
USING (
  canteen_id = get_user_canteen(auth.uid())
  AND (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'chef'))
);

-- Canteen settings for table capacity
ALTER TABLE canteens ADD COLUMN IF NOT EXISTS total_tables integer DEFAULT 20;
ALTER TABLE canteens ADD COLUMN IF NOT EXISTS seats_per_table integer DEFAULT 4;