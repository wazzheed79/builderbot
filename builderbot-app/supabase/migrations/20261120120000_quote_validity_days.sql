-- Each quote keeps its own validity (how many days the prices hold).
-- Safe to run more than once. Apply this in the Supabase SQL editor.
--
-- Before this, every quote's expiry was worked out from the business's
-- current "Quote validity" setting, so changing that setting moved the expiry
-- of quotes already sent. Now the setting is copied onto each quote when it is
-- saved, and the quote's own figure is used everywhere.
--
-- 1. New nullable column quotes.validity_days (1 to 365 days).
-- 2. Existing quotes get the business's current setting copied on, so they
--    stop moving if the setting changes later. Their expiry today does not change.
-- 3. get_public_quote and submit_public_quote_decision use the quote's own
--    figure, then the business default, then 30 days.

ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS validity_days INT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'quotes_validity_days_range'
      AND conrelid = 'public.quotes'::regclass
  ) THEN
    ALTER TABLE public.quotes
      ADD CONSTRAINT quotes_validity_days_range
      CHECK (validity_days IS NULL OR (validity_days >= 1 AND validity_days <= 365));
  END IF;
END;
$$;

UPDATE public.quotes q
SET validity_days = LEAST(365, GREATEST(1, p.quote_validity_days))
FROM public.profiles p
WHERE q.owner_id = p.owner_id
  AND q.validity_days IS NULL
  AND p.quote_validity_days IS NOT NULL;

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
  -- The quote's own validity wins. Older quotes without one use the business default.
  IF v_quote.validity_days IS NOT NULL THEN
    v_validity_days := v_quote.validity_days;
  ELSIF FOUND AND v_profile.quote_validity_days IS NOT NULL THEN
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
      -- BANK DETAILS: Only revealed after a typed acceptance.
      'bankName', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_name ELSE NULL END,
      'bankSortCode', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_sort_code ELSE NULL END,
      'bankAccountNumber', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_account_number ELSE NULL END
    ),
    'isExpired', v_quote.status = 'Expired'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_quote(TEXT) TO anon, authenticated, service_role;

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
  v_now TIMESTAMP WITH TIME ZONE := timezone('utc'::text, now());
  v_name TEXT;
  v_total NUMERIC;
  v_option_id TEXT;
BEGIN
  IF lookup_token IS NULL OR lookup_token !~ '^q_[A-Za-z0-9]{14,}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quote not found.');
  END IF;

  -- Validate decision
  IF new_decision NOT IN ('Accepted', 'Rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid decision. Only Accepted or Rejected is allowed.');
  END IF;

  -- Lookup quote
  SELECT * INTO v_quote FROM public.quotes WHERE token = lookup_token FOR UPDATE;
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
  -- The quote's own validity wins. Older quotes without one use the business default.
  IF v_quote.validity_days IS NOT NULL THEN
    v_validity_days := v_quote.validity_days;
  ELSIF FOUND AND v_profile.quote_validity_days IS NOT NULL THEN
    v_validity_days := v_profile.quote_validity_days;
  END IF;

  IF (v_quote.created_at + (v_validity_days || ' days')::interval) < v_now THEN
    UPDATE public.quotes SET status = 'Expired', updated_at = v_now WHERE token = lookup_token;
    RETURN jsonb_build_object('success', false, 'error', 'This quote has expired and can no longer be accepted.');
  END IF;

  -- Apply Decision
  IF new_decision = 'Accepted' THEN
    v_name := substr(trim(COALESCE(p_signature_name, '')), 1, 100);
    IF length(v_name) = 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'A typed acceptance name is required to accept.');
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

    v_total := CASE WHEN v_option IS NULL THEN v_quote.total ELSE (v_option->>'total')::numeric END;
    v_option_id := CASE
      WHEN v_option IS NOT NULL THEN NULLIF(substr(trim(p_selected_option), 1, 80), '')
      ELSE NULLIF(substr(COALESCE(v_quote.selected_option_id, ''), 1, 80), '')
    END;

    UPDATE public.quotes
    SET status = 'Accepted',
        accepted_signature_name = v_name,
        accepted_at = v_now,
        accepted_ip = NULLIF(substr(COALESCE(p_client_ip, ''), 1, 64), ''),
        items = CASE WHEN v_option IS NULL THEN items ELSE v_option->'items' END,
        subtotal = CASE WHEN v_option IS NULL THEN subtotal ELSE (v_option->>'subtotal')::numeric END,
        vat = CASE WHEN v_option IS NULL THEN vat ELSE (v_option->>'vat')::numeric END,
        total = v_total,
        deposit = CASE WHEN v_option IS NULL THEN deposit ELSE (v_option->>'deposit')::numeric END,
        selected_option_id = CASE WHEN v_option IS NULL THEN selected_option_id ELSE v_option_id END,
        updated_at = v_now
    WHERE token = lookup_token;

    INSERT INTO public.quote_acceptances (
      quote_token,
      quote_id,
      typed_name,
      accepted_at,
      client_ip,
      total_accepted,
      selected_option_id
    ) VALUES (
      lookup_token,
      v_quote.id,
      v_name,
      v_now,
      NULLIF(substr(COALESCE(p_client_ip, ''), 1, 64), ''),
      v_total,
      v_option_id
    );

  ELSIF new_decision = 'Rejected' THEN
    UPDATE public.quotes
    SET status = 'Rejected',
        rejected_reason = substr(COALESCE(trim(p_decline_reason), ''), 1, 1000),
        rejected_at = now(),
        rejected_ip = NULLIF(substr(COALESCE(p_client_ip, ''), 1, 64), ''),
        updated_at = now()
    WHERE token = lookup_token;
  END IF;

  RETURN jsonb_build_object('success', true, 'status', new_decision);
END;
$$;

REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
