-- Allow authenticated users to update investment fields on Company Detail
-- Existing: SELECT policy already present. We add UPDATE policy.
CREATE POLICY IF NOT EXISTS "Authenticated users can update company details"
ON public."Company Detail"
FOR UPDATE
USING (true)
WITH CHECK (true);
