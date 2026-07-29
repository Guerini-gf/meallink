-- 1) investor_leads: explicit deny-read policy to document intent
DROP POLICY IF EXISTS "No client read access to leads" ON public.investor_leads;
CREATE POLICY "No client read access to leads"
  ON public.investor_leads
  FOR SELECT
  TO anon, authenticated
  USING (false);

-- 2) menu_dishes: scope by canteen instead of creator
DROP POLICY IF EXISTS "Chefs can manage menu dishes" ON public.menu_dishes;
CREATE POLICY "Chefs can manage menu dishes in their canteen"
  ON public.menu_dishes
  FOR ALL
  TO authenticated
  USING (
    menu_id IN (
      SELECT dm.id FROM public.daily_menus dm
      WHERE dm.canteen_id = public.get_user_canteen(auth.uid())
        AND public.has_role(auth.uid(), 'chef'::user_role)
    )
  )
  WITH CHECK (
    menu_id IN (
      SELECT dm.id FROM public.daily_menus dm
      WHERE dm.canteen_id = public.get_user_canteen(auth.uid())
        AND public.has_role(auth.uid(), 'chef'::user_role)
    )
  );

-- 3) pending_employees badge enumeration: block anonymous callers from badge lookup functions
REVOKE EXECUTE ON FUNCTION public.get_badge_canteen(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.validate_badge_code(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_badge_canteen(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.validate_badge_code(text) TO authenticated, service_role;