import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate the request body
    const body = await request.json()
    const amount = parseFloat(body.amount)

    if (isNaN(amount) || amount <= 0 || amount > 100000) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      )
    }

    // Get the user's bank account
    const { data: bankAccount, error: bankError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (bankError || !bankAccount) {
      console.error('Bank account error:', bankError)
      return NextResponse.json(
        { error: 'Bank account not found' },
        { status: 404 }
      )
    }

    // Start a transaction to ensure both operations succeed or fail together
    const { error: transactionError } = await supabase.rpc('add_funds_transaction', {
      p_user_id: user.id,
      p_bank_account_id: bankAccount.id,
      p_amount: amount
    })

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      return NextResponse.json(
        { error: 'Failed to process transaction' },
        { status: 500 }
      )
    }

    // Get the updated balance
    const { data: updatedAccount, error: updateError } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('id', bankAccount.id)
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to get updated balance' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      newBalance: updatedAccount.balance
    })

  } catch (error) {
    console.error('Server error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
