import { checkAuth, unauthorized } from '../_utils/auth.js';

export async function onRequestGet(context) {
  const { request, env } = context;
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

export async function onRequestDelete(context) {
  const { request, env } = context;
  if (!checkAuth(request, env)) return unauthorized();

  await env.DB.prepare(`DELETE FROM visitors`).run();
  return Response.json({ ok: true });
}
