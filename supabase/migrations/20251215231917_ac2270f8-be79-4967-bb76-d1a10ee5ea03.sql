-- Allow all authenticated users to SELECT from company_detail
CREATE POLICY "Authenticated users can view company details"
ON public.company_detail
FOR SELECT
TO authenticated
USING (true);

-- Allow only admins to INSERT
CREATE POLICY "Admins can insert company details"
ON public.company_detail
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow only admins to UPDATE
CREATE POLICY "Admins can update company details"
ON public.company_detail
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow only admins to DELETE
CREATE POLICY "Admins can delete company details"
ON public.company_detail
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));