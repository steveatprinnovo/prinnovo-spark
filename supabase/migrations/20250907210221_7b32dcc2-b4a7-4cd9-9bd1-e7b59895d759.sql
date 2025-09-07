-- Rename the internal_annual_cost column to first_year_cost in board_approvals table
ALTER TABLE public.board_approvals 
RENAME COLUMN internal_annual_cost TO first_year_cost;