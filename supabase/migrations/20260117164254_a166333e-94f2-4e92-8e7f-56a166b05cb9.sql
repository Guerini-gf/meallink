-- Create table for storing push notification subscriptions
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can manage their own subscriptions
CREATE POLICY "Users can manage their own push subscriptions"
ON public.push_subscriptions
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Staff can read subscriptions for their canteen (to send notifications)
CREATE POLICY "Staff can view push subscriptions for their canteen"
ON public.push_subscriptions
FOR SELECT
USING (
  user_id IN (
    SELECT p2.id FROM profiles p1
    JOIN profiles p2 ON p1.canteen_id = p2.canteen_id
    WHERE p1.id = auth.uid() 
    AND (p1.role = 'chef'::user_role OR p1.role = 'operator'::user_role)
  )
);

-- Create trigger for updated_at using existing function
CREATE TRIGGER update_push_subscriptions_updated_at
BEFORE UPDATE ON public.push_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();