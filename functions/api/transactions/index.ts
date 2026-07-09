import { getAuthenticatedUser, jsonError } from '../_lib/auth'

function generateId(): string {
  return crypto.randomUUID()
}

// GET /api/transactions — filterable, sortable, paginated
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const url = new URL(context.request.url)
  const type = url.searchParams.get('type')
  const account_id = url.searchParams.get('account_id')
  const category = url.searchParams.get('category')
  const tag = url.searchParams.get('tag')
  const search = url.searchParams.get('search')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const sort = url.searchParams.get('sort') || 'date'
  const order = url.searchParams.get('order') || 'desc'
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '50', 10)
  const offset = (page - 1) * limit

  let where = 'WHERE user_id = ?'
  const params: any[] = [user.user_id]

  if (type) { where += ' AND type = ?'; params.push(type) }
  if (account_id) { where += ' AND (account_id = ? OR from_account_id = ? OR to_account_id = ?)'; params.push(account_id, account_id, account_id) }
  if (category) { where += ' AND category = ?'; params.push(category) }
  if (tag) { where += ' AND tags LIKE ?'; params.push(`%${tag}%`) }
  if (search) { where += ' AND (description LIKE ? OR notes LIKE ?)'; params.push(`%${search}%`, `%${search}%`) }
  if (from) { where += ' AND date >= ?'; params.push(from) }
  if (to) { where += ' AND date <= ?'; params.push(to) }

  const validSort = ['date', 'amount', 'description', 'created_at'].includes(sort) ? sort : 'date'
  const validOrder = order === 'asc' ? 'ASC' : 'DESC'

  const countResult = await context.env.DB
    .prepare(`SELECT COUNT(*) as count FROM transactions ${where}`)
    .bind(...params)
    .first<{ count: number }>()

  const { results: transactions } = await context.env.DB
    .prepare(`SELECT t.*, COALESCE(a.attachment_count, 0) as attachment_count FROM transactions t LEFT JOIN (SELECT transaction_id, COUNT(*) as attachment_count FROM attachments GROUP BY transaction_id) a ON t.id = a.transaction_id ${where} ORDER BY t.${validSort} ${validOrder} LIMIT ? OFFSET ?`)
    .bind(...params, limit, offset)
    .all()

  return Response.json({
    transactions: transactions.map(t => ({
      ...t,
      tags: typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags,
    })),
    total: countResult?.count || 0,
    page,
    limit,
  })
}

// POST /api/transactions — create transaction
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const body = await context.request.json() as any
  const { type, description, amount, currency, account_id, from_account_id, to_account_id, category, date, tags, notes } = body

  if (!type || !description || amount === undefined || !date) {
    return jsonError('type, description, amount, and date are required', 400)
  }

  if (!['income', 'expense', 'transfer'].includes(type)) {
    return jsonError('Invalid transaction type', 400)
  }

  if (type === 'transfer') {
    if (!from_account_id || !to_account_id) {
      return jsonError('Transfers require from_account_id and to_account_id', 400)
    }
    // Verify both accounts belong to user
    const fromAccount = await context.env.DB
      .prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?')
      .bind(from_account_id, user.user_id)
      .first()
    const toAccount = await context.env.DB
      .prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?')
      .bind(to_account_id, user.user_id)
      .first()
    if (!fromAccount || !toAccount) return jsonError('One or both accounts not found', 404)
  } else if (!account_id) {
    return jsonError('Non-transfer transactions require account_id', 400)
  }

  const id = generateId()

  // Get account currency for conversion
  let txnCurrency = currency || 'USD'
  let convertedAmount = null

  if (account_id && !currency) {
    const account = await context.env.DB
      .prepare('SELECT currency FROM accounts WHERE id = ?')
      .bind(account_id)
      .first<{ currency: string }>()
    if (account) txnCurrency = account.currency
  }

  // For now, store original amount; conversion happens at read time via FX rates
  await context.env.DB
    .prepare(
      `INSERT INTO transactions (id, user_id, account_id, from_account_id, to_account_id, type, description, amount, currency, converted_amount, category, date, tags, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      user.user_id,
      account_id || null,
      from_account_id || null,
      to_account_id || null,
      type,
      description,
      amount,
      txnCurrency,
      convertedAmount,
      category || null,
      date,
      JSON.stringify(tags || []),
      notes || null
    )
    .run()

  // Update account balance for non-transfer transactions
  if (type === 'income' && account_id) {
    await context.env.DB
      .prepare('UPDATE accounts SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
      .bind(amount, account_id, user.user_id)
      .run()
  } else if (type === 'expense' && account_id) {
    await context.env.DB
      .prepare('UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
      .bind(amount, account_id, user.user_id)
      .run()
  } else if (type === 'transfer') {
    await context.env.DB.batch([
      context.env.DB
        .prepare('UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
        .bind(amount, from_account_id, user.user_id),
      context.env.DB
        .prepare('UPDATE accounts SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
        .bind(amount, to_account_id, user.user_id),
    ])
  }

  const txn = await context.env.DB
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .bind(id)
    .first()

  return Response.json({
    ...txn,
    tags: typeof txn.tags === 'string' ? JSON.parse(txn.tags) : txn.tags,
  }, { status: 201 })
}
