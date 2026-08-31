# Deploy Winter Arc — Full-Stack (FastAPI + Postgres + Google Auth)

## 1) Get Google OAuth creds (once, 3 min)
1. https://console.cloud.google.com/apis/credentials → Create Project
2. Configure OAuth consent screen (External, add test user = your email)
3. Credentials → Create OAuth client → **Web application**
4. Add **Authorized redirect URIs**:
   - `http://127.0.0.1:8000/auth/google/callback` (local)
   - `https://YOUR-APP.onrender.com/auth/google/callback` (prod — replace after deploy)
5. Copy Client ID + Secret → keep for step 3.

## 2) Push to GitHub
```powershell
cd D:\WORK\WINTERARC
git init
git add .
git commit -m "winter arc full-stack"
gh repo create winterarc --public --source=. --push
# or git remote add origin https://github.com/YOU/winterarc.git; git push -u origin main
```

## 3) Deploy on Render (free, recommended)
- Go to dashboard.render.com → New → Blueprint → connect `winterarc` repo → `render.yaml` auto-detected → Apply.
- Or New → Web Service → connect repo → Runtime Docker → Build/Start auto from Dockerfile.
- Add Env Vars (Dashboard → Environment):
  - `GOOGLE_CLIENT_ID` = from step 1
  - `GOOGLE_CLIENT_SECRET` = from step 1
  - `SESSION_SECRET` = `openssl rand -hex 32` or generate
- Deploy → wait 2-3 min → open `https://winterarc-xxxx.onrender.com/arc`
- Back in Google Console, add the **real prod redirect** (`https://winterarc-xxxx.onrender.com/auth/google/callback`) → Save.

### Alternative hosts
**Fly.io:**
```bash
fly launch --dockerfile Dockerfile  # choose region, port 8000
fly secrets set GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=yyy SESSION_SECRET=zzz
fly deploy
```
**Railway:** `railway init` → add same env vars → `railway up`

**Local prod test:**
```bash
copy .env.example .env  # edit
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
# open http://127.0.0.1:8000/arc
```

## 4) Verify
- `/health` → `{"status":"ok","mode":"winter-arc-cloud"}`
- `/arc` → Sign in with Google → add custom task → check streak/radar → refresh → same on another device (same Google account).

## Notes
- No data stored on device when signed in — `WinterArcState` rows in `winterarc.db` (sqlite local) or Postgres on Render.
- If you skip Google env, `/auth/google` shows setup help and `/auth/dev-login` still gives cloud per-email (dev).
