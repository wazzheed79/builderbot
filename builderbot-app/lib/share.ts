/**
 * Trade-optimized sharing and communication suite for BuilderBot.
 * Handles WhatsApp deep linking, UK phone normalization, and message templating.
 */

export interface ShareQuoteParams {
  quoteId: string;
  token: string;
  clientName: string;
  clientPhone?: string;
  quoteTitle: string;
  companyName?: string;
  contractorName?: string;
  total: number;
  deposit: number;
  depositPercent: number;
  validityDays?: number;
}

/**
 * Normalizes phone numbers to international format without spaces or symbols.
 * Handles UK numbers (e.g. 07911 123456 -> 447911123456, +44 7911 -> 447911).
 */
export function normalizePhoneNumber(phone: string): string {
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
export function formatWhatsAppQuoteMessage(params: ShareQuoteParams, siteOrigin: string): string {
  const quoteUrl = `${siteOrigin}/q/${params.token || params.quoteId}`;
  const sender = params.companyName || params.contractorName || "our trade team";
  const firstName = params.clientName.trim().split(" ")[0] || "there";

  const depositText =
    params.deposit > 0
      ? `\n*Deposit Required:* £${params.deposit.toFixed(2)} (${params.depositPercent}%)`
      : "";

  return (
    `Hi ${firstName},\n\n` +
    `Here is your official quotation for *"${params.quoteTitle || "the planned works"}"* from *${sender}*:\n\n` +
    `👉 *Review & Approve Online:* ${quoteUrl}\n\n` +
    `*Total Price:* £${params.total.toFixed(2)}` +
    `${depositText}\n` +
    `*Quotation Ref:* ${params.quoteId}\n\n` +
    `You can review the full itemized scope, terms, and sign off digitally from your phone. Let us know if you have any questions!\n\n` +
    `Kind regards,\n${sender}`
  );
}

/**
 * Generates the full WhatsApp URL with encoded message text.
 */
export function getWhatsAppShareUrl(params: ShareQuoteParams, siteOrigin: string): string {
  const message = formatWhatsAppQuoteMessage(params, siteOrigin);
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
export function getEmailShareUrl(
  params: ShareQuoteParams,
  clientEmail: string,
  siteOrigin: string
): string {
  const subject = encodeURIComponent(
    `Quotation Ref: ${params.quoteId} — ${params.quoteTitle || "Planned Works"} (${params.companyName || "BuilderBot"})`
  );
  const body = encodeURIComponent(formatWhatsAppQuoteMessage(params, siteOrigin));
  return `mailto:${clientEmail}?subject=${subject}&body=${body}`;
}

export interface ShareInvoiceParams {
  invoiceId: string;
  clientName: string;
  clientPhone?: string;
  title: string;
  companyName?: string;
  contractorName?: string;
  total: number;
  balanceDue: number;
  dueDate?: string;
  bankSortCode?: string;
  bankAccountNumber?: string;
  bankName?: string;
}

/**
 * Formats a clear, professional WhatsApp invoice / payment request.
 */
export function formatWhatsAppInvoiceMessage(params: ShareInvoiceParams): string {
  const sender = params.companyName || params.contractorName || "our trade team";
  const firstName = params.clientName.trim().split(" ")[0] || "there";

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
export function getWhatsAppInvoiceShareUrl(params: ShareInvoiceParams): string {
  const message = formatWhatsAppInvoiceMessage(params);
  const cleanPhone = normalizePhoneNumber(params.clientPhone || "");
  const encoded = encodeURIComponent(message);

  if (cleanPhone) {
    return `https://wa.me/${cleanPhone}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

