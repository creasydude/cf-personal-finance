import { getAuthenticatedUser, jsonError } from './_lib/auth'

// GET /api/settings
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const settings = JSON.parse(user.settings || '{}')
  return Response.json({ settings })
}

// PUT /api/settings
export const onRequestPut: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const body = await context.request.json() as any
  const currentSettings = JSON.parse(user.settings || '{}')
  const newSettings = { ...currentSettings, ...body }

  await context.env.DB
    .prepare('UPDATE users SET settings = ? WHERE user_id = ?')
    .bind(JSON.stringify(newSettings), user.user_id)
    .run()

  return Response.json({ settings: newSettings })
}
