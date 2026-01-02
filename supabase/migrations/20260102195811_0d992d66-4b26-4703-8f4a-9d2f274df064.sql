-- Add high priority column to focus_areas table
ALTER TABLE public.focus_areas 
ADD COLUMN is_high_priority boolean NOT NULL DEFAULT false;