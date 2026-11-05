-- New quotes, invoices, and templates that omit the VAT flag are not VAT registered.
-- Existing rows are left as they were saved. Safe to run more than once.
-- The app still treats a missing flag as not registered if this has not been applied.
-- Apply it in the Supabase SQL editor. Do not apply it from the app.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quotes' AND column_name = 'vat_enabled'
  ) THEN
    ALTER TABLE public.quotes ALTER COLUMN vat_enabled SET DEFAULT false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'invoices' AND column_name = 'vat_enabled'
  ) THEN
    ALTER TABLE public.invoices ALTER COLUMN vat_enabled SET DEFAULT false;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'quote_templates' AND column_name = 'vat_enabled'
  ) THEN
    ALTER TABLE public.quote_templates ALTER COLUMN vat_enabled SET DEFAULT false;
  END IF;
END $$;
