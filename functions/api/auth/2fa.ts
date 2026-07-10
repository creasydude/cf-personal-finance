import * as OTPAuth from 'otpauth'
import { getAuthenticatedUser, jsonError } from '../_lib/auth'

// POST /api/auth/2fa/enable — generate secret + QR URI
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const settings = JSON.parse(user.settings || '{}')
  if (settings.twoFactorEnabled) return jsonError('2FA is already enabled', 400)

  // Generate TOTP secret
  const totp = new OTPAuth.TOTP({
    issuer: 'PersonalFinance',
    label: user.code,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
  })

  const secret = totp.secret.base32
  const uri = totp.toString()

  // Store secret temporarily (not enabled yet)
  await context.env.DB
    .prepare('UPDATE users SET settings = ? WHERE user_id = ?')
    .bind(JSON.stringify({ ...settings, twoFactorSecret: secret, twoFactorEnabled: false }), user.user_id)
    .run()

  return Response.json({ secret, uri })
}

// PUT /api/auth/2fa — verify code to enable/disable
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const body = await context.request.json() as { code: string; action: 'enable' | 'disable' }
  const { code, action } = body

  if (!code || !action) return jsonError('code and action are required', 400)
  if (!['enable', 'disable'].includes(action)) return jsonError('Invalid action', 400)

  const settings = JSON.parse(user.settings || '{}')

  if (action === 'enable') {
    if (!settings.twoFactorSecret) return jsonError('No pending 2FA setup. Call POST /api/auth/2fa first.', 400)
    if (settings.twoFactorEnabled) return jsonError('2FA is already enabled', 400)

    // Verify the code against the stored secret
    const totp = new OTPAuth.TOTP({
      issuer: 'PersonalFinance',
      label: user.code,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(settings.twoFactorSecret),
    })

    const delta = totp.validate({ token: code, window: 1 })
    if (delta === null) return jsonError('Invalid verification code', 400)

    // Enable 2FA
    await context.env.DB
      .prepare('UPDATE users SET settings = ? WHERE user_id = ?')
      .bind(JSON.stringify({ ...settings, twoFactorEnabled: true }), user.user_id)
      .run()

    return Response.json({ ok: true, enabled: true })
  }

  if (action === 'disable') {
    if (!settings.twoFactorEnabled) return jsonError('2FA is not enabled', 400)

    // Verify the code before disabling
    const totp = new OTPAuth.TOTP({
      issuer: 'PersonalFinance',
      label: user.code,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(settings.twoFactorSecret),
    })

    const delta = totp.validate({ token: code, window: 1 })
    if (delta === null) return jsonError('Invalid verification code', 400)

    // Disable 2FA
    const { twoFactorSecret, twoFactorEnabled, ...rest } = settings
    await context.env.DB
      .prepare('UPDATE users SET settings = ? WHERE user_id = ?')
      .bind(JSON.stringify(rest), user.user_id)
      .run()

    return Response.json({ ok: true, enabled: false })
  }

  return jsonError('Invalid action', 400)
}
