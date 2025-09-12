-- Create agenda_items table for persistent meeting agenda storage
CREATE TABLE public.agenda_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item TEXT NOT NULL DEFAULT '',
  presenter TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.agenda_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own agenda items" 
ON public.agenda_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own agenda items" 
ON public.agenda_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agenda items" 
ON public.agenda_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agenda items" 
ON public.agenda_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_agenda_items_updated_at
BEFORE UPDATE ON public.agenda_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();