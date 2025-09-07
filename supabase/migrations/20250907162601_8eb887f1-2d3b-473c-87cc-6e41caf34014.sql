-- Create storage buckets for Board Mode
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('company-logos', 'company-logos', true),
  ('new-company-approvals', 'new-company-approvals', false);

-- Create policies for company logos bucket (public)
CREATE POLICY "Company logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated users can upload company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update company logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete company logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'company-logos' AND auth.uid() IS NOT NULL);

-- Create policies for new company approvals bucket (private)
CREATE POLICY "Authenticated users can view their approvals" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'new-company-approvals' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload approvals" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'new-company-approvals' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update approvals" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'new-company-approvals' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete approvals" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'new-company-approvals' AND auth.uid() IS NOT NULL);