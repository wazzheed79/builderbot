-- Lock down the customer decision function. Safe to run more than once.
-- Apply this in the Supabase SQL editor. Do not rely on the app to apply it.
--
-- 1. The function is now service-role only. Before this, the public anon key
--    could call it directly, skipping the API rate limit and sending any
--    client IP into the acceptance record.
-- 2. The quote row is locked (FOR UPDATE) while a decision is applied, so an
--    accept and a reject at the same moment cannot overwrite each other.
-- 3. The rejected IP is trimmed the same way as the accepted IP.

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
  IF FOUND AND v_profile.quote_validity_days IS NOT NULL THEN
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
