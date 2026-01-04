-- Create table for venture office budget data
CREATE TABLE public.venture_office_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    venture_office VARCHAR(255) NOT NULL,
    year_number INTEGER NOT NULL CHECK (year_number > 0),
    services_budget NUMERIC(15,2) DEFAULT 0,
    operating_costs_budget NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(venture_office, year_number)
);

-- Enable RLS
ALTER TABLE public.venture_office_budgets ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to read
CREATE POLICY "Authenticated users can read budgets"
ON public.venture_office_budgets
FOR SELECT
TO authenticated
USING (true);

-- Create policy for admins to manage budgets
CREATE POLICY "Admins can insert budgets"
ON public.venture_office_budgets
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update budgets"
ON public.venture_office_budgets
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete budgets"
ON public.venture_office_budgets
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_venture_office_budgets_updated_at
BEFORE UPDATE ON public.venture_office_budgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();