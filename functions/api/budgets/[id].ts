import { getAuthenticatedUser, jsonError } from '../_lib/auth'

// PUT /api/budgets/:id
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const id = context.params.id as string
  const body = await context.request.json() as any

  const existing = await context.env.DB
    .prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first()
  if (!existing) return jsonError('Budget not found', 404)

  const { category, amount, period, month, year } = body

  await context.env.DB
    .prepare(
      `UPDATE budgets
       SET category = COALESCE(?, category),
           amount = COALESCE(?, amount),
           period = COALESCE(?, period),
           month = COALESCE(?, month),
           year = COALESCE(?, year)
       WHERE id = ? AND user_id = ?`
    )
    .bind(
      category || null,
      amount !== undefined ? amount : null,
      period || null,
      month !== undefined ? month : null,
      year || null,
      id,
      user.user_id
    )
    .run()

  const budget = await context.env.DB
    .prepare('SELECT * FROM budgets WHERE id = ?')
    .bind(id)
    .first()

  return Response.json(budget)
}

// DELETE /api/budgets/:id
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const id = context.params.id as string

  const existing = await context.env.DB
    .prepare('SELECT id FROM budgets WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first()
  if (!existing) return jsonError('Budget not found', 404)

  await context.env.DB
    .prepare('DELETE FROM budgets WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .run()

  return Response.json({ ok: true })
}
