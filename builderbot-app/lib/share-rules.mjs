/**
 * Trade message templates shared by the app and the Node tests.
 */
import { displayBusinessName } from "./business-name.mjs";

/**
 * Normalizes phone numbers to international format without spaces or symbols.
 * Handles UK numbers (e.g. 07911 123456 -> 447911123456, +44 7911 -> 447911).
 */
export function normalizePhoneNumber(phone) {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9+]/g, "");

  if (cleaned.startsWith("+")) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith("07") && cleaned.length === 11) {
    // UK mobile leading zero
    cleaned = `44${cleaned.substring(1)}`;
  } else if (cleaned.startsWith("0") && cleaned.length >= 10) {
    // UK landline leading zero
    cleaned = `44${cleaned.substring(1)}`;
  }

  return cleaned;
}

/**
 * Formats a high-converting, professional WhatsApp quote invitation.
 */
export function formatWhatsAppQuoteMessage(params, siteOrigin) {
  const quoteUrl = `${siteOrigin}/q/${params.token || params.quoteId}`;
  const company = displayBusinessName(params.companyName, params.contractorName);
  const firstName = (params.clientName || "").trim().split(" ")[0] || "there";
  const job = params.quoteTitle || "the job";

  return `Hi ${firstName}, here's your quote from ${company} for ${job}: ${quoteUrl}`;
}

/**
 * Generates the full WhatsApp URL with encoded message text.
 */
export function getWhatsAppShareUrl(params, siteOrigin) {
  const message = formatWhatsAppQuoteMessage(params, siteOrigin);
  const cleanPhone = normalizePhoneNumber(params.clientPhone || "");
  const encoded = encodeURIComponent(message);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Formats a clear, professional WhatsApp invoice / payment request.
 */
export function formatWhatsAppInvoiceMessage(params) {
  const sender = displayBusinessName(params.companyName, params.contractorName);
  const firstName = (params.clientName || "").trim().split(" ")[0] || "there";

  let bankDetails = "";
  if (params.bankSortCode && params.bankAccountNumber) {
    bankDetails =
      `\n\n*Direct Bank Payment Details:*\n` +
      (params.bankName ? `Bank: ${params.bankName}\n` : "") +
      `Sort Code: ${params.bankSortCode}\n` +
      `Account: ${params.bankAccountNumber}\n` +
      `Payment Reference: ${params.invoiceId}`;
  }

  return (
    `Hi ${firstName},\n\n` +
    `Please find details for invoice *${params.invoiceId}* (*"${params.title}"*) from *${sender}*:\n\n` +
    `*Invoice Total:* £${params.total.toFixed(2)}\n` +
    `*Balance Due:* £${params.balanceDue.toFixed(2)}\n` +
    (params.dueDate ? `*Payment Due:* ${params.dueDate}\n` : "") +
    `${bankDetails}\n\n` +
    `Please reply or let us know once transferred so we can issue your receipt. Thank you!\n\n` +
    `Kind regards,\n${sender}`
  );
}

/**
 * Generates a 1-tap WhatsApp URL for invoice payment notifications.
 */
export function getWhatsAppInvoiceShareUrl(params) {
  const message = formatWhatsAppInvoiceMessage(params);
  const cleanPhone = normalizePhoneNumber(params.clientPhone || "");
  const encoded = encodeURIComponent(message);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

/**
 * Generates an Email mailto: link for sending the quotation.
 */
export function getEmailShareUrl(params, clientEmail, siteOrigin) {
  const subject = encodeURIComponent(
    `Quotation Ref: ${params.quoteId} — ${params.quoteTitle || "Planned Works"} (${displayBusinessName(params.companyName, params.contractorName)})`
  );
  const body = encodeURIComponent(formatWhatsAppQuoteMessage(params, siteOrigin));
  return `mailto:${clientEmail}?subject=${subject}&body=${body}`;
}

/**
 * Formats a warm, non-pushy trade follow-up message for quotes pending acceptance.
 */
export function formatWhatsAppFollowUpMessage(params, siteOrigin) {
  const quoteUrl = `${siteOrigin}/q/${params.token || params.quoteId}`;
  const sender = displayBusinessName(params.companyName, params.contractorName);
  const firstName = (params.clientName || "").trim().split(" ")[0] || "there";

  return (
    `Hi ${firstName}, hope you're having a good week!\n\n` +
    `Just following up on the quotation for *"${params.quoteTitle || "the planned works"}"* that I sent over recently.\n\n` +
    `You can review the quote and details anytime here:\n` +
    `👉 ${quoteUrl}\n\n` +
    `Let me know if you have any questions or if you'd like to adjust anything in the scope. Happy to pencil the dates in our calendar whenever you're ready!\n\n` +
    `Kind regards,\n${sender}`
  );
}

/**
 * Generates the full WhatsApp URL for 1-tap quote follow-up.
 */
export function getWhatsAppFollowUpUrl(params, siteOrigin) {
  const message = formatWhatsAppFollowUpMessage(params, siteOrigin);
  const cleanPhone = normalizePhoneNumber(params.clientPhone || "");
  const encoded = encodeURIComponent(message);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

