import { getAuthenticatedUser, jsonError } from './_lib/auth'

const CACHE_KEY = 'exchange_rates'
const CACHE_TTL_SECONDS = 3600 // 1 hour default

interface RateCache {
  fetchedAt: string
  fiat: Record<string, number> // symbol → IRR price
  crypto: Record<string, { usd: number; irr: number }> // ticker → prices
  gold: Record<string, number> // symbol → IRR price per gram
}

// GET /api/rates — get cached exchange rates (auto-refreshes if stale)
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = await getAuthenticatedUser(context.env.DB, context.request)
  if (!user) return jsonError('Unauthorized', 401)

  const kv = context.env.RATE_CACHE
  const cached = await kv.get(CACHE_KEY, 'json') as RateCache | null

  // Return cached if fresh enough
  if (cached) {
    const age = (Date.now() - new Date(cached.fetchedAt).getTime()) / 1000
    if (age < CACHE_TTL_SECONDS) {
      return Response.json({ ...cached, cached: true, ageSeconds: Math.floor(age) })
    }
  }

  // Fetch fresh rates
  const apiBase = context.env.CURRENCY_API_BASE || 'https://currencies.plusking.ir'
  const apiKey = context.env.CURRENCY_API_KEY
  if (!apiKey) return jsonError('CURRENCY_API_KEY not configured', 500)

  try {
    const [currencyRes, cryptoRes, goldRes] = await Promise.all([
      fetch(`${apiBase}/currency`, { headers: { 'X-API-Key': apiKey } }),
      fetch(`${apiBase}/crypto`, { headers: { 'X-API-Key': apiKey } }),
      fetch(`${apiBase}/gold`, { headers: { 'X-API-Key': apiKey } }),
    ])

    if (!currencyRes.ok || !cryptoRes.ok) {
      // If external API fails and we have stale cache, return it
      if (cached) {
        return Response.json({ ...cached, cached: true, stale: true })
      }
      return jsonError('Failed to fetch exchange rates', 502)
    }

    const currencyData = await currencyRes.json() as { items: Array<{ symbol: string; price_num: number }> }
    const cryptoData = await cryptoRes.json() as { items: Array<{ ticker: string; price_num: number; price_irr: string }> }

    let goldData: { items: Array<{ symbol: string; name_fa: string; price_num: number }> } = { items: [] }
    if (goldRes.ok) {
      try {
        goldData = await goldRes.json() as any
      } catch (e) {
        console.log('[rates] Gold API returned invalid JSON')
      }
    } else {
      console.log(`[rates] Gold API failed: ${goldRes.status} ${goldRes.statusText}`)
      // Try fetching gold separately
      try {
        const retryRes = await fetch(`${apiBase}/gold`, { headers: { 'X-API-Key': apiKey } })
        if (retryRes.ok) {
          goldData = await retryRes.json() as any
          console.log(`[rates] Gold retry succeeded: ${(goldData.items || []).length} items`)
        }
      } catch (e) {
        console.log('[rates] Gold retry also failed')
      }
    }

    // Build fiat rates: symbol → IRR price
    const fiat: Record<string, number> = {}
    for (const item of currencyData.items) {
      if (item.price_num > 0) {
        fiat[item.symbol] = item.price_num
      }
    }

    // Build crypto rates: ticker → { usd, irr }
    const crypto: Record<string, { usd: number; irr: number }> = {}
    for (const item of cryptoData.items) {
      if (item.ticker && item.price_num > 0) {
        const irrStr = item.price_irr?.replace(/,/g, '') || '0'
        crypto[item.ticker] = {
          usd: item.price_num,
          irr: parseFloat(irrStr) || 0,
        }
      }
    }

    // Build gold rates: symbol → IRR price per gram
    const gold: Record<string, number> = {}
    for (const item of goldData.items) {
      if (item.symbol && item.price_num > 0) {
        gold[item.symbol] = item.price_num
      }
    }

    const rates: RateCache = {
      fetchedAt: new Date().toISOString(),
      fiat,
      crypto,
      gold,
    }

    // Cache in KV with TTL
    await kv.put(CACHE_KEY, JSON.stringify(rates), {
      expirationTtl: CACHE_TTL_SECONDS * 2, // 2x TTL as safety margin
    })

    return Response.json({ ...rates, cached: false })
  } catch (err) {
    // On error, return stale cache if available
    if (cached) {
      return Response.json({ ...cached, cached: true, stale: true })
    }
    return jsonError('Failed to fetch exchange rates', 502)
  }
}
