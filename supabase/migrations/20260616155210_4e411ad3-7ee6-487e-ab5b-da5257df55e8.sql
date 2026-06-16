
-- 1) Tighten table_reservations INSERT to require user's canteen
DROP POLICY IF EXISTS "Users can create their own reservations" ON public.table_reservations;
CREATE POLICY "Users can create their own reservations"
ON public.table_reservations
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND canteen_id = public.get_user_canteen(auth.uid())
);

-- Also scope SELECT to user's canteen (defence in depth)
DROP POLICY IF EXISTS "Users can view their own reservations" ON public.table_reservations;
CREATE POLICY "Users can view their own reservations"
ON public.table_reservations
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  AND canteen_id = public.get_user_canteen(auth.uid())
);

-- 2) meal_orders DELETE policies
CREATE POLICY "Users can delete their own orders before deadline"
ON public.meal_orders
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND (
    CURRENT_TIME < '16:00:00'::time
    OR public.has_role(auth.uid(), 'chef'::user_role)
    OR public.has_role(auth.uid(), 'operator'::user_role)
  )
);

CREATE POLICY "Staff can delete orders in their canteen"
ON public.meal_orders
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM profiles p
    JOIN daily_menus dm ON dm.canteen_id = p.canteen_id
    WHERE p.id = auth.uid()
      AND (public.has_role(auth.uid(), 'chef'::user_role) OR public.has_role(auth.uid(), 'operator'::user_role))
      AND dm.id = meal_orders.menu_id
  )
);

-- 3) Keep profiles.role in sync with user_roles
CREATE OR REPLACE FUNCTION public.sync_profile_role_from_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE public.profiles SET role = 'customer'::user_role WHERE id = OLD.user_id;
    RETURN OLD;
  ELSE
    UPDATE public.profiles SET role = NEW.role WHERE id = NEW.user_id;
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS user_roles_sync_profile ON public.user_roles;
CREATE TRIGGER user_roles_sync_profile
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_from_user_roles();

CREATE OR REPLACE FUNCTION public.sync_user_roles_from_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    DELETE FROM public.user_roles WHERE user_id = NEW.id;
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, NEW.role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_sync_user_roles ON public.profiles;
CREATE TRIGGER profiles_sync_user_roles
AFTER UPDATE OF role ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.sync_user_roles_from_profile();

-- Backfill: ensure profiles.role matches user_roles where they differ
UPDATE public.profiles p
SET role = ur.role
FROM public.user_roles ur
WHERE ur.user_id = p.id AND p.role IS DISTINCT FROM ur.role;
