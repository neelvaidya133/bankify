'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function freezeCard(cardId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('credit_cards')
    .update({ is_frozen: true })
    .eq('id', cardId)

  if (error) throw error

  revalidatePath('/cards')
  return { success: true }
}

export async function unfreezeCard(cardId: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('credit_cards')
    .update({ is_frozen: false })
    .eq('id', cardId)

  if (error) throw error

  revalidatePath('/cards')
  return { success: true }
}
