-- Create table for daily closing prices
CREATE TABLE public.daily_closing_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  grade_name TEXT NOT NULL,
  closing_price NUMERIC NOT NULL,
  price_date DATE NOT NULL,
  entered_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(grade_name, price_date)
);

-- Enable RLS
ALTER TABLE public.daily_closing_prices ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can insert daily prices" 
ON public.daily_closing_prices 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
));

CREATE POLICY "Admins can update daily prices" 
ON public.daily_closing_prices 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
));

CREATE POLICY "Admins can view daily prices" 
ON public.daily_closing_prices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.role IN ('admin'::user_role, 'super_admin'::user_role)
));

CREATE POLICY "Paid users can view daily prices" 
ON public.daily_closing_prices 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.user_id = auth.uid() 
  AND profiles.is_paid = true
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_daily_closing_prices_updated_at
BEFORE UPDATE ON public.daily_closing_prices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate dynamic price ranges
CREATE OR REPLACE FUNCTION public.get_current_price_range(grade_name_param TEXT)
RETURNS TABLE(
  grade_name TEXT,
  lower_price NUMERIC,
  upper_price NUMERIC,
  last_closing_price NUMERIC,
  last_price_date DATE,
  days_without_sales INTEGER
) 
LANGUAGE plpgsql
AS $$
DECLARE
  latest_price_record RECORD;
  working_days_since INTEGER;
  adjustment_percentage NUMERIC;
BEGIN
  -- Get the most recent closing price for this grade
  SELECT dcp.grade_name, dcp.closing_price, dcp.price_date
  INTO latest_price_record
  FROM daily_closing_prices dcp
  WHERE dcp.grade_name = grade_name_param
  ORDER BY dcp.price_date DESC
  LIMIT 1;

  -- If no price record exists, return null
  IF latest_price_record IS NULL THEN
    RETURN;
  END IF;

  -- Calculate working days since last price entry (excluding weekends)
  SELECT COUNT(*)
  INTO working_days_since
  FROM generate_series(
    latest_price_record.price_date + INTERVAL '1 day',
    CURRENT_DATE,
    INTERVAL '1 day'
  ) AS day_series
  WHERE EXTRACT(DOW FROM day_series) NOT IN (0, 6); -- Exclude Sunday (0) and Saturday (6)

  -- Determine adjustment percentage based on days without sales
  IF working_days_since = 0 THEN
    -- Same day or most recent entry
    adjustment_percentage := 0.10; -- ±10%
  ELSIF working_days_since <= 10 THEN
    -- Within 10 working days of no sales
    adjustment_percentage := 0.15; -- ±15%
  ELSE
    -- More than 10 working days, still use ±15%
    adjustment_percentage := 0.15;
  END IF;

  -- Return the calculated range
  RETURN QUERY SELECT
    latest_price_record.grade_name,
    (latest_price_record.closing_price * (1 - adjustment_percentage))::NUMERIC,
    (latest_price_record.closing_price * (1 + adjustment_percentage))::NUMERIC,
    latest_price_record.closing_price,
    latest_price_record.price_date,
    working_days_since;
END;
$$;