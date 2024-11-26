'use client'
import { useEffect, useState } from 'react'
import Pusher from 'pusher-js'

export default function TestPusher() {
  const [updates, setUpdates] = useState<any[]>([])

  useEffect(() => {
    // Initialize Pusher client
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    })

    // Subscribe to channel
    const channel = pusher.subscribe('todo-channel')

    // Bind to event
    channel.bind('todo-updated', (data: any) => {
      console.log('Received update:', data)
      setUpdates(prev => [...prev, data])
    })

    // Cleanup
    return () => {
      channel.unbind()
      pusher.unsubscribe('todo-channel')
    }
  }, [])

  // Test function to trigger update
  const testUpdate = async () => {
    try {
      const response = await fetch('/api/update-todo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          todoId: '123',
          listId: '456',
          newPosition: 1
        })
      })
      const data = await response.json()
      console.log('Update response:', data)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div>
      <button onClick={testUpdate}>Test Update</button>
      <div>
        {updates.map((update, index) => (
          <div key={index}>
            <pre>{JSON.stringify(update, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  )
}
