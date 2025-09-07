-- Drop existing conflicting policies for storage objects
DROP POLICY IF EXISTS "Authenticated users can upload company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete company logos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view their approvals" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload approvals" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update approvals" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete approvals" ON storage.objects;

-- Create new policies for Company Logos bucket
CREATE POLICY "Allow authenticated users to upload company logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'Company Logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update company logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'Company Logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete company logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'Company Logos' AND auth.uid() IS NOT NULL);

-- Create new policies for New Company approvals bucket  
CREATE POLICY "Allow authenticated users to upload approvals" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'New Company approvals' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view approvals" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'New Company approvals' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update approvals" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'New Company approvals' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete approvals" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'New Company approvals' AND auth.uid() IS NOT NULL);