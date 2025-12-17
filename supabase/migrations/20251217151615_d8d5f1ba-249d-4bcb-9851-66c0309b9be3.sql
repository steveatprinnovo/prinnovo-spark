-- Add deal_id column to status_notes table
ALTER TABLE public.status_notes 
ADD COLUMN deal_id bigint;

-- Drop the existing unique constraint on user_id,company_name
ALTER TABLE public.status_notes 
DROP CONSTRAINT IF EXISTS status_notes_user_id_company_name_key;

-- Add a new unique constraint on user_id,deal_id
ALTER TABLE public.status_notes 
ADD CONSTRAINT status_notes_user_id_deal_id_key UNIQUE (user_id, deal_id);