# Release v1.0 — Personal Finance Dashboard

**Release Date:** July 2026  
**Commit:** `2e61e16`

---

## 🎉 What's Included

A full-featured personal finance dashboard with account tracking, transaction management, budget monitoring, multi-currency support, and bilingual English/Persian with RTL layout.

---

## ✨ Features

### Core
- **Access Code Auth** — Login with a generated 8-character code (XXXX-XXXX format), no email/password
- **Multi-Account Tracking** — Cash, investments, crypto, gold, property, vehicles, credit cards, loans
- **Transaction Management** — Income, expenses, and transfers with categories, notes, and search
- **Budget Tracking** — Monthly spending limits with visual progress bars
- **Net Worth Dashboard** — Area chart with date range filters (30D / 90D / 1Y / ALL)
- **Asset Breakdown** — Segmented bar chart showing asset type distribution with percentages

### Multi-Currency & Gold
- **50+ Fiat Currencies** — USD, EUR, GBP, IRR, and many more
- **15+ Cryptocurrencies** — BTC, ETH, USDT, and more
- **Live Exchange Rates** — Real-time conversion via external API
- **Gold Valuation** — Automatic gold value calculation using live prices (24K/22K/18K)

### Transactions
- **File Attachments** — Upload images and documents (max 500KB) to transactions
- **Search & Filter** — Search by description/notes, filter by type and category
- **Sort Options** — Newest, oldest, highest amount, lowest amount
- **Edit Support** — Click any transaction to edit amount, type, or category
- **Balance Adjustment** — Editing transactions automatically adjusts account balances

### Budgets
- **Monthly Limits** — Set spending limits per category
- **Progress Bars** — Visual progress with percentage and remaining amount
- **Edit Support** — Click any budget to adjust the monthly limit

### Categories
- **Custom Categories** — Create income and expense categories with emoji icons
- **Edit Support** — Click any category to update name, type, or icon

### Authentication & Security
- **Two-Factor Authentication** — Google Authenticator TOTP with QR code setup
- **Session Management** — HttpOnly cookie-based sessions
- **Rate Limiting** — 20 login attempts per minute per IP

### Internationalization
- **English & Persian (فارسی)** — Full UI translation in both languages
- **RTL Layout** — Proper right-to-left layout for Persian
- **Persian Numerals** — Automatic numeral conversion in Persian mode
- **Locale-Aware Formatting** — Currency and date formatting respects language setting

### Data Management
- **Export** — Download all data as JSON
- **Import** — Restore from previously exported JSON
- **Account Reset** — Reset account data while keeping categories and settings
- **Account Deletion** — Permanently delete account and all data

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite 5, TypeScript, Tailwind CSS 3, Recharts |
| Backend | Cloudflare Pages Functions (Workers) |
| Database | Cloudflare D1 (SQLite) |
| Cache | Cloudflare KV (rate limiting) |
| Auth | Custom access code system with TOTP 2FA |

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login with code (+ TOTP) |
| `POST` | `/api/auth/logout` | Clear session |
| `GET` | `/api/auth/me` | Get current user |
| `POST` | `/api/auth/2fa` | Enable 2FA |
| `PUT` | `/api/auth/2fa` | Verify/disable 2FA |
| `GET` | `/api/accounts` | List accounts |
| `POST` | `/api/accounts` | Create account |
| `PUT` | `/api/accounts/:id` | Update account |
| `DELETE` | `/api/accounts/:id` | Delete account |
| `GET` | `/api/transactions` | List transactions |
| `POST` | `/api/transactions` | Create transaction |
| `PUT` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |
| `POST` | `/api/attachments` | Upload file |
| `GET` | `/api/attachments` | List attachments |
| `GET` | `/api/attachments?id=xxx&action=data` | Download file |
| `GET` | `/api/budgets` | List budgets |
| `POST` | `/api/budgets` | Create budget |
| `PUT` | `/api/budgets/:id` | Update budget |
| `DELETE` | `/api/budgets/:id` | Delete budget |
| `GET` | `/api/net-worth` | Net worth with history |
| `GET/POST/PUT/DELETE` | `/api/categories` | Category CRUD |
| `GET` | `/api/currencies` | Currency list |
| `GET/PUT` | `/api/settings` | User settings |
| `GET` | `/api/export` | Export data |
| `POST` | `/api/import` | Import data |
| `DELETE` | `/api/account` | Delete account |
| `POST` | `/api/account/reset` | Reset account |

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Reset DB + start dev server
npm run db:reset && npm run dev
```

Open **http://localhost:8789** — the app runs with a local D1 database.

---

## 📝 Known Limitations

- File attachments limited to 500KB (D1 column size constraint)
- Gold transactions store grams in balance field (API converts to currency)
- Exchange rates cached in KV with auto-refresh
- No real-time sync between tabs/devices

---

## 📄 License

MIT
