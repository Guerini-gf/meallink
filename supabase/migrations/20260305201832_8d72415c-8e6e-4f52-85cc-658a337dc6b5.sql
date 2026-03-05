
-- Funzione per eliminare pending_employees non reclamati dopo 90 giorni
CREATE OR REPLACE FUNCTION public.cleanup_old_pending_employees()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  DELETE FROM public.pending_employees
  WHERE claimed_by IS NULL
    AND created_at < now() - interval '90 days';
$$;
