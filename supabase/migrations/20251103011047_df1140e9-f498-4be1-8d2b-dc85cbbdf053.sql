-- Add takeaway availability and time fields to dishes table
ALTER TABLE public.dishes
ADD COLUMN available_for_takeaway boolean DEFAULT true,
ADD COLUMN takeaway_available_from time without time zone DEFAULT '11:00:00',
ADD COLUMN takeaway_available_until time without time zone DEFAULT '14:00:00';