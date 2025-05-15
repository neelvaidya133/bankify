import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CardsDisplay from './components/CardsDisplay'
import GenerateTempCard from '@/components/credit-cards/GenerateTempCard'

export default async function CardsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's cards
  const { data: cards } = await supabase
    .from('main_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('card_type')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Your Cards</h1>
        <GenerateTempCard />
      </div>
      <CardsDisplay cards={cards || []} />
    </div>
  )
}
