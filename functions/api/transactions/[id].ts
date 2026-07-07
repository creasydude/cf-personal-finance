import { getAuthenticatedUser, jsonError } from '../_lib/auth'

// PUT /api/transactions/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const id = context.params.id as string
  const body = await context.request.json() as any

  // Verify ownership
  const existing = await context.env.DB
    .prepare('SELECT * FROM transactions WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first()
  if (!existing) return jsonError('Transaction not found', 404)

  const { description, amount, category, date, tags, notes, account_id } = body

  await context.env.DB
    .prepare(
      `UPDATE transactions
       SET description = COALESCE(?, description),
           amount = COALESCE(?, amount),
           category = COALESCE(?, category),
           date = COALESCE(?, date),
           tags = COALESCE(?, tags),
           notes = COALESCE(?, notes),
           account_id = COALESCE(?, account_id)
       WHERE id = ? AND user_id = ?`
    )
    .bind(
      description || null,
      amount !== undefined ? amount : null,
      category !== undefined ? category : null,
      date || null,
      tags ? JSON.stringify(tags) : null,
      notes !== undefined ? notes : null,
      account_id || null,
      id,
      user.user_id
    )
    .run()

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
