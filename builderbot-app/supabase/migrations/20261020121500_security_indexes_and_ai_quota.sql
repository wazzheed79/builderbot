-- Safe to run more than once on the live database.
-- Tightens quote functions, speeds up foreign keys, and adds the AI hourly limit.

DROP POLICY IF EXISTS "Profiles are private to owner" ON public.profiles;
CREATE POLICY "Profiles are private to owner"
  ON public.profiles FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Customers are private to owner" ON public.customers;
CREATE POLICY "Customers are private to owner"
  ON public.customers FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Quotes are private to owner" ON public.quotes;
CREATE POLICY "Quotes are private to owner"
  ON public.quotes FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Jobs are private to owner" ON public.jobs;
CREATE POLICY "Jobs are private to owner"
  ON public.jobs FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

DROP POLICY IF EXISTS "Invoices are private to owner" ON public.invoices;
CREATE POLICY "Invoices are private to owner"
  ON public.invoices FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_quote(TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_quote_id ON public.jobs(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON public.invoices(job_id);

CREATE TABLE IF NOT EXISTS public.ai_usage (
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  request_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_id, kind)
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consume_ai_quota(
  p_owner UUID,
  p_kind TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.ai_usage%ROWTYPE;
  v_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
  v_retry INTEGER;
BEGIN
  IF p_owner IS NULL OR p_kind IS NULL OR length(trim(p_kind)) = 0 THEN
    RETURN jsonb_build_object('allowed', false, 'retry_after_sec', p_window_seconds);
  END IF;

  SELECT * INTO v_row FROM public.ai_usage WHERE owner_id = p_owner AND kind = p_kind FOR UPDATE;
  IF NOT FOUND THEN
    INSERT INTO public.ai_usage (owner_id, kind, window_start, request_count)
    VALUES (p_owner, p_kind, v_now, 1);
    RETURN jsonb_build_object('allowed', true, 'retry_after_sec', 0);
  END IF;

  IF v_row.window_start + make_interval(secs => p_window_seconds) <= v_now THEN
    UPDATE public.ai_usage
      SET window_start = v_now, request_count = 1
      WHERE owner_id = p_owner AND kind = p_kind;
    RETURN jsonb_build_object('allowed', true, 'retry_after_sec', 0);
  END IF;

  IF v_row.request_count >= p_limit THEN
    v_retry := GREATEST(1, ceil(extract(epoch FROM (v_row.window_start + make_interval(secs => p_window_seconds) - v_now)))::INTEGER);
    RETURN jsonb_build_object('allowed', false, 'retry_after_sec', v_retry);
  END IF;

  UPDATE public.ai_usage
    SET request_count = request_count + 1
    WHERE owner_id = p_owner AND kind = p_kind;
  RETURN jsonb_build_object('allowed', true, 'retry_after_sec', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.consume_ai_quota(UUID, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.consume_ai_quota(UUID, TEXT, INTEGER, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.consume_ai_quota(UUID, TEXT, INTEGER, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.consume_ai_quota(UUID, TEXT, INTEGER, INTEGER) TO service_role;
