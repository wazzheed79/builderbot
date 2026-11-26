-- Rebooking reminders on jobs ("remind me to rebook this customer in 12 months").
-- Safe to run more than once. Apply this in the Supabase SQL editor.
--
-- 1. jobs.rebook_due: the London calendar date the reminder is due. Null means no reminder.
-- 2. jobs.rebook_months: months between visits (1 to 60), used to set the next one.
--
-- The app works before this runs: jobs save without the two columns, and the
-- reminder stays on that phone only.

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS rebook_due DATE;
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS rebook_months INT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'jobs_rebook_months_range'
      AND conrelid = 'public.jobs'::regclass
  ) THEN
    ALTER TABLE public.jobs
      ADD CONSTRAINT jobs_rebook_months_range
      CHECK (rebook_months IS NULL OR (rebook_months >= 1 AND rebook_months <= 60));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_jobs_owner_rebook_due
  ON public.jobs(owner_id, rebook_due)
  WHERE rebook_due IS NOT NULL;
