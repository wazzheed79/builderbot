-- Safe to run more than once on the live database.
-- Quote cards, customer view counts, price memory, and optional Good / Better / Best prices.

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

