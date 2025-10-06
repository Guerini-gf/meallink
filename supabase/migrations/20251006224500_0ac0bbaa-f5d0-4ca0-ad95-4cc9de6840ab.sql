-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('chef', 'operator', 'customer');

-- Create enum for meal types
CREATE TYPE meal_type AS ENUM ('lunch', 'dinner');

-- Create canteens table
CREATE TABLE canteens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  canteen_id UUID REFERENCES canteens(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  badge_code TEXT UNIQUE,
  role user_role NOT NULL DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create dishes table (dynamic database)
CREATE TABLE dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID REFERENCES canteens(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('primo', 'secondo', 'contorno', 'dessert')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(canteen_id, name, category)
);

-- Create daily menus table
CREATE TABLE daily_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canteen_id UUID NOT NULL REFERENCES canteens(id) ON DELETE CASCADE,
  menu_date DATE NOT NULL,
  meal_type meal_type NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(canteen_id, menu_date, meal_type)
);

-- Create menu dishes (junction table for menu and dishes)
CREATE TABLE menu_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_id UUID REFERENCES daily_menus(id) ON DELETE CASCADE,
  dish_id UUID REFERENCES dishes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(menu_id, dish_id)
);

-- Create meal orders table
CREATE TABLE meal_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_id UUID NOT NULL REFERENCES daily_menus(id) ON DELETE CASCADE,
  selected_dishes UUID[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  served BOOLEAN DEFAULT false,
  served_at TIMESTAMPTZ,
  UNIQUE(user_id, menu_id)
);

-- Enable RLS
ALTER TABLE canteens ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for canteens
CREATE POLICY "Users can view their canteen"
  ON canteens FOR SELECT
  USING (
    id IN (SELECT canteen_id FROM profiles WHERE id = auth.uid())
  );

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- RLS Policies for dishes
CREATE POLICY "Users can view dishes from their canteen"
  ON dishes FOR SELECT
  USING (
    canteen_id IN (SELECT canteen_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Chefs can insert dishes"
  ON dishes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'chef' 
      AND canteen_id = dishes.canteen_id
    )
  );

-- RLS Policies for daily_menus
CREATE POLICY "Users can view menus from their canteen"
  ON daily_menus FOR SELECT
  USING (
    canteen_id IN (SELECT canteen_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Chefs can manage menus"
  ON daily_menus FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'chef' 
      AND canteen_id = daily_menus.canteen_id
    )
  );

-- RLS Policies for menu_dishes
CREATE POLICY "Users can view menu dishes from their canteen"
  ON menu_dishes FOR SELECT
  USING (
    menu_id IN (
      SELECT id FROM daily_menus 
      WHERE canteen_id IN (SELECT canteen_id FROM profiles WHERE id = auth.uid())
    )
  );

CREATE POLICY "Chefs can manage menu dishes"
  ON menu_dishes FOR ALL
  USING (
    menu_id IN (
      SELECT id FROM daily_menus 
      WHERE created_by = auth.uid()
    )
  );

-- RLS Policies for meal_orders
CREATE POLICY "Users can view their own orders"
  ON meal_orders FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own orders"
  ON meal_orders FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own orders"
  ON meal_orders FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Operators can view orders from their canteen"
  ON meal_orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN daily_menus dm ON dm.canteen_id = p.canteen_id
      WHERE p.id = auth.uid() 
      AND p.role IN ('operator', 'chef')
      AND dm.id = meal_orders.menu_id
    )
  );

CREATE POLICY "Operators can update orders"
  ON meal_orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN daily_menus dm ON dm.canteen_id = p.canteen_id
      WHERE p.id = auth.uid() 
      AND p.role IN ('operator', 'chef')
      AND dm.id = meal_orders.menu_id
    )
  );

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Nuovo Utente'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_canteens_updated_at
  BEFORE UPDATE ON canteens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_daily_menus_updated_at
  BEFORE UPDATE ON daily_menus
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meal_orders_updated_at
  BEFORE UPDATE ON meal_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();