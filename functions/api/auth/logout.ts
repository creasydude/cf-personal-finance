import { getCookie, verifySession, jsonError, clearSessionCookie } from '../_lib/auth'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const sessionToken = getCookie(context.request, 'session')
  if (!sessionToken) return jsonError('Not authenticated', 401)

  const db = context.env.DB

  // Delete session from DB
  await db.prepare('DELETE FROM sessions WHERE token = ?').bind(sessionToken).run()

  const response = Response.json({ ok: true })
  return clearSessionCookie(response)
}
