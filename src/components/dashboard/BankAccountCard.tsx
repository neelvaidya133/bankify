'use client'

import { useState } from 'react'
import { addFunds } from '@/app/(dashboard)/dashboard/action'
import { toast } from 'sonner'

export default function BankAccountCard({ account }: { account: any }) {
  const [isLoading, setIsLoading] = useState(false)
  const [amount, setAmount] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleAddFunds = async () => {
    try {
      setIsLoading(true)
      const numAmount = parseFloat(amount)
      await addFunds(numAmount)
      toast.success(`Successfully added $${numAmount.toLocaleString()} to your account`)
      setAmount('')
      setShowInput(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to add funds')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Bank Account</h2>
      <div className="text-3xl font-bold">
        ${account?.balance?.toFixed(2) || '0.00'}
      </div>
      <div className="mt-4">
        {!showInput ? (
          <button 
            onClick={() => setShowInput(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add Funds
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount (max $100,000)"
              className="w-full p-2 border rounded"
              max={100000}
              min={0}
            />
            <div className="flex space-x-2">
              <button 
                onClick={handleAddFunds}
                disabled={isLoading || !amount}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Adding...' : 'Confirm'}
              </button>
              <button 
                onClick={() => {
                  setShowInput(false)
                  setAmount('')
                }}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
