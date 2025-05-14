export default function CardsLoading() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map((i) => (
          <div 
            key={i}
            className="rounded-lg shadow-lg p-6 bg-gray-200 animate-pulse h-48"
          ></div>
        ))}
      </div>
    </div>
  )
}
