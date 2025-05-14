'use client'

import { useState } from 'react'
import { formatCurrency } from '@/utils/card-utils'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff } from 'lucide-react'
import { MainCard } from '@/lib/types'

interface CardsDisplayProps {
  cards: MainCard[]
}

// Add a function to format card number
function formatCardNumber(cardNumber: string): string {
  // Remove any non-digit characters
  const cleaned = cardNumber.replace(/\D/g, '')
  // Format as XXXX XXXX XXXX XXXX
  return cleaned.replace(/(\d{4})/g, '$1 ').trim()
}

export default function CardsDisplay({ cards }: CardsDisplayProps) {
  const [showDetails, setShowDetails] = useState<{ [key: string]: boolean }>({})

  const toggleDetails = (cardId: string) => {
    setShowDetails(prev => ({
      ...prev,
      [cardId]: !prev[cardId]
    }))
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
      {cards?.map((card) => (
        <div 
          key={card.id}
          className={`relative h-[220px] rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 ${
            card.card_type === 'credit' 
              ? 'bg-gradient-to-br from-[#1a1a1a] to-[#2d2d2d]' // Chase Sapphire dark theme
              : 'bg-gradient-to-br from-[#117ACA] to-[#0D5B9E]' // Chase Debit blue theme
          }`}
        >
          {/* Card Content */}
          <div className="absolute inset-0 p-6 flex flex-col justify-between">
            {/* Top Section */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                {/* Chase Logo */}
                <div className="flex items-center space-x-2">
                  <div className="w-16 h-8 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xl font-bold tracking-wider">
                        CHASE
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-12 h-8 bg-white/20 rounded-md flex items-center justify-center">
                    <span className="text-white text-lg font-bold">
                      {card.card_type === 'credit' ? 'VISA' : 'MC'}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-white/80 hover:bg-white/10 rounded-full"
                onClick={() => toggleDetails(card.id)}
              >
                {showDetails[card.id] ? <EyeOff size={20} /> : <Eye size={20} />}
              </Button>
            </div>

            {/* Middle Section - Card Number */}
            <div className="space-y-2">
              <p className="text-white/60 text-sm">Card Number</p>
              <p className="text-white text-2xl font-mono tracking-wider">
                {showDetails[card.id] 
                  ? formatCardNumber(card.card_number)
                  : `**** **** **** ${card.card_number.slice(-4)}`
                }
              </p>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-end">
              <div className="space-y-2">
                <p className="text-white/60 text-xs">Card Holder</p>
                <p className="text-white text-sm uppercase tracking-wider">
                  {card.card_holder_name}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-white/60 text-xs">Expires</p>
                <p className="text-white text-sm">
                  {new Date(card.expiry_date).toLocaleDateString('en-US', {
                    month: '2-digit',
                    year: '2-digit'
                  })}
                </p>
              </div>
            </div>

            {/* CVV - Only show when details are revealed */}
            {showDetails[card.id] && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white/10 p-2 rounded">
                <p className="text-white/60 text-xs">CVV</p>
                <p className="text-white text-sm font-mono">{card.cvv}</p>
              </div>
            )}
          </div>

          {/* Card Details Panel */}
          {showDetails[card.id] && card.card_type === 'credit' && (
            <div className="absolute -bottom-24 left-0 right-0 bg-white/10 backdrop-blur-sm rounded-b-xl p-4 text-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-white/60 text-xs">Available Credit</p>
                  <p className="text-white font-bold">
                    {formatCurrency(card.available_credit)}
                  </p>
                </div>
                <div>
                  <p className="text-white/60 text-xs">Credit Limit</p>
                  <p className="text-white font-bold">
                    {formatCurrency(card.credit_limit)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}