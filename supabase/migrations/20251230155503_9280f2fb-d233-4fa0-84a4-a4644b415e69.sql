-- Add updated_at column to venture_office_detail
ALTER TABLE public.venture_office_detail 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add updated_at column to company_detail
ALTER TABLE public.company_detail 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger for venture_office_detail updated_at
CREATE TRIGGER update_venture_office_detail_updated_at
BEFORE UPDATE ON public.venture_office_detail
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for company_detail updated_at
CREATE TRIGGER update_company_detail_updated_at
BEFORE UPDATE ON public.company_detail
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();