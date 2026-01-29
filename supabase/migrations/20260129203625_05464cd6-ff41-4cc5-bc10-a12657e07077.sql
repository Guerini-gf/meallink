-- Rimuovi la policy che espone TUTTI i dati del profilo allo staff
DROP POLICY IF EXISTS "Staff can view minimal profile data for orders" ON public.profiles;

-- Gli staff (chef/operator) devono usare SOLO la funzione get_operational_profile() 
-- per vedere i dati degli altri dipendenti. Non hanno più accesso diretto alla tabella profiles.

-- I customer (dipendenti) possono vedere SOLO il proprio profilo
-- La policy "Users can view own profile" già esiste e copre questo caso