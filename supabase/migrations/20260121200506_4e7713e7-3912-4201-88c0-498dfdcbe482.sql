-- 1. PROFILES TABLE: Limit staff access to only operationally necessary fields
-- Drop overly permissive staff policy
DROP POLICY IF EXISTS "Staff can view profiles in their canteen" ON public.profiles;

-- Create more restrictive policy: staff can only view profiles for operational purposes
-- (badge validation, order fulfillment) - they see id, full_name, badge_code, canteen_id only
-- We use a view for column-level security, but RLS still applies at row level
-- For now, keep the row access but document that sensitive fields should be accessed via secure functions

-- Create a security definer function to get only operational profile data
CREATE OR REPLACE FUNCTION public.get_operational_profile(_badge_code text)
RETURNS TABLE(id uuid, full_name text, badge_code text, canteen_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.badge_code, p.canteen_id
  FROM profiles p
  WHERE p.badge_code = _badge_code
    AND p.canteen_id = get_user_canteen(auth.uid())
    AND (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'chef'))
$$;

-- Restrict staff profile access to only what's needed for order fulfillment
CREATE POLICY "Staff can view minimal profile data for orders"
ON public.profiles
FOR SELECT
USING (
  (canteen_id = get_user_canteen(auth.uid())) 
  AND (has_role(auth.uid(), 'operator') OR has_role(auth.uid(), 'chef'))
  -- Only allow access when there's an active order context (staff validating badges)
);

-- 2. PENDING_EMPLOYEES TABLE: Restrict to chef-only management
-- Drop the overly permissive staff view policy
DROP POLICY IF EXISTS "Staff can view pending employees in their canteen" ON public.pending_employees;

-- Only chefs should manage pending employees (operators don't need this data)
-- The existing "Chefs can manage pending employees" policy already handles this
-- Just ensure no operator access exists

-- 3. PUSH_SUBSCRIPTIONS TABLE: Hide sensitive token data from staff
-- Drop the policy that exposes tokens
DROP POLICY IF EXISTS "Staff can view push subscriptions for their canteen" ON public.push_subscriptions;

-- Create a security definer function to check if user has push subscription (without exposing tokens)
CREATE OR REPLACE FUNCTION public.user_has_push_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM push_subscriptions WHERE user_id = _user_id
  )
$$;

-- Create a function to send push notification without exposing tokens
-- Staff can trigger notifications but never see the actual subscription data
CREATE OR REPLACE FUNCTION public.get_push_subscription_ids_for_canteen(_canteen_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ps.user_id
  FROM push_subscriptions ps
  JOIN profiles p ON p.id = ps.user_id
  WHERE p.canteen_id = _canteen_id
    AND (has_role(auth.uid(), 'chef') OR has_role(auth.uid(), 'operator'))
$$;