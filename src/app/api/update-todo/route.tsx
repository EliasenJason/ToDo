import Pusher from "pusher"
import { NextResponse } from 'next/server'

interface PusherConfig {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
  useTLS: boolean;
}

const pusherConfig: PusherConfig = {
  appId: String(process.env.PUSHER_APP_ID),
  key: String(process.env.PUSHER_KEY),
  secret: String(process.env.PUSHER_SECRET),
  cluster: String(process.env.PUSHER_CLUSTER),
  useTLS: true,
};

const pusher = new Pusher(pusherConfig);

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { listId, todoId, newPosition } = body

    // Trigger the pusher event
    await pusher.trigger("todo-channel", "todo-updated", {
      todoId,
      listId,
      newPosition,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ message: 'Todo updated successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update todo' }, { status: 500 })
  }
}
