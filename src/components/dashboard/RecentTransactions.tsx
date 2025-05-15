interface Transaction {
  id: string
  amount: number
  transaction_type: string
  status: string
  description: string
  merchant_name: string
  merchant_category: string
  created_at: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export default function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="space-y-4">
      {transactions?.map((transaction) => (
        <div key={transaction.id} className="flex justify-between items-center border-b pb-4">
          <div>
            <div className="font-medium">{transaction.description}</div>
            <div className="text-sm text-gray-500">
              {new Date(transaction.created_at).toLocaleDateString()}
            </div>
          </div>
          <div className={`font-medium ${
            transaction.transaction_type === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.transaction_type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}
