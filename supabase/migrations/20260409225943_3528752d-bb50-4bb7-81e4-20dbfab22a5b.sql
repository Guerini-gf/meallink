
CREATE TABLE public.investor_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.investor_leads ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous) to insert leads from the public landing page
CREATE POLICY "Anyone can submit a lead"
ON public.investor_leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only chefs can view leads
CREATE POLICY "Chefs can view leads"
ON public.investor_leads
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'chef'::user_role));
