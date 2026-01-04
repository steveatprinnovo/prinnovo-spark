-- Add RLS policies for admins to INSERT and UPDATE venture office costs
CREATE POLICY "Admins can insert venture office costs"
ON public.venture_office_costs
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update venture office costs"
ON public.venture_office_costs
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));