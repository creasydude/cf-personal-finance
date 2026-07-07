import { getAuthenticatedUser, jsonError } from './_lib/auth'

const CURRENCY_API_BASE = 'https://currencies.plusking.ir'
const CURRENCY_API_KEY = 'ae2b7d5548281c620ef0e186544a5d92d5d78fde'

// Symbol mapping for the API
const SYMBOL_MAP: Record<string, string> = {
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
  BTC: 'crypto-bitcoin',
  ETH: 'crypto-ethereum',
  USDT: 'crypto-tether',
  BNB: 'crypto-binancecoin',
  SOL: 'crypto-solana',
  XRP: 'crypto-xrp',
  DOGE: 'crypto-dogecoin',
  ADA: 'crypto-cardano',
  DOT: 'crypto-polkadot',
  AVAX: 'crypto-avalanche',
}

async function fetchCurrencyRates(): Promise<Record<string, number>> {
  const res = await fetch(`${CURRENCY_API_BASE}/currency`, {
    headers: { 'X-API-Key': CURRENCY_API_KEY },
  })

  if (!res.ok) throw new Error('Failed to fetch currency rates')
  const data = await res.json() as { items: Array<{ symbol: string; price_num: number }> }

  const rates: Record<string, number> = {}
  for (const item of data.items) {
    rates[item.symbol] = item.price_num
  }
  return rates
}

async function fetchCryptoRates(): Promise<Record<string, number>> {
  const res = await fetch(`${CURRENCY_API_BASE}/crypto`, {
    headers: { 'X-API-Key': CURRENCY_API_KEY },
  })

  if (!res.ok) throw new Error('Failed to fetch crypto rates')
  const data = await res.json() as { items: Array<{ ticker: string; price_num: number }> }

  const rates: Record<string, number> = {}
  for (const item of data.items) {
    rates[item.ticker] = item.price_num
  }
  return rates
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

  // IRR is the base in this API — all prices are in IRR
  if (to === 'IRR') {
    try {
      const [currencyRates, cryptoRates] = await Promise.all([
        fetchCurrencyRates(),
        fetchCryptoRates(),
      ])

      // For fiat: price_num is the IRR price per 1 unit
      const symbol = SYMBOL_MAP[from]
      if (symbol && currencyRates[symbol]) {
        return Response.json({
          from,
          to: 'IRR',
          amount,
          result: amount * currencyRates[symbol],
          rate: currencyRates[symbol],
        })
      }

      // For crypto: price_irr is available via the crypto endpoint
      if (cryptoRates[from]) {
        return Response.json({
          from,
          to: 'IRR',
          amount,
          result: amount * cryptoRates[from],
          rate: cryptoRates[from],
        })
      }

      return Response.json({ error: `Currency ${from} not supported for IRR conversion` }, { status: 400 })
    } catch (err) {
      return Response.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
    }
  }

  // For non-IRR conversions, go through IRR as intermediary
  if (from === 'IRR') {
    try {
      const [currencyRates, cryptoRates] = await Promise.all([
        fetchCurrencyRates(),
        fetchCryptoRates(),
      ])

      const symbol = SYMBOL_MAP[to]
      if (symbol && currencyRates[symbol]) {
        return Response.json({
          from: 'IRR',
          to,
          amount,
          result: amount / currencyRates[symbol],
          rate: 1 / currencyRates[symbol],
        })
      }

      if (cryptoRates[to]) {
        return Response.json({
          from: 'IRR',
          to,
          amount,
          result: amount / cryptoRates[to],
          rate: 1 / cryptoRates[to],
        })
      }

      return Response.json({ error: `Currency ${to} not supported` }, { status: 400 })
    } catch (err) {
      return Response.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
    }
  }

  // Cross-rate: from → IRR → to
  try {
    const [currencyRates, cryptoRates] = await Promise.all([
      fetchCurrencyRates(),
      fetchCryptoRates(),
    ])

    const getAllRates = () => ({ ...currencyRates, ...cryptoRates })

    const rates = getAllRates()
    const fromSymbol = SYMBOL_MAP[from]
    const toSymbol = SYMBOL_MAP[to]

    const fromRate = rates[fromSymbol || from]
    const toRate = rates[toSymbol || to]

    if (!fromRate || !toRate) {
      return Response.json({ error: 'Unsupported currency pair' }, { status: 400 })
    }

    // from → IRR → to
    const irrAmount = amount * fromRate
    const result = irrAmount / toRate

    return Response.json({
      from,
      to,
      amount,
      result,
      rate: fromRate / toRate,
    })
  } catch (err) {
    return Response.json({ error: 'Failed to fetch exchange rates' }, { status: 500 })
  }
}
