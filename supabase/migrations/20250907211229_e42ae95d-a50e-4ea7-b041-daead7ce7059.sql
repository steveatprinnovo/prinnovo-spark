-- Add ready_to_present column to board_approvals table
ALTER TABLE public.board_approvals 
ADD COLUMN ready_to_present boolean NOT NULL DEFAULT false;