-- Add RLS policies for allergens table to allow only chefs to manage allergens

-- Chefs can insert new allergens
CREATE POLICY "Chefs can insert allergens"
ON public.allergens
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'chef'::user_role));

-- Chefs can update allergens
CREATE POLICY "Chefs can update allergens"
ON public.allergens
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'chef'::user_role));

-- Chefs can delete allergens
CREATE POLICY "Chefs can delete allergens"
ON public.allergens
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'chef'::user_role));