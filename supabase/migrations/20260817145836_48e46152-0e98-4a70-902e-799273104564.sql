DO $$
DECLARE c uuid := 'a0000000-0000-0000-0000-000000000001';
        d date;
        m uuid;
BEGIN
  FOREACH d IN ARRAY ARRAY[current_date, current_date + 1] LOOP
    SELECT id INTO m FROM daily_menus WHERE canteen_id=c AND menu_date=d AND meal_type='lunch';
    IF m IS NULL THEN
      INSERT INTO daily_menus (canteen_id, menu_date, meal_type, order_deadline)
      VALUES (c, d, 'lunch', '16:00') RETURNING id INTO m;
    END IF;
    INSERT INTO menu_dishes (menu_id, dish_id)
    SELECT m, x.id FROM (
      SELECT DISTINCT ON (category) id, category FROM dishes
      WHERE canteen_id=c AND category IN ('primo','secondo','contorno','dessert')
      ORDER BY category, name
    ) x
    WHERE NOT EXISTS (SELECT 1 FROM menu_dishes md WHERE md.menu_id=m AND md.dish_id=x.id);
  END LOOP;
END $$;