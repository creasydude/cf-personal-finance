import { getAuthenticatedUser, jsonError } from '../_lib/auth'

// POST /api/account/reset — reset account (keep categories + settings, delete everything else)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const db = context.env.DB
  const userId = user.user_id

  await db.batch([
    db.prepare('DELETE FROM transactions WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM accounts WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM budgets WHERE user_id = ?').bind(userId),
  ])

  return Response.json({ ok: true })
}
