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

      // Update bank account balance for debit card
      const { error: bankError } = await supabase
        .from('bank_accounts')
        .update({
          balance: bankAccount.balance - amount
        })
        .eq('id', mainCard.bank_account_id)

      if (bankError) {
        console.error('Bank balance update error:', bankError)
        return NextResponse.json({ error: 'Failed to update bank balance' }, { status: 500 })
      }
    }

    // Create transaction record
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        card_id: tempCard.main_card_id,
        temp_card_id: tempCard.id,
        transaction_type: 'withdrawal',
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

      // Format dates as YYYY-MM-DD for PostgreSQL
      const formatDate = (date: Date) => {
        return date.toISOString().split('T')[0]
      }

      // Get all bills for this month
      const { data: existingBills, error: billsQueryError } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('card_id', tempCard.main_card_id)
        .gte('statement_start', formatDate(firstDayOfMonth))
        .lte('statement_end', formatDate(lastDayOfMonth))

      if (billsQueryError) {
        console.error('Error querying for existing bills:', billsQueryError)
        return NextResponse.json({ error: 'Failed to query bills' }, { status: 500 })
      }

      if (existingBills && existingBills.length > 0) {
        // Find the most recent unpaid bill or create a new one
        const unpaidBill = existingBills.find(bill => bill.status === 'unpaid')

        if (unpaidBill) {
          // Update the existing unpaid bill
          const { error: billError } = await supabase
            .from('credit_card_bills')
            .update({
              statement_amount: unpaidBill.statement_amount + amount
            })
            .eq('id', unpaidBill.id)

          if (billError) {
            console.error('Bill update error:', billError)
            return NextResponse.json({ error: 'Failed to update bill' }, { status: 500 })
          }
        } else {
          // Create new bill if all existing bills are paid
          const { error: billError } = await supabase
            .from('credit_card_bills')
            .insert({
              card_id: tempCard.main_card_id,
              user_id: user.id,
              statement_start: formatDate(firstDayOfMonth),
              statement_end: formatDate(lastDayOfMonth),
              due_date: formatDate(dueDate),
              statement_amount: amount,
              paid_amount: 0,
              status: 'unpaid'
            })

          if (billError) {
            console.error('Bill creation error:', billError)
            return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
          }
        }
      } else {
        // Create new bill if no bills exist for this month
        const { error: billError } = await supabase
          .from('credit_card_bills')
          .insert({
            card_id: tempCard.main_card_id,
            user_id: user.id,
            statement_start: formatDate(firstDayOfMonth),
            statement_end: formatDate(lastDayOfMonth),
            due_date: formatDate(dueDate),
            statement_amount: amount,
            paid_amount: 0,
            status: 'unpaid'
          })

        if (billError) {
          console.error('Bill creation error:', billError)
          return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 })
        }
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