# Personal Finance Dashboard

A premium personal finance dashboard built with React, TypeScript, Tailwind CSS, and Cloudflare Pages + Workers + D1.

## Features

- **Access Code Auth** — No email/password, just a generated code (XXXX-XXXX format)
- **Multi-Account Tracking** — Cash, investments, crypto, property, vehicles, credit cards, loans
- **Transaction Management** — Income, expenses, and transfers with categories and tags
- **Budget Tracking** — Monthly spending limits with progress bars
- **Net Worth Dashboard** — Area chart with date range filters (30D/90D/1Y/ALL)
- **Multi-Currency** — Support for 50+ fiat currencies and 15+ cryptocurrencies
- **Responsive Design** — Works on desktop, tablet, and mobile

## Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS 3, Recharts
- **Backend:** Cloudflare Pages Functions (Workers)
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV (rate limiting)

---

## Local Development (Temporary Database)

This uses **Miniflare** under the hood — it creates a **temporary local D1 database** in `.wrangler/` that lives for the duration of the dev server. Every time you restart, you start fresh (unless you seed data).

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Initialize the local database (creates tables)
npm run db:init

# 3. (Optional) Seed demo data — creates a demo account with code DEMO-2024
npm run db:seed

# 4. Start the dev server
npm run dev
```

This builds the frontend, then starts `wrangler pages dev` on **http://localhost:8789** with:
- D1 database (simulated locally)
- KV namespace (simulated locally)
- Session signing key from `.dev.vars`

The server serves both the React frontend AND the API — no CORS issues, no separate ports.

### Useful commands while running

```bash
# Reset the local DB (delete .wrangler/ directory)
rm -rf .wrangler

# Re-init after reset
npm run db:init && npm run db:seed
```

---

## Production Deployment (Cloudflare)

### 1. Create Cloudflare Resources

```bash
# Create D1 database
wrangler d1 create personal-finance-db
# → Copy the database_id into wrangler.toml (replace YOUR_D1_DATABASE_ID)

# Create KV namespace
wrangler kv:namespace create RATE_CACHE
# → Copy the id into wrangler.toml (replace YOUR_KV_NAMESPACE_ID)

# Set session signing secret
wrangler secret put SESSION_SIGNING_KEY
# → Enter a long random string (e.g. openssl rand -hex 32)
```

### 2. Initialize Remote Database

```bash
npm run db:init:remote
npm run db:seed:remote   # optional demo data
```

### 3. Deploy

```bash
npm run deploy
# → Builds frontend and deploys to Cloudflare Pages
```

---

## Project Structure

```
cf-personal-finance/
├── functions/              # Cloudflare Pages Functions (API)
│   ├── api/
│   │   ├── _lib/           # Shared auth, defaults
│   │   ├── auth/           # Register, login, logout, me
│   │   ├── accounts/       # Account CRUD
│   │   ├── transactions/   # Transaction CRUD
│   │   ├── budgets/        # Budget CRUD
│   │   ├── net-worth.ts    # Net worth aggregation
│   │   ├── categories.ts   # Category management
│   │   ├── currencies.ts   # Currency list
│   │   └── settings.ts     # User settings
├── migrations/             # D1 SQL migrations
│   ├── 0001_init.sql       # Schema
│   └── 0002_seed.sql       # Demo data
├── src/
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI (Modal, Badge, Dropdown, AnimatedNumber)
│   │   ├── AuthModal.tsx   # Login/register modal
│   │   ├── Layout.tsx      # App shell with sidebar
│   │   ├── Sidebar.tsx     # Navigation
│   │   ├── NetWorthChart.tsx
│   │   ├── SegmentedBar.tsx
│   │   ├── AccountTypeModal.tsx
│   │   └── AccountForm.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   └── Budgets.tsx
│   ├── hooks/              # useAuth, useAccounts, useTransactions, useBudgets, useNetWorth
│   ├── lib/                # currencies, categories, utils
│   ├── types/              # TypeScript types
│   └── api/client.ts       # API client
├── .dev.vars               # Local dev secrets (session key)
├── wrangler.toml           # Cloudflare config
├── vite.config.ts
└── tailwind.config.ts
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create new account, get access code |
| POST | `/api/auth/login` | Login with access code |
| POST | `/api/auth/logout` | Clear session |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/accounts` | List all accounts |
| POST | `/api/accounts` | Create account |
| PUT | `/api/accounts/:id` | Update account |
| DELETE | `/api/accounts/:id` | Delete account |
| GET | `/api/transactions` | List transactions (filterable, sortable, paginated) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/net-worth` | Net worth with history (`?range=30d\|90d\|1y\|all`) |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/currencies` | Supported currencies |
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update settings |

## License

MIT
