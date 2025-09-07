-- Create board_approvals table for storing company data
CREATE TABLE public.board_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_title TEXT NOT NULL,
  logo_storage_path TEXT,
  excel_storage_path TEXT,
  internal_champions TEXT DEFAULT '',
  value_impact_team TEXT DEFAULT '',
  ipa_terms TEXT DEFAULT '',
  referral_incentive TEXT DEFAULT '',
  internal_annual_cost NUMERIC DEFAULT 0,
  one_time_implementation_cost NUMERIC DEFAULT 0,
  annual_subscription_cost NUMERIC DEFAULT 0,
  key_points TEXT DEFAULT '',
  validation TEXT DEFAULT '',
  it_needs_pilot TEXT DEFAULT '',
  post_pilot TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.board_approvals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own board approvals"
ON public.board_approvals
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own board approvals"
ON public.board_approvals
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own board approvals"
ON public.board_approvals
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own board approvals"
ON public.board_approvals
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_board_approvals_updated_at
BEFORE UPDATE ON public.board_approvals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage policies for the existing buckets
CREATE POLICY "Users can view their own company logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'Company Logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'Company Logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'Company Logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'Company Logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own approval documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'New Company approvals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own approval documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'New Company approvals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own approval documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'New Company approvals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own approval documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'New Company approvals' AND auth.uid()::text = (storage.foldername(name))[1]);