/**
 * Sharing helpers for quote and invoice messages.
 * Handles WhatsApp deep linking, UK phone normalization, and message templating.
 */

import {
  normalizePhoneNumber as rawNormalizePhoneNumber,
  formatWhatsAppQuoteMessage as rawFormatWhatsAppQuoteMessage,
  getWhatsAppShareUrl as rawGetWhatsAppShareUrl,
  formatWhatsAppInvoiceMessage as rawFormatWhatsAppInvoiceMessage,
  getWhatsAppInvoiceShareUrl as rawGetWhatsAppInvoiceShareUrl,
  getEmailShareUrl as rawGetEmailShareUrl,
  formatWhatsAppFollowUpMessage as rawFormatWhatsAppFollowUpMessage,
  getWhatsAppFollowUpUrl as rawGetWhatsAppFollowUpUrl,
} from "./share-rules.mjs";

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

export const normalizePhoneNumber = rawNormalizePhoneNumber as (phone: string) => string;

export const formatWhatsAppQuoteMessage = rawFormatWhatsAppQuoteMessage as (
  params: ShareQuoteParams,
  siteOrigin: string
) => string;

export const getWhatsAppShareUrl = rawGetWhatsAppShareUrl as (
  params: ShareQuoteParams,
  siteOrigin: string
) => string;

export const formatWhatsAppInvoiceMessage = rawFormatWhatsAppInvoiceMessage as (
  params: ShareInvoiceParams
) => string;

export const getWhatsAppInvoiceShareUrl = rawGetWhatsAppInvoiceShareUrl as (
  params: ShareInvoiceParams
) => string;

export const getEmailShareUrl = rawGetEmailShareUrl as (
  params: ShareQuoteParams,
  clientEmail: string,
  siteOrigin: string
) => string;

export const formatWhatsAppFollowUpMessage = rawFormatWhatsAppFollowUpMessage as (
  params: ShareQuoteParams,
  siteOrigin: string
) => string;

export const getWhatsAppFollowUpUrl = rawGetWhatsAppFollowUpUrl as (
  params: ShareQuoteParams,
  siteOrigin: string
) => string;

