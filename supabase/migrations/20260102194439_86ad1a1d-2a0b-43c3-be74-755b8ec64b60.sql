-- Create focus_areas table for venture office focus areas
CREATE TABLE public.focus_areas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venture_office text NOT NULL,
  focus_area_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create focus_area_companies table for example companies within each focus area
CREATE TABLE public.focus_area_companies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  focus_area_id uuid NOT NULL REFERENCES public.focus_areas(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  website_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.focus_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_area_companies ENABLE ROW LEVEL SECURITY;

-- RLS policies for focus_areas (admins can manage, authenticated users can view)
CREATE POLICY "Admins can insert focus areas"
ON public.focus_areas
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update focus areas"
ON public.focus_areas
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete focus areas"
ON public.focus_areas
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view focus areas"
ON public.focus_areas
FOR SELECT
USING (true);

-- RLS policies for focus_area_companies (admins can manage, authenticated users can view)
CREATE POLICY "Admins can insert focus area companies"
ON public.focus_area_companies
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update focus area companies"
ON public.focus_area_companies
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete focus area companies"
ON public.focus_area_companies
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can view focus area companies"
ON public.focus_area_companies
FOR SELECT
USING (true);

-- Create trigger for updated_at on focus_areas
CREATE TRIGGER update_focus_areas_updated_at
BEFORE UPDATE ON public.focus_areas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();