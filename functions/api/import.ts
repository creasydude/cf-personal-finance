import { getAuthenticatedUser, jsonError } from './_lib/auth'

// POST /api/import — import data from exported JSON
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const body = await context.request.json() as any
  const db = context.env.DB
  const userId = user.user_id

  if (!body || !body.version) {
    return jsonError('Invalid import file format', 400)
  }

  const results = { accounts: 0, transactions: 0, categories: 0, budgets: 0 }

  // Import accounts
  if (body.accounts?.length) {
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO accounts (id, user_id, name, type, subtype, currency, balance, details, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    const batch = body.accounts.map((a: any) =>
      stmt.bind(a.id, userId, a.name, a.type, a.subtype || null, a.currency || 'USD', a.balance || 0, typeof a.details === 'string' ? a.details : JSON.stringify(a.details || {}), a.created_at || new Date().toISOString(), a.updated_at || new Date().toISOString())
    )
    await db.batch(batch)
    results.accounts = body.accounts.length
  }

  // Import transactions
  if (body.transactions?.length) {
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO transactions (id, user_id, account_id, from_account_id, to_account_id, type, description, amount, currency, converted_amount, category, date, tags, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    const batch = body.transactions.map((t: any) =>
      stmt.bind(t.id, userId, t.account_id || null, t.from_account_id || null, t.to_account_id || null, t.type, t.description, t.amount, t.currency || 'USD', t.converted_amount || null, t.category || null, t.date, typeof t.tags === 'string' ? t.tags : JSON.stringify(t.tags || []), t.notes || null, t.created_at || new Date().toISOString())
    )
    await db.batch(batch)
    results.transactions = body.transactions.length
  }

  // Import categories
  if (body.categories?.length) {
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO categories (id, user_id, name, type, icon, is_default) VALUES (?, ?, ?, ?, ?, ?)`
    )
    const batch = body.categories.map((c: any) =>
      stmt.bind(c.id, userId, c.name, c.type, c.icon || null, c.is_default || 0)
    )
    await db.batch(batch)
    results.categories = body.categories.length
  }

  // Import budgets
  if (body.budgets?.length) {
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO budgets (id, user_id, category, amount, period, month, year, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    const batch = body.budgets.map((b: any) =>
      stmt.bind(b.id, userId, b.category, b.amount, b.period, b.month || null, b.year, b.created_at || new Date().toISOString())
    )
    await db.batch(batch)
    results.budgets = body.budgets.length
  }

  return Response.json({ ok: true, imported: results })
}
