import Pusher from "pusher"
import { NextResponse } from 'next/server'

interface PusherConfig {
  appId: string;
  key: string;
  secret: string;
  cluster: string;
  useTLS: boolean;
}

interface DraggableItem {
  id: string;
  content: string;
  x: number;
  y: number;
  grid: number;
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
    const items: DraggableItem[] = await req.json();

    // Broadcast the updated items state to all clients
    await pusher.trigger("items-update-channel", "items-update", items);
    console.log("backend updating")
    return NextResponse.json({ 
      message: 'Items updated successfully',
      items 
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update items' }, { status: 500 });
  }
}