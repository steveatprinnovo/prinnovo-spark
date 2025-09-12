-- Create a table for status notes
CREATE TABLE public.status_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  status_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_name)
);

-- Enable Row Level Security
ALTER TABLE public.status_notes ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own status notes" 
ON public.status_notes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own status notes" 
ON public.status_notes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own status notes" 
ON public.status_notes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own status notes" 
ON public.status_notes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_status_notes_updated_at
BEFORE UPDATE ON public.status_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();