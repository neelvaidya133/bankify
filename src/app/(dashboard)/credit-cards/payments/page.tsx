import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency } from '@/utils/card-utils'
import BillPaymentForm from '@/components/credit-cards/BillPaymentForm'

export default async function CreditCardPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch user's credit cards
  const { data: creditCards } = await supabase
    .from('main_cards')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_type', 'credit')
    .eq('status', 'active')

  // Fetch bills for each credit card
  const bills = await Promise.all(
    (creditCards || []).map(async (card) => {
      const { data: cardBills } = await supabase
        .from('credit_card_bills')
        .select('*')
        .eq('card_id', card.id)
        .order('statement_start', { ascending: false })
        .limit(1)

      return {
        card,
        bill: cardBills?.[0]
      }
    })
  )

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Credit Card Payments</h1>

      <div className="grid gap-6">
        {bills.map(({ card, bill }) => (
          <div key={card.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{card.card_name}</h2>
                <p className="text-gray-600">Card ending in {card.card_number.slice(-4)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Available Credit</p>
                <p className="text-lg font-semibold">{formatCurrency(card.available_credit)}</p>
              </div>
            </div>

            {bill ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Statement Period</p>
                    <p className="font-medium">
                      {new Date(bill.statement_start).toLocaleDateString()} - {new Date(bill.statement_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Due Date</p>
                    <p className="font-medium">{new Date(bill.due_date).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Statement Amount</p>
                    <p className="text-lg font-semibold">{formatCurrency(bill.statement_amount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Paid Amount</p>
                    <p className="text-lg font-semibold">{formatCurrency(bill.paid_amount)}</p>
                  </div>
                </div>

                {bill.paid_amount < bill.statement_amount && (
                  <div className="mt-4">
                    <BillPaymentForm
                      cardId={card.id}
                      billId={bill.id}
                      amount={bill.statement_amount - bill.paid_amount}
                    />
                  </div>
                )}

                {bill.paid_amount >= bill.statement_amount && (
                  <div className="mt-4 p-4 bg-green-50 text-green-700 rounded-md">
                    This bill has been paid in full.
                  </div>
                )}

                {new Date(bill.due_date) < new Date() && bill.paid_amount < bill.statement_amount && (
                  <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
                    This bill is overdue. Please make a payment as soon as possible.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-600">
                No bills available for this card.
              </div>
            )}
          </div>
        ))}

        {bills.length === 0 && (
          <div className="text-center py-8 text-gray-600">
            You don't have any active credit cards.
          </div>
        )}
      </div>
    </div>
  )
} 