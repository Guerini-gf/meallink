-- Create allergens table
CREATE TABLE public.allergens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  icon text,
  created_at timestamp with time zone DEFAULT now()
);

-- Insert common allergens
INSERT INTO public.allergens (name, icon) VALUES
  ('Glutine', '🌾'),
  ('Crostacei', '🦐'),
  ('Uova', '🥚'),
  ('Pesce', '🐟'),
  ('Arachidi', '🥜'),
  ('Soia', '🫘'),
  ('Latte', '🥛'),
  ('Frutta a guscio', '🌰'),
  ('Sedano', '🥬'),
  ('Senape', '🟡'),
  ('Sesamo', '⚪'),
  ('Solfiti', '🍷'),
  ('Lupini', '🫘'),
  ('Molluschi', '🦪');

-- Create dish_allergens junction table
CREATE TABLE public.dish_allergens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dish_id uuid REFERENCES public.dishes(id) ON DELETE CASCADE,
  allergen_id uuid REFERENCES public.allergens(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(dish_id, allergen_id)
);

-- Create user_allergens junction table
CREATE TABLE public.user_allergens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  allergen_id uuid REFERENCES public.allergens(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, allergen_id)
);

-- Enable RLS
ALTER TABLE public.allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dish_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allergens ENABLE ROW LEVEL SECURITY;

-- RLS Policies for allergens (readable by all authenticated users)
CREATE POLICY "Everyone can view allergens"
  ON public.allergens
  FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for dish_allergens
CREATE POLICY "Users can view dish allergens from their canteen"
  ON public.dish_allergens
  FOR SELECT
  TO authenticated
  USING (
    dish_id IN (
      SELECT id FROM public.dishes
      WHERE canteen_id IN (
        SELECT canteen_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Chefs can manage dish allergens"
  ON public.dish_allergens
  FOR ALL
  TO authenticated
  USING (
    dish_id IN (
      SELECT id FROM public.dishes
      WHERE canteen_id IN (
        SELECT canteen_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'chef'
      )
    )
  )
  WITH CHECK (
    dish_id IN (
      SELECT id FROM public.dishes
      WHERE canteen_id IN (
        SELECT canteen_id FROM public.profiles
        WHERE id = auth.uid() AND role = 'chef'
      )
    )
  );

-- RLS Policies for user_allergens
CREATE POLICY "Users can view their own allergens"
  ON public.user_allergens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own allergens"
  ON public.user_allergens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());