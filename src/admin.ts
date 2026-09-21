import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from './db';
import { getSession, DEFAULT_SESSION_SECRET } from './auth';
import type { Env } from './types';

export const DEFAULT_ADMIN_EMAIL = 'mohammedxazi@gmail.com';

export const adminRouter = new Hono<{ Bindings: Env }>();

async function checkAdmin(c: any): Promise<{ isAdmin: boolean; email: string }> {
  const session = await getSession((k) => getCookie(c, k), c.env.SESSION_SECRET || DEFAULT_SESSION_SECRET);
  const adminEmail = (c.env.ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL).toLowerCase().trim();
  if (!session || !session.user_email || session.user_email.toLowerCase().trim() !== adminEmail) {
    return { isAdmin: false, email: '' };
  }
  return { isAdmin: true, email: session.user_email };
}

adminRouter.get('/', async (c) => {
  const { isAdmin, email } = await checkAdmin(c);
  if (!isAdmin) {
    return c.html(
      `<html style="font-family:system-ui;padding:40px;max-width:640px;margin:auto;background:#000;color:#fff"><h2>404 — Not Found</h2><p>The page you’re looking for doesn’t exist.</p><p><a href="/" style="color:#999">← Back to Protocol</a></p></html>`,
      404
    );
  }

  const sql = getDb(c.env.DATABASE_URL);
  const totalUsersRes = (await sql`SELECT count(*) FROM users`) as any[];
  const googleUsersRes = (await sql`SELECT count(*) FROM users WHERE google_sub IS NOT NULL`) as any[];
  const totalStatesRes = (await sql`SELECT count(*) FROM winterarc_states`) as any[];
  const recent = (await sql`SELECT email, name, created_at, google_sub FROM users ORDER BY created_at DESC LIMIT 50`) as any[];

  const totalUsers = totalUsersRes[0]?.count || 0;
  const googleUsers = googleUsersRes[0]?.count || 0;
  const totalStates = totalStatesRes[0]?.count || 0;

  const rows = recent
    .map(
      (u) =>
        `<tr>
          <td style='padding:6px 8px;border:1px solid #262626'>${u.email}</td>
          <td style='padding:6px 8px;border:1px solid #262626'>${u.name || ''}</td>
          <td style='padding:6px 8px;border:1px solid #262626;font-size:11px'>${String(u.created_at).slice(0, 19)}</td>
          <td style='padding:6px 8px;border:1px solid #262626;font-size:10px'>${u.google_sub ? 'Google' : 'Dev'}</td>
        </tr>`
    )
    .join('');

  return c.html(`
    <html style="font-family:JetBrains Mono,monospace;padding:20px;max-width:960px;margin:auto;background:#000;color:#fff">
    <head><title>Admin — Winter Arc</title></head>
    <body>
    <p><a href="/" style="color:#999;text-decoration:none">← Back to Protocol</a> <span style="color:#666">|</span> <a href="/admin/stats" style="color:#fff">JSON</a></p>
    <h1 style="font-family:Saira Condensed,sans-serif;letter-spacing:3px">ADMIN — WINTER ARC</h1>
    <p style="color:#999;font-size:11px;letter-spacing:2px;text-transform:uppercase">Signed in as ${email} • ${totalUsers} users total</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0">
      <div style="border:1px solid #262626;padding:16px;text-align:center"><div style="font-size:28px">${totalUsers}</div><div style="color:#999;font-size:10px;letter-spacing:1px">TOTAL GOOGLE LOGINS</div></div>
      <div style="border:1px solid #262626;padding:16px;text-align:center"><div style="font-size:28px">${googleUsers}</div><div style="color:#999;font-size:10px;letter-spacing:1px">GOOGLE VERIFIED</div></div>
      <div style="border:1px solid #262626;padding:16px;text-align:center"><div style="font-size:28px">${totalStates}</div><div style="color:#999;font-size:10px;letter-spacing:1px">INITIALIZED ARCS</div></div>
    </div>
    <h3 style="font-family:Saira Condensed,sans-serif;letter-spacing:1px;margin-top:24px">Recent users (latest 50)</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
      <tr style="background:#141414;color:#999"><th style="padding:6px 8px;border:1px solid #262626;text-align:left">EMAIL</th><th style="padding:6px 8px;border:1px solid #262626">NAME</th><th style="padding:6px 8px;border:1px solid #262626">CREATED</th><th style="padding:6px 8px;border:1px solid #262626">TYPE</th></tr>
      ${rows || '<tr><td colspan=4 style="padding:12px;color:#666;text-align:center">No users yet</td></tr>'}
    </table>
    <p style="color:#666;font-size:11px;margin-top:16px">Public contact remains webmayhemx@gmail.com (FAQ/Privacy). This admin page is ${DEFAULT_ADMIN_EMAIL} only.</p>
    <p><a href="/auth/logout" style="color:#999;font-size:11px">Log out</a></p>
    </body></html>
  `);
});

adminRouter.get('/stats', async (c) => {
  const { isAdmin } = await checkAdmin(c);
  if (!isAdmin) {
    return c.json({ error: 'Not found' }, 404);
  }

  const sql = getDb(c.env.DATABASE_URL);
  const totalUsersRes = (await sql`SELECT count(*) FROM users`) as any[];
  const googleUsersRes = (await sql`SELECT count(*) FROM users WHERE google_sub IS NOT NULL`) as any[];
  const totalStatesRes = (await sql`SELECT count(*) FROM winterarc_states`) as any[];
  const recent = (await sql`SELECT email, name, created_at FROM users ORDER BY created_at DESC LIMIT 20`) as any[];

  return c.json({
    total_users: totalUsersRes[0]?.count || 0,
    google_users: googleUsersRes[0]?.count || 0,
    initialized_arcs: totalStatesRes[0]?.count || 0,
    admin: DEFAULT_ADMIN_EMAIL,
    recent: recent.map((u) => ({ email: u.email, name: u.name, created_at: String(u.created_at) })),
  });
});
