'use client'

import { useState } from 'react'
import { maskCardNumber } from '@/utils/card-utils'

export default function CardDisplay({ card }: { card: any }) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className={`rounded-lg shadow-lg p-6 ${
      card.card_type === 'credit' 
        ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white'
        : 'bg-gradient-to-r from-gray-600 to-gray-800 text-white'
    }`}>
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {card.card_type === 'credit' ? 'Credit Card' : 'Debit Card'}
          </h2>
          <p className="text-sm opacity-80">Card Number</p>
          <p className="text-xl font-mono">
            {showDetails ? card.card_number : maskCardNumber(card.card_number)}
          </p>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm underline"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-2">
          <div>
            <p className="text-sm opacity-80">CVV</p>
            <p className="font-mono">{card.cvv}</p>
          </div>
          <div>
            <p className="text-sm opacity-80">Expiry Date</p>
            <p className="font-mono">
              {new Date(card.expiry_date).toLocaleDateString()}
            </p>
          </div>
          {card.card_type === 'credit' && (
            <div>
              <p className="text-sm opacity-80">Available Credit</p>
              <p className="font-mono">${card.available_credit.toFixed(2)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
