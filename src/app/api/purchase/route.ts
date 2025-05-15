import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { productId, cardNumber, expiryDate, cvv, amount } = await request.json()

    // Get product details
    const { data: product } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Verify the temporary card
    const { data: tempCard, error: tempCardError } = await supabase
      .from('temporary_cards')
      .select('*, main_cards(*)')
      .eq('card_number', cardNumber)
      .eq('expiry_date', expiryDate)
      .eq('cvv', cvv)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (tempCardError || !tempCard) {
      return NextResponse.json(
        { error: 'Invalid or expired temporary card' },
        { status: 400 }
      );
    }

    // Check if main card has sufficient funds/credit
    const mainCard = tempCard.main_cards
    if (mainCard.card_type === 'credit' && (!mainCard.available_credit || mainCard.available_credit < amount)) {
      return NextResponse.json({ error: 'Insufficient credit available' }, { status: 400 })
    }

    if (mainCard.card_type === 'debit') {
      const { data: bankAccount } = await supabase
        .from('bank_accounts')
        .select('balance')
        .eq('id', mainCard.bank_account_id)
        .single()

      if (!bankAccount || bankAccount.balance < amount) {
        return NextResponse.json({ error: 'Insufficient funds in bank account' }, { status: 400 })
      }
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        card_id: tempCard.main_card_id,
        temp_card_id: tempCard.id,
        transaction_type: 'purchase',
        amount: amount,
        status: 'completed',
        description: `Purchase: ${product.name}`,
        merchant_name: product.name,
        merchant_category: product.category
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
    }

    // Update main card's available credit or bank balance
    if (mainCard.card_type === 'credit') {
      console.log('Processing credit card purchase:', {
        mainCardId: tempCard.main_card_id,
        availableCredit: mainCard.available_credit,
        amount
      })

      const { error: cardError } = await supabase
        .from('main_cards')
        .update({
          available_credit: mainCard.available_credit - amount
        })
        .eq('id', tempCard.main_card_id)

      if (cardError) {
        console.error('Error updating available credit:', cardError)
        return NextResponse.json({ error: 'Failed to update available credit' }, { status: 500 })
      }

      // Update or create bill
      const today = new Date()
      // Get the first day of the current month
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
      // Get the last day of the current month
      const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      // Set due date to the 15th of next month
      const dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 15)

      console.log('Bill period dates:', {
        firstDay: firstDayOfMonth.toISOString(),
        lastDay: lastDayOfMonth.toISOString(),
        dueDate: dueDate.toISOString()
      })

      const { data: currentBill, error: billQueryError } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('card_id', tempCard.main_card_id)
        .gte('statement_start', firstDayOfMonth.toISOString())
        .lte('statement_end', lastDayOfMonth.toISOString())
        .single()

      if (billQueryError) {
        console.error('Error querying for existing bill:', billQueryError)
      }

      if (currentBill) {
        console.log('Updating existing bill:', {
          billId: currentBill.id,
          currentAmount: currentBill.statement_amount,
          newAmount: currentBill.statement_amount + amount
        })

        const { error: billError } = await supabase
          .from('credit_card_bills')
          .update({
            statement_amount: currentBill.statement_amount + amount
          })
          .eq('id', currentBill.id)

        if (billError) {
          console.error('Bill update error:', billError)
          return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
        }
      } else {
        console.log('Creating new bill:', {
          cardId: tempCard.main_card_id,
          userId: user.id,
          amount,
          dueDate: dueDate.toISOString()
        })

        const { error: billError } = await supabase
          .from('credit_card_bills')
          .insert({
            card_id: tempCard.main_card_id,
            user_id: user.id,
            statement_start: firstDayOfMonth.toISOString(),
            statement_end: lastDayOfMonth.toISOString(),
            due_date: dueDate.toISOString(),
            statement_amount: amount,
            status: 'unpaid'
          })

        if (billError) {
          console.error('Bill creation error:', billError)
          return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
        }
      }
    } else {
      // Update bank account balance for debit card
      const { error: bankError } = await supabase
        .from('bank_accounts')
        .update({
          balance: mainCard.bank_accounts.balance - amount
        })
        .eq('id', mainCard.bank_account_id)

      if (bankError) {
        console.error('Bank balance update error:', bankError)
        return NextResponse.json({ error: 'Failed to update bank balance' }, { status: 500 })
      }
    }

    // Update temporary card status
    const { error: updateTempCardError } = await supabase
      .from('temporary_cards')
      .update({ status: 'used' })
      .eq('id', tempCard.id);

    if (updateTempCardError) {
      console.error('Error deactivating temporary card:', updateTempCardError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Purchase error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 