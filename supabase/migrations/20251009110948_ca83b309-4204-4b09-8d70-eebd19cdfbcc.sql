-- Add employee_number field to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS employee_number text;

-- Add code field to canteens if not exists
ALTER TABLE public.canteens 
ADD COLUMN IF NOT EXISTS code text;

-- Drop old constraint and add new one with 'altro' category
ALTER TABLE public.dishes DROP CONSTRAINT IF EXISTS dishes_category_check;
ALTER TABLE public.dishes 
ADD CONSTRAINT dishes_category_check 
CHECK (category IN ('primo', 'secondo', 'contorno', 'dessert', 'altro'));

-- Insert a test canteen
INSERT INTO public.canteens (id, name, code, address, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'MENSA IVECO',
  '0001',
  'Via Test 1, Torino',
  true
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, code = EXCLUDED.code;

-- Create tomorrow's menu
INSERT INTO public.daily_menus (id, canteen_id, menu_date, meal_type, order_deadline)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  (CURRENT_DATE + INTERVAL '1 day')::date,
  'lunch',
  '15:00:00'
) ON CONFLICT (id) DO UPDATE SET menu_date = EXCLUDED.menu_date;

-- Insert sample dishes
INSERT INTO public.dishes (id, name, category, canteen_id) VALUES
('d0000001-0000-0000-0000-000000000001'::uuid, 'PASTA POMODORO/RAGÙ', 'primo', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000002-0000-0000-0000-000000000001'::uuid, 'PASTA PESTO OLIVE', 'primo', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000003-0000-0000-0000-000000000001'::uuid, 'LASAGNA BOLOGNESE', 'primo', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000004-0000-0000-0000-000000000001'::uuid, 'RISO IN BIANCO', 'primo', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000005-0000-0000-0000-000000000001'::uuid, 'PASTA IN BIANCO', 'primo', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000006-0000-0000-0000-000000000001'::uuid, 'FRITTATA CON SPINACI', 'secondo', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000007-0000-0000-0000-000000000001'::uuid, 'COTOLETTA POLLO', 'secondo', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000008-0000-0000-0000-000000000001'::uuid, 'SALMONE AL FORNO', 'secondo', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000009-0000-0000-0000-000000000001'::uuid, 'PATATE FORNO', 'contorno', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000010-0000-0000-0000-000000000001'::uuid, 'ZUCCHINE AL FORNO', 'contorno', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000011-0000-0000-0000-000000000001'::uuid, 'INSALATA / POMODORO', 'contorno', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000012-0000-0000-0000-000000000001'::uuid, 'FORMAGGI MISTI', 'altro', 'a0000000-0000-0000-0000-000000000001'::uuid),
('d0000013-0000-0000-0000-000000000001'::uuid, 'SALUMI MISTI', 'altro', 'a0000000-0000-0000-0000-000000000001'::uuid)
ON CONFLICT (id) DO NOTHING;

-- Link dishes to tomorrow's menu
INSERT INTO public.menu_dishes (menu_id, dish_id)
SELECT 
  'b0000000-0000-0000-0000-000000000001'::uuid,
  id
FROM public.dishes 
WHERE canteen_id = 'a0000000-0000-0000-0000-000000000001'::uuid
ON CONFLICT DO NOTHING;