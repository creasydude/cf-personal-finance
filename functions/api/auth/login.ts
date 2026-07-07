import { createSession, setSessionCookie, jsonError, checkRateLimit } from '../_lib/auth'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Rate limit: 20 requests per minute per IP
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'
  const allowed = await checkRateLimit(context.env.RATE_CACHE, `login:${ip}`, 20, 60)
  if (!allowed) return jsonError('Too many requests. Please try again later.', 429)

  const body = await context.request.json() as { code?: string }
  const code = body?.code

  if (!code || typeof code !== 'string') {
    return jsonError('Access code is required', 400)
  }

  // Normalize the code
  const normalizedCode = code.toUpperCase().trim()

  const db = context.env.DB

  // Look up user by code
  const user = await db
    .prepare('SELECT user_id FROM users WHERE code = ?')
    .bind(normalizedCode)
    .first<{ user_id: string }>()

  if (!user) {
    return jsonError('Invalid access code', 401)
  }

  // Create session and set cookie
  const sessionToken = await createSession(db, user.user_id)
  const response = Response.json({ userId: user.user_id })
  return setSessionCookie(response, sessionToken)
}
