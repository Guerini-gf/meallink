
-- Tighten profiles INSERT: prevent client-side self-assignment of privileged roles.
-- The handle_new_user() SECURITY DEFINER trigger already validates canteen_code and assigns roles safely.
DROP POLICY IF EXISTS "Users can insert profile with valid canteen code" ON public.profiles;

CREATE POLICY "Users can insert their own customer profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = id
  AND role = 'customer'::user_role
);

-- Tighten profiles UPDATE: prevent users from escalating their own role or moving canteens.
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  AND canteen_id IS NOT DISTINCT FROM (SELECT canteen_id FROM public.profiles WHERE id = auth.uid())
);
