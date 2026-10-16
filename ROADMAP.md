# BuilderBot Roadmap

## Mission

BuilderBot is an AI-powered quoting platform designed for builders, plumbers, electricians, roofers, landscapers and other tradespeople.

The goal is simple:

> **Create and send a professional quote in under two minutes from a mobile phone.**

---

# Core Vision

Most tradespeople waste hours each week creating quotes, chasing customers and managing paperwork from the van or late at night.

BuilderBot automates this process by combining customer records, AI quote itemisation, real-time margin calculation, PDF generation, digital acceptance, and quote tracking into a single mobile-first platform.

---

# Current Technology Stack

- **Framework**: Next.js 16 (App Router, Turbopack) & React 19
- **Language**: TypeScript (`strict: true`)
- **Styling**: Tailwind CSS v4
- **Database & Auth**: Supabase (PostgreSQL with Row Level Security, Secure Stored Procedures)
- **AI Engine**: Google Gemini API (`@google/genai`, `gemini-2.5-flash`)
- **Validation & Testing**: Zod schemas, Node.js native test runner (`node:test`)
- **Payments**: Stripe (Planned)
- **Hosting & CI**: Vercel & GitHub Actions CI

---

# Minimum Viable Product (MVP)

## Customer Management

Create and manage customer records.

### Current Customer Fields
- Full Name
- Company (optional)
- Phone Number
- Email Address
- Address
- Notes
- Created Timestamp

### Future Fields
- Property Type (Residential / Commercial)
- Last Quote Date
- Preferred Contact Method (WhatsApp / Phone / Email)
- Lead Source (Referral / Checkatrade / Google / Repeat)

---

## Dashboard Metrics

Provide users with a clear, instant overview of their trade business.

### Dashboard Widgets
- Total Customers
- Quotes Sent
- Quotes Accepted
- Quotes Rejected
- Win Rate %
- Revenue Won (£)
- Outstanding / Pending Quotes (£)

---

## Quote Builder

Create professional quotes in seconds with live calculation.

### Features
- Select existing customer or enter custom details
- 1-click trade job templates (Bathrooms, Kitchens, Roofing, Driveways, Boilers)
- Add materials, labor hours, and service/skip costs
- Real-time margin & day-rate calculator (Net cost, Markup %, Days on site, Operatives)
- Automatic VAT (20%) and custom deposit percentages (0% – 50%)
- Save drafts and issue live customer links

---

## AI Quote Generation & Polishing

User enters or dictates simple site notes.

*Example:*
> "20m timber fence. Remove old fence and dispose of waste."

*Gemini AI generates:*
- Clear professional scope of works
- Itemized trade materials list with quantities and market unit rates
- Labour hours breakdown and day rates
- Waste disposal / licensed skip hire costs
- Customer-facing professional job summary

---

## PDF Generation & Clean Printing

Generate professional, client-ready quotes.

### Features
- Company branding & business address
- Clean `@media print` layout optimized for A4 paper and PDF export
- Quote reference number and secure link
- Customer details & site address
- Itemized cost breakdown
- Terms and conditions & payment schedule

---

## Quote Tracking & Status Lifecycle

Track every stage of quote delivery.

### Statuses
- **Draft** (Grey): In progress, not yet shared with client
- **Sent** (Blue): Issued to client via unguessable link or WhatsApp
- **Viewed** (Amber): Customer has opened the quote link on their device
- **Accepted** (Green): Customer digitally signed and accepted terms
- **Rejected** (Red): Customer declined with optional reason
- **Expired** (Slate): Passed validity period (e.g. 30 days)

---

# Jobs Module (Next Major Architecture Step)

Allow customers to have multiple distinct projects or quote revisions.

## Hierarchy
```text
Customer
└── Jobs (e.g., "14 Victoria Rd - Kitchen Extension")
    ├── Quotes (Draft -> Sent -> Viewed -> Accepted)
    │   └── Revisions / Variation Orders
    ├── Site Survey Photos
    └── Invoices & Receipts
```

---

# Photo & Media Uploads

Allow trades to capture and attach media directly from mobile cameras:
- Site survey photos (pre-work conditions)
- Architectural plans / drawings
- Mid-job progress photos
- Signed completion proof photos

*Storage*: Supabase Storage buckets secured per authenticated user.

---

# Future & Commercial Features

## Reminder System
Automatically generate reminders:
- Follow up quote after 3, 7, and 14 days
- Chase overdue deposit payments
- Schedule annual boiler service or warranty check-ins

## AI Follow-Up Generator
Generate tailored, professional chase-ups based on quote status:
- WhatsApp messages (1-tap open in WhatsApp app)
- SMS text messages
- Polite email follow-ups

## Business Profile & Branding
- Company Name & Trading Name
- Logo & Accreditations (Gas Safe, NICEIC, FMB)
- VAT Registration Number
- Bank Sort Code & Account Number (revealed only upon quote acceptance)
- Standard Payment Terms (7, 14, 30 days)
- Standard Quote Validity (14, 30, 60 days)

## Stripe Payment Integration
- Collect quote deposit immediately upon digital signature
- Card payments, Apple Pay & Google Pay
- Instant webhook updates to flip quote to "Deposit Paid"

---

# Mobile First Strategy

The platform must be 100% functional and friction-free on:
- iPhone (Safari / iOS PWA)
- Android (Chrome / Android PWA)
- iPad / Tablet

Most tradespeople create quotes in their van, on site, or during merchant visits. Mobile responsiveness, large tap targets, and camera/mic integration take priority over desktop-only features.

---

# Development Roadmap

## Phase 1: Core Foundation ✅
- [x] Landing Page
- [x] Customer Directory (Add, View, Edit, Link)
- [x] Dashboard Metrics & Key Trade Numbers
- [x] Local Storage Cache with Mock Seed Data

## Phase 2: Hardened Quoting & Security ✅
- [x] Dynamic Quote Builder with Line Items
- [x] Server-Side Gemini AI Generation & Scope Expansion (`@google/genai`)
- [x] Web Speech API Voice Dictation
- [x] Labour & Margin Calculator
- [x] 1-Click Trade Job Templates
- [x] Public Customer Quote Page with Digital Signature (`/q/[token]`)
- [x] WhatsApp Share Integration
- [x] Supabase Row Level Security (RLS) with Authenticated `owner_id`
- [x] Cryptographic Quote Tokens (`q_...`)
- [x] Rate Limiting & Zod Input Validation
- [x] Print-to-PDF `@media print` Styles
- [x] Unit Test Suite (`node:test`) & GitHub Actions CI

## Phase 3: Tracking, Jobs & Site Media 🚀 (Current Focus)
- [x] Real-time Quote "Viewed" tracking (records `viewed_at` when customer opens link)
- [ ] Jobs Module (`Customer -> Jobs -> Quotes`)
- [ ] Supabase Storage photo uploads (before / survey / progress)
- [ ] Automatic Quote Expiry enforcement based on `quote_validity_days`
- [ ] 1-Tap WhatsApp chase messages

## Phase 4: Payments & Delivery
- [ ] Stripe deposit checkout on quote acceptance
- [ ] Customer acceptance receipt email (via Resend)
- [ ] SMS quote notification (via Twilio)
- [ ] Audit log export (IP address, signature, timestamp)

## Phase 5: Trade Intelligence & Mobile App
- [ ] Common materials cost database (Timber, Bricks, Cement, Pipework)
- [ ] Full offline capability with background sync
- [ ] Installable PWA with push notifications

---

# Long-Term Goal

BuilderBot should become the standard quoting tool for UK & international trades.

A tradesperson can:
1. Walk a job and speak their notes into their phone.
2. Let AI generate the materials and labour breakdown.
3. Check their profit margin with one tap.
4. Send a WhatsApp link with a professional quote.
5. See when the client views the quote.
6. Collect digital signature and deposit in under two minutes.
