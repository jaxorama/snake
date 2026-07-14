export async function onRequestPost(context) {
  const { request, env } = context;
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
