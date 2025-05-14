import { format, parseISO } from 'date-fns';

// Date formatting
export const formatDate = (date: string) => {
  return format(parseISO(date), 'MMM dd, yyyy');
};

export const formatDateTime = (date: string) => {
  return format(parseISO(date), 'MMM dd, yyyy HH:mm');
};

// Currency formatting
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Card number masking
export const maskCardNumber = (cardNumber: string) => {
  return `**** **** **** ${cardNumber.slice(-4)}`;
};

// Generate random card number
export const generateCardNumber = () => {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
};

// Generate random CVV
export const generateCVV = () => {
  return Array.from({ length: 3 }, () => 
    Math.floor(Math.random() * 10)
  ).join('');
};
