import { getAuthenticatedUser, jsonError } from '../_lib/auth'

// PUT /api/accounts/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const id = context.params.id as string
  const body = await context.request.json() as any
  const { name, type, subtype, currency, balance, details } = body

  // Verify ownership
  const existing = await context.env.DB
    .prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first()
  if (!existing) return jsonError('Account not found', 404)

  await context.env.DB
    .prepare(
      `UPDATE accounts
       SET name = COALESCE(?, name),
           type = COALESCE(?, type),
           subtype = COALESCE(?, subtype),
           currency = COALESCE(?, currency),
           balance = COALESCE(?, balance),
           details = COALESCE(?, details),
           updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`
    )
    .bind(
      name || null,
      type || null,
      subtype !== undefined ? subtype : null,
      currency || null,
      balance !== undefined ? balance : null,
      details ? JSON.stringify(details) : null,
      id,
      user.user_id
    )
    .run()

  const account = await context.env.DB
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .bind(id)
    .first()

  // For gold accounts: recalculate balance from grams × live gold price
  const accountType = account?.type || body.type
  const accountCurrency = account?.currency || currency
  if (accountType === 'gold' && details?.grams) {
    try {
      const kv = context.env.RATE_CACHE
      const cached = await kv.get('exchange_rates', 'json') as any
      const goldRates = cached?.gold || {}
      const goldSymMap: Record<string, string> = { GOLD_GRAM24: 'geram24', GOLD_GRAM22: 'geram22', GOLD_GRAM18: 'geram18' }
      const goldSym = goldSymMap[accountCurrency || 'GOLD_GRAM18'] || 'geram18'
      const pricePerGram = goldRates[goldSym] || 0
      if (pricePerGram > 0) {
        const grams = parseFloat(details.grams) || 0
        const calculatedBalance = grams
        await context.env.DB
          .prepare('UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?')
          .bind(calculatedBalance, id, user.user_id)
          .run()
      }
    } catch (e) { /* ignore */ }
    // Re-fetch account with updated balance
    const updated = await context.env.DB
      .prepare('SELECT * FROM accounts WHERE id = ?')
      .bind(id)
      .first()
    return Response.json({
      ...updated,
      details: typeof updated.details === 'string' ? JSON.parse(updated.details) : updated.details,
    })
  }

  return Response.json({
    ...account,
    details: typeof account.details === 'string' ? JSON.parse(account.details) : account.details,
  })
}

// DELETE /api/accounts/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const id = context.params.id as string

  const existing = await context.env.DB
    .prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first()
  if (!existing) return jsonError('Account not found', 404)

  await context.env.DB
    .prepare('DELETE FROM accounts WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .run()

  return Response.json({ ok: true })
}
