# Chuffed Quotes

[![CI](https://github.com/wazzheed79/builderbot/actions/workflows/ci.yml/badge.svg)](https://github.com/wazzheed79/builderbot/actions/workflows/ci.yml)

Chuffed Quotes turns rough job notes into a professional, itemised quote. A tradesperson talks or types the job, checks the prices, and sends a link. The customer opens it on their phone, picks a price if they were offered a choice, and signs. A sent or accepted quote can then become an invoice.

**Live site:** [https://www.chuffedquotes.co.uk](https://www.chuffedquotes.co.uk)

The old addresses `tradematequotes.co.uk` and `www.tradematequotes.co.uk` permanently redirect (HTTP 308) to the same path on the live site. The product was previously called TradeMate, and before that BuilderBot. The GitHub repository is still named `builderbot`. The product name itself lives in `builderbot-app/lib/brand.mjs`.

The app is in a free public beta for UK trades. Card payments are switched off. The first 100 people who join keep it free for 12 months.

## Key features

- Talk or type the job. The quote builder and the home page use the phone’s speech recognition where the browser allows it.
- Signed-in users can ask Google Gemini to turn notes (and optional site photos) into line items and a scope. The reply is checked before it is used. A failed, empty, or unusable reply falls back to a labelled rough estimate.
- Every quantity and rate can be edited. Similar lines can reuse a price the tradesperson has used before.
- One total, or three choices labelled Standard, Better, and Premium. The customer picks one.
- Customers, a business profile (name, logo, terms, bank details), and a dashboard of quotes sent, won value, and win rate.
- A customer link with its own WhatsApp preview. The customer can accept or decline without an account. Views are counted, and the same phone opening the same quote again within a day counts once.
- A WhatsApp share message, and a reminder the tradesperson can send after three days.
- Printable quotes and invoices (the browser’s Print / Save as PDF). Long lines wrap, and pounds show pence.
- A sent or accepted quote can become an invoice (`INV-0001` onwards for that account). Invoices can be edited, shared, printed, and marked paid.
- Quote lines can be saved as a private template. Five built-in trade templates are also available (kitchen, bathroom, roof, driveway, boiler).
- A materials and labour margin calculator.
- Drafts are kept in the browser and offered back after a refresh. Signed-in drafts also upload when the connection returns.
- Quotes are not sent until a real business name is saved. Accepted quotes show bank details only when the tradesperson has saved them.
- Sign-in by email link (opened on `/auth/confirm` when the person taps) or by email and password. A 6-digit code can be typed in when the email shows one.

## How it works

1. **Describe the job.** On the home page or in the quote builder, talk or type a few rough notes.
2. **Check the prices.** The app builds an itemised list. Change any line. Send one price, or Standard, Better, and Premium.
3. **Save and send.** Sign in, save the quote, then share the link or a WhatsApp message. Until it is saved online, the quote stays in that browser.
4. **The customer decides.** They open the link, read the quote, choose an option if one was offered, and accept or decline. They do not need an account.
5. **Invoice.** After the quote is sent or accepted, turn it into an invoice and share or print that too.

New quotes get their own reference (`BB-` plus eight characters). An older shared number such as `BB-1041` is left as it is, unless that same id already belongs to another account, in which case it is given a new reference on save.

## Tech stack

| Piece | What it is |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Icons | `lucide-react` |
| Data and sign-in | Supabase (Postgres, Auth, Storage). The live project is in the EU (London). |
| AI | Google Gemini through `@google/genai`. Default model `gemini-3.5-flash`, overridable with `GEMINI_MODEL`. |
| Hosting | Vercel |
| Errors | Sentry, only when `NEXT_PUBLIC_SENTRY_DSN` is set |
| Usage counts | PostHog, only after the visitor taps Accept on the cookie banner |
| Payments | Stripe code is in the repo. Card payments are switched off in this beta, and the Stripe keys are left blank. |
| Tests and CI | Node’s built-in test runner. GitHub Actions workflow **CI**, job **Lint, Test & Build**. |

## Project structure

```
builderbot-app/                 The Next.js app
  app/                          Pages and API routes
    q/[id]/                     Public customer quote
    i/[token]/                  Public invoice
    api/quote/                  AI generate, AI expand, save, and view counts
  components/                   Navigation, quote editor pieces, consent banner
  lib/                          Quote rules, storage, Gemini, Supabase, brand
  supabase/schema.sql           Full database for a new project
  supabase/migrations/          Incremental SQL for a database that already exists
  scripts/                      Optional local Reddit and X helpers (not part of the website)
  test/                         Unit tests (node --test)
.github/workflows/ci.yml        Lint, Test & Build
```

The product name, tagline, and owner contact are in `builderbot-app/lib/brand.mjs`.

## Local setup

You need Node.js 20 (the version CI uses).

```bash
cd builderbot-app
cp .env.example .env.local
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy names into `.env.local`. Put real values only in that file or in the host’s environment settings. `.env.example` shows placeholders. Do not commit real keys.

| Name | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Optional. Blank keeps the app on rough estimates. |
| `GEMINI_MODEL` | Optional model id. Default `gemini-3.5-flash`. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser). |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only. Used for rate limits and the AI quota. |
| `NEXT_PUBLIC_APP_URL` | Optional public site address, with no trailing slash. |
| `NEXT_PUBLIC_FEEDBACK_EMAIL` | Optional. Blank uses the owner email in `lib/brand.mjs`. |
| `STRIPE_SECRET_KEY` | Leave blank. Card payments are off. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Leave blank. |
| `STRIPE_WEBHOOK_SECRET` | Leave blank. |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional. Blank means no error reports. |
| `SENTRY_ORG` | Optional. Needed only to upload source maps. |
| `SENTRY_PROJECT` | Optional. Needed only to upload source maps. |
| `SENTRY_AUTH_TOKEN` | Optional. Server only. Needed only to upload source maps. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional. Blank means no usage counts. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Optional. Use the EU host for this site. |
| `REDDIT_CLIENT_ID` | Optional. Only for `scripts/reddit-assistant.mjs`. |
| `REDDIT_CLIENT_SECRET` | Optional. Only for that script. |
| `REDDIT_USERNAME` | Optional. Only for that script. |
| `REDDIT_PASSWORD` | Optional. Only for that script. |
| `X_API_KEY` | Optional. Only for `scripts/x-assistant.mjs`. |
| `X_API_SECRET` | Optional. Only for that script. |
| `X_ACCESS_TOKEN` | Optional. Only for that script. |
| `X_ACCESS_SECRET` | Optional. Only for that script. |

AI quoting runs for signed-in users. Each account can run 30 quote builds and 30 scope rewrites in a rolling hour. If the quota check itself fails, the build is allowed and the fault is logged. A stored “limit reached” answer still stops the build. If Gemini returns an error, times out (20 seconds), or sends unusable JSON, the quote uses the rough estimate.

`E2E_BASE_URL` is read by `builderbot-app/test/e2e-live-check.mjs` when you point that script at a deployed site. It is not required for `npm test`.

## Scripts

Run these from `builderbot-app/`:

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm test` | Unit tests (`node --test test/*.test.mjs`) |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm start` | Serve the production build |

Two optional local helpers live next to the app and are not started by the website or by CI:

```bash
node scripts/reddit-assistant.mjs --help
node scripts/x-assistant.mjs --help
```

## Deployment

The live site is hosted on Vercel. Merging to `main` is what ships a new version. Wait until the Vercel deployment says Ready, then use [https://www.chuffedquotes.co.uk](https://www.chuffedquotes.co.uk).

**New Supabase project:** in the SQL editor, run the whole of `builderbot-app/supabase/schema.sql`. That file is the current database, including quotes, invoices, templates, rate limits, and view counting.

**Database that already exists:** run any file in `builderbot-app/supabase/migrations/` that has not been applied yet, in filename order. Those files are safe to run more than once. A fresh project that has just run `schema.sql` does not need them again.

Set the environment variable names from the table above in Vercel. Leave every Stripe variable blank. Sign-in emails are sent from `hello@chuffedquotes.co.uk`. The privacy notice names Resend as the sender. That mail setup is in Supabase, not in this repository.

A longer click-by-click list for a first deploy is in [BETA_SETUP.md](BETA_SETUP.md).

## Monitoring, analytics, and privacy

- **Sentry** receives an error report only when `NEXT_PUBLIC_SENTRY_DSN` is set. Tracing is sampled at 10%. Names, email addresses, phone numbers, addresses, and quote wording are removed before the report is sent. Sentry does not record the screen. Source-map upload runs only when `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` are all set. Otherwise the upload is skipped and production stack traces stay minified.
- **PostHog** starts only after the visitor taps Accept on the cookie banner. It stays off when the key or the host is missing. Customer quote pages (`/q/…`) and customer invoice pages (`/i/…`) are not recorded. A signed-in account is counted by id. The intended host is the EU one (`https://eu.i.posthog.com`).
- The public notice is at `/privacy` on the live site. It names the owner, what is stored, sign-in email, Gemini, Sentry, and PostHog. It is a plain-language beta notice, not legal advice.

## Progress / Changelog

Dates are the dates on the commits. The same history, in [Keep a Changelog](https://keepachangelog.com/) form, is in [CHANGELOG.md](CHANGELOG.md).

### 21 October 2026

- Invoices from a sent or accepted quote, private quote templates, and a permanent redirect from the old TradeMate domain.
- Clearer home page, phone quote editor, and customer quote. Options are named Standard, Better, and Premium on the customer page.
- Gemini replies are checked before use. Rate limits are stored in Supabase. One quote view per phone per day.
- Quote drafts survive a refresh. The AI hourly cap is enforced. Print layout handles long quotes. Accepted quotes no longer invent bank details.
- Sentry error reports and PostHog usage counts, behind the cookie banner.
- If the AI limit check itself errors, the quote is still allowed. Each new quote gets its own reference.
- Optional local Reddit and X helpers, including a public RSS watch that needs no API key.

### 20 October 2026

- A real business name is required before a quote is sent. Privacy and terms match the beta. Email sign-in links open `/auth/confirm` and are used only when the person taps.
- Customer accept and decline errors show inside the sign box.
- Customer links open again. Save and WhatsApp send the lines on the screen. The quote editor fits a narrow phone.
- Each quote can have its own WhatsApp preview picture.
- View counts, a three-day WhatsApp reminder, remembered prices, and Standard / Better / Premium options.
- The shared Gemini model setting, with a rough-estimate fallback when Google fails.

### 19 October 2026

- Home page leads with talking or typing a quote, a founding-member offer, and WhatsApp sharing.
- The rough estimator covers a wider set of UK trades.

### 18 October 2026

- Free public beta under the name Chuffed Quotes. The app starts empty. AI quoting is signed-in only. Card payments switched off. Pages fit a phone.
- Privacy and terms name Michael Boylen and the contact email.
- Voice notes, site photos on a quote, remembered prices, and a customer profile with quotes, jobs, and invoices.
- A live end-to-end check script for the production site.

### 16–17 October 2026

- First usable product: customers, quote builder, voice dictation, five templates, margin calculator, public acceptance page, and dashboard totals.
- Supabase sign-in and cloud sync, Gemini quote generation, and a business profile.
- PWA home-screen install, logo upload, printable site flyer, and job-site photos.
- TradeMate name and `tradematequotes.co.uk` (later redirected).
- Early Stripe subscription and deposit screens. Those payments are switched off for the beta.

### 13 October 2026

- Repository created and the Next.js app added.

## Roadmap

Known follow-ups, in the order they matter:

- **Leaked-password protection.** Supabase Auth has this switched off (checked 22 October 2026). The login page still offers email-and-password sign-up. Turn the check on in the Supabase dashboard under Authentication → Password security. [Supabase’s guide](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) describes the setting. No app code change is required.
- **Sentry source maps.** Upload is already coded, and it stays off until `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` are set on Vercel. Do not commit the token.
- **Hydration warning on `/quotes`.** The quote summary prints today’s date with `new Date()` while the page is rendering (`builderbot-app/app/quotes/QuotesClient.tsx`). That can make the server HTML and the browser disagree. React reports that mismatch as warning #418.
- **Option names.** The quote builder button still says “Good, Better, Best”. The prices it creates, the customer page, and the home page say Standard, Better, and Premium. The button should use the same three words.
- **Card payments.** Stripe routes and plan copy exist. Deposits and paid plans stay off until the beta terms say otherwise.
- **Job board.** Jobs are stored and listed on the customer page. There is no Lead → Paid board yet.
- **Quote numbers on the paperwork.** Stored ids are unique across accounts. A short per-account number (the first quote for that tradesperson, the second, and so on) is still to do.
- **Follow-ups.** The app can open a WhatsApp reminder after three days. It does not send that message by itself.

Longer-term notes (supplier price lookups, a native app, tax summaries) are in [ROADMAP.md](ROADMAP.md) and [AGENTS.md](AGENTS.md). Some older lines in those files still describe card payments as live. The beta behaviour above is the one to trust.

## Keeping this file up to date

Any change that alters what the product does, how to run it, or what is still to do should update this file’s Progress section and [CHANGELOG.md](CHANGELOG.md) in the same pull request. Coding agents are told to do that in [AGENTS.md](AGENTS.md), [GEMINI.md](GEMINI.md), and `.agents/rules/keep-docs-updated.md`. Nothing in the repository commits to `main` by itself.

## Licence and contact

There is no licence file in this repository. All rights reserved. Ask before you copy or reuse the code.

Chuffed Quotes is run by Michael Boylen, a sole trader in the United Kingdom.

Email: [hello@chuffedquotes.co.uk](mailto:hello@chuffedquotes.co.uk)
