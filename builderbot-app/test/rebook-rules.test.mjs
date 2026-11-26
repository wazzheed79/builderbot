import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  addMonthsIso,
  cleanRebookDate,
  cleanRebookMonths,
  daysBetweenIso,
  formatRebookDate,
  formatRebookMessage,
  getWhatsAppRebookUrl,
  nextRebookAfterDone,
  rebookDueLabel,
  rebookFields,
  rebookingsDue,
} from "../lib/rebook-rules.mjs";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("months and dates are cleaned", () => {
  assert.equal(cleanRebookMonths("12"), 12);
  assert.equal(cleanRebookMonths(0), undefined);
  assert.equal(cleanRebookMonths(61), undefined);
  assert.equal(cleanRebookMonths("soon"), undefined);
  assert.equal(cleanRebookDate("2027-02-28"), "2027-02-28");
  assert.equal(cleanRebookDate("2027-02-30"), undefined);
  assert.equal(cleanRebookDate("2027-11-26T10:00:00Z"), "2027-11-26");
  assert.equal(cleanRebookDate(null), undefined);
});

test("adding months keeps the end of the month real", () => {
  assert.equal(addMonthsIso("2026-11-26", 12), "2027-11-26");
  assert.equal(addMonthsIso("2026-11-26", 6), "2027-05-26");
  assert.equal(addMonthsIso("2027-01-31", 1), "2027-02-28");
  assert.equal(addMonthsIso("2028-01-31", 1), "2028-02-29");
  assert.equal(addMonthsIso("2026-08-31", 24), "2028-08-31");
  assert.equal(addMonthsIso("bad", 12), "");
});

test("days between dates", () => {
  assert.equal(daysBetweenIso("2026-11-26", "2026-12-26"), 30);
  assert.equal(daysBetweenIso("2026-11-26", "2026-11-20"), -6);
  // Clocks going back in October do not change the count.
  assert.equal(daysBetweenIso("2026-10-24", "2026-10-26"), 2);
});

test("choosing a reminder sets the due date, and 0 clears it", () => {
  assert.deepEqual(rebookFields("2026-11-26", 12), { rebookMonths: 12, rebookDue: "2027-11-26" });
  assert.deepEqual(rebookFields("2026-11-26", 0), { rebookMonths: undefined, rebookDue: undefined });
  assert.deepEqual(rebookFields("2026-11-26", ""), { rebookMonths: undefined, rebookDue: undefined });
});

test("marking a rebooking done moves it on one interval", () => {
  assert.deepEqual(nextRebookAfterDone({ rebookDue: "2027-11-26", rebookMonths: 12 }, "2027-11-20"), {
    rebookMonths: 12,
    rebookDue: "2028-11-26",
  });
  // Very late: the next one counts from today, not from a date already gone.
  assert.deepEqual(nextRebookAfterDone({ rebookDue: "2025-01-10", rebookMonths: 6 }, "2026-11-26"), {
    rebookMonths: 6,
    rebookDue: "2027-05-26",
  });
  // No months saved: a year.
  assert.equal(nextRebookAfterDone({ rebookDue: "2026-11-26" }, "2026-11-26").rebookDue, "2027-11-26");
});

test("only overdue and soon-due reminders show, soonest first", () => {
  const jobs = [
    { id: "a", rebookDue: "2027-01-10" },
    { id: "b", rebookDue: "2026-12-10" },
    { id: "c", rebookDue: "2026-11-01" },
    { id: "d" },
    { id: "e", rebookDue: "not a date" },
  ];
  const rows = rebookingsDue(jobs, "2026-11-26");
  assert.deepEqual(rows.map((row) => row.job.id), ["c", "b"]);
  assert.deepEqual(rows.map((row) => row.daysUntil), [-25, 14]);
  assert.deepEqual(rebookingsDue(jobs, "nope"), []);
  assert.deepEqual(rebookingsDue(null, "2026-11-26"), []);
});

test("labels read naturally", () => {
  assert.equal(rebookDueLabel(-3), "3 days overdue");
  assert.equal(rebookDueLabel(-1), "1 day overdue");
  assert.equal(rebookDueLabel(0), "Due today");
  assert.equal(rebookDueLabel(1), "Due tomorrow");
  assert.equal(rebookDueLabel(9), "Due in 9 days");
  assert.equal(formatRebookDate("2027-11-26"), "26 November 2027");
});

test("the customer message uses first name, business, job and interval", () => {
  const text = formatRebookMessage({
    clientName: "Sarah Jones",
    companyName: "Boylen Heating",
    jobTitle: "Boiler service",
    months: 12,
  });
  assert.match(text, /^Hi Sarah, it's Boylen Heating\./);
  assert.match(text, /about a year since we did your boiler service/);
  assert.match(formatRebookMessage({ months: 24 }), /^Hi, .*about 2 years since we did the last job/);
  assert.match(formatRebookMessage({ months: 6 }), /about 6 months/);
});

test("WhatsApp link goes to the customer's UK number when there is one", () => {
  assert.match(getWhatsAppRebookUrl({ clientPhone: "07911 123456", jobTitle: "Gutter clean" }), /^https:\/\/wa\.me\/447911123456\?text=/);
  assert.match(getWhatsAppRebookUrl({ jobTitle: "Gutter clean" }), /^https:\/\/wa\.me\/\?text=/);
});

test("the database and app carry the reminder fields", () => {
  const migration = read("supabase/migrations/20261126120000_job_rebook_reminders.sql");
  assert.match(migration, /ADD COLUMN IF NOT EXISTS rebook_due DATE/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS rebook_months INT/);
  const schema = read("supabase/schema.sql");
  assert.match(schema, /rebook_due DATE/);
  const cloud = read("lib/supabase.ts");
  assert.match(cloud, /rebook_due/);
  assert.match(cloud, /OPTIONAL_JOB_COLUMNS/);
  const dashboard = read("app/dashboard/page.tsx");
  assert.match(dashboard, /<RebookDue \/>/);
});
