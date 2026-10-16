-- BuilderBot Supabase Database Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Profiles / Business Branding Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT 'default',
  company_name TEXT NOT NULL,
  trading_name TEXT,
  owner_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  address TEXT NOT NULL,
  trade TEXT NOT NULL,
  vat_registered BOOLEAN DEFAULT false,
  vat_number TEXT,
  bank_name TEXT,
  bank_sort_code TEXT,
  bank_account_number TEXT,
  accreditations JSONB DEFAULT '[]'::jsonb,
  default_deposit_percent NUMERIC DEFAULT 20,
  payment_terms_days NUMERIC DEFAULT 7,
  quote_validity_days NUMERIC DEFAULT 30,
  terms_and_conditions TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  company TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Quotes Table
CREATE TABLE IF NOT EXISTS public.quotes (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  customer_id TEXT REFERENCES public.customers(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_company TEXT,
  client_address TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  title TEXT NOT NULL,
  notes TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC NOT NULL,
  vat_enabled BOOLEAN DEFAULT true,
  vat NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  deposit_percent NUMERIC DEFAULT 20,
  deposit NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Accepted', 'Rejected', 'Expired')),
  accepted_signature_name TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_reason TEXT,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Indexes for lightning fast lookups by token or customer
CREATE INDEX IF NOT EXISTS idx_quotes_token ON public.quotes(token);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON public.quotes(customer_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Allow public read access to quotes by token for customer viewing & acceptance
CREATE POLICY "Allow public read access to quotes by token or id"
  ON public.quotes FOR SELECT
  USING (true);

-- Allow public update for digital acceptance (signing and declining)
CREATE POLICY "Allow public update to quote status and signatures"
  ON public.quotes FOR UPDATE
  USING (true);

-- Allow public insert/manage for tradespeople without auth lock
CREATE POLICY "Allow insert quotes"
  ON public.quotes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow all on customers"
  ON public.customers FOR ALL
  USING (true);

CREATE POLICY "Allow all on profiles"
  ON public.profiles FOR ALL
  USING (true);
