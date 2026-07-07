import { getAuthenticatedUser, jsonError } from './_lib/auth'

// GET /api/export — export all user data
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const db = context.env.DB
  const userId = user.user_id

  const [accounts, transactions, categories, budgets] = await Promise.all([
    db.prepare('SELECT * FROM accounts WHERE user_id = ?').bind(userId).all(),
    db.prepare('SELECT * FROM transactions WHERE user_id = ?').bind(userId).all(),
    db.prepare('SELECT * FROM categories WHERE user_id = ?').bind(userId).all(),
    db.prepare('SELECT * FROM budgets WHERE user_id = ?').bind(userId).all(),
  ])

  const settings = JSON.parse(user.settings || '{}')

  return Response.json({
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    accounts: accounts.results,
    transactions: transactions.results.map((t: any) => ({
      ...t,
      tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
    })),
    categories: categories.results,
    budgets: budgets.results,
  })
}
