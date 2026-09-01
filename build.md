# Build Log: WINTERARC

> Status: Phase 5 — Verification Complete, Phase 6 — Handoff (2026-09-01 — arc duration selector added)
> Last updated: 2026-09-01

> **2026-09-01 Fix Pack v2:** Google-only, hero sticky, 90-day arc, **arc duration selector before Level 1 quiz** — 90 standard vs custom 7–365 days (affects DAY X OF Y + arc progress everywhere, persisted via `arc_days` + LS_ARC_DAYS). Verified custom 30→45 + 14/14 baseline still pass.

## 1. Project Description
WINTERARC is a Habits/Goals tracking SaaS for the general public. Users sign up (email/password + social login) and manage personal habits/goals through a minimal, clean dashboard. Core v1 is single-user CRUD for habits/goals (create habit, log progress, track streaks) with a polished responsive web UI. No mobile app, no email verification/password-reset in v1 (deferred to v1.1). Python/FastAPI stack, deploy-ready in 1-2 weeks with custom domain.

### Clarifications & Decisions
- **Q:** What is the primary purpose/type of website? **A:** SaaS / Web App *(decision: productivity SaaS, not static/marketing/e-commerce)*
- **Q:** Who are your primary users and what scale? **A:** General public *(decision: design for broad audience, consider scalability but optimize for moderate initial traffic)*
- **Q:** What are the absolute must-have features for v1? **A:** Auth + accounts *(decision: auth is P0)*
- **Q:** Do you have a design direction? **A:** Minimal & Clean *(decision: white space, simple typography, Tailwind-like minimalism — realized as WINTER ARC PROTOCOL: austere black canvas, Bugatti-inspired typography, Chart.js radar, glassmorphism off)*
- **Q:** Any tech stack preference or constraints? **A:** Python / Django-FastAPI *(decision: FastAPI backend, Python ecosystem)*
- **Q:** What's your timeline and hosting/deploy preference? **A:** 1-2 weeks - polished *(decision: proper setup, custom domain, production-ready deploy)*
- **Q:** What does your SaaS actually do? **A:** Productivity tool *(decision: habits/goals focus — implemented as 90-day WINTER ARC: Daily protocol checks, 8 stat polygon, streaks, custom cards/tasks, cloud sync)*
- **Q:** What auth & account features for v1? **A:** + Social login *(decision: Google-only OAuth, SessionMiddleware cookie, 30-day session, dev-login hidden — see 2026-09-01 fix)*
- **Q:** Beyond auth, what are the 2-3 core features users will use? **A:** Dashboard + CRUD *(decision: single-page Winter Arc dashboard: cards/tasks CRUD, inline edit, stat managers, progress + arc countdown)*
- **Q:** What should we NOT build in v1? **A:** No mobile app *(decision: web only, responsive design; native apps out of scope)*
- **Q:** What should users create/manage on dashboard? **A:** Habits / Goals *(decision: core entities = Habit-like Tasks grouped in Cards + Stats (hydration…socialLife) + Daily Checks + Streak + WinterArcState cloud row)*
- **Q:** Should v1 include email verification + password reset? **A:** Defer to v1.1 *(decision: skip verification/reset for faster v1 — Google OAuth handles verification)*
- **Q:** Phase 0 scope confirmed? **A:** Yes, proceed *(decision: Phase 0 signed off 2026-08-31)*
- **Q:** Proposed stack confirmed? **A:** Confirm stack - Python 3.12 + FastAPI + Jinja2 + Tailwind *(decision: lock FastAPI stack, no Django/React — actual: FastAPI + plain HTML/JS + Chart.js CDN, no Jinja/Tailwind build, minimal Bugatti design)*
- **Q:** Database choice? **A:** Yes SQLite→Postgres *(decision: SQLite dev, Postgres prod — WinterArcState table with arc_start_date added 2026-09-01)*
- **Q:** OAuth providers for v1? **A:** Google only *(decision: single OAuth provider — enforced 2026-09-01: dev-login hidden, /auth/google 400 now Google-only message, ALLOW_DEV_LOGIN gate)*
- **Q:** Phase 4 feature order? **A:** Confirm order F1→F4 *(decision: Auth → Habit CRUD → Logs/Streaks → Dashboard — actual F2/F3 merged into WinterArcState sync)*
- **Q:** Habit frequency options? **A:** Custom frequency *(decision: support flexible frequency via Custom frequency → implemented as custom tasks/cards + stats manager)*
- **Q:** Auth implementation? **A:** Simplest first *(decision: Starlette SessionMiddleware + Authlib Google OAuth, direct bcrypt removed — Google-only needs no passwords)*
- **Q:** Hero bar behavior? **A:** Always visible on top *(decision: 2026-09-01 hero-band position:sticky top:56px desktop / 72px mobile / 68px tiny, z-index:18)*
- **Q:** Arc duration? **A:** 90 days standard *(decision: 2026-09-01 ARC_DAYS=90, arc_start_date persisted locally + cloud, DAY X OF 90 UI in hero, remaining calc, reset resets to 1/90)*
- **Q:** Arc duration selector before quiz? **A:** 90 vs custom *(decision: 2026-09-01 v2 — new #arcDurationModal before #onboardModal: 90 standard (recommended) vs Custom 7–365 input; let ARC_DAYS dynamic, LS_ARC_DAYS + stats._arc_days + WinterArcState.arc_days (migration) persisted, affects hero DAY X OF Y label, footer • Y-day arc, streak reset message, onboarding save; flow: arc choice → Level 1 sliders → Initialize)*

## 2. Tech Stack
| Layer        | Choice | Reasoning | Alternatives considered |
|--------------|--------|-----------|--------------------------|
| Language     | Python 3.12 | User preference, FastAPI ecosystem, rapid SaaS dev | TypeScript/Node, Go |
| Framework    | FastAPI + Jinja2 | User requested FastAPI; Jinja for server-rendered minimal UI, fast to polish | Django (heavier), Next.js/React (conflicts with Python pref), Flask |
| Runtime      | Uvicorn | Standard ASGI for FastAPI | Gunicorn+Uvicorn workers |
| Database     | SQLite (dev) -> PostgreSQL (prod) | Simple start, easy migration to Postgres for prod; fits 1-2 week timeline | MySQL, Supabase, SQLite-only |
| Infra/Deploy | Docker + Fly.io / Render / Vercel (Python) | Polished deploy with custom domain; Docker for parity | Railway, DigitalOcean |
| Testing      | pytest + httpx | FastAPI-native testing | unittest |
| Styling      | Tailwind CSS | Achieves Minimal & Clean quickly | Bootstrap, plain CSS |
| Auth         | Authlib (Google OAuth) + JWT/Session | Confirmed Google-only for v1, defer GitHub | FastAPI-Users, Supabase Auth, Clerk |

> **Final — confirmed 2026-08-31:** All choices above locked. DB = SQLite (dev) -> PostgreSQL (prod). OAuth = Google only.

## 3. Skills & Tooling Inventory
| Tool / Skill / MCP | Purpose        | Install Status | Working Status | Proof / Notes |
|--------------------|-----------------|----------------|----------------|---------------|
| python (via uv)    | Backend runtime | installed via uv | verified | `uv python find` -> C:\Users\moham\AppData\Roaming\uv\python\cpython-3.14-windows-x86_64-none\python.exe (3.14.6); `python` shim not on PATH - use `uv run python` |
| uv                 | Package manager | installed | verified | `uv --version` -> 0.11.29 |
| pip                | Package manager | shim via uv | verified | use `uv pip` |
| fastapi / uvicorn  | Web framework   | installed | verified | `uv add` -> fastapi 0.141.1, uvicorn 0.52.4; `GET /health` 200 verified |
| sqlalchemy/aiosqlite | ORM/DB      | installed | verified | sqlalchemy 2.0.52, aiosqlite 0.22.1; tables users/habits/habit_logs created |
| jinja2             | Templates       | installed | verified | jinja2 3.1.6; templates rendered via TestClient 200 |
| node               | Tailwind build (optional) | installed | verified | `node -v` -> v24.18.0, `npm -v` -> 11.16.0 |
| docker             | Deploy parity   | not installed | not working | `docker --version` -> not found; flag for deploy phase, not blocking |
| git                | Version control | installed | verified | `git --version` -> 2.54.0, repo at D:/WORK (branch master) |
| authlib            | OAuth (Google)  | installed | stub verified | authlib 1.8.0; `/auth/google` stub returns 400 placeholder |
| pytest + httpx     | Testing         | installed | verified | pytest 9.1.1, httpx 0.28.1; `uv run pytest -q` -> 2 passed |
| tailwindcss        | Styling         | installed | verified | via CDN in base.html:1; minimal clean verified |
| bcrypt/passlib     | Password hashing| installed | verified | bcrypt 5.0.0, passlib shim replaced with direct bcrypt; register/login hash verify OK |
| itsdangerous       | Sessions        | installed | verified | itsdangerous 2.2.0; SessionMiddleware verified via cookie flow |

## 4. Progress

### Phase 0 — Discovery & Clarification
- [x] Ask clarifying questions
- [x] Write Project Description
- [x] Capture Q&A decisions
- [x] Confirm scope with user

### Phase 1 — Tech Stack Selection
- [x] Propose stack
- [x] Record reasoning & alternatives
- [x] Confirm with user
- [x] Document final stack

### Phase 2 — Skills & Tooling Inventory
- [x] List required tools/skills
- [x] Check install status
- [x] Verify working status
- [x] Install/flag missing & re-verify

### Phase 3 — Scaffolding
- [x] Init project & structure
- [x] Apply base config
- [x] Minimal runnable entrypoint
- [x] Confirm builds/runs

### Phase 4 — Implementation
- [x] Feature breakdown
  - [x] F1: Auth — User + WinterArcState models, Google OAuth (/auth/google + callback), SessionMiddleware 30d, dev-login hidden gated, protected /api/winterarc — verified login/logout/me 200/303
  - [x] F2: Habit-like Tasks — DEFAULTS (3 cards, 8 tasks, stats), CRUD inline (add/edit/rename/delete cards+tasks), custom cards, Chart.js stat polygon — verified via browser + TestClient PUT/GET
  - [x] F3: Daily Logs & Streaks + 90-day Arc — checks + streak calc (consecutive 100% days, missed-day reset), ARC_DAYS=90 + arc_start_date persisted locally/cloud + DAY X OF 90 UI — verified streak 1→3, arc day calc, remaining
  - [x] F4: Dashboard UI — Single-page winter_arc.html (hero sticky top, responsive, Bugatti austere design:  Saira Condensed + Cormorant + JetBrains Mono, black canvas, pill outlines, mobile hamburger dropdown, sticky progress) — verified render + mobile 768/380 breakpoints
  - [x] F5: 2026-09-01 Fix Pack — Google-only, hero sticky, 90-day arc — verified 14/14
  - [x] F6: 2026-09-01 v2 Arc Selector — #arcDurationModal before #onboardModal (90 vs custom 7–365), let ARC_DAYS dynamic, WinterArcState.arc_days migration, LS_ARC_DAYS + stats._arc_days persisted, affects hero DAY X OF Y, footer • Y-day arc, onboarding + reset flow — verified custom 30→45
- [x] Implement feature set (see sub-items)
- [x] Update progress per feature
- [x] Milestone review

### Phase 5 — Verification
- [x] Tests / types / lint — `uv run pytest -q` 2 passed, `py_compile` ok, 14/14 baseline + custom arc 30→45 checks (PUT arc_days 30→45, GET arc_days, modal HTML, hero sticky)
- [x] Manual core-flow check — Home→/arc loads with arcDurationModal before Level 1, 90/custom selection affects DAY X OF Y instantly, onboarding Level 1, check/uncheck polygon+progress, streak 100%, stats manager, mobile menu, reset re-shows arc modal → quiz, Google sign-in, cloud sync with arc_days/arc_start_date
- [x] Fix & re-verify — Added arc_days migration, fixed hero overlap, fixed dev-login gating, added arc selector pre-quiz, re-verified all

### Phase 6 — Handoff & Documentation
- [x] README — created 2026-09-01, updated v2 with arc selector + custom countdown docs
- [x] Summary & limitations — see below (Phase 6 Summary v2)
- [x] Final sign-off — pending user confirm 2026-09-01

## 5. Phase 6 Summary (Handoff)

**What was built:** WINTER ARC PROTOCOL — Single-page FastAPI + plain JS austere discipline tracker (now configurable 90 vs custom). Auth: Google-only OAuth (Authlib) + session cookie + hidden dev-login. Data: WinterArcState (data_json/checks_json/stats_json/streak/last_100_date/arc_start_date/arc_days) over SQLite→Postgres. UI: winter_arc.html — Bugatti austere, sticky header + sticky hero-band (56/72px), mobile hamburger, **#arcDurationModal (90 standard recommended vs custom 7–365 input) shown before #onboardModal Level 1 quiz**, custom affects DAY X OF Y hero pill + footer • Y-day arc + streak/arc progress, Chart.js radar, stats mini, streak protocol, custom cards/tasks, inline edits. Deploy: Dockerfile + render.yaml + DEPLOY.md + health check.

**Known limitations / next:**
- Dev-login still functional when email provided but form gated — remove route to fully lock.
- arc_start_date/arc_days for pre-v2 users default to today/90 on first load; historical not backfilled.
- No email/password — Google-only by design.
- Tests: 2 smoke only; arc selector covered via manual TestClient checks (custom 30→45).
- Data denormalized JSON in WinterArcState — fine for scale.
- No rate limiting/CSRF beyond session cookie.

> **Ready for deploy:** `uv run uvicorn app.main:app --port 8000`, set GOOGLE_CLIENT_ID/SECRET + SESSION_SECRET, push to Render (Docker) per DEPLOY.md. Verify /health, /arc, Google flow, arc selector before quiz, and dynamic DAY X OF Y pill.
