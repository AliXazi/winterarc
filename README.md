# WINTER ARC — PROTOCOL

Austere discipline tracker — **configurable arc: 90 days standard vs custom 7–365**. Single-page FastAPI + plain JS. Black canvas, Bugatti-inspired typography (Saira Condensed / Cormorant Garamond / JetBrains Mono), pill ghost buttons, sticky header + sticky hero-band always visible, Chart.js stat polygon, DAY X OF Y countdown.

> Live: **https://winterarc.online** (custom domain, Render `winterarc-a1ua.onrender.com` fallback). Entry `/` or `/arc` → `winter_arc.html`. Health `/health` → `{"status":"ok","mode":"winter-arc-cloud"}`.

## Quick start

```powershell
# 1) env
copy .env.example .env
# edit .env → set GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / SESSION_SECRET
# get creds: https://console.cloud.google.com/apis/credentials
#   Web app → redirects: http://127.0.0.1:8000/auth/google/callback
#                          https://winterarc.online/auth/google/callback
#                          https://winterarc-a1ua.onrender.com/auth/google/callback

# 2) run
uv sync
uv run uvicorn app.main:app --reload --port 8000
# open http://127.0.0.1:8000/arc
```

No Google creds? `/auth/google` shows setup help. For local cloud test without Google you can still use `/auth/dev-login?email=you@example.com` when `GOOGLE_CLIENT_ID` is unset or `ALLOW_DEV_LOGIN=1` — hidden in prod (Google-only).

## Scripts

| Cmd | Purpose |
|-----|---------|
| `uv run uvicorn app.main:app --port 8000` | dev server |
| `uv run pytest -q` | tests (2 passed) |
| `uv run python -m py_compile app/main.py app/models.py app/routers/api.py app/routers/auth.py` | type/lint sanity |

## Env

- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth (required for prod)
- `SESSION_SECRET` — Starlette SessionMiddleware secret (change in prod, `openssl rand -hex 32`)
- `DATABASE_URL` — `sqlite+aiosqlite:///./winterarc.db` (default) or `postgresql+asyncpg://…` (Render sets automatically)
- `ALLOW_DEV_LOGIN` — `1` to expose dev-login form even when Google is configured (default: hidden, Google-only)

## Deploy (Render — Docker, recommended)

See `DEPLOY.md` + `render.yaml` + `Dockerfile`.

1. Push to GitHub → Render Dashboard → New → Blueprint → pick repo → `render.yaml` auto-applies (web + free Postgres).
2. Env vars in Render: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SESSION_SECRET` (Generate Value).
3. After deploy, add real redirects in Google Console: `https://winterarc.online/auth/google/callback` + `https://winterarc-a1ua.onrender.com/auth/google/callback`. Custom domain `winterarc.online` already attached → verify `https://winterarc.online/health`.
4. Verify `/health` and Google sign-in → check task → refresh → same on another device.

Fly.io / Railway analogues in `DEPLOY.md`.

## Core flows

- **Arc duration (pre-quiz):** First load → modal `#arcDurationModal` — **90 days — Standard Arc (Recommended)** vs **Custom 7–365 days** input (before Level 1 quiz). Choice sets `let ARC_DAYS` → affects hero `DAY X OF Y — Z REMAINING • Y-DAY ARC`, footer `• Y-day arc`, streak target, onboarding + Reset flow. Persisted in `WinterArcState.arc_days` (migration) + `LS_ARC_DAYS` + `stats._arc_days`.
- **Onboarding:** After arc choice → Level 1 sliders (8 stats) → sets baseline polygon (1–10). `STATS._defs` persists stat labels/keys, `_arc_days/_arc_start` co-persisted.
- **Daily protocol:** Check tasks → polygon +0.18 per check, progress bar + pill update instantly via `refreshUI()`. 100% stamps `last_100_date` and increments streak (consecutive days); miss resets on next load.
- **Arc countdown:** `ARC_DAYS` dynamic (90 or custom). `arc_start_date` persisted in `WinterArcState.arc_start_date` + `LS_ARC_START` and cloud `arc_start_date` (+ `LS_ARC_DAYS`/`arc_days`). Hero shows `DAY X OF Y — Z REMAINING • Y-DAY ARC`; resets to `1/Y` on Reset (re-shows arc modal before quiz).
- **Cards/Tasks:** `+ Add task` per card, `+ Add Card`, double-click card/task titles to rename, ✎ inline desc edit, ✕ delete (confirm). Everything `saveAll()` → debounced `PUT /api/winterarc` (includes `arc_days` + `arc_start_date`).
- **Stats manager:** Edit labels (key auto-slugged), remove (keep ≥3), add (max 12), Save → chart + renders refresh instantly. Reset button wipes local + cloud (confirm) and re-onboards via arc modal.
- **Header:** Sticky top-0, hero-band sticky `top:56px` desktop / `72px` mobile / `68px` tiny — always visible while scrolling. Mobile hamburger holds Reset + legal links, `Sign in` (Google) right-aligned.

## API

- `GET /health` → status
- `GET /api/me` → `{authenticated, email, name, picture}`
- `GET /api/winterarc` → 401 when anon or `{authenticated, data, checks, stats, streak, last_100_date, arc_start_date, arc_days}` (90 default, or custom) when authed
- `PUT /api/winterarc` → `{data, checks, stats, streak, last_100_date, arc_start_date, arc_days}` (7–365 clamped) → `{ok:true}`
- `GET /auth/google` → redirect to Google (400 help when not configured, Google-only message)
- `GET /auth/google/callback` → upsert `User`, set session, 303 to `/arc`
- `GET /auth/dev-login?email=x` → hidden local login (form gated), 403 when Google configured without `ALLOW_DEV_LOGIN=1`
- `GET /auth/logout` → clear session 303
- Pages: `/`, `/arc`, `/winter-arc` → `winter_arc.html`; `/terms`, `/privacy`, `/faq` → legal

## Design

- Canvas `#000000`, card `#141414`, hairline `#262626`, text `#ffffff`/`#cccccc`. No accent — only `#c3d9f3` links. See `DESIGN.md` (Bugatti tokens, substitutes via Google Fonts).
- Pill buttons: transparent + 1px white outline. Hero `64px→32px` mobile, 96px padding with sticky offset.
- Chart: `Chart.js 4.4.1` CDN radar, 0–10 scale, 2-step ticks, dark grid.

## Limitations (v1)

- Google-only auth (intentional). No password, no email verify/reset (deferred).
- Dev-login route still works with `?email=` even when form gated — remove route to fully lock.
- Users created before arc column backfill to `today` / 90 on first load.
- Tests: 2 smoke tests only; arc + custom countdown covered manually via TestClient (custom 30→45 + 14 baseline).
- Data stored denormalized JSON in `WinterArcState` + new `arc_days` column — fine for moderate scale.

## Project status

- Phase 0–4 complete + F6 arc selector (see `build.md`). Phase 5 verified 2026-09-01 v2 (2 pytest + baseline 14 + custom 30→45). Phase 6 handoff — `README.md` + `build.md` summary v2.
- Last updated: 2026-09-01. Fix pack v2: Google-only, hero sticky, 90-day arc, **arc duration selector before quiz (90 vs custom 7–365)**.

> Build log: `build.md`. Deploy guide: `DEPLOY.md`. Design tokens: `DESIGN.md`.
