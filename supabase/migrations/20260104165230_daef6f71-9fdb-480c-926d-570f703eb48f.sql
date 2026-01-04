-- Backfill missing users into user_roles table
INSERT INTO public.user_roles (user_id, email, role)
SELECT au.id, au.email, 'user'::app_role
FROM auth.users au
LEFT JOIN public.user_roles ur ON au.id = ur.user_id
WHERE ur.user_id IS NULL;