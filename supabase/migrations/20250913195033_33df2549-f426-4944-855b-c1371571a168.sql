-- Add UPDATE policy for Company Detail if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies p
    WHERE p.schemaname = 'public'
      AND p.tablename = 'Company Detail'
      AND p.policyname = 'Authenticated users can update company details'
  ) THEN
    CREATE POLICY "Authenticated users can update company details"
    ON public."Company Detail"
    FOR UPDATE
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;