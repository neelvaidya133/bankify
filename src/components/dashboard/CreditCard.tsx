export default function CreditCard({ card }: { card: any }) {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg shadow p-6 text-white">
      <h2 className="text-xl font-semibold mb-4">Credit Card</h2>
      <div className="text-3xl font-bold">
        ${card?.available_credit?.toFixed(2) || '0.00'}
      </div>
      <div className="mt-2 text-sm">
        Available Credit
      </div>
      <div className="mt-4">
        <button className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100">
          Make Payment
        </button>
      </div>
    </div>
  )
}
