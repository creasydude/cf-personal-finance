import type { Env } from '../../../src/types'

// ─── Cookie Helpers ──────────────────────────────────────────
export function getCookie(request: Request, name: string): string | null {
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(new RegExp(`${name}=([^;]+)`))
  return match ? match[1] : null
}

export function setSessionCookie(response: Response, token: string): Response {
  const res = new Response(response.body, response)
  res.headers.append(
    'Set-Cookie',
    `session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`
  )
  return res
}

export function clearSessionCookie(response: Response): Response {
  const res = new Response(response.body, response)
  res.headers.append(
    'Set-Cookie',
    `session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
  )
  return res
}

// ─── Session Management ──────────────────────────────────────
export async function createSession(db: D1Database, userId: string): Promise<string> {
  const token = crypto.randomUUID()
  await db.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').bind(token, userId).run()
  return token
}

export async function verifySession(
  db: D1Database,
  token: string
): Promise<{ user_id: string; code: string; settings: string } | null> {
  const row = await db
    .prepare(
      `SELECT s.user_id, u.code, u.settings
       FROM sessions s
       JOIN users u ON s.user_id = u.user_id
       WHERE s.token = ?`
    )
    .bind(token)
    .first<{ user_id: string; code: string; settings: string }>()

  return row || null
}

export async function getAuthenticatedUser(
  db: D1Database,
  request: Request
): Promise<{ user_id: string; code: string; settings: string } | null> {
  const token = getCookie(request, 'session')
  if (!token) return null
  return verifySession(db, token)
}

// ─── Rate Limiting (KV-based) ────────────────────────────────
export async function checkRateLimit(
  kv: KVNamespace,
  key: string,
  maxRequests: number,
  windowSeconds: number
): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `rl:${key}:${Math.floor(now / windowSeconds)}`

  const current = await kv.get(windowKey)
  const count = current ? parseInt(current, 10) + 1 : 1

  if (count > maxRequests) return false

  await kv.put(windowKey, count.toString(), { expirationTtl: windowSeconds * 2 })
  return true
}

// ─── Error Helper ────────────────────────────────────────────
export function jsonError(message: string, status: number = 400): Response {
  return Response.json({ error: message }, { status })
}
