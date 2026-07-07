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
- **Dark Account Type Picker** — Keyboard-navigable modal for adding accounts

## Tech Stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS 3, Recharts
- **Backend:** Cloudflare Pages Functions (Workers)
- **Database:** Cloudflare D1 (SQLite)
- **Cache:** Cloudflare KV (sessions, FX rates)

## Setup

### Prerequisites

- Node.js 18+
- A Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Cloudflare Resources

```bash
# Create D1 database
wrangler d1 create personal-finance-db
# Copy the database_id into wrangler.toml

# Create KV namespace for rate limiting and FX cache
wrangler kv:namespace create RATE_CACHE
# Copy the id into wrangler.toml

# Set session signing secret
wrangler secret put SESSION_SIGNING_KEY
# Enter a long random string when prompted
```

### 3. Initialize Database

```bash
# Local development
npm run db:init

# Remote (production)
npm run db:init:remote
```

### 4. Seed Demo Data (Optional)

```bash
npm run seed
```

This creates a demo account with code `DEMO-2024` containing sample accounts, transactions, and budgets.

### 5. Local Development

```bash
# Frontend only (API proxy to localhost:8788)
npm run dev

# Full stack (Vite + Wrangler)
npm run dev:full
```

### 6. Deploy

```bash
# Build frontend
npm run build

# Deploy to Cloudflare Pages
npm run deploy
# Or: wrangler pages deploy dist
```

## Project Structure

```
cf-personal-finance/
├── functions/              # Cloudflare Pages Functions (API)
│   ├── api/
│   │   ├── _lib/           # Shared auth, defaults
│   │   ├── auth/           # Login, register, logout, me
│   │   ├── accounts/       # Account CRUD
│   │   ├── transactions/   # Transaction CRUD
│   │   ├── budgets/        # Budget CRUD
│   │   ├── net-worth.ts    # Net worth aggregation
│   │   ├── categories.ts   # Category management
│   │   ├── currencies.ts   # Currency list
│   │   └── settings.ts     # User settings
├── migrations/             # D1 SQL migrations
├── src/
│   ├── components/         # React components
│   │   ├── ui/             # Reusable UI primitives
│   │   ├── AuthModal.tsx   # Login/register modal
│   │   ├── Layout.tsx      # App layout with sidebar
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── NetWorthChart.tsx
│   │   ├── SegmentedBar.tsx
│   │   ├── AccountTypeModal.tsx
│   │   └── AccountForm.tsx
│   ├── pages/              # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   └── Budgets.tsx
│   ├── hooks/              # React hooks
│   ├── lib/                # Utilities, currencies, categories
│   ├── types/              # TypeScript types
│   └── api/                # API client
├── wrangler.toml           # Cloudflare config
├── tailwind.config.ts
└── vite.config.ts
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
| GET | `/api/transactions` | List transactions (filterable) |
| POST | `/api/transactions` | Create transaction |
| PUT | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create budget |
| PUT | `/api/budgets/:id` | Update budget |
| DELETE | `/api/budgets/:id` | Delete budget |
| GET | `/api/net-worth` | Net worth data (range filter) |
| GET | `/api/categories` | List categories |
| POST | `/api/categories` | Create category |
| GET | `/api/currencies` | Supported currencies |
| GET | `/api/settings` | Get user settings |
| PUT | `/api/settings` | Update settings |

## License

MIT
