# Changelog

All notable changes to Chuffed Quotes are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are the dates on the git commits. The app is not released under version numbers yet, so each entry is a date.

The short version of this list is the Progress section of [README.md](README.md). Update both files in the same pull request when behaviour changes.

## [Unreleased]

### Added

- A short van demo on the home page and at `/walkthrough`. It plays five recorded clips in `builderbot-app/public/audio/walkthrough/` (`step-1.mp3` to `step-5.mp3`), all in the same voice. Together they last about 32 seconds (about 6.9, 8.8, 5.5, 5.2, and 5.4 seconds). Sound starts when you tap, moves on when each clip ends, and stops after the last step. Closing the popup stops the sound. If the sound is muted or cannot play, each step still waits for that clip’s length, so the words are not cut off.
- A root README, this changelog, and standing instructions so later changes update both. Google Antigravity reads `GEMINI.md` and `.agents/rules/keep-docs-updated.md` as well as `AGENTS.md`.
- A try-it page at `/try` for visitors with no account. They can type job notes or tap a decorating, plumbing, or electrics example, then see an itemised quote with Standard, Better, and Premium and a preview of the customer page. The preview uses the placeholder business name “Your Business Name” and never shows bank details. The quote is not saved, emailed, or given a public link. Guests are limited to five builds a day from one network address, through the existing Supabase rate limit (the check still allows the request if the check itself fails). Notes are capped at 800 characters and the AI reply uses the same checks as a signed-in quote. After they create an account, the quote is waiting in the quote builder. The signed-in quote route is unchanged. No database migration.
- PostHog events `demo_started`, `demo_quote_generated`, and `demo_signup_clicked`, only after the visitor accepts the cookie banner. Job notes are not sent.

### Changed

- The home page headline says a quote from the van takes a couple of minutes.
- The demo words match what the app does. The customer types their name to accept. Prices on the demo are an example, not a live merchant price list. The demo no longer says the notes were transcribed on the device, that a signature is IP verified, that you are notified at once, or that both people are sent a contract. It does not say that UK trades already use this flow.
- Sample bank details on the demo are sort code 00-00-00 and account 12345678, labelled as sample. The demo says the names and prices are not a real business.
- The fuse-board example and the consumer-unit template say EIC (the certificate for new electrical work) instead of EICR.
- Buttons on the demo, including close, mute, play, previous, next, Try free, and Back to Chuffed Quotes, are at least 44 pixels tall. The popup is labelled for screen readers, moves focus to Close, puts focus back when it closes, and stops the page behind it from scrolling. Animations stay still when the device asks for less motion.
- Next.js is pinned to 16.4.2. The config no longer repeats `experimental.agentUpgrade: "security"`, which Next.js 16.4.2 already uses when the line is left out.

### Fixed

- The “this browser only” banner no longer appears on `/walkthrough`. `/walkthrough` is included in the sitemap.
- The demo page no longer fails lint on an apostrophe in “driver’s seat” or on unused imports.

## [2026-10-21]

### Added

- Invoices from a sent or accepted quote (`INV-0001` onwards for that account), with edit, share, print, and mark-paid. Public invoice links use `get_public_invoice`. Migration: `builderbot-app/supabase/migrations/20261021140000_invoices_templates_public_link.sql`.
- Private saved quote templates.
- A permanent redirect from `tradematequotes.co.uk` and `www.tradematequotes.co.uk` to the same path on `https://www.chuffedquotes.co.uk` (HTTP 308).
- Sentry error reports when `NEXT_PUBLIC_SENTRY_DSN` is set. Personal details are stripped. Trace sample is 10%. Source-map upload runs only when the org, project, and auth token are all set.
- PostHog usage counts after the visitor taps Accept. Counts stay off without a key and host, and they skip customer quote and invoice pages.
- Optional local helpers: `builderbot-app/scripts/reddit-assistant.mjs` and `builderbot-app/scripts/x-assistant.mjs`. The Reddit script can watch a public RSS feed with no API key.

### Changed

- Home page explains the product in one line, three steps, a short feature list, the free-beta offer, and a FAQ.
- The quote editor on a phone keeps large tap targets, a sticky save action, and totals on screen.
- The customer quote and its printout use a clearer letterhead and labelled line prices.
- Choice prices are named Standard, Better, and Premium on the customer page and the home page. The quote-builder button still says “Good, Better, Best” (see Roadmap in the README).

### Fixed

- Gemini line items and scope text are checked before use. A broken reply falls back to the rough estimate. Prices stay inside the existing limits.
- API rate limits are stored in Supabase, so a new server does not reset them. Migration: `builderbot-app/supabase/migrations/20261021110000_rate_limits_and_view_dedupe.sql`.
- Opening the same quote again on the same phone within a day does not add another view.
- A quote in progress is kept in the browser and offered back after a refresh or a closed tab. Signed-in drafts upload when the connection returns.
- AI builds stop after 30 an hour. The quota and rate-limit checks use the service-role client. If that check itself fails, the quote is allowed and the fault is logged. A stored “limit reached” answer still stops the build.
- Printed quotes wrap long lines, split a long list across pages, and format pounds with pence.
- Accepted quotes show bank details only when they were saved. They no longer invent a bank name or sort code.
- New quotes get their own `BB-` reference. An old number that already belongs to another account is given a new reference on save. Existing quotes, customer links, and invoices keep their current ids.

## [2026-10-20]

### Added

- Each customer link can carry its own WhatsApp preview picture. A link that is not a real quote returns a not-found page.
- Quote view counts, a WhatsApp reminder the tradesperson can send after three days, and remembered prices for the next similar line.
- Standard, Better, and Premium on one quote. The customer picks one.
- `/auth/confirm`, so an email sign-in link is used only when the person taps it. A 6-digit code can still be typed in. Password sign-in remains.
- Sign-in mail is described in the privacy notice as coming from Resend at `hello@chuffedquotes.co.uk`. The mail provider is configured in Supabase, not in this repository.

### Fixed

- Quotes cannot be sent until a real business name is saved.
- Privacy and terms describe the live beta. The home-page example matches the sample en-suite quote, and the free-beta offer matches the terms.
- Accept and decline errors show inside the customer sign box.
- Public quote lookup uses `get_public_quote`, which the anon key may call, because row security hides the quotes table from that key.
- Save and WhatsApp send the lines on the screen. The quote editor fits a 360px-wide phone.
- The shared Gemini model id lives in `builderbot-app/lib/gemini.mjs` (default `gemini-3.5-flash`). A 404, 429, 503, timeout, or unusable JSON falls back to the rough estimate.
- Fallback site URL uses `chuffedquotes.co.uk`.
- `package-lock.json` includes the `qrcode` dependency.

## [2026-10-19]

### Added

- Home page leads with talking or typing a quote, a short notes-to-quote animation, the founding-member offer (first 100 sign-ups, free for 12 months), and a Share on WhatsApp button.
- Wider UK trade coverage in the rough estimator.

### Fixed

- The live end-to-end check accepts the free-beta response that refuses AI quoting for a signed-out visitor.

## [2026-10-18]

### Added

- Product name Chuffed Quotes, set in `builderbot-app/lib/brand.mjs`. A new account starts empty. AI quoting is limited to signed-in users. Card payments are switched off.
- Privacy and terms name Michael Boylen and `hello@chuffedquotes.co.uk`.
- Voice notes and site photos can be sent with an AI quote. Prices the tradesperson edits can be remembered.
- Customer profile page with that customer’s quotes, jobs, and invoices.
- Live production check in `builderbot-app/test/e2e-live-check.mjs`.

### Changed

- Layout stays on the page at phone, tablet, and desktop widths. Pinch-zoom is allowed.

## [2026-10-17]

### Added

- Printable A5 site flyer with a QR code.
- Job-site photo upload with compression in the browser.
- One-tap WhatsApp follow-up message.
- Custom domain `tradematequotes.co.uk` wired through sharing and the flyer. On 21 October 2026 this domain became a redirect to `www.chuffedquotes.co.uk`.

### Changed

- Product name at this point was TradeMate.

## [2026-10-16]

### Added

- Next.js app shell, mobile navigation, landing page, customer directory, quote builder, voice dictation, scope expander, five trade templates, margin calculator, and the public acceptance page (`/q/[id]`).
- Dashboard totals for quotes sent, won value, pending value, and win rate.
- Supabase Auth, cloud sync, row-level security, and the public quote token.
- Server-side Gemini quote generation and scope expansion.
- Business profile: trading name, bank details, logo, and accreditations.
- Customer profile and an activity feed on the dashboard.
- Quote “viewed” status.
- PWA manifest and home-screen icons.
- Early jobs and invoices data, WhatsApp sharing, and a PDF-style print view.
- Stripe subscription and deposit routes. Card collection was later switched off for the free beta (18 October 2026).
- Unit tests and the GitHub Actions workflow **CI** (Lint, Test & Build).
- `AGENTS.md` and `ROADMAP.md`.

### Fixed

- Next.js 16 partial prerendering: dynamic `params` resolved inside `<Suspense>`.
- Production build cleaned of the ESLint errors found at that point.

## [2026-10-13]

### Added

- Repository and the first Next.js application.
