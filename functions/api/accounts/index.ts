import { getAuthenticatedUser, jsonError } from '../_lib/auth'

function generateId(): string {
  return crypto.randomUUID()
}

// GET /api/accounts — list all accounts grouped by type
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const { results: accounts } = await context.env.DB
    .prepare('SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at DESC')
    .bind(user.user_id)
    .all()

  // Get base currency from settings
  const settings = JSON.parse(user.settings || '{}')
  const baseCurrency = settings.baseCurrency || 'USD'

  // Group by asset vs liability
  const assetTypes = ['cash', 'investment', 'crypto', 'property', 'vehicle', 'other_asset']
  const liabilityTypes = ['credit_card', 'loan', 'other_liability']

  const assets = accounts.filter(a => assetTypes.includes(a.type))
  const liabilities = accounts.filter(a => liabilityTypes.includes(a.type))

  const assetsTotal = assets.reduce((sum, a) => sum + (a.balance || 0), 0)
  const liabilitiesTotal = liabilities.reduce((sum, a) => sum + (a.balance || 0), 0)

  return Response.json({
    accounts: accounts.map(a => ({
      ...a,
      details: typeof a.details === 'string' ? JSON.parse(a.details) : a.details,
    })),
    assets_total: assetsTotal,
    liabilities_total: liabilitiesTotal,
    base_currency: baseCurrency,
  })
}

// POST /api/accounts — create account
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const body = await context.request.json() as any
  const { name, type, subtype, currency, details } = body
  let balance = body.balance || 0

  if (!name || !type) return jsonError('Name and type are required', 400)

  const id = generateId()
  await context.env.DB
    .prepare(
      `INSERT INTO accounts (id, user_id, name, type, subtype, currency, balance, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      user.user_id,
      name,
      type,
      subtype || null,
      currency || 'USD',
      balance || 0,
      JSON.stringify(details || {})
    )
    .run()

  // For gold accounts: store balance in GRAMS (converter handles price multiplication)
  if (type === 'gold' && details?.grams) {
    const grams = parseFloat(details.grams) || 0
    balance = grams
    await context.env.DB
      .prepare('UPDATE accounts SET balance = ? WHERE id = ? AND user_id = ?')
      .bind(grams, id, user.user_id)
      .run()
  }

  const account = await context.env.DB
    .prepare('SELECT * FROM accounts WHERE id = ?')
    .bind(id)
    .first()

  return Response.json({
    ...account,
    details: typeof account.details === 'string' ? JSON.parse(account.details) : account.details,
  }, { status: 201 })
}
