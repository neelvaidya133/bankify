export default function RecentTransactions({ transactions }: { transactions: any[] }) {
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
            transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
          }`}>
            {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  )
}
