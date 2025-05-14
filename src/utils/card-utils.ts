// src/utils/card-utils.ts
export function maskCardNumber(cardNumber: string) {
    return `**** **** **** ${cardNumber.slice(-4)}`;
  }
  
  export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }
  
  export function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }