import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { getDb } from './db';
import { getSession, DEFAULT_SESSION_SECRET } from './auth';
import type { Env, WinterArcState } from './types';

export const DEFAULT_DATA = [
  {
    id: 'h1',
    cat: 'Health Infrastructure',
    color: '#00D4FF',
    tasks: [
      { id: 't1', title: 'Hydration', desc: 'Drink 3–4 liters of water.', stat: 'hydration' },
      { id: 't2', title: 'Nutrition', desc: 'Hit 2500-calorie and strict protein targets.', stat: 'nutrition' },
      { id: 't3', title: 'Training', desc: 'Complete heavy lifting session (track progressive overload).', stat: 'training' },
      { id: 't4', title: 'Recovery', desc: 'Sleep 7–8 hours.', stat: 'recovery' },
    ],
  },
  {
    id: 'h2',
    cat: 'Skill Development',
    color: '#A855F7',
    tasks: [
      { id: 't5', title: 'Deep Work', desc: '45 minutes of focused skill acquisition — Coding / Editing / Design.', stat: 'deepWork' },
      { id: 't6', title: 'Discipline', desc: 'Leisure / Entertainment strictly capped at 1–2 hours.', stat: 'discipline' },
    ],
  },
  {
    id: 'h3',
    cat: 'Academic Prep',
    color: '#22C55E',
    tasks: [
      { id: 't7', title: 'Core Reading', desc: 'Read 10–15 pages of primary texts.', stat: 'reading' },
      { id: 't8', title: 'Active Recall', desc: '20–30 minutes of spaced repetition / flashcards.', stat: 'activeRecall' },
    ],
  },
];

export const STAT_KEYS = ['hydration', 'nutrition', 'training', 'recovery', 'deepWork', 'discipline', 'reading', 'activeRecall', 'socialLife'];
export const DEFAULT_ARC_DAYS = 90;

export const apiRouter = new Hono<{ Bindings: Env }>();

apiRouter.get('/me', async (c) => {
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

apiRouter.get('/winterarc', async (c) => {
  const session = await getSession((k) => getCookie(c, k), c.env.SESSION_SECRET || DEFAULT_SESSION_SECRET);
  if (!session) {
    return c.json(
      {
        authenticated: false,
        data: DEFAULT_DATA,
        checks: {},
        stats: null,
        streak: 0,
        last_100_date: null,
        arc_start_date: null,
        arc_days: DEFAULT_ARC_DAYS,
      },
      401
    );
  }

  const sql = getDb(c.env.DATABASE_URL);
  let states = (await sql`SELECT * FROM winterarc_states WHERE user_id = ${session.user_id}`) as WinterArcState[];

  if (states.length === 0) {
    states = (await sql`
      INSERT INTO winterarc_states (
        user_id, data_json, checks_json, stats_json, streak,
        last_100_date, checks_date, arc_start_date, arc_days, updated_at
      )
      VALUES (
        ${session.user_id},
        ${JSON.stringify(DEFAULT_DATA)},
        '{}',
        '{}',
        0,
        NULL,
        NULL,
        NULL,
        ${DEFAULT_ARC_DAYS},
        NOW()
      )
      RETURNING *
    `) as WinterArcState[];
  }

  const state = states[0];
  let data = DEFAULT_DATA;
  let checks: Record<string, boolean> = {};
  let stats: any = null;

  try {
    if (state.data_json) data = JSON.parse(state.data_json);
  } catch {}
  try {
    if (state.checks_json) checks = JSON.parse(state.checks_json);
  } catch {}
  try {
    if (state.stats_json && state.stats_json !== '{}') {
      stats = JSON.parse(state.stats_json);
      if (stats && typeof stats === 'object') {
        for (const k of ['hydration', 'nutrition', 'training', 'recovery', 'deepWork', 'discipline', 'reading']) {
          if (!(k in stats)) stats[k] = 5;
        }
      }
    }
  } catch {}

  let arcStart = state.arc_start_date || (stats && stats._arc_start) || null;
  let arcDays = state.arc_days || (stats && stats._arc_days ? parseInt(stats._arc_days, 10) : DEFAULT_ARC_DAYS);
  if (!arcDays || arcDays < 7 || arcDays > 365) arcDays = DEFAULT_ARC_DAYS;

  let checksDate = state.checks_date || (stats && stats._checks_date) || null;

  return c.json({
    authenticated: true,
    data,
    checks,
    stats,
    streak: state.streak || 0,
    last_100_date: state.last_100_date,
    checks_date: checksDate,
    arc_start_date: arcStart,
    arc_days: arcDays,
  });
});

apiRouter.put('/winterarc', async (c) => {
  const session = await getSession((k) => getCookie(c, k), c.env.SESSION_SECRET || DEFAULT_SESSION_SECRET);
  if (!session) {
    return c.json({ error: 'Not authenticated', authenticated: false }, 401);
  }

  let payload: any;
  try {
    payload = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const { data, checks, stats, streak, last_100_date, checks_date, arc_start_date } = payload;
  let arc_days = payload.arc_days;

  if (arc_start_date === undefined && stats && stats._arc_start) {
    payload.arc_start_date = stats._arc_start;
  }
  if (arc_days === undefined && stats && stats._arc_days) {
    arc_days = stats._arc_days;
  }

  if (data === undefined || checks === undefined) {
    return c.json({ error: 'Missing data/checks' }, 400);
  }

  if (arc_days !== undefined && arc_days !== null) {
    const parsed = parseInt(String(arc_days), 10);
    if (!isNaN(parsed)) {
      arc_days = Math.min(365, Math.max(7, parsed));
    } else {
      arc_days = DEFAULT_ARC_DAYS;
    }
  } else {
    arc_days = DEFAULT_ARC_DAYS;
  }

  const dataJson = JSON.stringify(data);
  const checksJson = JSON.stringify(checks);
  const statsJson = stats !== undefined && stats !== null ? JSON.stringify(stats) : null;
  const streakVal = streak !== undefined && streak !== null ? parseInt(String(streak), 10) || 0 : 0;
  const last100 = last_100_date !== undefined ? last_100_date : null;
  const checksDt = checks_date !== undefined ? checks_date : null;
  const arcStart = payload.arc_start_date !== undefined ? payload.arc_start_date : null;

  const sql = getDb(c.env.DATABASE_URL);
  const existing = (await sql`SELECT id, stats_json FROM winterarc_states WHERE user_id = ${session.user_id}`) as any[];

  if (existing.length === 0) {
    await sql`
      INSERT INTO winterarc_states (
        user_id, data_json, checks_json, stats_json, streak,
        last_100_date, checks_date, arc_start_date, arc_days, updated_at
      )
      VALUES (
        ${session.user_id}, ${dataJson}, ${checksJson}, ${statsJson || '{}'}, ${streakVal},
        ${last100}, ${checksDt}, ${arcStart}, ${arc_days}, NOW()
      )
    `;
  } else {
    const finalStatsJson = statsJson !== null ? statsJson : existing[0].stats_json;
    await sql`
      UPDATE winterarc_states
      SET data_json = ${dataJson},
          checks_json = ${checksJson},
          stats_json = ${finalStatsJson},
          streak = ${streakVal},
          last_100_date = ${last100},
          checks_date = ${checksDt},
          arc_start_date = ${arcStart},
          arc_days = ${arc_days},
          updated_at = NOW()
      WHERE user_id = ${session.user_id}
    `;
  }

  return c.json({ ok: true });
});
