# Changelog

All notable changes to Chuffed Quotes are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Dates are the dates on the git commits. The app is not released under version numbers yet, so each entry is a date.

The short version of this list is the Progress section of [README.md](README.md). Update both files in the same pull request when behaviour changes.

## [Unreleased]

### Added

- Quotes now say when materials were priced and how long the prices hold: "Materials priced on 5 Nov 2026. Prices valid for 30 days." It uses the date the quote was made and the validity days in Settings, and sits under Payment & Deposit Terms on the customer quote and its printout. No database migration.
- Download CSV for Xero, on the Invoices page. One row per invoice line, in Xero's invoice import layout, with dates as DD/MM/YYYY, prices excluding VAT, the tax type "20% (VAT on Income)" or "No VAT", and account code 200. Cells that start with =, +, - or @ are neutralised so a spreadsheet cannot run them as a formula. A deposit already paid is not part of the file. Xero shows the full invoice and you record the deposit in Xero. QuickBooks is not included yet. No database migration.
- VAT on quotes and invoices. In Settings, VAT registered is off until you turn it on. You can add a VAT number (9 digits, with or without GB). When you are registered, a quote and an invoice show Subtotal (ex VAT), VAT (20%), and Total inc VAT, and the VAT number if you entered one. Prices you type, and AI prices, are excluding VAT. Standard, Better, and Premium stay 15% and 30% of that net price, and VAT is added after. When you are not registered, the paperwork shows the total and “Not VAT registered - no VAT charged”. An older quote with no VAT flag is treated as not registered. Migration (optional, apply it yourself in the Supabase SQL editor; this change does not touch the live database): `builderbot-app/supabase/migrations/20261105143000_vat_default_not_registered.sql`. It only changes the default for a new row that forgets to say. The app works if you do not run it. Existing quotes are not rewritten.
- A typed acceptance record for a customer who accepts a quote. It stores the name they typed, the time, the network address, the exact total, and the option they chose. The row cannot be updated or deleted. Migration (apply it yourself in the Supabase SQL editor; this change does not touch the live database): `builderbot-app/supabase/migrations/20261030120000_typed_acceptance_record.sql`. Until that SQL is applied, accepting a quote still saves the name on the quote as before.
- Try-it counts for the steps after the page opens: `demo_build_clicked` (with whether an example button was used), `demo_quote_generated` when the quote is shown, and `demo_build_failed` with a reason of `empty_input`, `daily_limit`, or `ai_error`. `demo_started` still means the try-it page was opened, and `demo_signup_clicked` still means sign-up was tapped. These fire only after Accept. The job notes are not sent.
- **My price list**, at `/settings/prices`, for a signed-in tradesperson. They can add, edit, and delete their own items (name, unit such as each, per metre, per m², or per hour, and a price in pounds) before they type them on a quote. The list uses the existing `price_memory` table, so prices already remembered from a quote show there too, and row security still limits each row to its owner. New quotes send those prices to the AI and then apply them to matching lines. The AI is asked to fill in the quantities. Day rate, hourly rate, and material markup stay on the Settings page. The try-it page does not save or send a price list. No database migration.
- A short van demo on the home page and at `/walkthrough`. It plays five recorded clips in `builderbot-app/public/audio/walkthrough/` (`step-1.mp3` to `step-5.mp3`), all in the same voice. Together they last about 32 seconds (about 6.9, 8.8, 5.5, 5.2, and 5.4 seconds). Sound starts when you tap, moves on when each clip ends, and stops after the last step. Closing the popup stops the sound. If the sound is muted or cannot play, each step still waits for that clip’s length, so the words are not cut off.
- A root README, this changelog, and standing instructions so later changes update both. Google Antigravity reads `GEMINI.md` and `.agents/rules/keep-docs-updated.md` as well as `AGENTS.md`.
- A try-it page at `/try` for visitors with no account. They can type job notes or tap a decorating, plumbing, or electrics example, then see an itemised quote with Standard, Better, and Premium and a preview of the customer page. The preview uses the placeholder business name “Your Business Name” and never shows bank details. The quote is not saved, emailed, or given a public link. Guests are limited to five builds a day from one network address, through the existing Supabase rate limit. If that check fails, the same daily cap is applied in this server’s memory. Notes are capped at 800 characters and the AI reply uses the same checks as a signed-in quote. After they create an account, the quote is waiting in the quote builder. The signed-in quote route is unchanged. No database migration.
- PostHog events `demo_started`, `demo_quote_generated`, and `demo_signup_clicked`, only after the visitor accepts the cookie banner. Job notes are not sent.

### Changed

- Better and Premium list only a real difference from the price below. A point that describes ordinary work, such as dust sheets, masking, a clean-up, or something “included as standard”, is left off those two prices. It can still appear on Standard. If too few real differences remain, the trade’s own list is used. The prices are unchanged. No database migration.
- Standard, Better, and Premium say what is different. On the customer’s quote and on the try-it preview, each price has short plain points: what Standard includes, and what changes on Better and Premium (the material, extra preparation or coats, the finish, or an extra item). The AI reply is asked for those points and they are checked before use. A rough quote uses a written list for that trade, including decorating when the customer is supplying the paint. The extra amounts stay 15% and 30% of the net price (£25 and £45 minimums unchanged). A quote that was saved without these points still shows its prices and its old lines. No database migration.
- Customer acceptance is described as a typed acceptance. The quote page, privacy notice, terms, flyer, and activity text no longer call it a legal signature or a legal name. The recorded van-demo line still says the customer types their name to sign, because that sentence is the audio clip.
- On a phone, the try-it page shows a one-line introduction, the example buttons, and the job notes on the first screen. The longer explanation, including “Set your day rate and prices once, and every quote uses them…” and the note that the preview uses example prices, sits below the build button.
- The cookie banner is one shorter row on a phone. Accept and Decline stay side by side, and both are still at least 44 pixels tall.
- The home page and the try-it page say that a saved day rate and price list are used on later quotes, and that the AI fills in the quantities and the paperwork. The try-it page also says that this preview uses example prices and does not save a price list.
- The home page headline says a quote from the van takes a couple of minutes.
- The demo words match what the app does. The customer types their name to accept. Prices on the demo are an example, not a live merchant price list. The demo no longer says the notes were transcribed on the device, that a signature is IP verified, that you are notified at once, or that both people are sent a contract. It does not say that UK trades already use this flow.
- Sample bank details on the demo are sort code 00-00-00 and account 12345678, labelled as sample. The demo says the names and prices are not a real business.
- The fuse-board example and the consumer-unit template say EIC (the certificate for new electrical work) instead of EICR.
- Buttons on the demo, including close, mute, play, previous, next, Try free, and Back to Chuffed Quotes, are at least 44 pixels tall. The popup is labelled for screen readers, moves focus to Close, puts focus back when it closes, and stops the page behind it from scrolling. Animations stay still when the device asks for less motion.
- Next.js is pinned to 16.4.2. The config no longer repeats `experimental.agentUpgrade: "security"`, which Next.js 16.4.2 already uses when the line is left out.

### Fixed

- When the AI is unavailable, the rough quote follows the selected trade and the repair words (replace, unblock, repair, fix, and similar) before a room or a material. “Replace 5 tiles” for a roofer is a small roof repair. “Unblock kitchen sink and replace trap” for a plumber is a small plumbing repair, not a kitchen fitting. A short repair that matches nothing else is a small call-out. The try-it page uses the same fallback. No database migration.
- Sitemap addresses are `https://www.chuffedquotes.co.uk`. The bare domain redirects to www, so a sitemap entry on the bare domain would add an extra redirect.
- The pricing introduction is separate sentences: Chuffed Quotes is free during the beta, and you can build a quote in under 2 minutes, with no card and no paid plans. You are not charged for this test version.
- `/pricing` has a canonical link and `og:url`. `/try` and `/walkthrough` have `og:url`. All three use `https://www.chuffedquotes.co.uk`. `/site.webmanifest` serves the same home-screen file as `/manifest.json`. The email sign-in pages stay ordinary browser pages, so Edge on Android is not asked to open the app.
- While you are speaking, unfinished words show in grey inside the notes box on the home page, the try-it page, and the quote. They join the notes when the phone finishes the phrase, including when you had already typed, and they are not added twice.
- On the customer quote, “Tick the box to agree to the terms.” now sits under the terms checkbox. The box and its label stay on the screen. Ticking the box clears that message.
- The job progress steps use a green tick for a finished step, a dark circle for the step you are on, and grey for later steps. Red is only used when the quote is declined or expired.
- Opening a customer link shows “Opening customer link…” while the page loads, instead of a blank white screen. The same words appear on the Customer link button while it is saving.
- Send by email, next to Share on WhatsApp, saves the quote and opens the tradesperson’s own email app with the quote link. It does not send email from this site. If the customer has no email address, the To line is left empty.

- AI rate limits no longer fail open. If `consume_rate_limit` or the hourly AI quota check errors, the same limit is applied in this server’s memory (per network address, and per account for the hourly cap). The first requests in the window still succeed, so a database fault does not turn every quote into a “too many requests” error. A stored “limit reached” answer still stops the call. Guest try-it stays at 5 builds a day.
- AI quote requests are capped at about 1.8 MB. Each photo must be under about 350,000 characters, at most 6 photos, and the file bytes must be a real JPEG, PNG, GIF, or WebP. A photo that only claims to be an image is refused. The quote builder shows the plain-English reason.
- Saving business details a second time now updates the account. The profile row is found by the account (`owner_id`). The first save still creates it. Later saves were treated as a new row, Postgres rejected the duplicate account, and the page still said the save had worked. A failed save now stays on the screen as an error. The day rate, hourly rate, and material markup stay on this phone, as before. No database migration.
- On a new quote, the box for the job is at the top and labelled “What is the job?”. The example in the box is “New boiler fit”. Add from my price list stays on the quote: tick the prices or tap Add, and they become lines. Edit price list is a separate small link. Discard quote throws away the quote you have started, after you confirm, and it is not offered back when you sign in. A draft in Your quotes, on the dashboard, or on a customer can be deleted the same way.
- The sign-in email has a button and a code. Supabase allows 6 to 10 digits, and this project sends 8. The sign-in page said the email had no code and only accepted 6 digits, so the code could not be used. The page now says the email has a button and a code, and “Got a code? Type it here” accepts 6 to 10 digits. Typing the code signs you in.
- Opening that email link in Edge on Android asked the site to open the Edge app. The tap-to-sign-in page was marked as an installable app (`display: standalone` and `mobile-web-app-capable`), so Edge treated the link as a request to leave the tab. That page is now an ordinary browser page, and the home-screen app no longer claims https links, so sign-in stays in the same tab. The “this browser only” banner and the cookie banner are not shown on the tap-to-sign-in page or the signing-in page.
- A saved price list now reaches the quote. Build the quote uses a matching saved price (for example a new boiler on a combi boiler job) and the day rate or hourly rate from Settings, instead of leaving an AI guess in place. Each matching line is labelled “From your price list”, and a labour line that used Settings is labelled “Your rate from Settings”. On the quote, Add from my price list opens the saved prices so one can be tapped on as a line. No database migration.
- Price, quantity, and rate boxes can be cleared while typing. A lone 0 no longer sticks, so typing 50 replaces it instead of turning into 050 or 500. An empty box becomes 0 when you leave it. The phone keypad is still the number keypad.

- PostHog events were dropped before they were sent. The privacy check treated PostHog’s own `token` (the project key) as a secret, and the skip for PostHog’s `$` fields ran only after the `$` had already been removed, so it never matched. The project key and PostHog’s own fields are kept. Names, emails, phones, job notes, passwords, and other token-like fields are still removed. Quote and invoice links in addresses are still shortened.
- Signed-out visitors on the public pages (home, try-it, pricing, sign-in, and the legal pages) no longer see the logged-in bottom tab bar. That bar was covering the job notes, and each tab asked them to sign in. Signed-in people still get the bar. The quote builder and the other signed-in pages are unchanged.
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

