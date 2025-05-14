import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/utils/card-utils'
import AddFundsForm from "./AddFundsForm"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's bank account
  const { data: bankAccount } = await supabase
    .from('bank_accounts')
    .select('*')
    .eq('user_id', user.id)
    .single()

  // Fetch user's cards
  const { data: cards } = await supabase
    .from('main_cards')
    .select('*')
    .eq('user_id', user.id)
    .order('card_type')

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      
      {/* Bank Account Summary */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Bank Account</h2>
        <div className="text-3xl font-bold">
          {formatCurrency(bankAccount?.balance || 0)}
        </div>
        <div className="mt-4">
          <AddFundsForm />
        </div>
      </div>

      {/* Cards Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards?.map((card) => (
          <div 
            key={card.id}
            className={`rounded-lg shadow p-6 ${
              card.card_type === 'credit' 
                ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white'
                : 'bg-gradient-to-r from-gray-600 to-gray-800 text-white'
            }`}
          >
            <h3 className="text-lg font-semibold mb-2">
              {card.card_type === 'credit' ? 'Credit Card' : 'Debit Card'}
            </h3>
            <p className="text-sm opacity-80">Card Number</p>
            <p className="text-xl font-mono mb-4">
              **** **** **** {card.card_number.slice(-4)}
            </p>
            {card.card_type === 'credit' && (
              <div>
                <p className="text-sm opacity-80">Available Credit</p>
                <p className="text-xl font-bold">
                  {formatCurrency(card.available_credit)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* View All Cards Link */}
      <div className="text-center">
        <Link 
          href="/cards" 
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          View All Cards
        </Link>
      </div>
    </div>
  )
}
