import { getAuthenticatedUser, jsonError } from '../_lib/auth'

// PUT /api/transactions/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const id = context.params.id as string
  const body = await context.request.json() as any

  // Get existing transaction
  const existing = await context.env.DB
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first<{ type: string; account_id: string; from_account_id: string; to_account_id: string; amount: number }>()
  if (!existing) return jsonError('Transaction not found', 404)

  const { description, amount, category, date, tags, notes, account_id } = body
  const newAmount = amount !== undefined ? amount : existing.amount
  const newType = body.type || existing.type
  const newAccountId = account_id || existing.account_id
  const newFromAccountId = body.from_account_id || existing.from_account_id
  const newToAccountId = body.to_account_id || existing.to_account_id

  // Step 1: Reverse old balance change
  if (existing.type === 'income' && existing.account_id) {
    await context.env.DB
      .prepare('UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
      .bind(existing.amount, existing.account_id, user.user_id)
      .run()
  } else if (existing.type === 'expense' && existing.account_id) {
    await context.env.DB
      .prepare('UPDATE accounts SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
      .bind(existing.amount, existing.account_id, user.user_id)
      .run()
  } else if (existing.type === 'transfer') {
    await context.env.DB.batch([
      context.env.DB
        .prepare('UPDATE accounts SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
        .bind(existing.amount, existing.from_account_id, user.user_id),
      context.env.DB
        .prepare('UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
        .bind(existing.amount, existing.to_account_id, user.user_id),
    ])
  }

  // Step 2: Update the transaction record
  await context.env.DB
    .prepare(
      `UPDATE transactions
       SET description = COALESCE(?, description),
           amount = COALESCE(?, amount),
           type = COALESCE(?, type),
           category = COALESCE(?, category),
           date = COALESCE(?, date),
           tags = COALESCE(?, tags),
           notes = COALESCE(?, notes),
           account_id = COALESCE(?, account_id),
           from_account_id = COALESCE(?, from_account_id),
           to_account_id = COALESCE(?, to_account_id)
       WHERE id = ? AND user_id = ?`
    )
    .bind(
      description || null,
      amount !== undefined ? amount : null,
      body.type || null,
      category !== undefined ? category : null,
      date || null,
      tags ? JSON.stringify(tags) : null,
      notes !== undefined ? notes : null,
      account_id || null,
      body.from_account_id || null,
      body.to_account_id || null,
      id,
      user.user_id
    )
    .run()

  // Step 3: Apply new balance change
  if (newType === 'income' && newAccountId) {
    await context.env.DB
      .prepare('UPDATE accounts SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
      .bind(newAmount, newAccountId, user.user_id)
      .run()
  } else if (newType === 'expense' && newAccountId) {
    await context.env.DB
      .prepare('UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
      .bind(newAmount, newAccountId, user.user_id)
      .run()
  } else if (newType === 'transfer') {
    await context.env.DB.batch([
      context.env.DB
        .prepare('UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
        .bind(newAmount, newFromAccountId, user.user_id),
      context.env.DB
        .prepare('UPDATE accounts SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
        .bind(newAmount, newToAccountId, user.user_id),
    ])
  }

  const txn = await context.env.DB
    .prepare('SELECT * FROM transactions WHERE id = ?')
    .bind(id)
    .first()

  return Response.json({
    ...txn,
    tags: typeof txn.tags === 'string' ? JSON.parse(txn.tags) : txn.tags,
  })
}

// DELETE /api/transactions/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const id = context.params.id as string

  const existing = await context.env.DB
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first<{ type: string; account_id: string; from_account_id: string; to_account_id: string; amount: number }>()
  if (!existing) return jsonError('Transaction not found', 404)

  // Reverse the balance change
  if (existing.type === 'income' && existing.account_id) {
    await context.env.DB
      .prepare('UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
      .bind(existing.amount, existing.account_id, user.user_id)
      .run()
  } else if (existing.type === 'expense' && existing.account_id) {
    await context.env.DB
      .prepare('UPDATE accounts SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
      .bind(existing.amount, existing.account_id, user.user_id)
      .run()
  } else if (existing.type === 'transfer') {
    await context.env.DB.batch([
      context.env.DB
        .prepare('UPDATE accounts SET balance = balance + ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
        .bind(existing.amount, existing.from_account_id, user.user_id),
      context.env.DB
        .prepare('UPDATE accounts SET balance = balance - ?, updated_at = datetime(\'now\') WHERE id = ? AND user_id = ?')
        .bind(existing.amount, existing.to_account_id, user.user_id),
    ])
  }

  await context.env.DB
    .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .run()

  return Response.json({ ok: true })
}
