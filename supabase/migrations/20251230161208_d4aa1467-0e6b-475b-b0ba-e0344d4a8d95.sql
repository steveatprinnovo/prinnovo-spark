-- Create RLS policies for Company Logos bucket to allow admin uploads

-- Allow authenticated users to view/download company logos
CREATE POLICY "Authenticated users can view company logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'Company Logos');

-- Allow admins to upload company logos
CREATE POLICY "Admins can upload company logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'Company Logos' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to update/overwrite company logos
CREATE POLICY "Admins can update company logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'Company Logos' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Allow admins to delete company logos
CREATE POLICY "Admins can delete company logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'Company Logos' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);