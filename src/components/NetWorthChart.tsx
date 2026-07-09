import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '../lib/utils'

interface NetWorthChartProps {
  data: { date: string; value: number }[]
  baseCurrency?: string
  locale?: string
}

function CustomTooltip({ active, payload, label, baseCurrency, locale }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-bold text-gray-900">{formatCurrency(payload[0].value, baseCurrency || 'USD', locale)}</p>
    </div>
  )
}

export function NetWorthChart({ data, baseCurrency = 'USD', locale = 'en' }: NetWorthChartProps) {
  if (!data?.length) {
    return (
      <div className="flex h-[300px] items-center justify-center text-gray-400">
        No data available
      </div>
    )
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickFormatter={(v) => {
              const d = new Date(v)
              return d.toLocaleDateString(locale === 'fa' ? 'fa-IR' : 'en-US', { month: 'short', day: 'numeric' })
            }}
            interval="preserveStartEnd"
            minTickGap={60}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: '#9ca3af' }}
            tickFormatter={(v) => {
              const sym = baseCurrency === 'IRR' ? 'IRR' : baseCurrency === 'EUR' ? '€' : baseCurrency === 'GBP' ? '£' : baseCurrency === 'JPY' ? '¥' : '$'
              if (Math.abs(v) >= 1000000000) return `${(v / 1000000000).toFixed(1)}B ${sym}`
              if (Math.abs(v) >= 1000000) return `${(v / 1000000).toFixed(1)}M ${sym}`
              if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}K ${sym}`
              return `${v} ${sym}`
            }}
            width={70}
          />
          <Tooltip content={(props) => <CustomTooltip {...props} baseCurrency={baseCurrency} locale={locale} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#8b5cf6"
            strokeWidth={2}
            fill="url(#netWorthGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
