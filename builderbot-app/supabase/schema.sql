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
-- Overdue is derived from due_date and is not stored.
-- Public reads go through get_public_invoice, not this table.
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  number TEXT,
  token TEXT UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quote_id TEXT REFERENCES public.quotes(id) ON DELETE SET NULL,
  job_id TEXT REFERENCES public.jobs(id) ON DELETE SET NULL,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  option_id TEXT,
  option_label TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_address TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
  vat_enabled BOOLEAN DEFAULT true,
  vat NUMERIC NOT NULL CHECK (vat >= 0),
  total NUMERIC NOT NULL CHECK (total >= 0),
  deposit_paid NUMERIC DEFAULT 0 CHECK (deposit_paid >= 0),
  balance_due NUMERIC NOT NULL CHECK (balance_due >= 0),
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid')),
  issue_date DATE,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,
  company_name TEXT,
  trading_name TEXT,
  owner_name TEXT,
  business_phone TEXT,
  business_email TEXT,
  business_address TEXT,
  vat_number TEXT,
  bank_name TEXT,
  bank_sort_code TEXT,
  bank_account_number TEXT,
  logo_url TEXT,
  accreditations JSONB DEFAULT '[]'::jsonb,
  terms_and_conditions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_owner_number
  ON public.invoices (owner_id, number)
  WHERE number IS NOT NULL;

-- 5b. Quote templates (private to the tradesperson)
CREATE TABLE IF NOT EXISTS public.quote_templates (
  id TEXT PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  vat_enabled BOOLEAN NOT NULL DEFAULT true,
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
CREATE INDEX IF NOT EXISTS idx_invoices_token ON public.invoices(token);
CREATE INDEX IF NOT EXISTS idx_quote_templates_owner_id ON public.quote_templates(owner_id);
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
ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

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

-- Quote templates: Authenticated users can only access their own templates
CREATE POLICY "Quote templates are private to owner"
  ON public.quote_templates FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

REVOKE ALL ON TABLE public.quote_templates FROM anon;

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
  IF lookup_token IS NULL OR lookup_token !~ '^q_[A-Za-z0-9]{14,}$' THEN
    RETURN NULL;
  END IF;

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
      'clientPhone', v_quote.client_phone,
      'clientEmail', v_quote.client_email,
      'title', v_quote.title,
      'notes', v_quote.notes,
      'items', v_quote.items,
      'photos', COALESCE(v_quote.photos, '[]'::jsonb),
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
      'companyName', CASE
        WHEN v_profile.company_name IS NULL THEN NULL
        WHEN lower(btrim(v_profile.company_name)) IN ('', 'trade contractor services') THEN NULL
        ELSE btrim(v_profile.company_name)
      END,
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
    ),
    'isExpired', v_quote.status = 'Expired'
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
  p_client_ip TEXT DEFAULT NULL,
  p_selected_option TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quote RECORD;
  v_profile RECORD;
  v_option JSONB;
  v_validity_days INT := 30;
BEGIN
  IF lookup_token IS NULL OR lookup_token !~ '^q_[A-Za-z0-9]{14,}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quote not found.');
  END IF;

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

    IF jsonb_typeof(v_quote.options) = 'array' AND jsonb_array_length(v_quote.options) > 1 THEN
      IF p_selected_option IS NULL OR length(trim(p_selected_option)) = 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Choose Standard, Better, or Premium before you accept.');
      END IF;
      SELECT elem INTO v_option
      FROM jsonb_array_elements(v_quote.options) elem
      WHERE elem->>'id' = p_selected_option
      LIMIT 1;
      IF v_option IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Choose Standard, Better, or Premium before you accept.');
      END IF;
    END IF;

    UPDATE public.quotes
    SET status = 'Accepted',
        accepted_signature_name = substr(trim(p_signature_name), 1, 100),
        accepted_at = now(),
        accepted_ip = p_client_ip,
        items = CASE WHEN v_option IS NULL THEN items ELSE v_option->'items' END,
        subtotal = CASE WHEN v_option IS NULL THEN subtotal ELSE (v_option->>'subtotal')::numeric END,
        vat = CASE WHEN v_option IS NULL THEN vat ELSE (v_option->>'vat')::numeric END,
        total = CASE WHEN v_option IS NULL THEN total ELSE (v_option->>'total')::numeric END,
        deposit = CASE WHEN v_option IS NULL THEN deposit ELSE (v_option->>'deposit')::numeric END,
        selected_option_id = CASE WHEN v_option IS NULL THEN selected_option_id ELSE p_selected_option END,
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

-- Customer phones open quote links with the anon key. These functions accept
-- one unguessable token and do not list anyone else's quotes.
REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_quote(TEXT) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- One public invoice by unguessable token. Bank details are whatever was copied
-- onto the invoice. Blank details stay blank.
CREATE OR REPLACE FUNCTION public.get_public_invoice(lookup_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invoice RECORD;
  v_status TEXT;
  v_today DATE;
BEGIN
  IF lookup_token IS NULL OR lookup_token !~ '^i_[A-Za-z0-9]{14,}$' THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_invoice FROM public.invoices WHERE token = lookup_token;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  v_today := (timezone('Europe/London', now()))::date;
  v_status := CASE
    WHEN v_invoice.status = 'Paid' THEN 'Paid'
    WHEN v_invoice.status = 'Draft' THEN 'Draft'
    WHEN v_invoice.due_date IS NOT NULL
      AND (v_invoice.due_date AT TIME ZONE 'Europe/London')::date < v_today THEN 'Overdue'
    ELSE 'Sent'
  END;

  RETURN jsonb_build_object(
    'invoice', jsonb_build_object(
      'id', v_invoice.id,
      'number', COALESCE(v_invoice.number, v_invoice.id),
      'token', v_invoice.token,
      'title', v_invoice.title,
      'notes', v_invoice.notes,
      'optionLabel', v_invoice.option_label,
      'clientName', v_invoice.client_name,
      'clientCompany', v_invoice.client_company,
      'clientAddress', v_invoice.client_address,
      'clientPhone', v_invoice.client_phone,
      'clientEmail', v_invoice.client_email,
      'items', v_invoice.items,
      'subtotal', v_invoice.subtotal,
      'vatEnabled', v_invoice.vat_enabled,
      'vat', v_invoice.vat,
      'total', v_invoice.total,
      'balanceDue', CASE WHEN v_status = 'Paid' THEN 0 ELSE v_invoice.balance_due END,
      'status', v_status,
      'issueDate', v_invoice.issue_date,
      'dueDate', v_invoice.due_date,
      'paidAt', v_invoice.paid_at,
      'createdAt', v_invoice.created_at
    ),
    'contractor', jsonb_build_object(
      'companyName', v_invoice.company_name,
      'tradingName', v_invoice.trading_name,
      'ownerName', v_invoice.owner_name,
      'phone', v_invoice.business_phone,
      'email', v_invoice.business_email,
      'address', v_invoice.business_address,
      'vatNumber', v_invoice.vat_number,
      'logoUrl', v_invoice.logo_url,
      'accreditations', COALESCE(v_invoice.accreditations, '[]'::jsonb),
      'termsAndConditions', v_invoice.terms_and_conditions,
      'bankName', NULLIF(btrim(COALESCE(v_invoice.bank_name, '')), ''),
      'bankSortCode', NULLIF(btrim(COALESCE(v_invoice.bank_sort_code, '')), ''),
      'bankAccountNumber', NULLIF(btrim(COALESCE(v_invoice.bank_account_number, '')), '')
    )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_invoice(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_invoice(TEXT) TO anon, authenticated, service_role;

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

-- API rate limits. No policies: only the service role can call the function.
-- The subject is a hash, not an IP address.
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

-- One counted open per visitor per quote inside 24 hours. The anon key cannot
-- call this. Customer opens are counted here, not when the link preview is built.
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
