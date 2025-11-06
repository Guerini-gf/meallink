-- 1. Create user_roles table using existing user_role enum
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role user_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Create security definer function to check roles (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 3. Migrate existing roles from profiles to user_roles table
INSERT INTO public.user_roles (user_id, role)
SELECT id, role FROM public.profiles
ON CONFLICT (user_id, role) DO NOTHING;

-- 4. Add UNIQUE constraint to badge_code (prevent duplicate badges)
ALTER TABLE public.profiles ADD CONSTRAINT unique_badge_code UNIQUE (badge_code);

-- 5. Make badge_code NOT NULL for customers (required for order station)
-- First update any existing NULL values to temporary unique values
UPDATE public.profiles SET badge_code = 'TEMP_' || id::text WHERE badge_code IS NULL OR badge_code = '';
ALTER TABLE public.profiles ALTER COLUMN badge_code SET NOT NULL;

-- 6. Add DELETE policy for dishes (only chefs from same canteen)
CREATE POLICY "Chefs can delete dishes from their canteen"
ON public.dishes
FOR DELETE
USING (
  canteen_id IN (
    SELECT canteen_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND public.has_role(auth.uid(), 'chef')
  )
);

-- 7. Add UPDATE policy for dishes (chefs can update their canteen's dishes)
CREATE POLICY "Chefs can update dishes from their canteen"
ON public.dishes
FOR UPDATE
USING (
  canteen_id IN (
    SELECT canteen_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND public.has_role(auth.uid(), 'chef')
  )
);

-- 8. Allow operators/chefs to view profiles in their canteen (in addition to own profile)
CREATE POLICY "Staff can view profiles in their canteen"
ON public.profiles
FOR SELECT
USING (
  canteen_id IN (
    SELECT canteen_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND (public.has_role(auth.uid(), 'operator') OR public.has_role(auth.uid(), 'chef'))
  )
);

-- 9. Enforce order deadline (16:00) server-side - INSERT
CREATE POLICY "Orders only before 16:00 deadline"
ON public.meal_orders
FOR INSERT
WITH CHECK (
  CURRENT_TIME < '16:00:00'::time
  OR public.has_role(auth.uid(), 'chef')
  OR public.has_role(auth.uid(), 'operator')
);

-- 10. Enforce order deadline (16:00) server-side - UPDATE  
CREATE POLICY "Updates only before 16:00 deadline"
ON public.meal_orders
FOR UPDATE
USING (
  CURRENT_TIME < '16:00:00'::time
  OR public.has_role(auth.uid(), 'chef')
  OR public.has_role(auth.uid(), 'operator')
);

-- 11. Update handle_new_user function to create user_role entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO profiles (id, full_name, role, badge_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nuovo Utente'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'badge_code', 'TEMP_' || NEW.id::text)
  );
  
  -- Insert into user_roles (separate table for security)
  INSERT INTO user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  
  RETURN NEW;
END;
$$;