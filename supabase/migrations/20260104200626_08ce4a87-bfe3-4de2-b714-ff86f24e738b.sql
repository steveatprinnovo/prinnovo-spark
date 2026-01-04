-- Enable RLS on venture_office_costs table (if not already enabled)
ALTER TABLE public.venture_office_costs ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin users to view venture office costs
CREATE POLICY "Admins can view venture office costs" 
ON public.venture_office_costs 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));