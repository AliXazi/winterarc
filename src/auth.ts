import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { getDb } from './db';
import type { Env, SessionPayload } from './types';

export const SESSION_COOKIE_NAME = 'winterarc_session';
export const DEFAULT_SESSION_SECRET = 'winterarc-dev-secret-change-in-prod';

export async function createSession(
  cookieSetter: (name: string, value: string, opts: any) => void,
  payload: SessionPayload,
  secret: string
): Promise<string> {
  const token = await sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
    },
    secret || DEFAULT_SESSION_SECRET,
    'HS256'
  );

  cookieSetter(SESSION_COOKIE_NAME, token, {
    path: '/',
    httpOnly: true,
    secure: true,
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 30,
  });

  return token;
}

export async function getSession(
  cookieGetter: (name: string) => string | undefined,
  secret: string
): Promise<SessionPayload | null> {
  const token = cookieGetter(SESSION_COOKIE_NAME);
  if (!token) return null;

  try {
    const payload = (await verify(token, secret || DEFAULT_SESSION_SECRET, 'HS256')) as unknown as SessionPayload;
    if (payload && payload.user_id && payload.user_email) {
      return payload;
    }
  } catch {
    // Expired or invalid signature
  }
  return null;
}

export const authRouter = new Hono<{ Bindings: Env }>();

authRouter.get('/google', async (c) => {
  const clientId = c.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return c.html(
      `
      <html style="font-family:system-ui;padding:40px;max-width:640px;margin:auto">
      <h2>Google OAuth not configured</h2>
      <p>To enable cloud save, create a Google OAuth 2.0 Client ID at <a href="https://console.cloud.google.com/apis/credentials" target="_blank">console.cloud.google.com</a></p>
      <ol>
        <li>Create project → Credentials → Create OAuth client → Web application</li>
        <li>Add authorized redirect URI: <code>https://winterarc.online/auth/google/callback</code> (or local dev URI)</li>
        <li>Set environment variables in Cloudflare: <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code></li>
      </ol>
      <p style="color:#666;font-size:13px">Sign-in is Google-only. No password or dev login in production.</p>
      <p><a href="/arc">← Back to Winter Arc</a></p>
      </html>
      `,
      400
    );
  }

  const host = c.req.header('x-forwarded-host') || c.req.header('host') || 'winterarc.online';
  const proto = c.req.header('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/auth/google/callback`;

  const state = crypto.randomUUID();
  setCookie(c, 'oauth_state', state, {
    path: '/',
    httpOnly: true,
    secure: proto === 'https',
    sameSite: 'Lax',
    maxAge: 600,
  });

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', clientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'select_account');

  return c.redirect(authUrl.toString(), 302);
});

authRouter.get('/google/callback', async (c) => {
  const code = c.req.query('code');
  const state = c.req.query('state');
  const error = c.req.query('error');
  const savedState = getCookie(c, 'oauth_state');
  deleteCookie(c, 'oauth_state', { path: '/' });

  if (error) {
    return c.html(`<h3>OAuth error: ${error}</h3><p><a href="/arc">Back to Protocol</a></p>`, 400);
  }

  if (!code || !state || (savedState && state !== savedState)) {
    return c.html(`<h3>OAuth verification failed</h3><p>State mismatch or missing code.</p><p><a href="/arc">Back</a></p>`, 400);
  }

  const clientId = c.env.GOOGLE_CLIENT_ID;
  const clientSecret = c.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return c.html(`<h3>Google OAuth credentials missing</h3>`, 500);
  }

  const host = c.req.header('x-forwarded-host') || c.req.header('host') || 'winterarc.online';
  const proto = c.req.header('x-forwarded-proto') || (host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    return c.html(`<h3>OAuth token exchange failed</h3><pre>${errText}</pre><p><a href="/arc">Back</a></p>`, 400);
  }

  const tokens = (await tokenRes.json()) as { access_token: string; id_token?: string };
  if (!tokens.access_token) {
    return c.html(`<h3>OAuth failed: No access token received</h3><p><a href="/arc">Back</a></p>`, 400);
  }

  // Fetch Google User Profile
  const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userinfoRes.ok) {
    return c.html(`<h3>Failed to fetch userinfo from Google</h3><p><a href="/arc">Back</a></p>`, 400);
  }

  const userinfo = (await userinfoRes.json()) as {
    email: string;
    name?: string;
    picture?: string;
    sub?: string;
  };

  if (!userinfo.email) {
    return c.html(`<h3>No email provided by Google</h3>`, 400);
  }

  const email = userinfo.email.toLowerCase().trim();
  const name = userinfo.name || null;
  const picture = userinfo.picture || null;
  const sub = userinfo.sub || null;

  // Upsert user in Neon DB
  const sql = getDb(c.env.DATABASE_URL);
  const existing = (await sql`SELECT id, email, name, picture, google_sub FROM users WHERE email = ${email}`) as any[];

  let userId: number;
  if (existing.length === 0) {
    const inserted = (await sql`
      INSERT INTO users (email, name, picture, google_sub, created_at)
      VALUES (${email}, ${name}, ${picture}, ${sub}, NOW())
      RETURNING id
    `) as any[];
    userId = inserted[0].id;
  } else {
    userId = existing[0].id;
    await sql`
      UPDATE users
      SET name = COALESCE(${name}, name),
          picture = COALESCE(${picture}, picture),
          google_sub = COALESCE(${sub}, google_sub)
      WHERE id = ${userId}
    `;
  }

  await createSession(
    (k, v, o) => setCookie(c, k, v, o),
    { user_id: userId, user_email: email },
    c.env.SESSION_SECRET || DEFAULT_SESSION_SECRET
  );

  return c.redirect('/arc', 303);
});

authRouter.get('/logout', async (c) => {
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
  return c.redirect('/arc', 303);
});

authRouter.get('/dev-login', async (c) => {
  const emailParam = c.req.query('email');
  if (!emailParam) {
    const allow =
      c.env.ALLOW_DEV_LOGIN === '1' ||
      !c.env.GOOGLE_CLIENT_ID;

    if (!allow) {
      return c.html(
        `
        <html style="font-family:system-ui;padding:40px;max-width:520px;margin:auto">
        <h2>Dev login disabled — Google only</h2>
        <p>This instance uses Google-only sign-in. Use <a href="/auth/google">Sign in with Google</a>.</p>
        <p><a href="/arc">← Back</a></p>
        </html>
        `,
        403
      );
    }

    return c.html(`
      <html style="font-family:system-ui;padding:40px;max-width:520px;margin:auto">
      <h2>Dev Login (local only)</h2>
      <p style="color:#666;font-size:13px">Google-only in production. This form is for local testing when GOOGLE_CLIENT_ID is not set.</p>
      <form method="get" action="/auth/dev-login">
        <input name="email" type="email" required placeholder="you@example.com" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px"/>
        <button type="submit" style="margin-top:12px;width:100%;padding:10px;background:#111;color:white;border-radius:8px">Continue</button>
      </form>
      <p style="margin-top:16px"><a href="/arc">← Back</a></p>
      </html>
    `);
  }

  const email = emailParam.trim().toLowerCase();
  const sql = getDb(c.env.DATABASE_URL);
  const existing = (await sql`SELECT id, email, name FROM users WHERE email = ${email}`) as any[];

  let userId: number;
  if (existing.length === 0) {
    const inserted = (await sql`
      INSERT INTO users (email, name, created_at)
      VALUES (${email}, ${email.split('@')[0]}, NOW())
      RETURNING id
    `) as any[];
    userId = inserted[0].id;
  } else {
    userId = existing[0].id;
  }

  await createSession(
    (k, v, o) => setCookie(c, k, v, o),
    { user_id: userId, user_email: email },
    c.env.SESSION_SECRET || DEFAULT_SESSION_SECRET
  );

  return c.redirect('/arc', 303);
});

authRouter.get('/me', async (c) => {
  const session = await getSession((k) => getCookie(c, k), c.env.SESSION_SECRET || DEFAULT_SESSION_SECRET);
  if (!session) {
    return c.json({ authenticated: false });
  }

  const sql = getDb(c.env.DATABASE_URL);
  const users = (await sql`SELECT id, email, name, picture FROM users WHERE id = ${session.user_id}`) as any[];
  if (users.length === 0) {
    return c.json({ authenticated: false });
  }

  const user = users[0];
  return c.json({ authenticated: true, email: user.email, name: user.name, picture: user.picture });
});
