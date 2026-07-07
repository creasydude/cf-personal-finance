import { getAuthenticatedUser, jsonError } from './_lib/auth'

// DELETE /api/account — delete entire account and all data
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const db = context.env.DB
  const userId = user.user_id

  await db.batch([
    db.prepare('DELETE FROM transactions WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM accounts WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM categories WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM budgets WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId),
    db.prepare('DELETE FROM users WHERE user_id = ?').bind(userId),
  ])

  return Response.json({ ok: true })
}
