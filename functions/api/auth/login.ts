import { generateCode, hashToken, createSession, setSessionCookie, jsonError, checkRateLimit } from '../_lib/auth'
import { DEFAULT_CATEGORIES } from '../_lib/defaults'

// Generate a unique access code (XXXX-XXXX format)
function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789' // no 0/O, 1/I/L
  const getRandomChar = () => {
    const arr = new Uint8Array(1)
    crypto.getRandomValues(arr)
    return chars[arr[0] % chars.length]
  }

  let code: string
  do {
    const a = Array.from({ length: 4 }, getRandomChar).join('')
    const b = Array.from({ length: 4 }, getRandomChar).join('')
    code = `${a}-${b}`
  } while (false) // collision check not needed for first generation

  return code
}

// Generate a stable user ID from code
function userIdFromCode(code: string): string {
  // Simple deterministic ID based on the code
  return `u_${code.replace('-', '').toLowerCase()}`
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Rate limit: 10 requests per minute per IP
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'
  const allowed = await checkRateLimit(context.env.RATE_CACHE, `register:${ip}`, 10, 60)
  if (!allowed) return jsonError('Too many requests. Please try again later.', 429)

  const db = context.env.DB
  const code = generateAccessCode()
  const userId = userIdFromCode(code)

  // Check for collision (extremely unlikely but safe)
  const existing = await db.prepare('SELECT user_id FROM users WHERE user_id = ?').bind(userId).first()
  if (existing) {
    return jsonError('Code collision, please try again', 500)
  }

  // Create user
  await db.prepare('INSERT INTO users (code, user_id, settings) VALUES (?, ?, ?)').bind(
    code,
    userId,
    JSON.stringify({ baseCurrency: 'USD' })
  ).run()

  // Seed default categories
  const stmt = db.prepare('INSERT INTO categories (id, user_id, name, type, icon, is_default) VALUES (?, ?, ?, ?, ?, 1)')
  const batch = DEFAULT_CATEGORIES.map((cat, i) =>
    stmt.bind(`cat_${userId}_${i}`, userId, cat.name, cat.type, cat.icon)
  )
  await db.batch(batch)

  // Create session and set cookie
  const sessionToken = await createSession(db, userId)
  const response = Response.json({ code, userId })
  return setSessionCookie(response, sessionToken)
}
