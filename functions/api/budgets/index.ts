import { getAuthenticatedUser, jsonError } from '../_lib/auth'

function generateId(): string {
  return crypto.randomUUID()
}

// GET /api/budgets
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const url = new URL(context.request.url)
  const month = url.searchParams.get('month')
  const year = url.searchParams.get('year')

  let where = 'WHERE user_id = ?'
  const params: any[] = [user.user_id]

  if (month) { where += ' AND month = ?'; params.push(parseInt(month)) }
  if (year) { where += ' AND year = ?'; params.push(parseInt(year)) }

  const { results: budgets } = await context.env.DB
    .prepare(`SELECT * FROM budgets ${where} ORDER BY category`)
    .bind(...params)
    .all()

  // Get actual spending for each budget's category
  const enriched = await Promise.all(
    budgets.map(async (b) => {
      let txnWhere = 'WHERE user_id = ? AND type = \'expense\' AND category = ?'
      const txnParams: any[] = [user.user_id, b.category]

      if (b.period === 'monthly' && b.month && b.year) {
        txnWhere += ' AND strftime(\'%Y\', date) = ? AND strftime(\'%m\', date) = ?'
        txnParams.push(String(b.year), String(b.month).padStart(2, '0'))
      } else if (b.period === 'yearly' && b.year) {
        txnWhere += ' AND strftime(\'%Y\', date) = ?'
        txnParams.push(String(b.year))
      }

      const result = await context.env.DB
        .prepare(`SELECT COALESCE(SUM(amount), 0) as spent FROM transactions ${txnWhere}`)
        .bind(...txnParams)
        .first<{ spent: number }>()

      const spent = result?.spent || 0
      const remaining = b.amount - spent
      const pct = b.amount > 0 ? (spent / b.amount) * 100 : 0

      return { ...b, spent, remaining, pct }
    })
  )

  return Response.json({ budgets: enriched })
}

// POST /api/budgets
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const body = await context.request.json() as any
  const { category, amount, period, month, year, currency } = body

  if (!category || !amount || !period || !year) {
    return jsonError('category, amount, period, and year are required', 400)
  }

  const id = generateId()
  await context.env.DB
    .prepare(
      `INSERT INTO budgets (id, user_id, category, amount, period, month, year, currency)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, user.user_id, category, amount, period, month || null, year, currency || 'USD')
    .run()

  const budget = await context.env.DB
    .prepare('SELECT * FROM budgets WHERE id = ?')
    .bind(id)
    .first()

  return Response.json(budget, { status: 201 })
}
