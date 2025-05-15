'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatCurrency } from '@/utils/format'
import { Copy } from 'lucide-react'

interface MainCard {
  id: string
  card_number: string
  card_type: string
  available_credit?: number
  bank_accounts?: {
    balance: number
  }
}

export default function GenerateTempCard() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [cards, setCards] = useState<MainCard[]>([])
  const [selectedCardId, setSelectedCardId] = useState<string>('')
  const [tempCard, setTempCard] = useState<{
    card_number: string
    expiry_date: string
    cvv: string
  } | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(`${field} copied to clipboard`)
    } catch {
      toast.error('Failed to copy to clipboard')
    }
  }

  const fetchCards = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { data, error } = await supabase
      .from('main_cards')
      .select(`
        *,
        bank_accounts (
          balance
        )
      `)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching cards:', error)
      return
    }

    setCards(data || [])
  }

  const generateTempCard = async () => {
    if (!selectedCardId) {
      toast.error('Please select a card')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('User not authenticated')
      return
    }

    try {
      // Generate temporary card details
      const cardNumber = '4' + Array(15).fill(0).map(() => Math.floor(Math.random() * 10)).join('')
      const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')
      const currentYear = new Date().getFullYear()
      const expiryYear = String(currentYear + Math.floor(Math.random() * 3) + 1).slice(-2) // Get last 2 digits of year
      const cvv = String(Math.floor(Math.random() * 900) + 100)

      // Format expiry date as MM/YY to fit VARCHAR(5)
      const expiryDate = `${expiryMonth}/${expiryYear}`

      // Create temporary card record
      const { data: tempCardData, error: tempCardError } = await supabase
        .from('temporary_cards')
        .insert({
          user_id: user.id,
          main_card_id: selectedCardId,
          card_number: cardNumber,
          expiry_date: expiryDate,
          cvv: cvv,
          status: 'active',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
        })
        .select()
        .single()

      if (tempCardError) {
        console.error('Database error:', {
          code: tempCardError.code,
          message: tempCardError.message,
          details: tempCardError.details,
          hint: tempCardError.hint
        })
        throw new Error(`Failed to create temporary card: ${tempCardError.message}`)
      }

      if (!tempCardData) {
        throw new Error('No data returned after creating temporary card')
      }

      setTempCard({
        card_number: cardNumber,
        expiry_date: expiryDate,
        cvv: cvv
      })

      toast.success('Temporary card generated successfully')
    } catch (error) {
      console.error('Error generating temporary card:', error)
      toast.error('Failed to generate temporary card')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          onClick={() => {
            setOpen(true)
            fetchCards()
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          Generate Temporary Card
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate Temporary Card</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!tempCard ? (
            <>
              <div className="grid gap-2">
                <label className="text-sm font-medium">Select Source Card</label>
                <Select
                  value={selectedCardId}
                  onValueChange={setSelectedCardId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a card" />
                  </SelectTrigger>
                  <SelectContent>
                    {cards.map((card) => (
                      <SelectItem key={card.id} value={card.id}>
                        {card.card_type === 'credit' ? 'Credit' : 'Debit'} Card - 
                        **** **** **** {card.card_number.slice(-4)}
                        {card.card_type === 'credit' && card.available_credit && 
                          ` (Available: ${formatCurrency(card.available_credit)})`}
                        {card.card_type === 'debit' && card.bank_accounts?.balance && 
                          ` (Balance: ${formatCurrency(card.bank_accounts.balance)})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={generateTempCard} 
                disabled={loading || !selectedCardId}
                className="w-full"
              >
                {loading ? 'Generating...' : 'Generate Card'}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Card Number</p>
                    <p className="font-mono">{tempCard.card_number}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(tempCard.card_number, 'Card number')}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Expiry Date</p>
                    <p className="font-mono">{tempCard.expiry_date}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(tempCard.expiry_date, 'Expiry date')}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">CVV</p>
                    <p className="font-mono">{tempCard.cvv}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => copyToClipboard(tempCard.cvv, 'CVV')}
                    className="h-8 w-8"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Don&apos;t forget to save your temporary card details!
              </div>
              <Button 
                onClick={() => {
                  setTempCard(null)
                  setOpen(false)
                }}
                className="w-full"
              >
                Close
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
} 