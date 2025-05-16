'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface PaymentData {
  cardId: string
  billId: string
  amount: number
}

export async function makePayment({ cardId, billId, amount }: PaymentData) {
  const supabase = await createClient()

  try {
    // Get the bill details
    const { data: bill, error: billError } = await supabase
      .from('credit_card_bills')
      .select('*')
      .eq('id', billId)
      .single()

    if (billError) {
      console.error('Error fetching bill:', billError)
      return { success: false, error: 'Failed to fetch bill details' }
    }

    // Check if bill is already paid
    if (bill.paid_amount >= bill.statement_amount) {
      return { success: false, error: 'Bill is already paid in full' }
    }

    // Check if payment amount is valid
    const remainingBalance = Number((bill.statement_amount - bill.paid_amount).toFixed(2))
    const roundedAmount = Number(amount.toFixed(2))

    if (roundedAmount > remainingBalance) {
      return { success: false, error: 'Payment amount exceeds remaining balance' }
    }

    // Get user's bank account balance
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('user_id', bill.user_id)
      .single()

    if (bankError || !bankAccount) {
      console.error('Error fetching bank account:', bankError)
      return { success: false, error: 'Failed to fetch bank account details' }
    }

    // Check if user has sufficient funds
    if (bankAccount.balance < roundedAmount) {
      return { success: false, error: 'Insufficient funds in bank account' }
    }

    // Start a transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: bill.user_id,
        card_id: cardId,
        amount: roundedAmount,
        transaction_type: 'payment',
        status: 'completed',
        description: 'Credit card bill payment',
        merchant_name: 'Credit Card Payment',
        merchant_category: 'Financial Services'
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return { success: false, error: 'Failed to create transaction' }
    }

    // Update bank account balance
    const { error: bankUpdateError } = await supabase
      .from('bank_accounts')
      .update({
        balance: Number((bankAccount.balance - roundedAmount).toFixed(2))
      })
      .eq('user_id', bill.user_id)

    if (bankUpdateError) {
      console.error('Error updating bank balance:', bankUpdateError)
      return { success: false, error: 'Failed to update bank balance' }
    }

    // Update the bill's paid amount
    const newPaidAmount = Number((bill.paid_amount + roundedAmount).toFixed(2))
    const { error: updateError } = await supabase
      .from('credit_card_bills')
      .update({
        paid_amount: newPaidAmount,
        status: newPaidAmount >= bill.statement_amount ? 'paid' : 'unpaid'
      })
      .eq('id', billId)

    if (updateError) {
      console.error('Error updating bill:', updateError)
      return { success: false, error: 'Failed to update bill' }
    }

    // Get current card data
    const { data: card, error: cardFetchError } = await supabase
      .from('main_cards')
      .select('available_credit')
      .eq('id', cardId)
      .single()

    if (cardFetchError) {
      console.error('Error fetching card:', cardFetchError)
      return { success: false, error: 'Failed to fetch card details' }
    }

    // Update the card's available credit
    const { error: cardError } = await supabase
      .from('main_cards')
      .update({
        available_credit: Number((card.available_credit + roundedAmount).toFixed(2))
      })
      .eq('id', cardId)

    if (cardError) {
      console.error('Error updating card:', cardError)
      return { success: false, error: 'Failed to update card' }
    }

    revalidatePath('/credit-cards/payments')
    return { success: true }
  } catch (error) {
    console.error('Payment error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

// Function to generate monthly bills
export async function generateMonthlyBills() {
  const supabase = await createClient()
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15)

  try {
    // Get all active credit cards
    const { data: creditCards } = await supabase
      .from('main_cards')
      .select('*')
      .eq('card_type', 'credit')
      .eq('status', 'active')

    if (!creditCards) return

    // For each credit card, check if a bill exists for this month
    for (const card of creditCards) {
      const { data: existingBill } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('card_id', card.id)
        .gte('statement_start', firstDayOfMonth.toISOString())
        .lte('statement_end', lastDayOfMonth.toISOString())
        .single()

      if (!existingBill) {
        // Calculate statement amount from transactions
        const { data: transactions } = await supabase
          .from('transactions')
          .select('amount')
          .eq('card_id', card.id)
          .gte('created_at', firstDayOfMonth.toISOString())
          .lte('created_at', lastDayOfMonth.toISOString())
          .in('transaction_type', ['payment', 'withdrawal', 'transfer'])

        const statementAmount = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0

        // Create new bill
        await supabase
          .from('credit_card_bills')
          .insert({
            card_id: card.id,
            user_id: card.user_id,
            statement_start: firstDayOfMonth.toISOString(),
            statement_end: lastDayOfMonth.toISOString(),
            due_date: dueDate.toISOString(),
            statement_amount: statementAmount,
            status: 'unpaid'
          })
      }
    }

    revalidatePath('/credit-cards/payments')
    return { success: true }
  } catch (error) {
    console.error('Bill generation error:', error)
    return { success: false, error: 'Failed to generate bills' }
  }
} 