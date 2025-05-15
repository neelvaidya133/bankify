'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

interface PurchaseParams {
  productId: string
  cardId: string
  amount: number
}

export async function makePurchase({ productId, cardId, amount }: PurchaseParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'User not authenticated' }
  }

  try {
    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (!product) {
      return { success: false, error: 'Product not found' }
    }

    // Get card details
    const { data: card } = await supabase
      .from('main_cards')
      .select('*, bank_accounts(balance)')
      .eq('id', cardId)
      .single()

    if (!card) {
      return { success: false, error: 'Card not found' }
    }

    // Check if card has sufficient funds/credit
    if (card.card_type === 'credit' && (!card.available_credit || card.available_credit < amount)) {
      return { success: false, error: 'Insufficient credit available' }
    }

    if (card.card_type === 'debit' && (!card.bank_accounts?.balance || card.bank_accounts.balance < amount)) {
      return { success: false, error: 'Insufficient funds in bank account' }
    }

    // Create transaction record
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        card_id: cardId,
        transaction_type: 'withdrawal',
        amount: amount,
        status: 'completed',
        description: `Purchase: ${product.name}`,
        merchant_name: product.name,
        merchant_category: product.category
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return { success: false, error: 'Failed to create transaction' }
    }

    // Update card's available credit or bank balance
    if (card.card_type === 'credit') {
      const { error: cardError } = await supabase
        .from('main_cards')
        .update({
          available_credit: card.available_credit - amount
        })
        .eq('id', cardId)

      if (cardError) {
        return { success: false, error: 'Failed to update available credit' }
      }

      // Get current month's bill
      const today = new Date()
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)

      const { data: currentBill } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('card_id', cardId)
        .gte('statement_start', firstDayOfMonth.toISOString())
        .lte('statement_end', lastDayOfMonth.toISOString())
        .single()

      if (currentBill) {
        // Update existing bill
        const { error: billError } = await supabase
          .from('credit_card_bills')
          .update({
            statement_amount: currentBill.statement_amount + amount
          })
          .eq('id', currentBill.id)

        if (billError) {
          console.error('Bill update error:', billError)
          return { success: false, error: 'Failed to update bill' }
        }
      } else {
        // Create new bill if it doesn't exist
        const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15)
        const { error: billError } = await supabase
          .from('credit_card_bills')
          .insert({
            card_id: cardId,
            user_id: user.id,
            statement_start: firstDayOfMonth.toISOString(),
            statement_end: lastDayOfMonth.toISOString(),
            due_date: dueDate.toISOString(),
            statement_amount: amount,
            status: 'unpaid'
          })

        if (billError) {
          console.error('Bill creation error:', billError)
          return { success: false, error: 'Failed to create bill' }
        }
      }
    } else if (card.card_type === 'debit') {
      // Update bank account balance for debit card
      const { error: bankError } = await supabase
        .from('bank_accounts')
        .update({
          balance: card.bank_accounts.balance - amount
        })
        .eq('id', card.bank_account_id)

      if (bankError) {
        console.error('Bank balance update error:', bankError)
        return { success: false, error: 'Failed to update bank balance' }
      }
    }

    revalidatePath('/catalog')
    revalidatePath('/credit-cards/payments')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (error) {
    console.error('Purchase error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
} 