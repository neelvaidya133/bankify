'use client'

import { useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { formatCurrency } from '@/utils/card-utils'
import { format } from 'date-fns'

interface Transaction {
  id: string
  created_at: string
  amount: number
  transaction_type: string
  status: string
  description: string
  merchant_name: string
  merchant_category: string
  main_cards: {
    card_number: string
    card_type: string
  }
}

export default function TransactionsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    type: 'all',
    status: 'all',
    category: 'all'
  })
  const [sortBy, setSortBy] = useState('date')
  const [sortOrder, setSortOrder] = useState('desc')

  const fetchTransactions = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (transactions) {
      setTransactions(transactions)
      setLoading(false)
    } else {
      console.error('Error fetching transactions')
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600'
      case 'pending':
        return 'text-yellow-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return 'text-red-600'
      case 'deposit':
        return 'text-green-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          className="form-select"
          value={filter.type}
          onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value }))}
        >
          <option value="all">All Types</option>
          <option value="withdrawal">Withdrawals</option>
          <option value="deposit">Deposits</option>
        </select>

        <select
          className="form-select"
          value={filter.status}
          onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value }))}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>

        <select
          className="form-select"
          value={filter.category}
          onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value }))}
        >
          <option value="all">All Categories</option>
          <option value="electronics">Electronics</option>
          <option value="entertainment">Entertainment</option>
          <option value="food">Food</option>
          <option value="travel">Travel</option>
        </select>

        <div className="flex gap-2">
          <select
            className="form-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="date">Sort by Date</option>
            <option value="amount">Sort by Amount</option>
          </select>
          <button
            className="btn btn-outline"
            onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="text-center py-8">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No transactions found</div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Card</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{transaction.description}</div>
                    <div className="text-sm text-gray-500">{transaction.merchant_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {transaction.main_cards.card_type === 'credit' ? 'Credit' : 'Debit'}
                    </div>
                    <div className="text-sm text-gray-500">
                      **** **** **** {transaction.main_cards.card_number.slice(-4)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.merchant_category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                      {transaction.transaction_type === 'withdrawal' ? '-' : '+'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getStatusColor(transaction.status)}`}>
                      {transaction.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 