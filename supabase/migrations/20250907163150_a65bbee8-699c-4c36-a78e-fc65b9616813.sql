-- Drop and recreate the storage policies with proper path-based access control
DROP POLICY "Allow authenticated users to upload approvals" ON storage.objects;
DROP POLICY "Allow authenticated users to view approvals" ON storage.objects;
DROP POLICY "Allow authenticated users to update approvals" ON storage.objects;
DROP POLICY "Allow authenticated users to delete approvals" ON storage.objects;

-- Create new policies for New Company approvals bucket with proper path checking
CREATE POLICY "Allow users to upload to their own folder in approvals" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'New Company approvals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to view their own approvals" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'New Company approvals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to update their own approvals" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'New Company approvals' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Allow users to delete their own approvals" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'New Company approvals' AND auth.uid()::text = (storage.foldername(name))[1]);