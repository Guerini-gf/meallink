-- Add new columns to meal_orders table for takeaway, feedback, and notes
ALTER TABLE public.meal_orders
ADD COLUMN IF NOT EXISTS is_takeaway BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS takeaway_time TIME,
ADD COLUMN IF NOT EXISTS feedback TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add order deadline column to daily_menus table
ALTER TABLE public.daily_menus
ADD COLUMN IF NOT EXISTS order_deadline TIME DEFAULT '15:00:00';

-- Update existing records to have default values
UPDATE public.meal_orders
SET is_takeaway = false
WHERE is_takeaway IS NULL;