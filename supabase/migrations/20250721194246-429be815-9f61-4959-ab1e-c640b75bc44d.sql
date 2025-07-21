-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('normal', 'admin', 'super_admin');

-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM ('unpaid', 'pending', 'paid');

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  mobile_number TEXT NOT NULL UNIQUE,
  role user_role NOT NULL DEFAULT 'normal',
  is_paid BOOLEAN NOT NULL DEFAULT false,
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  device_id TEXT,
  selected_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment plans table
CREATE TABLE public.payment_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  duration TEXT NOT NULL,
  price INTEGER NOT NULL, -- in birr
  months INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert default payment plans
INSERT INTO public.payment_plans (duration, price, months) VALUES
('1 Month', 2000, 1),
('3 Months', 6000, 3),
('6 Months', 10000, 6),
('1 Year', 20000, 12);

-- Create samples table for uploaded samples
CREATE TABLE public.samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grn TEXT NOT NULL,
  grade TEXT NOT NULL,
  total_value DECIMAL(10,2) NOT NULL,
  owner_name TEXT NOT NULL,
  image_url TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create coffee grades table for market info
CREATE TABLE public.coffee_grades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_name TEXT NOT NULL UNIQUE,
  lower_price DECIMAL(10,2) NOT NULL,
  upper_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert sample coffee grades
INSERT INTO public.coffee_grades (grade_name, lower_price, upper_price) VALUES
('LUBPAA1', 17500, 18900),
('LUBPAA2', 16800, 18200),
('LUBPAA3', 16100, 17500),
('LUBPAA4', 15400, 16800),
('LUBPAA5', 14700, 16100),
('LWBP1', 15500, 16900),
('LWBP2', 14200, 15300),
('LWBP3', 13500, 14600),
('LWBP4', 12800, 13900),
('LWSD1', 14800, 16200),
('LWSD2', 14100, 15500),
('LWSD3', 13400, 14800),
('LWSD4', 12700, 14100),
('LWYC1', 13900, 15300),
('LWYC2', 13200, 14600),
('LWYC3', 12500, 13900),
('LWYC4', 11800, 13200);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.samples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coffee_grades ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admins can update any profile" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role = 'super_admin'
  )
);

-- Payment plans policies (public read)
CREATE POLICY "Anyone can view payment plans" 
ON public.payment_plans FOR SELECT 
USING (true);

-- Samples policies
CREATE POLICY "Paid users can view samples" 
ON public.samples FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND is_paid = true
  )
);

CREATE POLICY "Admins can insert samples" 
ON public.samples FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Coffee grades policies (public read)
CREATE POLICY "Anyone can view coffee grades" 
ON public.coffee_grades FOR SELECT 
USING (true);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, mobile_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'User'),
    COALESCE(NEW.raw_user_meta_data ->> 'mobile_number', NEW.phone)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_coffee_grades_updated_at
  BEFORE UPDATE ON public.coffee_grades
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();