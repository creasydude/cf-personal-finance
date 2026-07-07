import { getAuthenticatedUser, jsonError } from './_lib/auth'

// Symbol mapping: currency code → API symbol
const FIAT_SYMBOL_MAP: Record<string, string> = {
  USD: 'price_dollar_rl',
  EUR: 'price_eur',
  GBP: 'price_gbp',
  AED: 'price_dirham',
  AUD: 'price_aud',
  CAD: 'price_cad',
  CHF: 'price_chf',
  CNY: 'price_cny',
  HKD: 'price_hkd',
  INR: 'price_inr',
  JPY: 'price_jpy',
  KRW: 'price_krw',
  KWD: 'price_kwd',
  OMR: 'price_omr',
  SAR: 'price_sar',
  SGD: 'price_sgd',
  TRY: 'price_try',
}

// GET /api/convert?from=USD&to=IRR&amount=100
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const url = new URL(context.request.url)
  const from = url.searchParams.get('from')?.toUpperCase()
  const to = url.searchParams.get('to')?.toUpperCase()
  const amount = parseFloat(url.searchParams.get('amount') || '0')

  if (!from || !to) return jsonError('from and to are required', 400)

  // Fetch cached rates
  const kv = context.env.RATE_CACHE
  const cached = await kv.get('exchange_rates', 'json') as any

  if (!cached) {
    return jsonError('Exchange rates not available. Call /api/rates first.', 503)
  }

  const { fiat, crypto } = cached

  // Get IRR value of `from` currency
  let fromIrrRate: number | null = null

  if (from === 'IRR') {
    fromIrrRate = 1
  } else {
    // Check fiat
    const fiatSymbol = FIAT_SYMBOL_MAP[from]
    if (fiatSymbol && fiat[fiatSymbol]) {
      fromIrrRate = fiat[fiatSymbol]
    }
    // Check crypto
    if (crypto[from]) {
      fromIrrRate = crypto[from].irr
    }
  }

  // Get IRR value of `to` currency (to compute cross-rate)
  let toIrrRate: number | null = null

  if (to === 'IRR') {
    toIrrRate = 1
  } else {
    const toFiatSymbol = FIAT_SYMBOL_MAP[to]
    if (toFiatSymbol && fiat[toFiatSymbol]) {
      toIrrRate = fiat[toFiatSymbol]
    }
    if (crypto[to]) {
      toIrrRate = crypto[to].irr
    }
  }

  if (!fromIrrRate || !toIrrRate) {
    return jsonError(`Currency pair ${from}→${to} not supported`, 400)
  }

  // Convert: from → IRR → to
  const irrAmount = amount * fromIrrRate
  const result = irrAmount / toIrrRate
  const rate = fromIrrRate / toIrrRate

  return Response.json({
    from,
    to,
    amount,
    result: Math.round(result * 100) / 100,
    rate: Math.round(rate * 10000) / 10000,
    cachedAt: cached.fetchedAt,
  })
}
