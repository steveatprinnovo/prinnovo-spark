-- Add email column to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN email TEXT;

-- Update existing records with email addresses from auth.users
UPDATE public.user_roles
SET email = auth.users.email
FROM auth.users
WHERE user_roles.user_id = auth.users.id;

-- Create a function to automatically set email when inserting new roles
CREATE OR REPLACE FUNCTION public.set_user_role_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  SELECT email INTO NEW.email
  FROM auth.users
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

-- Create trigger to automatically populate email on insert
CREATE TRIGGER set_user_role_email_on_insert
BEFORE INSERT ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.set_user_role_email();