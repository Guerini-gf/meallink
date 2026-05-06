
-- Allow reading the public display "code" column too (only canteen_code stays hidden)
GRANT SELECT (code) ON public.canteens TO authenticated;
