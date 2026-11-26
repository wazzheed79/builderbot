/**
 * Rebooking reminders: "remind me to rebook this customer in 12 months".
 * A reminder lives on a job as a due date (YYYY-MM-DD, London calendar) and
 * the number of months between visits. Shared by the app and the Node tests.
 * Shown in the app only. Nothing is emailed or sent by itself.
 */
import { displayBusinessName } from "./business-name.mjs";
import { normalizePhoneNumber } from "./share-rules.mjs";

/** The choices offered on a finished job. */
export const REBOOK_MONTH_CHOICES = [6, 12, 24];

/** Reminders show on the dashboard this many days before they are due. */
export const REBOOK_WINDOW_DAYS = 30;

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * @param {unknown} value
 * @returns {number | undefined} Whole months from 1 to 60, or undefined.
 */
export function cleanRebookMonths(value) {
  const months = Math.round(Number(value));
  if (!Number.isFinite(months) || months < 1 || months > 60) return undefined;
  return months;
}

/**
 * @param {unknown} value
 * @returns {string | undefined} A real YYYY-MM-DD date, or undefined.
 */
export function cleanRebookDate(value) {
  if (typeof value !== "string") return undefined;
  const iso = value.trim().slice(0, 10);
  if (!DATE_ONLY.test(iso)) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return undefined;
  return iso;
}

/**
 * Add whole months to a YYYY-MM-DD date. 31 January plus 1 month is 28 or 29 February.
 * @param {string} iso
 * @param {number} months
 * @returns {string}
 */
export function addMonthsIso(iso, months) {
  const clean = cleanRebookDate(iso);
  if (!clean) return "";
  const [y, m, d] = clean.split("-").map(Number);
  const totalMonths = y * 12 + (m - 1) + Math.round(Number(months) || 0);
  const year = Math.floor(totalMonths / 12);
  const monthIndex = totalMonths - year * 12;
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const day = Math.min(d, lastDay);
  return `${String(year).padStart(4, "0")}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Whole days from one YYYY-MM-DD date to another. Negative when `to` is earlier.
 * @param {string} from
 * @param {string} to
 */
export function daysBetweenIso(from, to) {
  const a = cleanRebookDate(from);
  const b = cleanRebookDate(to);
  if (!a || !b) return NaN;
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY_MS);
}

/**
 * The reminder fields to save on a job, or both cleared when months is 0 / empty.
 * @param {string} todayIso
 * @param {unknown} months
 * @returns {{ rebookMonths?: number, rebookDue?: string }}
 */
export function rebookFields(todayIso, months) {
  const clean = cleanRebookMonths(months);
  const due = clean ? addMonthsIso(todayIso, clean) : "";
  if (!clean || !due) return { rebookMonths: undefined, rebookDue: undefined };
  return { rebookMonths: clean, rebookDue: due };
}

/**
 * After the trade has rebooked the customer, the next reminder is one more
 * interval after the old due date. If that is still not in the future (a very
 * late rebook), it counts from today.
 * @param {{ rebookDue?: string, rebookMonths?: number }} job
 * @param {string} todayIso
 * @returns {{ rebookMonths?: number, rebookDue?: string }}
 */
export function nextRebookAfterDone(job, todayIso) {
  const months = cleanRebookMonths(job?.rebookMonths) || 12;
  const due = cleanRebookDate(job?.rebookDue);
  let next = due ? addMonthsIso(due, months) : "";
  if (!next || daysBetweenIso(todayIso, next) <= 0) next = addMonthsIso(todayIso, months);
  return { rebookMonths: months, rebookDue: next || undefined };
}

/**
 * Jobs whose rebooking reminder is overdue or due within the window, soonest first.
 * @template {{ rebookDue?: string }} J
 * @param {J[]} jobs
 * @param {string} todayIso
 * @param {number} [windowDays]
 * @returns {{ job: J, daysUntil: number }[]}
 */
export function rebookingsDue(jobs, todayIso, windowDays = REBOOK_WINDOW_DAYS) {
  if (!Array.isArray(jobs) || !cleanRebookDate(todayIso)) return [];
  return jobs
    .map((job) => ({ job, daysUntil: daysBetweenIso(todayIso, cleanRebookDate(job?.rebookDue) || "") }))
    .filter((row) => Number.isFinite(row.daysUntil) && row.daysUntil <= windowDays)
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/** @param {number} days */
export function rebookDueLabel(days) {
  if (!Number.isFinite(days)) return "";
  if (days < -1) return `${-days} days overdue`;
  if (days === -1) return "1 day overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

/** @param {number} months */
export function rebookIntervalWords(months) {
  const clean = cleanRebookMonths(months) || 12;
  if (clean === 12) return "a year";
  if (clean % 12 === 0) return `${clean / 12} years`;
  if (clean === 1) return "a month";
  return `${clean} months`;
}

/**
 * Long UK date for the app, e.g. 26 November 2027.
 * @param {string} iso
 */
export function formatRebookDate(iso) {
  const clean = cleanRebookDate(iso);
  if (!clean) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${clean}T00:00:00Z`)
  );
}

/**
 * The message the trade sends when a rebooking is due.
 * @param {{ clientName?: string, companyName?: string, ownerName?: string, jobTitle?: string, months?: number }} params
 */
export function formatRebookMessage(params) {
  const first = String(params?.clientName || "").trim().split(/\s+/)[0] || "";
  const greeting = first ? `Hi ${first},` : "Hi,";
  const business = displayBusinessName(params?.companyName, params?.ownerName);
  const job = String(params?.jobTitle || "").trim();
  const what = job ? `your ${job.charAt(0).toLowerCase()}${job.slice(1)}` : "the last job";
  const since = rebookIntervalWords(params?.months);
  return `${greeting} it's ${business}. It's about ${since} since we did ${what}, so it may be due again. Would you like me to book you in? Just reply with a day that suits.`;
}

/**
 * WhatsApp link with the rebook message, sent to the customer's number when there is one.
 * @param {{ clientName?: string, clientPhone?: string, companyName?: string, ownerName?: string, jobTitle?: string, months?: number }} params
 */
export function getWhatsAppRebookUrl(params) {
  const text = encodeURIComponent(formatRebookMessage(params));
  const phone = normalizePhoneNumber(params?.clientPhone || "");
  return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
}
