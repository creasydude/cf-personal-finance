-- Seed data for demo account
-- Run: wrangler d1 execute personal-finance-db --local --file=migrations/0002_seed.sql

-- Demo user
INSERT OR IGNORE INTO users (code, user_id, settings) VALUES
  ('DEMO-2024', 'u_demo2024', '{"baseCurrency":"USD","displayName":"Demo User"}');

-- Demo accounts
INSERT INTO accounts (id, user_id, name, type, subtype, currency, balance, details) VALUES
  ('acc_001', 'u_demo2024', 'Main Checking', 'cash', 'checking', 'USD', 12450.00, '{"bank":"Chase"}'),
  ('acc_002', 'u_demo2024', 'High-Yield Savings', 'cash', 'savings', 'USD', 25000.00, '{"bank":"Marcus"}'),
  ('acc_003', 'u_demo2024', 'Brokerage Account', 'investment', null, 'USD', 45230.50, '{"platform":"Fidelity"}'),
  ('acc_004', 'u_demo2024', 'Bitcoin', 'crypto', null, 'BTC', 0.45, '{"wallet":"Ledger"}'),
  ('acc_005', 'u_demo2024', 'Ethereum', 'crypto', null, 'ETH', 3.2, '{"wallet":"MetaMask"}'),
  ('acc_006', 'u_demo2024', 'Chase Sapphire', 'credit_card', null, 'USD', -2340.75, '{"credit_limit":15000}'),
  ('acc_007', 'u_demo2024', 'Student Loan', 'loan', null, 'USD', -18500.00, '{"interest_rate":4.5,"term":120}');

-- Demo categories (user-created for demo account)
INSERT OR IGNORE INTO categories (id, user_id, name, type, icon, is_default) VALUES
  ('cat_demo_001', 'u_demo2024', 'Salary', 'income', '💼', 0),
  ('cat_demo_002', 'u_demo2024', 'Freelance', 'income', '💻', 0),
  ('cat_demo_003', 'u_demo2024', 'Rent', 'expense', '🏠', 0),
  ('cat_demo_004', 'u_demo2024', 'Groceries', 'expense', '🛒', 0),
  ('cat_demo_005', 'u_demo2024', 'Dining Out', 'expense', '🍽️', 0),
  ('cat_demo_006', 'u_demo2024', 'Utilities', 'expense', '💡', 0),
  ('cat_demo_007', 'u_demo2024', 'Subscriptions', 'expense', '📱', 0),
  ('cat_demo_008', 'u_demo2024', 'Gas', 'expense', '⛽', 0),
  ('cat_demo_009', 'u_demo2024', 'Entertainment', 'expense', '🎬', 0),
  ('cat_demo_010', 'u_demo2024', 'Gym', 'expense', '🏋️', 0);

-- Demo transactions
INSERT INTO transactions (id, user_id, account_id, type, description, amount, currency, category, date, tags, notes) VALUES
  -- This month's income
  ('txn_001', 'u_demo2024', 'acc_001', 'income', 'Monthly Salary', 8500.00, 'USD', 'Salary', '2024-12-01', '["salary"]', null),
  ('txn_002', 'u_demo2024', 'acc_001', 'income', 'Freelance Project', 2200.00, 'USD', 'Freelance', '2024-12-05', '["freelance","web"]', 'Website redesign project'),

  -- This month's expenses
  ('txn_003', 'u_demo2024', 'acc_006', 'expense', 'Rent Payment', 2100.00, 'USD', 'Rent', '2024-12-01', '["housing"]', null),
  ('txn_004', 'u_demo2024', 'acc_006', 'expense', 'Whole Foods', 187.50, 'USD', 'Groceries', '2024-12-03', '["food"]', null),
  ('txn_005', 'u_demo2024', 'acc_006', 'expense', 'Electric Bill', 95.00, 'USD', 'Utilities', '2024-12-04', '["bills"]', null),
  ('txn_006', 'u_demo2024', 'acc_006', 'expense', 'Netflix + Spotify', 25.98, 'USD', 'Subscriptions', '2024-12-05', '["entertainment"]', null),
  ('txn_007', 'u_demo2024', 'acc_006', 'expense', 'Dinner at Nobu', 156.00, 'USD', 'Dining Out', '2024-12-06', '["food","dining"]', 'Date night'),
  ('txn_008', 'u_demo2024', 'acc_006', 'expense', 'Shell Gas Station', 52.30, 'USD', 'Gas', '2024-12-07', '["transport"]', null),
  ('txn_009', 'u_demo2024', 'acc_006', 'expense', 'Movie Tickets', 32.00, 'USD', 'Entertainment', '2024-12-08', '["entertainment"]', null),
  ('txn_010', 'u_demo2024', 'acc_006', 'expense', 'Equinox Gym', 89.00, 'USD', 'Gym', '2024-12-01', '["health"]', null),

  -- Transfers
  ('txn_011', 'u_demo2024', null, 'transfer', 'Transfer to Savings', 1500.00, 'USD', null, '2024-12-02', '["savings"]', null),

  -- Last month's data
  ('txn_012', 'u_demo2024', 'acc_001', 'income', 'Monthly Salary', 8500.00, 'USD', 'Salary', '2024-11-01', '["salary"]', null),
  ('txn_013', 'u_demo2024', 'acc_006', 'expense', 'Rent Payment', 2100.00, 'USD', 'Rent', '2024-11-01', '["housing"]', null),
  ('txn_014', 'u_demo2024', 'acc_006', 'expense', 'Groceries', 320.00, 'USD', 'Groceries', '2024-11-05', '["food"]', null),
  ('txn_015', 'u_demo2024', 'acc_006', 'expense', 'Utilities', 110.00, 'USD', 'Utilities', '2024-11-04', '["bills"]', null);

-- Demo budgets
INSERT INTO budgets (id, user_id, category, amount, period, month, year) VALUES
  ('bud_001', 'u_demo2024', 'Rent', 2100.00, 'monthly', 12, 2024),
  ('bud_002', 'u_demo2024', 'Groceries', 400.00, 'monthly', 12, 2024),
  ('bud_003', 'u_demo2024', 'Dining Out', 200.00, 'monthly', 12, 2024),
  ('bud_004', 'u_demo2024', 'Utilities', 150.00, 'monthly', 12, 2024),
  ('bud_005', 'u_demo2024', 'Entertainment', 100.00, 'monthly', 12, 2024),
  ('bud_006', 'u_demo2024', 'Subscriptions', 50.00, 'monthly', 12, 2024),
  ('bud_007', 'u_demo2024', 'Gas', 100.00, 'monthly', 12, 2024);
