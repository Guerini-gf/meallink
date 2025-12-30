-- Fix Role Self-Assignment vulnerability by adding server-side validation
-- Only 'customer' role is allowed by default
-- 'chef' role requires valid canteen_code verification
-- 'operator' role cannot be self-assigned during signup

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  pending_rec RECORD;
  v_canteen_id UUID;
  v_requested_role user_role;
  v_final_role user_role;
  v_canteen_code TEXT;
BEGIN
  -- Get the requested role from metadata (default to 'customer')
  v_requested_role := COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer');
  v_canteen_code := NEW.raw_user_meta_data->>'canteen_code';
  
  -- SECURITY: Validate role assignment to prevent privilege escalation
  -- 'operator' role can NEVER be self-assigned during signup
  IF v_requested_role = 'operator' THEN
    v_final_role := 'customer';
  -- 'chef' role requires valid canteen_code
  ELSIF v_requested_role = 'chef' THEN
    IF v_canteen_code IS NOT NULL THEN
      -- Verify canteen_code exists
      SELECT id INTO v_canteen_id
      FROM canteens
      WHERE canteen_code = v_canteen_code;
      
      IF v_canteen_id IS NOT NULL THEN
        v_final_role := 'chef';
      ELSE
        -- Invalid canteen_code, downgrade to customer
        v_final_role := 'customer';
        v_canteen_id := NULL;
      END IF;
    ELSE
      -- No canteen_code provided, downgrade to customer
      v_final_role := 'customer';
    END IF;
  ELSE
    -- Default: customer role (safe)
    v_final_role := 'customer';
  END IF;

  -- Check if this badge is pre-registered
  SELECT canteen_id, employee_number INTO pending_rec
  FROM pending_employees
  WHERE badge_code = COALESCE(NEW.raw_user_meta_data->>'badge_code', '')
    AND claimed_by IS NULL
  LIMIT 1;

  -- Determine canteen_id: from chef validation, pre-registration, or metadata
  IF v_final_role = 'chef' AND v_canteen_id IS NOT NULL THEN
    -- Already set from chef validation above
    NULL;
  ELSIF pending_rec.canteen_id IS NOT NULL THEN
    v_canteen_id := pending_rec.canteen_id;
  ELSIF NEW.raw_user_meta_data->>'canteen_id' IS NOT NULL THEN
    v_canteen_id := (NEW.raw_user_meta_data->>'canteen_id')::UUID;
  ELSE
    v_canteen_id := NULL;
  END IF;

  -- Insert into profiles with VALIDATED role
  INSERT INTO profiles (id, full_name, role, badge_code, canteen_id, employee_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nuovo Utente'),
    v_final_role,  -- Use validated role, NOT the raw metadata
    COALESCE(NEW.raw_user_meta_data->>'badge_code', 'TEMP_' || NEW.id::text),
    v_canteen_id,
    pending_rec.employee_number
  );
  
  -- Insert into user_roles with VALIDATED role
  INSERT INTO user_roles (user_id, role)
  VALUES (
    NEW.id,
    v_final_role  -- Use validated role, NOT the raw metadata
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
$function$;