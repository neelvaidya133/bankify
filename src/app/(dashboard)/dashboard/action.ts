'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

const MAX_BALANCE = 1000000000 // 1 billion
const MAX_ADDITION = 10000000 // 10 million

export async function addFunds(amount: number) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Validate amount
  if (amount <= 0) throw new Error('Amount must be greater than 0')
  if (amount > MAX_ADDITION) throw new Error(`Amount cannot exceed $${MAX_ADDITION.toLocaleString()}`)

  // Get current bank account
  const { data: bankAccount } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Check if new balance would exceed maximum
  const newBalance = (bankAccount?.balance || 0) + amount
  if (newBalance > MAX_BALANCE) {
    throw new Error(`Balance cannot exceed $${MAX_BALANCE.toLocaleString()}`)
  }

  // Update balance
  const { error: updateError } = await supabase
    .from('bank_accounts')
    .update({
      balance: newBalance
    })
    .eq('user_id', user.id)

  if (updateError) throw updateError

  revalidatePath('/dashboard')
  return { success: true }
}
