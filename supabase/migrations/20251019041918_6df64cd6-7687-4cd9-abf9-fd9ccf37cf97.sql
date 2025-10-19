-- Ensure RLS is enabled and allow authenticated users to read venture office details
ALTER TABLE public.venture_office_detail ENABLE ROW LEVEL SECURITY;

-- Create SELECT policy for authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'venture_office_detail' 
      AND policyname = 'Authenticated can view venture office details'
  ) THEN
    CREATE POLICY "Authenticated can view venture office details"
    ON public.venture_office_detail
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;
END $$;