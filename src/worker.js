function checkAuth(request, env) {
  const user = env.ADMIN_USER || 'admin';
  const pass = env.ADMIN_PASS || 'changeme';
  const header = request.headers.get('Authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = atob(encoded);
    const idx = decoded.indexOf(':');
    const u = decoded.slice(0, idx);
    const p = decoded.slice(idx + 1);
    if (u === user && p === pass) return true;
  }
  return false;
}

function unauthorized() {
  return new Response('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}

async function handleLog(request, env) {
  let body = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const id = crypto.randomUUID();
  const serverTimestamp = new Date().toISOString();
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const userAgent = request.headers.get('User-Agent') || '';
  const acceptLanguage = request.headers.get('Accept-Language') || '';
  const referer = request.headers.get('Referer') || '';

  await env.DB.prepare(
    `INSERT INTO visitors (id, server_timestamp, ip, user_agent, accept_language, referer, client_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, serverTimestamp, ip, userAgent, acceptLanguage, referer, JSON.stringify(body))
    .run();

  return Response.json({ ok: true });
}

async function handleVisitorsGet(request, env) {
  if (!checkAuth(request, env)) return unauthorized();

  const { results } = await env.DB.prepare(
    `SELECT * FROM visitors ORDER BY server_timestamp DESC`
  ).all();

  const records = results.map((row) => ({
    id: row.id,
    serverTimestamp: row.server_timestamp,
    ip: row.ip,
    headers: {
      userAgent: row.user_agent,
      acceptLanguage: row.accept_language,
      referer: row.referer,
    },
    client: JSON.parse(row.client_json || '{}'),
  }));

  return Response.json(records);
}

async function handleVisitorsDelete(request, env) {
  if (!checkAuth(request, env)) return unauthorized();
  await env.DB.prepare(`DELETE FROM visitors`).run();
  return Response.json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/log' && request.method === 'POST') {
      return handleLog(request, env);
    }
    if (url.pathname === '/api/visitors' && request.method === 'GET') {
      return handleVisitorsGet(request, env);
    }
    if (url.pathname === '/api/visitors' && request.method === 'DELETE') {
      return handleVisitorsDelete(request, env);
    }
    if (url.pathname === '/admin' || url.pathname === '/admin.html' || url.pathname.startsWith('/admin/')) {
      if (!checkAuth(request, env)) return unauthorized();
      return env.ASSETS.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};
