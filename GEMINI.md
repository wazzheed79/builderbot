# Chuffed Quotes — Antigravity

This file is always on for Google Antigravity. The same rule is in `AGENTS.md` and in `.agents/rules/keep-docs-updated.md`.

## Docs travel with the change

When a change alters what the product does, how it is set up, or what is still to do, update both of these in the **same commit and the same pull request**:

1. `CHANGELOG.md` — Keep a Changelog style, under today’s date (or `[Unreleased]` until it merges). Use the git date. Do not invent a version number.
2. `README.md` — the **Progress / Changelog** section, in plain English. Move finished items out of **Roadmap**, and add a new known to-do when you find one. Update the setup tables (environment variable **names**, scripts, migrations) when those change.

Write only what the code and git history support. Never paste secret values, real keys, or `.env.local`.

Do not add a GitHub Action, git hook, or bot that commits these files to `main` by itself. Do not add new secrets to keep the docs updated. The owner merges to `main`.

## Product facts that are easy to get wrong

- The product name is Chuffed Quotes. Change it only in `builderbot-app/lib/brand.mjs`.
- The app lives in `builderbot-app/`. Live site: https://www.chuffedquotes.co.uk.
- Card payments are switched off in this beta. Leave Stripe keys blank.
- Quote choices are Standard, Better, and Premium. The builder button still says “Good, Better, Best”; that mismatch is an open fix, not a second set of names to introduce.
- AI quoting is signed-in only, 30 builds and 30 scope rewrites an hour, and falls back to a rough estimate when Gemini fails. If the quota check itself errors, the build is allowed.
