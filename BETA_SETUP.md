# Make the free beta live

The product name is **Chuffed Quotes**. To rename it later, edit only `builderbot-app/lib/brand.mjs` (`name`, `shortName`, and `tagline`). Then redeploy.

Do these steps on your phone, in order. You do not need a paid Vercel plan or a paid Supabase plan for this test.

## 1. Merge the code

1. Open the pull request on GitHub.
2. Press **Merge**.
3. In Vercel, wait until the new deployment says Ready. Use the public site, not a preview link that asks you to log into Vercel.

## 2. Supabase (free project)

1. Go to [supabase.com](https://supabase.com) and create a project on the free plan. Save the database password somewhere safe.
2. Open **SQL Editor**, paste the whole file `builderbot-app/supabase/schema.sql`, and press **Run**. That adds your tables, quote photos, and a feedback box.
3. Open **Project Settings → API**. Copy the project URL, the `anon` key, and the `service_role` key.
4. Open **Authentication → URL configuration**. Set the site URL to your public address (for example the address you type in the browser). Add the same address under redirect URLs. Do not use a Vercel preview link that is behind a login wall.

Free Supabase pauses after about a week of no use, and the free plan does not keep automatic backups. Open the project once a week, or accept that it may sleep. If it sleeps, open the Supabase dashboard and restore it before you quote.

## 3. Vercel environment settings

In the Vercel project, open **Settings → Environment Variables** and add:

| Name | What to paste |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key. This must stay secret. |
| `NEXT_PUBLIC_APP_URL` | Your public address, no slash at the end. Optional. |
| `NEXT_PUBLIC_FEEDBACK_EMAIL` | Your email. Optional. |
| `GEMINI_API_KEY` | Only if you want AI prices. Optional. |

Leave every Stripe key empty. Card payments are turned off in the app.

Press **Redeploy** after saving the variables.

## 4. Google AI spending cap (only if you add a key)

1. Open [Google AI Studio](https://aistudio.google.com/app/apikey) and create a key.
2. In Google Cloud billing, set a monthly cap you can afford (a few pounds is enough for a test).
3. AI only runs for people who are signed in. Everyone else gets a rough estimate they must edit.
4. Do not rely on a free Gemini key for customer photos. Google may use that content to improve its models.

## 5. Words you must replace yourself

Open the live **Privacy** and **Terms** pages. They contain `[YOUR NAME]` and `[YOUR EMAIL]`. Change those in `builderbot-app/app/privacy/page.tsx` and `builderbot-app/app/terms/page.tsx`, then redeploy. This template is not legal advice. If you store customer data for a business, check whether you need to register with the ICO.

## 6. What stays manual if you rename again

Changing `lib/brand.mjs` updates the app, page title, flyer, and home-screen name for new installs. These do **not** change by themselves:

- The domain name at your registrar and in Vercel (the app uses the address that is open, or `NEXT_PUBLIC_APP_URL`).
- The GitHub repository name (`builderbot`) and the Vercel project name.
- The Supabase project name, and any auth email wording you typed in the Supabase dashboard.
- Saved quotes in the browser. Their storage keys still start with `builderbot_` and `trademate_pricing_memory_v1` so existing quotes are not wiped. Do not rename those keys.
- The folder name `builderbot-app` and `package.json` name.
- `README.md`, `ROADMAP.md`, `AGENTS.md`, and `BETA_SETUP.md` if you want the docs to match a new name.
- `builderbot-app/test/e2e-live-check.mjs` checks the name from `brand.mjs`, but you must set `E2E_BASE_URL` yourself.
- A phone that already saved the old icon keeps the old label until that icon is deleted and added again.
- The hammer icon file has no words in it, so it does not need a new drawing for a rename.

## 7. If a deploy looks wrong

In Vercel, open **Deployments**, find the last good one, and choose **Promote to production** (or the rollback control on that deployment). That puts the previous version back without a code change.
