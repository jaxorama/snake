import { checkAuth, unauthorized } from '../_utils/auth.js';

export async function onRequest(context) {
  if (!checkAuth(context.request, context.env)) return unauthorized();
  return context.next();
}
