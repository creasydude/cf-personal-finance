export interface DefaultCategory {
  name: string
  type: 'income' | 'expense'
  icon: string
}

export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  // Income
  { name: 'Salary', type: 'income', icon: '💼' },
  { name: 'Freelance', type: 'income', icon: '💻' },
  { name: 'Investment Income', type: 'income', icon: '📈' },
  { name: 'Rental Income', type: 'income', icon: '🏠' },
  { name: 'Side Business', type: 'income', icon: '🚀' },
  { name: 'Gifts Received', type: 'income', icon: '🎁' },
  { name: 'Other Income', type: 'income', icon: '💰' },

  // Expenses - Housing
  { name: 'Rent', type: 'expense', icon: '🏠' },
  { name: 'Mortgage', type: 'expense', icon: '🏡' },
  { name: 'Utilities', type: 'expense', icon: '💡' },
  { name: 'Internet', type: 'expense', icon: '🌐' },
  { name: 'Home Insurance', type: 'expense', icon: '🛡️' },
  { name: 'Home Maintenance', type: 'expense', icon: '🔧' },

  // Expenses - Transportation
  { name: 'Car Payment', type: 'expense', icon: '🚗' },
  { name: 'Gas', type: 'expense', icon: '⛽' },
  { name: 'Car Insurance', type: 'expense', icon: '🛡️' },
  { name: 'Public Transit', type: 'expense', icon: '🚇' },
  { name: 'Parking', type: 'expense', icon: '🅿️' },

  // Expenses - Food
  { name: 'Groceries', type: 'expense', icon: '🛒' },
  { name: 'Dining Out', type: 'expense', icon: '🍽️' },
  { name: 'Coffee', type: 'expense', icon: '☕' },

  // Expenses - Health
  { name: 'Health Insurance', type: 'expense', icon: '🏥' },
  { name: 'Doctor', type: 'expense', icon: '👨‍⚕️' },
  { name: 'Pharmacy', type: 'expense', icon: '💊' },
  { name: 'Gym', type: 'expense', icon: '🏋️' },

  // Expenses - Personal
  { name: 'Clothing', type: 'expense', icon: '👔' },
  { name: 'Personal Care', type: 'expense', icon: '💇' },
  { name: 'Education', type: 'expense', icon: '📚' },
  { name: 'Entertainment', type: 'expense', icon: '🎬' },
  { name: 'Subscriptions', type: 'expense', icon: '📱' },
  { name: 'Travel', type: 'expense', icon: '✈️' },
  { name: 'Gifts Given', type: 'expense', icon: '🎁' },
  { name: 'Charity', type: 'expense', icon: '❤️' },
  { name: 'Taxes', type: 'expense', icon: '🏛️' },
  { name: 'Pet', type: 'expense', icon: '🐕' },
  { name: 'Childcare', type: 'expense', icon: '👶' },
  { name: 'Miscellaneous', type: 'expense', icon: '📦' },
]
