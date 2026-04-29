/**
 * 直播信令 API
 * 
 * WebRTC 信令服务器：
 * - 创建/加入房间
 * - 通过 SSE 推送信令消息（offer/answer/ICE candidate）
 * - 发送信令消息
 * 
 * 房间数据存储在内存中（生产环境应使用 Redis）
 */

import { NextRequest, NextResponse } from 'next/server';
import { success, error, ErrorCode } from '@/lib/api';

// ============================================
// 内存存储（生产环境应替换为 Redis）
// ============================================

type RoomParticipant = {
  id: string;
  name: string;
  joinedAt: number;
};

type SignalingMessage = {
  type: 'offer' | 'answer' | 'ice-candidate' | 'user-joined' | 'user-left' | 'chat';
  from: string;
  to?: string; // undefined = broadcast
  payload: unknown;
  timestamp: number;
};

type Room = {
  id: string;
  name: string;
  courseId: string;
  createdBy: string;
  createdAt: number;
  participants: Map<string, RoomParticipant>;
  messages: SignalingMessage[];
};

const rooms = new Map<string, Room>();

// 每个客户端的消息队列
const clientQueues = new Map<string, SignalingMessage[]>();

// SSE 客户端连接
const sseClients = new Map<string, ReadableStreamDefaultController>();

function broadcastToRoom(roomId: string, message: SignalingMessage, excludeClientId?: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.messages.push(message);
  // 保留最近500条消息
  if (room.messages.length > 500) {
    room.messages = room.messages.slice(-500);
  }

  // 推送给房间内所有 SSE 客户端
  for (const [clientId, controller] of sseClients.entries()) {
    if (excludeClientId && clientId === excludeClientId) continue;
    // 检查该客户端是否在此房间
    const participant = Array.from(room.participants.values())
      .find(p => clientId.startsWith(`${roomId}:${p.id}`));
    if (!participant && !clientId.startsWith(`${roomId}:`)) continue;

    try {
      controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
    } catch {
      sseClients.delete(clientId);
    }
  }
}

// ============================================
// GET: SSE 信令流
// ============================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId');
  const clientId = searchParams.get('clientId');

  if (!roomId || !clientId) {
    return NextResponse.json(error('缺少 roomId 或 clientId', ErrorCode.BAD_REQUEST), { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const sseKey = `${roomId}:${clientId}`;
      sseClients.set(sseKey, controller);

      // 发送初始连接成功消息
      controller.enqueue(`data: ${JSON.stringify({ type: 'connected', clientId, timestamp: Date.now() })}\n\n`);

      // 发送房间历史消息（最近50条）
      const room = rooms.get(roomId);
      if (room) {
        const recent = room.messages.slice(-50);
        for (const msg of recent) {
          try {
            controller.enqueue(`data: ${JSON.stringify(msg)}\n\n`);
          } catch { /* ignore */ }
        }
      }

      // 心跳
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(':heartbeat\n\n');
        } catch {
          clearInterval(heartbeat);
          sseClients.delete(sseKey);
        }
      }, 30000);

      // 清理
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat);
        sseClients.delete(sseKey);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

// ============================================
// POST: 信令操作
// ============================================

type SignalAction = {
  action: 'create-room' | 'join-room' | 'leave-room' | 'signal' | 'chat';
  // create-room
  roomId?: string;
  roomName?: string;
  courseId?: string;
  // join-room / leave-room
  participantId?: string;
  participantName?: string;
  // signal
  signalType?: 'offer' | 'answer' | 'ice-candidate';
  targetId?: string;
  payload?: unknown;
  // chat
  message?: string;
};

export async function POST(request: NextRequest) {
  let body: SignalAction;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(error('无效的请求体', ErrorCode.BAD_REQUEST), { status: 400 });
  }
  const { action } = body;

  switch (action) {
    case 'create-room': {
      const roomId = body.roomId || `room-${Date.now()}`;
      const room: Room = {
        id: roomId,
        name: body.roomName || '云课堂',
        courseId: body.courseId || '',
        createdBy: body.participantId || '',
        createdAt: Date.now(),
        participants: new Map(),
        messages: [],
      };
      rooms.set(roomId, room);
      return NextResponse.json(success({ roomId, roomName: room.name }, 'database'));
    }

    case 'join-room': {
      const room = rooms.get(body.roomId || '');
      if (!room) {
        return NextResponse.json(error('房间不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }

      const participant: RoomParticipant = {
        id: body.participantId || '',
        name: body.participantName || '匿名',
        joinedAt: Date.now(),
      };
      room.participants.set(participant.id, participant);

      // 广播用户加入
      broadcastToRoom(room.id, {
        type: 'user-joined',
        from: participant.id,
        payload: { name: participant.name, participantCount: room.participants.size },
        timestamp: Date.now(),
      });

      return NextResponse.json(success({
        roomId: room.id,
        participants: Array.from(room.participants.values()),
        participantCount: room.participants.size,
      }, 'database'));
    }

    case 'leave-room': {
      const room = rooms.get(body.roomId || '');
      if (!room) break;

      room.participants.delete(body.participantId || '');

      broadcastToRoom(room.id, {
        type: 'user-left',
        from: body.participantId || '',
        payload: { participantCount: room.participants.size },
        timestamp: Date.now(),
      });

      // 房间没人了就删除
      if (room.participants.size === 0) {
        rooms.delete(room.id);
      }

      return NextResponse.json(success({ left: true }, 'database'));
    }

    case 'signal': {
      const room = rooms.get(body.roomId || '');
      if (!room) {
        return NextResponse.json(error('房间不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }

      const message: SignalingMessage = {
        type: body.signalType || 'offer',
        from: body.participantId || '',
        to: body.targetId,
        payload: body.payload,
        timestamp: Date.now(),
      };

      // 定向发送或广播
      if (body.targetId) {
        // 定向发送
        const targetKey = Array.from(sseClients.keys()).find(k =>
          k.startsWith(`${room.id}:`) && k.includes(body.targetId!)
        );
        if (targetKey) {
          const controller = sseClients.get(targetKey);
          try {
            controller?.enqueue(`data: ${JSON.stringify(message)}\n\n`);
          } catch { /* ignore */ }
        }
      } else {
        broadcastToRoom(room.id, message, `${room.id}:${body.participantId}`);
      }

      return NextResponse.json(success({ sent: true }, 'database'));
    }

    case 'chat': {
      const room = rooms.get(body.roomId || '');
      if (!room) {
        return NextResponse.json(error('房间不存在', ErrorCode.NOT_FOUND), { status: 404 });
      }

      broadcastToRoom(room.id, {
        type: 'chat',
        from: body.participantId || '',
        payload: { message: body.message, name: body.participantName },
        timestamp: Date.now(),
      });

      return NextResponse.json(success({ sent: true }, 'database'));
    }
  }

  return NextResponse.json(error('未知操作', ErrorCode.BAD_REQUEST), { status: 400 });
}
