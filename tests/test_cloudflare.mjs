import http from 'http';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      `http://127.0.0.1:8788${path}`,
      {
        method: options.method || 'GET',
        headers: options.headers || {},
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body,
          });
        });
      }
    );
    req.on('error', reject);
    if (options.body) {
      req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

async function run() {
  console.log('Verifying Cloudflare endpoints on http://127.0.0.1:8788 ...');
  
  // Health
  const h = await request('/health');
  if (h.statusCode !== 200 || !h.body.includes('"status":"ok"')) {
    throw new Error('Health check failed');
  }
  console.log('✓ /health OK');

  // Static root
  const root = await request('/');
  if (root.statusCode !== 200 || !root.body.includes('WINTER ARC')) {
    throw new Error('Root page failed');
  }
  console.log('✓ / OK');

  // /arc clean URL
  const arc = await request('/arc');
  if (arc.statusCode !== 200 || !arc.body.includes('WINTER ARC')) {
    throw new Error('/arc failed');
  }
  console.log('✓ /arc OK');

  // /api/me anon
  const me = await request('/api/me');
  if (me.statusCode !== 200 || !me.body.includes('"authenticated":false')) {
    throw new Error('/api/me anon failed');
  }
  console.log('✓ /api/me (unauthenticated) OK');

  // /api/winterarc anon
  const wa = await request('/api/winterarc');
  if (wa.statusCode !== 401) {
    throw new Error('/api/winterarc anon failed');
  }
  console.log('✓ /api/winterarc (401 unauthenticated) OK');

  console.log('All Cloudflare smoke tests passed!');
}

run().catch((e) => {
  console.error('Test error:', e.message);
  process.exit(1);
});
