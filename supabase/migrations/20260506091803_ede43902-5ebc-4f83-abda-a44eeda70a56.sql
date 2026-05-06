
-- 1) Hide sensitive canteen code columns from end-users (column-level privileges)
REVOKE SELECT ON public.canteens FROM anon, authenticated;
GRANT SELECT (id, name, address, is_active, seats_per_table, total_tables, created_at, updated_at)
  ON public.canteens TO authenticated;

-- Provide a safe RPC for chefs/operators to retrieve their own canteen codes when needed
CREATE OR REPLACE FUNCTION public.get_my_canteen_codes()
RETURNS TABLE(canteen_code text, code text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.canteen_code, c.code
  FROM canteens c
  WHERE c.id = get_user_canteen(auth.uid())
    AND (has_role(auth.uid(), 'chef') OR has_role(auth.uid(), 'operator'));
$$;
REVOKE ALL ON FUNCTION public.get_my_canteen_codes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_canteen_codes() TO authenticated;

-- Helper for signup: validate a canteen code without exposing the table
CREATE OR REPLACE FUNCTION public.canteen_code_exists(_canteen_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM canteens WHERE canteen_code = _canteen_code
  );
$$;
REVOKE ALL ON FUNCTION public.canteen_code_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.canteen_code_exists(text) TO anon, authenticated;

-- 2) Lock down SECURITY DEFINER functions: revoke from anon/PUBLIC.
-- Keep EXECUTE for authenticated only on functions actually used by the client/RLS.

-- Used by RLS for authenticated users -> keep authenticated, drop anon/public
REVOKE ALL ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_canteen(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_canteen(uuid) TO authenticated;

-- Called via RPC from staff scanner UI (authenticated)
REVOKE ALL ON FUNCTION public.get_operational_profile(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_operational_profile(text) TO authenticated;

-- Internal-only functions: revoke from everyone (run by triggers / pg_cron / service role)
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_old_pending_employees() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_badge_code(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_badge_canteen(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.user_has_push_subscription(uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_push_subscription_ids_for_canteen(uuid) FROM PUBLIC, anon, authenticated;

-- 3) Tighten public investor_leads insert policy (no more WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.investor_leads;

CREATE POLICY "Anyone can submit a lead"
ON public.investor_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (
  full_name IS NOT NULL
  AND length(btrim(full_name)) BETWEEN 2 AND 100
  AND email IS NOT NULL
  AND length(email) BETWEEN 5 AND 255
  AND email LIKE '%_@_%.__%'
  AND (company IS NULL OR length(company) <= 200)
  AND (phone IS NULL OR length(phone) <= 30)
  AND (message IS NULL OR length(message) <= 2000)
);
