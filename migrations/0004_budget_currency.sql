-- Add currency column to budgets table
ALTER TABLE budgets ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD';
