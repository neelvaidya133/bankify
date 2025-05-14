import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const tempCardSchema = z.object({
  source_type: z.enum(['credit', 'debit']),
  amount_limit: z.number().min(1, 'Amount must be greater than 0'),
  expiry_date: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'Expiry date must be in the future',
  }),
});

export const transactionSchema = z.object({
  amount: z.number().min(1, 'Amount must be greater than 0'),
  type: z.enum(['credit', 'debit']),
  description: z.string().min(1, 'Description is required'),
});
