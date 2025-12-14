-- Create table for pre-registered employees
CREATE TABLE public.pending_employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  canteen_id UUID NOT NULL REFERENCES public.canteens(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  badge_code TEXT NOT NULL,
  employee_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(canteen_id, badge_code)
);

-- Enable RLS
ALTER TABLE public.pending_employees ENABLE ROW LEVEL SECURITY;

-- Chefs can manage pending employees in their canteen
CREATE POLICY "Chefs can manage pending employees"
ON public.pending_employees
FOR ALL
USING (
  canteen_id IN (
    SELECT canteen_id FROM profiles 
    WHERE id = auth.uid() AND role = 'chef'::user_role
  )
)
WITH CHECK (
  canteen_id IN (
    SELECT canteen_id FROM profiles 
    WHERE id = auth.uid() AND role = 'chef'::user_role
  )
);

-- Anyone can check if their badge exists (for registration)
CREATE POLICY "Anyone can check badge existence"
ON public.pending_employees
FOR SELECT
USING (true);

-- Add index for faster badge lookups
CREATE INDEX idx_pending_employees_badge ON public.pending_employees(badge_code);
CREATE INDEX idx_pending_employees_canteen ON public.pending_employees(canteen_id);