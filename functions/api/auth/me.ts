import { getCookie, verifySession, jsonError } from '../_lib/auth'

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const sessionToken = getCookie(context.request, 'session')
  if (!sessionToken) return jsonError('Not authenticated', 401)

  const user = await verifySession(context.env.DB, sessionToken)
  if (!user) return jsonError('Invalid session', 401)

  const settings = JSON.parse(user.settings || '{}')

  return Response.json({
    userId: user.user_id,
    code: user.code,
    settings,
  })
}
