-- Update handle_new_user function to link pre-registered employees to their canteen
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  pending_rec RECORD;
  v_canteen_id UUID;
BEGIN
  -- Check if this badge is pre-registered
  SELECT canteen_id, employee_number INTO pending_rec
  FROM pending_employees
  WHERE badge_code = COALESCE(NEW.raw_user_meta_data->>'badge_code', '')
    AND claimed_by IS NULL
  LIMIT 1;

  -- Determine canteen_id: from pre-registration, from metadata, or null
  IF pending_rec.canteen_id IS NOT NULL THEN
    v_canteen_id := pending_rec.canteen_id;
  ELSIF NEW.raw_user_meta_data->>'canteen_id' IS NOT NULL THEN
    v_canteen_id := (NEW.raw_user_meta_data->>'canteen_id')::UUID;
  ELSIF NEW.raw_user_meta_data->>'canteen_code' IS NOT NULL THEN
    SELECT id INTO v_canteen_id
    FROM canteens
    WHERE canteen_code = NEW.raw_user_meta_data->>'canteen_code';
  ELSE
    v_canteen_id := NULL;
  END IF;

  -- Insert into profiles
  INSERT INTO profiles (id, full_name, role, badge_code, canteen_id, employee_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nuovo Utente'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'badge_code', 'TEMP_' || NEW.id::text),
    v_canteen_id,
    pending_rec.employee_number
  );
  
  -- Insert into user_roles (separate table for security)
  INSERT INTO user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  
  -- Mark the pending employee as claimed
  IF pending_rec.canteen_id IS NOT NULL THEN
    UPDATE pending_employees
    SET claimed_by = NEW.id, claimed_at = NOW()
    WHERE badge_code = NEW.raw_user_meta_data->>'badge_code'
      AND claimed_by IS NULL;
  END IF;
  
  RETURN NEW;
END;
$$;