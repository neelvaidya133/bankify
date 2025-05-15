'use client'

import { useState } from 'react'
import { maskCardNumber } from '@/utils/card-utils'

interface Card {
  id: string
  card_name: string
  card_number: string
  expiry_date: string
  card_type: 'credit' | 'debit'
  available_credit?: number
  balance?: number
  status: string
  cvv?: string
}

interface CardDisplayProps {
  card: Card
  onSelect?: (card: Card) => void
  selected?: boolean
}

export default function CardDisplay({ card, onSelect, selected }: CardDisplayProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div 
      className={`rounded-lg shadow-lg p-6 cursor-pointer ${
        card.card_type === 'credit' 
          ? 'bg-gradient-to-r from-blue-600 to-blue-800 text-white'
          : 'bg-gradient-to-r from-gray-600 to-gray-800 text-white'
      } ${selected ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onSelect?.(card)}
    >
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
          onClick={(e) => {
            e.stopPropagation()
            setShowDetails(!showDetails)
          }}
          className="text-sm underline"
        >
          {showDetails ? 'Hide' : 'Show'} Details
        </button>
      </div>

      {showDetails && (
        <div className="mt-4 space-y-2">
          {card.cvv && (
            <div>
              <p className="text-sm opacity-80">CVV</p>
              <p className="font-mono">{card.cvv}</p>
            </div>
          )}
          <div>
            <p className="text-sm opacity-80">Expiry Date</p>
            <p className="font-mono">
              {new Date(card.expiry_date).toLocaleDateString()}
            </p>
          </div>
          {card.card_type === 'credit' && (
            <div>
              <p className="text-sm opacity-80">Available Credit</p>
              <p className="font-mono">${card.available_credit?.toFixed(2) || 'N/A'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
