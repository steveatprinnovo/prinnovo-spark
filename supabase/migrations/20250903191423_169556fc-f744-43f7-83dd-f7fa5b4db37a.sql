-- Fix security vulnerability: Restrict Company Detail table access to authenticated users only
-- Remove the current overly permissive policy
DROP POLICY IF EXISTS "Enable read access for all users" ON "Company Detail";

-- Create a new secure policy that requires authentication
CREATE POLICY "Authenticated users can view company details" 
ON "Company Detail" 
FOR SELECT 
TO authenticated 
USING (true);

-- Ensure RLS is enabled (should already be enabled but confirming)
ALTER TABLE "Company Detail" ENABLE ROW LEVEL SECURITY;