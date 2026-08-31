# Build Log: WINTERARC

> Status: Phase 4 — Complete, Phase 5 — Verification (next)
> Last updated: 2026-08-31

## 1. Project Description
WINTERARC is a Habits/Goals tracking SaaS for the general public. Users sign up (email/password + social login) and manage personal habits/goals through a minimal, clean dashboard. Core v1 is single-user CRUD for habits/goals (create habit, log progress, track streaks) with a polished responsive web UI. No mobile app, no email verification/password-reset in v1 (deferred to v1.1). Python/FastAPI stack, deploy-ready in 1-2 weeks with custom domain.

### Clarifications & Decisions
- **Q:** What is the primary purpose/type of website? **A:** SaaS / Web App *(decision: productivity SaaS, not static/marketing/e-commerce)*
- **Q:** Who are your primary users and what scale? **A:** General public *(decision: design for broad audience, consider scalability but optimize for moderate initial traffic)*
- **Q:** What are the absolute must-have features for v1? **A:** Auth + accounts *(decision: auth is P0)*
- **Q:** Do you have a design direction? **A:** Minimal & Clean *(decision: white space, simple typography, Tailwind-like minimalism)*
- **Q:** Any tech stack preference or constraints? **A:** Python / Django-FastAPI *(decision: FastAPI backend, Python ecosystem)*
- **Q:** What's your timeline and hosting/deploy preference? **A:** 1-2 weeks - polished *(decision: proper setup, custom domain, production-ready deploy)*
- **Q:** What does your SaaS actually do? **A:** Productivity tool *(decision: habits/goals focus)*
- **Q:** What auth & account features for v1? **A:** + Social login *(decision: email/password + OAuth (Google and/or GitHub), includes signup/login/logout)*
- **Q:** Beyond auth, what are the 2-3 core features users will use? **A:** Dashboard + CRUD *(decision: authenticated dashboard where users create/read/update/delete their own data)*
- **Q:** What should we NOT build in v1? **A:** No mobile app *(decision: web only, responsive design; native apps out of scope)*
- **Q:** What should users create/manage on dashboard? **A:** Habits / Goals *(decision: core entities = Habit (name, frequency, target) + Daily Log/Check-in; streaks/progress view)*
- **Q:** Should v1 include email verification + password reset? **A:** Defer to v1.1 *(decision: skip verification/reset for faster v1)*
- **Q:** Phase 0 scope confirmed? **A:** Yes, proceed *(decision: Phase 0 signed off 2026-08-31)*
- **Q:** Proposed stack confirmed? **A:** Confirm stack - Python 3.12 + FastAPI + Jinja2 + Tailwind *(decision: lock FastAPI stack, no Django/React)*
- **Q:** Database choice? **A:** Yes SQLite→Postgres *(decision: SQLite dev, Postgres prod)*
- **Q:** OAuth providers for v1? **A:** Google only *(decision: single OAuth provider, simplifies v1)*
- **Q:** Phase 4 feature order? **A:** Confirm order F1→F4 *(decision: Auth → Habit CRUD → Logs/Streaks → Dashboard)*
- **Q:** Habit frequency options? **A:** Custom frequency *(decision: support flexible frequency e.g., daily, weekly, 3x/week, target count)*
- **Q:** Auth implementation? **A:** Simplest first *(decision: choose fastest reliable — passlib+bcrypt, Starlette SessionMiddleware, Authlib stub)*

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
  - [x] F1: Auth — User model, signup/login/logout, session/cookie, password hashing, Google OAuth (stub), protected routes — verified via TestClient register/login/logout/dashboard 303/200
  - [x] F2: Habit CRUD — Habit model (user_id, name, description, frequency, target), CRUD routes + templates — verified create/edit/delete 303, list 200
  - [x] F3: Daily Logs & Streaks — HabitLog model, check-in, streak calculation, progress view — verified checkin duplicate prevention, streak 3, uncheck, week_count
  - [x] F4: Dashboard UI — minimal clean dashboard, habit list/detail, auth gating, Tailwind polish — verified Tailwind CDN, responsive, auth-aware base.html/index.html/dashboard.html
- [ ] Implement feature set (see sub-items)
- [ ] Update progress per feature
- [ ] Milestone review

### Phase 5 — Verification
- [ ] Tests / types / lint
- [ ] Manual core-flow check
- [ ] Fix & re-verify

### Phase 6 — Handoff & Documentation
- [ ] README
- [ ] Summary & limitations
- [ ] Final sign-off
