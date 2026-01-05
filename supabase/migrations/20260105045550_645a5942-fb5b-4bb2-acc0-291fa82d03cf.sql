-- Create travel_photos table for photo gallery
CREATE TABLE public.travel_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  country_id UUID REFERENCES public.countries(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  taken_at DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.travel_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for travel_photos
CREATE POLICY "Users can view their own photos" ON public.travel_photos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own photos" ON public.travel_photos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own photos" ON public.travel_photos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own photos" ON public.travel_photos FOR DELETE USING (auth.uid() = user_id);

-- Create travel_goals table for goals tracking
CREATE TABLE public.travel_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  goal_type TEXT NOT NULL DEFAULT 'countries', -- 'countries', 'continents', 'trips'
  deadline DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.travel_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for travel_goals
CREATE POLICY "Users can view their own goals" ON public.travel_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own goals" ON public.travel_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.travel_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.travel_goals FOR DELETE USING (auth.uid() = user_id);

-- Create user_achievements table for earned badges
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_key TEXT NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_key)
);

-- Enable RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for travel photos
INSERT INTO storage.buckets (id, name, public) VALUES ('travel-photos', 'travel-photos', true);

-- Storage policies for travel photos bucket
CREATE POLICY "Travel photos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'travel-photos');
CREATE POLICY "Users can upload their own travel photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own travel photos" ON storage.objects FOR UPDATE USING (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own travel photos" ON storage.objects FOR DELETE USING (bucket_id = 'travel-photos' AND auth.uid()::text = (storage.foldername(name))[1]);