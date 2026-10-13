ALTER TABLE public.meal_orders ADD COLUMN IF NOT EXISTS delivery_time time;

CREATE OR REPLACE FUNCTION public.get_delivery_schedule(_date date)
RETURNS TABLE(order_id uuid, full_name text, badge_code text, delivery_time time, is_takeaway boolean, dish_names text[], notes text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT mo.id, p.full_name, p.badge_code, COALESCE(mo.delivery_time, mo.takeaway_time), COALESCE(mo.is_takeaway,false),
    ARRAY(SELECT d.name FROM dishes d WHERE d.id = ANY(mo.selected_dishes) ORDER BY d.category),
    mo.notes
  FROM meal_orders mo
  JOIN daily_menus dm ON dm.id = mo.menu_id
  JOIN profiles p ON p.id = mo.user_id
  WHERE dm.menu_date = _date
    AND dm.canteen_id = get_user_canteen(auth.uid())
    AND (has_role(auth.uid(), 'chef') OR has_role(auth.uid(), 'operator'))
  ORDER BY 4 NULLS LAST, p.full_name;
$$;
REVOKE EXECUTE ON FUNCTION public.get_delivery_schedule(date) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_delivery_schedule(date) TO authenticated;