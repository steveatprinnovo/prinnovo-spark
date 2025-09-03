-- Enable public read access to Company Detail table for dashboard
CREATE POLICY "Enable read access for all users" ON "Company Detail"
FOR SELECT USING (true);

-- Create storage policies for Company Logos bucket
CREATE POLICY "Public can view company logos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'Company Logos');

-- Allow authenticated users to upload company logos (for admin purposes)
CREATE POLICY "Authenticated users can upload company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'Company Logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to update company logos
CREATE POLICY "Authenticated users can update company logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'Company Logos' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete company logos
CREATE POLICY "Authenticated users can delete company logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'Company Logos' AND auth.role() = 'authenticated');