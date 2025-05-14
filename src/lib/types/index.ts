// User/Profile Types
export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
};

// Bank Account Types
export type BankAccount = {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
};

// Credit Card Types
export type CreditCard = {
  id: string;
  user_id: string;
  card_number: string;
  credit_limit: number;
  available_credit: number;
  created_at: string;
};

// Temp Card Types
export type TempCard = {
  id: string;
  user_id: string;
  source_type: 'credit' | 'debit';
  card_number: string;
  cvv: string;
  expiry_date: string;
  amount_limit: number;
  is_used: boolean;
  created_at: string;
};

// Transaction Types
export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  status: 'success' | 'failed' | 'pending';
  description: string;
  created_at: string;
};

// Subscription Types
export type Subscription = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'yearly';
  next_billing_date: string;
  created_at: string;
};


export interface MainCard {
  id: string
  user_id: string
  bank_account_id: string
  card_type: 'credit' | 'debit'
  card_number: string
  card_holder_name: string
  expiry_date: string
  cvv: string
  available_credit: number
  credit_limit: number
  currency: string
  created_at: string
  updated_at: string
}