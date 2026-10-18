# Chuffed Quotes roadmap

## Vision
Chuffed Quotes helps builders, plumbers, electricians, roofers, landscapers and other tradespeople create professional quotations. The name lives in `builderbot-app/lib/brand.mjs`.

The goal is to remove paperwork and allow tradespeople to spend more time earning money and less time creating quotes.

**"Less paperwork. More work won."**

---

## Current Status & Progress Tracker

| Milestone | Phase | Description | Status |
| :--- | :--- | :--- | :--- |
| **Foundation** | Current | Next.js 16, TypeScript, Tailwind v4, PWA mobile icon, GitHub Sync | ✅ **Completed** |
| **MVP Core** | Phase 1 | Customer CRM, AI Quoting Engine, PDF Export, Quote Tracking | ✅ **Completed & Tested** |
| **Cloud Hosting & Domain** | Phase 3 | Address is set on the host (`NEXT_PUBLIC_APP_URL`) | ✅ **Completed** |
| **Real Testing** | Phase 2 | Real trade validation (Target: 1st tradesperson saying *"I would pay for this"*) | 🟡 **In Progress** |
| **Monetisation** | Later | Card payments are off during the free beta | ⏸️ **Paused** |
| **Expansion** | Phase 5 | Team tools, automated follow-ups, £1,000/mo MRR | ⏳ **Upcoming** |

---

# Phase 1 - MVP (Minimum Viable Product)
**Goal:** Get one real trade professional using the software.

### Customer Management
- [x] Add customer
- [x] Edit customer
- [x] Delete customer
- [x] View customer job & quote history

### Quote Generator
- [x] Enter job description
- [x] Itemize materials & trade supplier pricing
- [x] Calculate labour hours and daily rates
- [x] AI quote breakdown with UK trade intelligence (Gemini 2.5 Flash / Smart Rules)

### PDF & Customer Portal
- [x] Create professional branded PDF
- [x] Digital customer acceptance & signature
- [x] Download & print capability
- [x] Instant WhatsApp & SMS sharing

### Quote Tracking
- [x] Draft
- [x] Sent
- [x] Accepted
- [x] Rejected
- [x] Paid

---

# Phase 2 - Real World Testing
**Goal:** Gather candid feedback from 1 to 5 local tradespeople.

### Target Trades
- General Builders
- Plumbers & Heating Engineers
- Electricians
- Landscapers & Groundworkers
- Roofers & Carpenters

### Success Metric
One working tradesperson says: **"I would pay for this."**

---

# Phase 3 - Online Infrastructure
**Goal:** Fast, reliable, zero-maintenance global deployment.

- [x] **Vercel Cloud:** Live at `https://builderbot-app.vercel.app`
- [x] **PWA Mobile App:** "Add to Home Screen" enabled for iOS & Android
- [x] **Supabase Database:** Multi-device database schema & real-time sync ready
- [x] **Custom Domain:** Set on the host. Do not hardcode it in the app.

---

# Phase 4 - Payments & Monetisation
**Goal:** Generate first recurring subscription revenue (£100 MRR).

### Stripe Subscription Plans
1. **Free Starter** (£0)
   - 5 quotes per month
   - Core PDF generation
   - Card payments are off during the free beta
2. **Pro - Founder Early Bird** (£9.99/month, moving to £14.99/month)
   - Unlimited quotes & invoices
   - Custom business logo & brand colours on PDFs
   - Complete customer CRM database
   - 1-tap customer WhatsApp dispatch
3. **Business & Team** (£24.99/month)
   - Multiple vans / team members
   - Advanced profit margin calculator
   - Priority phone & email support

---

# Phase 5 - Growth & Scaling
**Goal:** Reach £1,000+ recurring monthly revenue.

### Revenue Ladder
- **First Paying Customer:** £10/month
- **First 10 Customers:** £100/month
- **First 100 Customers:** £1,000/month
- **First 1,000 Customers:** £10,000/month

---

# Founder Note
*By Michael Boylen*

> *"Chuffed Quotes is being built as a real-world learning project.*  
> *The mission is simple: Help tradespeople win more work while spending less time on paperwork.*  
> *Every feature we build must serve this mission."*
