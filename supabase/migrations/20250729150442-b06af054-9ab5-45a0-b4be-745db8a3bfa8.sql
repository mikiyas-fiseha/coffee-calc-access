-- Update the get_current_price_range function to return null ranges when more than 10 days without sales
CREATE OR REPLACE FUNCTION public.get_current_price_range(grade_name_param text)
 RETURNS TABLE(grade_name text, lower_price numeric, upper_price numeric, last_closing_price numeric, last_price_date date, days_without_sales integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
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

  -- If more than 10 working days without sales, return null ranges
  IF working_days_since > 10 THEN
    RETURN QUERY SELECT
      latest_price_record.grade_name,
      NULL::NUMERIC,
      NULL::NUMERIC,
      latest_price_record.closing_price,
      latest_price_record.price_date,
      working_days_since;
    RETURN;
  END IF;

  -- Determine adjustment percentage based on days without sales
  IF working_days_since = 0 THEN
    -- Same day or most recent entry
    adjustment_percentage := 0.10; -- ±10%
  ELSIF working_days_since <= 10 THEN
    -- Within 10 working days of no sales
    adjustment_percentage := 0.15; -- ±15%
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
$function$