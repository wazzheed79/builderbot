-- Invoices, private quote templates, and a public invoice link.
-- Safe to run more than once. Do not skip this: until it is applied, invoice
-- and template sync cannot store the new columns, and customer invoice links
-- cannot be opened. The app keeps a copy on the phone in the meantime.
--
-- Run this in the Supabase SQL editor for project ldapscbchbjywsltkqfz only.

-- ---------------------------------------------------------------------------
-- Invoices: number per user, public token, dates, copied business details.
-- Overdue is not stored. It is worked out from the due date.
-- ---------------------------------------------------------------------------

ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS token TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS issue_date DATE;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS client_company TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS option_id TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS option_label TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS trading_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS business_email TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS vat_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bank_sort_code TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS bank_account_number TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS accreditations JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS terms_and_conditions TEXT;

ALTER TABLE public.invoices ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE public.invoices ALTER COLUMN status SET DEFAULT 'Draft';

UPDATE public.invoices
SET status = 'Sent'
WHERE status IN ('Issued', 'Partially Paid', 'Overdue');

ALTER TABLE public.invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE public.invoices
  ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('Draft', 'Sent', 'Paid'));

UPDATE public.invoices
SET number = upper(id)
WHERE number IS NULL AND id ~* '^INV-[0-9]+$';

UPDATE public.invoices
SET token = 'i_' || replace(gen_random_uuid()::text, '-', '')
WHERE token IS NULL OR btrim(token) = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_token ON public.invoices (token);
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_owner_number
  ON public.invoices (owner_id, number)
  WHERE number IS NOT NULL;

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Invoices are private to owner" ON public.invoices;
CREATE POLICY "Invoices are private to owner"
  ON public.invoices FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

-- ---------------------------------------------------------------------------
-- Quote templates. Private to the tradesperson. No public read.
-- ---------------------------------------------------------------------------

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

CREATE INDEX IF NOT EXISTS idx_quote_templates_owner_id ON public.quote_templates (owner_id);

ALTER TABLE public.quote_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Quote templates are private to owner" ON public.quote_templates;
CREATE POLICY "Quote templates are private to owner"
  ON public.quote_templates FOR ALL
  TO authenticated
  USING ((select auth.uid()) = owner_id)
  WITH CHECK ((select auth.uid()) = owner_id);

REVOKE ALL ON TABLE public.quote_templates FROM anon;

-- ---------------------------------------------------------------------------
-- One public invoice, looked up by an unguessable token. The anon key may
-- call this, the same way it may call get_public_quote. Row security still
-- hides the invoices table itself.
-- ---------------------------------------------------------------------------

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
