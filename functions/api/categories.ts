import { getAuthenticatedUser, jsonError } from './_lib/auth'

// GET /api/categories
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const { results: categories } = await context.env.DB
    .prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY type, name')
    .bind(user.user_id)
    .all()

  return Response.json({ categories })
}

// POST /api/categories
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const body = await context.request.json() as any
  const { name, type, icon } = body

  if (!name || !type) return jsonError('name and type are required', 400)
  if (!['income', 'expense'].includes(type)) return jsonError('Invalid type', 400)

  const id = `cat_${crypto.randomUUID().substring(0, 8)}`
  await context.env.DB
    .prepare('INSERT INTO categories (id, user_id, name, type, icon, is_default) VALUES (?, ?, ?, ?, ?, 0)')
    .bind(id, user.user_id, name, type, icon || null)
    .run()

  const category = await context.env.DB
    .prepare('SELECT * FROM categories WHERE id = ?')
    .bind(id)
    .first()

  return Response.json(category, { status: 201 })
}

// DELETE /api/categories?id=xxx
export const onRequestDelete: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const url = new URL(context.request.url)
  const id = url.searchParams.get('id')
  if (!id) return jsonError('Category id is required', 400)

  const existing = await context.env.DB
    .prepare('SELECT id FROM categories WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .first()
  if (!existing) return jsonError('Category not found', 404)

  await context.env.DB
    .prepare('DELETE FROM categories WHERE id = ? AND user_id = ?')
    .bind(id, user.user_id)
    .run()

  return Response.json({ ok: true })
}
