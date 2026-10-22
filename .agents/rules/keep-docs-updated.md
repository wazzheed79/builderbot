---
trigger: always_on
description: Update README.md and CHANGELOG.md in the same pull request whenever behaviour, setup, or the roadmap changes.
---

# Keep the README and changelog updated

When a change alters what Chuffed Quotes does, how it is set up, or what is still to do, update both files in the **same commit and the same pull request**:

1. `CHANGELOG.md` — [Keep a Changelog](https://keepachangelog.com/) style. Add the note under the date of the change, or under `[Unreleased]` while the branch is open. Use Added, Changed, or Fixed. Dates come from git. Do not invent a version number.
2. `README.md` — add a short plain-English line to **Progress / Changelog**. If the work finishes something listed under **Roadmap**, remove it there. If you discover a real follow-up, add it to **Roadmap**. If environment variable names, scripts, or Supabase migrations change, update those sections too. Names only. Never paste secret values.

Describe only what the code does. Do not claim a service, badge, or integration that is not in the repo.

Do not add a GitHub Action, hook, or bot that commits documentation to `main` by itself. Do not add new secrets for this. Open a pull request. The owner merges.

Cursor reads `AGENTS.md`. Google Antigravity also reads this file, `GEMINI.md`, and `AGENTS.md`.
