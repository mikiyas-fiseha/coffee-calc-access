-- Drop the problematic admin policy that causes infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a proper admin policy using a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = $1 
    AND profiles.role IN ('admin', 'super_admin')
  );
$$;

-- Create new admin policy using the security definer function
CREATE POLICY "Admins can view all profiles v2" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = user_id OR public.is_admin(auth.uid())
);