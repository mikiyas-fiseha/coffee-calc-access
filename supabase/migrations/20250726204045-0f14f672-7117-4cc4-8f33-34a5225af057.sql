-- Add warehouse field to samples table
ALTER TABLE public.samples 
ADD COLUMN warehouse TEXT;

-- Create admin settings table for controlling filter visibility
CREATE TABLE public.admin_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Only super admins can view and modify admin settings
CREATE POLICY "Super admins can view admin settings" 
ON public.admin_settings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'super_admin'::user_role
));

CREATE POLICY "Super admins can insert admin settings" 
ON public.admin_settings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'super_admin'::user_role
));

CREATE POLICY "Super admins can update admin settings" 
ON public.admin_settings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role = 'super_admin'::user_role
));

-- Create trigger for admin settings updated_at
CREATE TRIGGER update_admin_settings_updated_at
BEFORE UPDATE ON public.admin_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default setting for filter visibility
INSERT INTO public.admin_settings (setting_key, setting_value) 
VALUES ('show_filters_to_users', true);