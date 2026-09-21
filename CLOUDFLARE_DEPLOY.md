# Migrating WINTER ARC to Cloudflare Pages & Functions

This guide explains how to shift **WINTER ARC** from Render to **Cloudflare Pages & Functions** while preserving the entire website, database, user accounts, and Google authentication.

---

## 🌟 Why Cloudflare Pages?
- **Zero Spin-Down / No Sleeping**: Render free tier sleeps after 15 minutes of inactivity. Cloudflare Pages runs globally at 300+ edge data centers with **0ms cold start**.
- **No Monthly Hours Cap**: Render gives 750 free hours/month. Cloudflare Pages is 100% free with unlimited bandwidth and 100,000 free API requests/day.
- **Zero Data Loss**: Connects directly to your existing **Neon PostgreSQL** database. All existing user streaks and arcs stay intact.
- **No Keep-Alive Pinger Needed**: You can turn off the GitHub Actions 14-minute pinger.

---

## Architecture Summary
- **Frontend**: Served from `public/` via Cloudflare's Global Edge Network (HTTP/3, DDoS protected).
- **Backend API**: Cloudflare Pages Functions (`functions/[[path]].ts` + `src/app.ts`) powered by Hono and `@neondatabase/serverless`.
- **Database**: Existing Neon Serverless PostgreSQL (`production` branch).

---

## Step 1: Deploy to Cloudflare Pages (Git Integration)

1. Push your updated code to GitHub:
   ```bash
   git add .
   git commit -m "feat: Cloudflare Pages + Neon serverless backend"
   git push origin main
   ```
2. Open the [Cloudflare Dashboard](https://dash.cloudflare.com).
3. Navigate to **Workers & Pages** → **Create Application** → **Pages** → **Connect to Git**.
4. Select your **`winterarc`** repository and click **Begin setup**.
5. Configure the build settings:
   - **Project Name**: `winterarc`
   - **Production Branch**: `main`
   - **Framework Preset**: `None`
   - **Build Command**: `npm run build`
   - **Build Output Directory**: `public`
   - **Root directory**: `/` (leave empty)

---

## Step 2: Configure Environment Variables

Under **Environment Variables (Production)** in Cloudflare Pages (or go to **Settings → Environment variables**):

| Variable | Value | Notes |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://neondb_owner:npg_tni6PBobUv8s@ep-empty-wind-b37fspnh-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` | Your existing Neon Postgres connection string |
| `GOOGLE_CLIENT_ID` | `your-google-client-id.apps.googleusercontent.com` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | `your-google-client-secret` | From Google Cloud Console |
| `SESSION_SECRET` | `your-random-32-char-session-secret` | For encrypted session cookies |
| `ADMIN_EMAIL` | `mohammedxazi@gmail.com` | Stealth admin access |
| `ALLOW_DEV_LOGIN` | `0` | (Optional: `1` for offline testing) |

Click **Save and Deploy**.

---

## Step 3: Attach Custom Domain (`winterarc.online`)

1. In your Cloudflare Pages project, click the **Custom domains** tab.
2. Click **Set up a custom domain**.
3. Enter **`winterarc.online`** (and optionally `www.winterarc.online`).
4. **DNS Configuration**:
   - If your domain is managed on Cloudflare DNS: Cloudflare will automatically configure the CNAME record for you with 1 click.
   - If your domain is on Namecheap: Point your Namecheap DNS CNAME record to `<your-project>.pages.dev` (or switch nameservers to Cloudflare for full edge acceleration).
5. Cloudflare will automatically generate and renew an edge SSL certificate (HTTPS) for free.

---

## Step 4: Verify Google OAuth Redirects

In the [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials):
Under your OAuth 2.0 Web Client, ensure the **Authorized redirect URIs** include:
- `https://winterarc.online/auth/google/callback`
- `https://<your-project>.pages.dev/auth/google/callback` (optional, for testing the `.pages.dev` preview)

---

## Step 5: Verify Everything

Once deployed, verify:
1. `https://winterarc.online/health` → returns `{"status":"ok","runtime":"cloudflare"}`
2. `https://winterarc.online/` → renders the dark austere Bugatti dashboard
3. `https://winterarc.online/arc` → clean URL loads without redirects
4. Click **Sign in with Google** → completes login and shows your synced state
5. Check/uncheck a task → instant cloud sync
6. Visit `https://winterarc.online/admin` signed in as `mohammedxazi@gmail.com` → admin dashboard works
7. Visit `https://winterarc.online/faq`, `/terms`, `/privacy` → SEO pages intact

---

## Step 6: Shut Down Render & Keep-Alive

Once your domain points to Cloudflare and is verified:
1. In the **Render Dashboard**, suspend or delete the `winterarc` web service.
2. In your GitHub repo, disable the `.github/workflows/keep-alive.yml` workflow (or delete it), since Cloudflare is edge-serverless and never sleeps.

---

## Local Development (Optional)

To run the Cloudflare stack locally:
```bash
npm run dev
# Opens at http://127.0.0.1:8788 with live Neon database connection
```
To run tests:
```bash
node scratch/verify-cloudflare.mjs
```
