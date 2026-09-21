import { Hono } from 'hono';
import { authRouter } from './auth';
import { apiRouter } from './api';
import { adminRouter } from './admin';
import type { Env } from './types';

const app = new Hono<{ Bindings: Env }>();

// Global health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    app: 'WINTERARC',
    mode: 'winter-arc-cloud',
    runtime: 'cloudflare',
  });
});

// Mount routers
app.route('/auth', authRouter);
app.route('/api', apiRouter);
app.route('/admin', adminRouter);

export default app;
