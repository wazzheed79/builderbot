-- Customer links are opened with the public anon key. Row security hides
-- quotes from that key, and these functions were only granted to service_role.
-- When the service role is not the key the server actually uses, every real
-- customer link looks missing. These functions look up one unguessable token
-- and are safe for the anon key to call.

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

  SELECT * INTO v_quote FROM public.quotes WHERE token = lookup_token;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE owner_id = v_quote.owner_id;
  IF FOUND AND v_profile.quote_validity_days IS NOT NULL THEN
    v_validity_days := v_profile.quote_validity_days;
  END IF;

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
      'bankName', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_name ELSE NULL END,
      'bankSortCode', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_sort_code ELSE NULL END,
      'bankAccountNumber', CASE WHEN v_quote.status = 'Accepted' THEN v_profile.bank_account_number ELSE NULL END
    ),
    'isExpired', v_quote.status = 'Expired'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_public_quote_view(lookup_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF lookup_token IS NULL OR lookup_token !~ '^q_[A-Za-z0-9]{14,}$' THEN
    RETURN jsonb_build_object('counted', false, 'view_count', 0);
  END IF;

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

DROP FUNCTION IF EXISTS public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT);

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

  IF new_decision NOT IN ('Accepted', 'Rejected') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid decision. Only Accepted or Rejected is allowed.');
  END IF;

  SELECT * INTO v_quote FROM public.quotes WHERE token = lookup_token;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quote not found.');
  END IF;

  IF v_quote.status NOT IN ('Sent', 'Viewed') THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Quote cannot be modified. Current status: ' || v_quote.status
    );
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE owner_id = v_quote.owner_id;
  IF FOUND AND v_profile.quote_validity_days IS NOT NULL THEN
    v_validity_days := v_profile.quote_validity_days;
  END IF;

  IF (v_quote.created_at + (v_validity_days || ' days')::interval) < now() THEN
    UPDATE public.quotes SET status = 'Expired', updated_at = now() WHERE token = lookup_token;
    RETURN jsonb_build_object('success', false, 'error', 'This quote has expired and can no longer be accepted.');
  END IF;

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

REVOKE ALL ON FUNCTION public.get_public_quote(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_quote(TEXT) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.record_public_quote_view(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_quote_view(TEXT) TO anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_public_quote_decision(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
