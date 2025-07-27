-- Fix the function search path security issue
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
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  latest_price_record RECORD;
  working_days_since INTEGER;
  adjustment_percentage NUMERIC;
BEGIN
  -- Get the most recent closing price for this grade
  SELECT dcp.grade_name, dcp.closing_price, dcp.price_date
  INTO latest_price_record
  FROM public.daily_closing_prices dcp
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