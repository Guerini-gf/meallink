
-- 1) Investor leads: remove broad chef read access (PII protection)
DROP POLICY IF EXISTS "Chefs can view leads" ON public.investor_leads;

-- 2) Canteens: hide secret canteen_code column from anon/authenticated.
--    Customers and staff can still read all other columns. Staff retrieve
--    canteen_code via the existing SECURITY DEFINER RPC get_my_canteen_codes().
REVOKE SELECT ON public.canteens FROM anon, authenticated;
GRANT SELECT (id, name, address, is_active, total_tables, seats_per_table, code, created_at, updated_at)
  ON public.canteens TO authenticated;
GRANT SELECT (id, name, address, is_active, total_tables, seats_per_table, code, created_at, updated_at)
  ON public.canteens TO anon;
GRANT ALL ON public.canteens TO service_role;

-- 3) Tighten EXECUTE on SECURITY DEFINER helpers.
--    Keep only what the public/signup flows truly need callable.

-- Internal-only (used by RLS / triggers / cron) — revoke from clients
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.user_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_canteen(uuid)          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_pending_employees() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at()             FROM PUBLIC, anon, authenticated;

-- Authenticated-only (already enforce role/ownership inside) — revoke anon
REVOKE EXECUTE ON FUNCTION public.user_has_push_subscription(uuid)            FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_push_subscription_ids_for_canteen(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_operational_profile(text)               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_my_canteen_codes()                      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_badge_canteen(text)                     FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.user_has_push_subscription(uuid)            TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_push_subscription_ids_for_canteen(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_operational_profile(text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_canteen_codes()                      TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_badge_canteen(text)                     TO authenticated;

-- Signup flow validators — must remain callable by anon
GRANT EXECUTE ON FUNCTION public.canteen_code_exists(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_badge_code(text) TO anon, authenticated;
