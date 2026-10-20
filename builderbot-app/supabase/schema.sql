-- ==============================================================================
-- BuilderBot Supabase Production Database Schema & Security Architecture
-- ==============================================================================
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Profiles Table (Owner scoped - private business data & banking)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  trading_name TEXT,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  address TEXT NOT NULL,
  trade TEXT NOT NULL DEFAULT 'General Building & Renovation',
  vat_registered BOOLEAN DEFAULT false,
  vat_number TEXT,
  bank_name TEXT,
  bank_sort_code TEXT,
  bank_account_number TEXT,
  accreditations JSONB DEFAULT '[]'::jsonb,
  default_deposit_percent NUMERIC DEFAULT 20 CHECK (default_deposit_percent >= 0 AND default_deposit_percent <= 100),
  payment_terms_days INT DEFAULT 7 CHECK (payment_terms_days >= 0),
  quote_validity_days INT DEFAULT 30 CHECK (quote_validity_days >= 1),
  terms_and_conditions TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Customers Table (Owner scoped - client GDPR contact records)
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Quotes Table (Owner scoped - core quote records)
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_address TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  vat_enabled BOOLEAN DEFAULT true,
  vat NUMERIC NOT NULL CHECK (vat >= 0),
  total NUMERIC NOT NULL CHECK (total >= 0),
  deposit_percent NUMERIC DEFAULT 20 CHECK (deposit_percent >= 0 AND deposit_percent <= 100),
  deposit NUMERIC NOT NULL CHECK (deposit >= 0),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired')),
  viewed_at TIMESTAMP WITH TIME ZONE,
  view_count INTEGER NOT NULL DEFAULT 0,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  reminder_after_days INTEGER NOT NULL DEFAULT 3,
  options JSONB,
  selected_option_id TEXT,
  viewed_ip TEXT,
  accepted_signature_name TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_ip TEXT,
  rejected_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  rejected_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Jobs Table (Owner scoped - site projects)
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Quoted' CHECK (status IN ('Quoted', 'Scheduled', 'In Progress', 'Completed', 'Invoiced')),
  notes TEXT,
  quote_id TEXT REFERENCES public.quotes(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Invoices Table (Owner scoped - billing & cashflow)
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id TEXT REFERENCES public.quotes(id) ON DELETE SET NULL,
  job_id TEXT REFERENCES public.jobs(id) ON DELETE SET NULL,
  customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  client_name TEXT NOT NULL,
  client_address TEXT NOT NULL,
  client_email TEXT,
  client_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  vat_enabled BOOLEAN DEFAULT true,
  vat NUMERIC NOT NULL CHECK (vat >= 0),
  total NUMERIC NOT NULL CHECK (total >= 0),
  deposit_paid NUMERIC DEFAULT 0 CHECK (deposit_paid >= 0),
  balance_due NUMERIC NOT NULL CHECK (balance_due >= 0),
  status TEXT NOT NULL DEFAULT 'Issued' CHECK (status IN ('Draft', 'Issued', 'Partially Paid', 'Paid', 'Overdue')),
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON public.profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_customers_owner_id ON public.customers(owner_id);
CREATE INDEX IF NOT EXISTS idx_quotes_owner_id ON public.quotes(owner_id);
CREATE INDEX IF NOT EXISTS idx_quotes_token ON public.quotes(token);
CREATE INDEX IF NOT EXISTS idx_jobs_owner_id ON public.jobs(owner_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_owner_id ON public.invoices(owner_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON public.invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_quote_id ON public.jobs(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON public.invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON public.invoices(job_id);

-- ==============================================================================
-- STRICT ROW LEVEL SECURITY (RLS)
-- Rule: The public has ZERO direct access to tables. Only owners access their data.
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can only read and mutate their own profile
CREATE POLICY "Profiles are private to owner"
  ON public.profiles FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

-- Customers: Authenticated users can only access their own customer directory
CREATE POLICY "Customers are private to owner"
  ON public.customers FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

-- Quotes: Authenticated users can only access their own quotes
CREATE POLICY "Quotes are private to owner"
  ON public.quotes FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

-- Jobs: Authenticated users can only access their own jobs
CREATE POLICY "Jobs are private to owner"
  ON public.jobs FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

-- Invoices: Authenticated users can only access their own invoices
CREATE POLICY "Invoices are private to owner"
  ON public.invoices FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

-- ==============================================================================
-- SECURE PUBLIC FUNCTIONS (Called exclusively via server-side service role)
-- ==============================================================================

-- Function 1: Get sanitized public quote by unguessable token
-- Automatically checks and updates expiry date, and hides contractor bank details unless accepted.
CREATE OR REPLACE FUNCTION public.get_public_quote(lookup_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote RECORD;
  v_profile RECORD;
  v_validity_days INT := 30;
BEGIN
  -- Lookup by unguessable token only (never by guessable sequential ID)
  SELECT * INTO v_quote FROM public.quotes WHERE token = lookup_token;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- Get contractor profile
  SELECT * INTO v_profile FROM public.profiles WHERE owner_id = v_quote.owner_id;
  IF FOUND AND v_profile.quote_validity_days IS NOT NULL THEN
    v_validity_days := v_profile.quote_validity_days;
  END IF;

  -- Check Expiry: if status is 'Sent' or 'Viewed' and current time exceeds validity
  IF v_quote.status IN ('Sent', 'Viewed') AND (v_quote.created_at + (v_validity_days || ' days')::interval) < now() THEN
    UPDATE public.quotes SET status = 'Expired', updated_at = now() WHERE token = lookup_token;
    v_quote.status := 'Expired';
  END IF;

  RETURN jsonb_build_object(
    'quote', jsonb_build_object(
      'id', v_quote.id,
      'token', v_quote.token,
      'clientName', v_quote.client_name,
      'clientCompany', v_quote.client_company,
      'clientAddress', v_quote.client_address,
      'title', v_quote.title,
      'notes', v_quote.notes,
      'items', v_quote.items,
      'subtotal', v_quote.subtotal,
      'vatEnabled', v_quote.vat_enabled,
      'vat', v_quote.vat,
      'total', v_quote.total,
      'depositPercent', v_quote.deposit_percent,
      'deposit', v_quote.deposit,
      'status', v_quote.status,
      'viewedAt', v_quote.viewed_at,
      'viewCount', COALESCE(v_quote.view_count, 0),
      'options', v_quote.options,
      'selectedOptionId', v_quote.selected_option_id,
      'acceptedSignatureName', v_quote.accepted_signature_name,
      'acceptedAt', v_quote.accepted_at,
      'rejectedReason', v_quote.rejected_reason,
      'rejectedAt', v_quote.rejected_at,
      'createdAt', v_quote.created_at,
      'validityDays', v_validity_days
    ),
    'contractor', jsonb_build_object(
      'companyName', COALESCE(v_profile.company_name, 'Trade Contractor Services'),
      'tradingName', v_profile.trading_name,
      'ownerName', v_profile.owner_name,
      'trade', v_profile.trade,
      'phone', v_profile.phone,
      'email', v_profile.email,
      'address', v_profile.address,
      'accreditations', COALESCE(v_profile.accreditations, '[]'::jsonb),
      'termsAndConditions', v_profile.terms_and_conditions,
      'vatRegistered', v_profile.vat_registered,
      'vatNumber', v_profile.vat_number,
      -- BANK DETAILS: Only revealed if quote has been digitally accepted!
      'bankName', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_name ELSE NULL END,
      'bankSortCode', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_sort_code ELSE NULL END,
      'bankAccountNumber', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_account_number ELSE NULL END
    )
  );
END;
$$;

-- Function 2: Submit customer decision (Accept or Reject)
-- Enforces strict state transitions: ONLY 'Sent' -> 'Accepted' or 'Sent' -> 'Rejected'.
CREATE OR REPLACE FUNCTION public.submit_public_quote_decision(
  lookup_token TEXT,
  new_decision TEXT,
  p_signature_name TEXT DEFAULT NULL,
  p_decline_reason TEXT DEFAULT NULL,
  p_client_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote RECORD;
  v_profile RECORD;
  v_validity_days INT := 30;
BEGIN
  -- Validate decision
  IF new_decision NOT IN ('Accepted', 'Rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid decision. Only Accepted or Rejected is allowed.');
  END IF;

  -- Lookup quote
  SELECT * INTO v_quote FROM public.quotes WHERE token = lookup_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quote not found.');
  END IF;

  -- Validate state machine: Must be currently 'Sent' or 'Viewed'
  IF v_quote.status NOT IN ('Sent', 'Viewed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quote cannot be modified. Current status: ' || v_quote.status
    );
  END IF;

  -- Validate expiry
  SELECT * INTO v_profile FROM public.profiles WHERE owner_id = v_quote.owner_id;
  IF FOUND AND v_profile.quote_validity_days IS NOT NULL THEN
    v_validity_days := v_profile.quote_validity_days;
  END IF;

  IF (v_quote.created_at + (v_validity_days || ' days')::interval) < now() THEN
    UPDATE public.quotes SET status = 'Expired', updated_at = now() WHERE token = lookup_token;
    RETURN jsonb_build_object('success', false, 'error', 'This quote has expired and can no longer be accepted.');
  END IF;

  -- Apply Decision
  IF new_decision = 'Accepted' THEN
    IF p_signature_name IS NULL OR length(trim(p_signature_name)) = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Signature name is required to accept.');
    END IF;

    UPDATE public.quotes
    SET status = 'Accepted',
        accepted_signature_name = substr(trim(p_signature_name), 1, 100),
        accepted_at = now(),
        accepted_ip = p_client_ip,
        updated_at = now()
    WHERE token = lookup_token;

  ELSIF new_decision = 'Rejected' THEN
    UPDATE public.quotes
    SET status = 'Rejected',
        rejected_reason = substr(COALESCE(trim(p_decline_reason), ''), 1, 1000),
        rejected_at = now(),
        rejected_ip = p_client_ip,
        updated_at = now()
    WHERE token = lookup_token;
  END IF;

  RETURN jsonb_build_object('success', true, 'status', new_decision);
END;
$$;

-- Photos on quotes. Safe to run again on a database that already exists.
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Feedback from the free beta. No public policies: only the server service role can write.
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  message TEXT NOT NULL,
  contact TEXT,
  page TEXT
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Public quote functions are for the server service role only.
REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_quote(TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- Signed-in AI quota. No policies: only the service role can call the function.
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

-- Extra quote fields. Safe on a database that already has the quotes table.
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS first_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS reminder_after_days INTEGER NOT NULL DEFAULT 3;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS options JSONB;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS selected_option_id TEXT;

-- Prices the tradesperson has typed, used on later quotes. Owner only.
CREATE TABLE IF NOT EXISTS public.price_memory (
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  description TEXT NOT NULL,
  unit TEXT NOT NULL,
  rate NUMERIC NOT NULL CHECK (rate >= 0),
  item_type TEXT NOT NULL DEFAULT 'material',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (owner_id, item_key)
);

ALTER TABLE public.price_memory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Price memory is private to owner" ON public.price_memory;
CREATE POLICY "Price memory is private to owner"
  ON public.price_memory FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

-- Customer opens are counted here, not when the link preview is built.
CREATE OR REPLACE FUNCTION public.record_public_quote_view(lookup_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.quotes
  SET view_count = COALESCE(view_count, 0) + 1,
      first_viewed_at = COALESCE(first_viewed_at, now()),
      last_viewed_at = now(),
      viewed_at = COALESCE(viewed_at, now()),
      status = CASE WHEN status = 'Sent' THEN 'Viewed' ELSE status END,
      updated_at = now()
  WHERE token = lookup_token
    AND status IN ('Sent', 'Viewed')
  RETURNING view_count INTO v_count;

  IF v_count IS NULL THEN
    RETURN jsonb_build_object('counted', false, 'view_count', 0);
  END IF;
  RETURN jsonb_build_object('counted', true, 'view_count', v_count);
END;
$$;

REVOKE ALL ON FUNCTION public.record_public_quote_view(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_public_quote_view(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.record_public_quote_view(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_public_quote_view(TEXT) TO service_role;
