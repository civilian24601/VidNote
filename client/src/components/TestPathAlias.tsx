import { useState } from '@/lib/react'

export const TestPathAlias = () => {
  const [count, setCount] = useState(0)

  return (
    <div className="p-4">
      <h2>Path Alias Test Component</h2>
      <p>Current count: {count}</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Increment
      </button>
    </div>
  )
} 