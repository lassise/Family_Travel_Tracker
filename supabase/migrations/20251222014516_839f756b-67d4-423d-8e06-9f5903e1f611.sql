-- Create a table for country wishlist
CREATE TABLE public.country_wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(country_id)
);

-- Enable Row Level Security
ALTER TABLE public.country_wishlist ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Public can view wishlist" 
ON public.country_wishlist 
FOR SELECT 
USING (true);

CREATE POLICY "Public can insert wishlist" 
ON public.country_wishlist 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can delete wishlist" 
ON public.country_wishlist 
FOR DELETE 
USING (true);