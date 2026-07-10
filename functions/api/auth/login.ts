import * as OTPAuth from 'otpauth'
import { createSession, setSessionCookie, jsonError, checkRateLimit } from '../_lib/auth'

export const onRequestPost: PagesFunction<Env> = async (context) => {
  // Rate limit: 20 requests per minute per IP
  const ip = context.request.headers.get('CF-Connecting-IP') || 'unknown'
  const allowed = await checkRateLimit(context.env.RATE_CACHE, `login:${ip}`, 20, 60)
  if (!allowed) return jsonError('Too many requests. Please try again later.', 429)

  const body = await context.request.json() as { code?: string; totp?: string }
  const code = body?.code
  const totp = body?.totp

  if (!code || typeof code !== 'string') {
    return jsonError('Access code is required', 400)
  }

  // Normalize the code
  const normalizedCode = code.toUpperCase().trim()

  const db = context.env.DB

  // Look up user by code
  const user = await db
    .prepare('SELECT user_id, settings FROM users WHERE code = ?')
    .bind(normalizedCode)
    .first<{ user_id: string; settings: string }>()

  if (!user) {
    return jsonError('Invalid access code', 401)
  }

  const settings = JSON.parse(user.settings || '{}')

  // If 2FA is enabled, require TOTP verification
  if (settings.twoFactorEnabled) {
    if (!totp) {
      return Response.json({ requires2FA: true })
    }

    // Verify TOTP code
    const totpInstance = new OTPAuth.TOTP({
      issuer: 'PersonalFinance',
      label: normalizedCode,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(settings.twoFactorSecret),
    })

    const delta = totpInstance.validate({ token: totp, window: 1 })
    if (delta === null) {
      return jsonError('Invalid authentication code', 401)
    }
  }

  // Create session and set cookie
  const sessionToken = await createSession(db, user.user_id)
  const response = Response.json({ userId: user.user_id })
  return setSessionCookie(response, sessionToken)
}
