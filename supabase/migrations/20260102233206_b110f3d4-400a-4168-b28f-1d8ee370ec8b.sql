-- Fix Pending Employees Public vulnerability
-- Remove overly permissive SELECT policy and replace with secure badge validation

-- Drop the dangerous "Anyone can check badge existence" policy
DROP POLICY IF EXISTS "Anyone can check badge existence" ON public.pending_employees;

-- Create a secure function to validate badge codes during registration
-- This function only returns true/false, not the actual data
CREATE OR REPLACE FUNCTION public.validate_badge_code(_badge_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.pending_employees
    WHERE badge_code = _badge_code
      AND claimed_by IS NULL
  )
$$;

-- Create a secure function to get canteen_id for a valid badge (used during registration)
CREATE OR REPLACE FUNCTION public.get_badge_canteen(_badge_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT canteen_id
  FROM public.pending_employees
  WHERE badge_code = _badge_code
    AND claimed_by IS NULL
  LIMIT 1
$$;

-- Add a restrictive SELECT policy: users can only see pending employees if they're staff
-- This replaces the public access with staff-only access
CREATE POLICY "Staff can view pending employees in their canteen"
ON public.pending_employees
FOR SELECT
USING (
  canteen_id = get_user_canteen(auth.uid()) 
  AND (has_role(auth.uid(), 'chef'::user_role) OR has_role(auth.uid(), 'operator'::user_role))
);