-- Add variant column to dishes table for storing variations like "Opzione pesce", "Opzione brodo", etc.
ALTER TABLE public.dishes 
ADD COLUMN IF NOT EXISTS variant text;

-- Add comment to explain the column
COMMENT ON COLUMN public.dishes.variant IS 'Variante del piatto (es: Opzione pesce, Opzione brodo, Burro e salvia)';