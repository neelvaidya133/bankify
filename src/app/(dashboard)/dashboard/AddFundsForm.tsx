'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addFunds } from './action'
import { toast } from 'sonner'

const MAX_ADDITION = 10000000 // 10 million CAD

export default function AddFundsForm() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await addFunds(parseFloat(amount))
      if (result.success) {
        setAmount('')
        toast.success('Funds added successfully')
        router.refresh()
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add funds')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="amount" className="text-sm font-medium">
          Add Funds (CAD)
        </label>
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              $
            </span>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              min="0.01"
              max={MAX_ADDITION}
              step="0.01"
              className="w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : 'Add Funds'}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Maximum amount per transaction: ${MAX_ADDITION.toLocaleString()}
        </p>
      </div>
    </form>
  )
}
