-- Durable API rate limits, and one counted quote open per visitor per day.
-- Safe to run more than once. Apply this in the Supabase SQL editor before
-- merging the app change. Until it is applied, rate limits stay in each
-- server's memory and quote opens use the previous counter.
--
-- These functions are service-role only. The public anon key cannot call them.

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  bucket TEXT NOT NULL,
  subject TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, subject)
);

ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.api_rate_limits FROM PUBLIC;
REVOKE ALL ON TABLE public.api_rate_limits FROM anon;
REVOKE ALL ON TABLE public.api_rate_limits FROM authenticated;

CREATE INDEX IF NOT EXISTS idx_api_rate_limits_window ON public.api_rate_limits (window_start);

CREATE OR REPLACE FUNCTION public.consume_rate_limit(
  p_bucket TEXT,
  p_subject TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.api_rate_limits%ROWTYPE;
  v_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
  v_retry INTEGER;
  v_limit INTEGER;
  v_window INTEGER;
BEGIN
  IF p_bucket IS NULL OR p_subject IS NULL
     OR p_bucket !~ '^[a-z0-9-]{1,40}$'
     OR p_subject !~ '^[a-f0-9]{64}$' THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after_sec', 60);
  END IF;

  v_limit := LEAST(1000, GREATEST(1, COALESCE(p_limit, 1)));
  v_window := LEAST(86400, GREATEST(1, COALESCE(p_window_seconds, 60)));

  DELETE FROM public.api_rate_limits
  WHERE ctid IN (
    SELECT ctid FROM public.api_rate_limits
    WHERE window_start < v_now - interval '2 days'
    LIMIT 20
  );

  SELECT * INTO v_row
  FROM public.api_rate_limits
  WHERE bucket = p_bucket AND subject = p_subject
  FOR UPDATE;

  IF NOT FOUND THEN
    BEGIN
      INSERT INTO public.api_rate_limits (bucket, subject, window_start, request_count)
      VALUES (p_bucket, p_subject, v_now, 1);
      RETURN jsonb_build_object('allowed', true, 'retry_after_sec', 0);
    EXCEPTION WHEN unique_violation THEN
      SELECT * INTO v_row
      FROM public.api_rate_limits
      WHERE bucket = p_bucket AND subject = p_subject
      FOR UPDATE;
    END;
  END IF;

  IF v_row.window_start + make_interval(secs => v_window) <= v_now THEN
    UPDATE public.api_rate_limits
      SET window_start = v_now, request_count = 1
      WHERE bucket = p_bucket AND subject = p_subject;
    RETURN jsonb_build_object('allowed', true, 'retry_after_sec', 0);
  END IF;

  IF v_row.request_count >= v_limit THEN
    v_retry := GREATEST(
      1,
      ceil(extract(epoch FROM (v_row.window_start + make_interval(secs => v_window) - v_now)))::INTEGER
    );
    RETURN jsonb_build_object('allowed', false, 'retry_after_sec', v_retry);
  END IF;

  UPDATE public.api_rate_limits
    SET request_count = request_count + 1
    WHERE bucket = p_bucket AND subject = p_subject;
  RETURN jsonb_build_object('allowed', true, 'retry_after_sec', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_rate_limit(TEXT, TEXT, INTEGER, INTEGER) TO service_role;

-- Same visitor opening the same quote again inside the window does not add
-- another view and does not touch the quote row, so it does not look like a
-- new open. The window matches QUOTE_VIEW_WINDOW_SECONDS in lib/quote-view.mjs
-- (24 hours). A window shorter than an hour is raised to an hour.
CREATE TABLE IF NOT EXISTS public.quote_view_visitors (
  token TEXT NOT NULL REFERENCES public.quotes(token) ON DELETE CASCADE,
  visitor_key TEXT NOT NULL,
  counted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (token, visitor_key)
);

ALTER TABLE public.quote_view_visitors ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.quote_view_visitors FROM PUBLIC;
REVOKE ALL ON TABLE public.quote_view_visitors FROM anon;
REVOKE ALL ON TABLE public.quote_view_visitors FROM authenticated;

DROP FUNCTION IF EXISTS public.record_public_quote_view(TEXT);

CREATE OR REPLACE FUNCTION public.record_public_quote_view(
  lookup_token TEXT,
  p_visitor TEXT,
  p_window_seconds INTEGER DEFAULT 86400
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
  v_window INTEGER;
  v_counted_at TIMESTAMP WITH TIME ZONE;
BEGIN
  IF lookup_token IS NULL OR lookup_token !~ '^q_[A-Za-z0-9]{14,}$' THEN
    RETURN jsonb_build_object('counted', false, 'view_count', 0);
  END IF;

  IF p_visitor IS NULL OR p_visitor !~ '^[a-f0-9]{64}$' THEN
    RETURN jsonb_build_object('counted', false, 'view_count', 0);
  END IF;

  v_window := LEAST(604800, GREATEST(3600, COALESCE(p_window_seconds, 86400)));

  DELETE FROM public.quote_view_visitors
  WHERE ctid IN (
    SELECT ctid FROM public.quote_view_visitors
    WHERE counted_at < v_now - interval '7 days'
    LIMIT 20
  );

  SELECT view_count INTO v_count
  FROM public.quotes
  WHERE token = lookup_token
    AND status IN ('Sent', 'Viewed')
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('counted', false, 'view_count', 0);
  END IF;

  SELECT counted_at INTO v_counted_at
  FROM public.quote_view_visitors
  WHERE token = lookup_token AND visitor_key = p_visitor
  FOR UPDATE;

  IF FOUND AND v_counted_at > v_now - make_interval(secs => v_window) THEN
    RETURN jsonb_build_object(
      'counted', false,
      'repeat', true,
      'view_count', COALESCE(v_count, 0)
    );
  END IF;

  UPDATE public.quotes
  SET view_count = COALESCE(view_count, 0) + 1,
      first_viewed_at = COALESCE(first_viewed_at, v_now),
      last_viewed_at = v_now,
      viewed_at = COALESCE(viewed_at, v_now),
      status = CASE WHEN status = 'Sent' THEN 'Viewed' ELSE status END,
      updated_at = v_now
  WHERE token = lookup_token
    AND status IN ('Sent', 'Viewed')
  RETURNING view_count INTO v_count;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('counted', false, 'view_count', 0);
  END IF;

  INSERT INTO public.quote_view_visitors (token, visitor_key, counted_at)
  VALUES (lookup_token, p_visitor, v_now)
  ON CONFLICT (token, visitor_key)
  DO UPDATE SET counted_at = EXCLUDED.counted_at;

  RETURN jsonb_build_object('counted', true, 'repeat', false, 'view_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.record_public_quote_view(TEXT, TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_public_quote_view(TEXT, TEXT, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.record_public_quote_view(TEXT, TEXT, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_public_quote_view(TEXT, TEXT, INTEGER) TO service_role;
