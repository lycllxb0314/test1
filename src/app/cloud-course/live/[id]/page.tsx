'use client';

/**
 * 在线云课堂页面
 * 
 * 基于 WebRTC 的实时视频教学：
 * - 教师：发起直播，广播视频/音频/屏幕共享
 * - 学生：加入课堂，观看直播，文字互动
 * - 信令通过 SSE + POST 实现
 * 
 * 路由参数：/cloud-course/live/[id]
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Mic, MicOff, Video, VideoOff, Monitor, MonitorOff,
  MessageSquare, Users, Hand, PhoneOff, Send, Loader2,
  Radio,
} from 'lucide-react';

// ============================================
// 类型
// ============================================

type ChatMessage = {
  id: string;
  from: string;
  name: string;
  content: string;
  timestamp: number;
  isSelf: boolean;
};

type Participant = {
  id: string;
  name: string;
  hasVideo: boolean;
  hasAudio: boolean;
  isHandRaised: boolean;
};

type RoomState = 'idle' | 'connecting' | 'connected' | 'error';

// ICE 服务器配置（使用免费 STUN 服务器，生产环境需要 TURN）
const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export default function LiveClassroomPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const courseId = params.id as string;

  // 状态
  const [roomState, setRoomState] = useState<RoomState>('idle');
  const [roomId, setRoomId] = useState<string>('');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localStream = useRef<MediaStream | null>(null);
  const screenStream = useRef<MediaStream | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const isTeacher = true; // 简化：通过角色判断

  // ============================================
  // 获取本地媒体流
  // ============================================

  const getLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: localVideoEnabled,
        audio: localAudioEnabled,
      });
      localStream.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.error('[LiveClassroom] getUserMedia error:', err);
      setErrorMessage('无法访问摄像头/麦克风，请检查权限设置');
      return null;
    }
  }, [localVideoEnabled, localAudioEnabled]);

  // ============================================
  // 创建 WebRTC PeerConnection
  // ============================================

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current.set(peerId, pc);

    // 添加本地流
    const stream = localStream.current || screenStream.current;
    if (stream) {
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });
    }

    // 接收远程流
    pc.ontrack = (event) => {
      const remoteVideo = remoteVideoRefs.current.get(peerId);
      if (remoteVideo && event.streams[0]) {
        remoteVideo.srcObject = event.streams[0];
      }
    };

    // ICE 候选
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // 发送 ICE 候选到信令服务器
        apiClient.post('/cloud-course/live/signal', {
          action: 'signal',
          roomId,
          participantId: user?.id || '',
          signalType: 'ice-candidate',
          targetId: peerId,
          payload: event.candidate.toJSON(),
        });
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        peerConnections.current.delete(peerId);
        setParticipants(prev => prev.filter(p => p.id !== peerId));
      }
    };

    return pc;
  }, [roomId, user?.id]);

  // ============================================
  // 处理信令消息
  // ============================================

  const handleSignalingMessage = useCallback(async (data: Record<string, unknown>) => {
    const msgType = data.type as string;
    const from = data.from as string;
    const payload = data.payload;

    switch (msgType) {
      case 'user-joined': {
        const name = (payload as Record<string, unknown>)?.name as string || '匿名';
        setParticipants(prev => {
          if (prev.find(p => p.id === from)) return prev;
          return [...prev, { id: from, name, hasVideo: false, hasAudio: false, isHandRaised: false }];
        });

        // 作为现有参与者，向新加入者发送 offer
        const pc = createPeerConnection(from);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await apiClient.post('/cloud-course/live/signal', {
          action: 'signal',
          roomId,
          participantId: user?.id || '',
          signalType: 'offer',
          targetId: from,
          payload: offer,
        });
        break;
      }

      case 'user-left': {
        setParticipants(prev => prev.filter(p => p.id !== from));
        const pc = peerConnections.current.get(from);
        if (pc) {
          pc.close();
          peerConnections.current.delete(from);
        }
        break;
      }

      case 'offer': {
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        await apiClient.post('/cloud-course/live/signal', {
          action: 'signal',
          roomId,
          participantId: user?.id || '',
          signalType: 'answer',
          targetId: from,
          payload: answer,
        });
        break;
      }

      case 'answer': {
        const pc = peerConnections.current.get(from);
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(payload as RTCSessionDescriptionInit));
        }
        break;
      }

      case 'ice-candidate': {
        const pc = peerConnections.current.get(from);
        if (pc) {
          await pc.addIceCandidate(new RTCIceCandidate(payload as RTCIceCandidateInit));
        }
        break;
      }

      case 'chat': {
        const chatPayload = payload as { message?: string; name?: string };
        const msgContent = chatPayload?.message;
        if (msgContent) {
          setChatMessages(prev => [...prev, {
            id: `${from}-${Date.now()}`,
            from,
            name: chatPayload.name || '匿名',
            content: msgContent,
            timestamp: Date.now(),
            isSelf: from === user?.id,
          }]);
        }
        break;
      }
    }
  }, [roomId, user?.id, createPeerConnection]);

  // ============================================
  // 连接 SSE 信令流
  // ============================================

  const connectSignaling = useCallback((rId: string) => {
    const clientId = user?.id || `guest-${Date.now()}`;
    const es = new EventSource(`/api/cloud-course/live/signal?roomId=${rId}&clientId=${clientId}`);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleSignalingMessage(data);
      } catch { /* ignore parse errors */ }
    };

    es.onerror = () => {
      console.error('[LiveClassroom] SSE connection error');
    };
  }, [user?.id, handleSignalingMessage]);

  // ============================================
  // 加入房间
  // ============================================

  const joinRoom = useCallback(async () => {
    setRoomState('connecting');
    setErrorMessage(null);

    // 获取本地媒体流
    const stream = await getLocalStream();
    if (!stream) {
      setRoomState('error');
      return;
    }

    try {
      // 创建或获取房间
      const rId = `course-${courseId}`;
      setRoomId(rId);

      // 尝试创建房间（如果已存在会返回已有房间）
      await apiClient.post('/cloud-course/live/signal', {
        action: 'create-room',
        roomId: rId,
        roomName: `云课堂-${courseId}`,
        courseId,
        participantId: user?.id,
      });

      // 加入房间
      await apiClient.post('/cloud-course/live/signal', {
        action: 'join-room',
        roomId: rId,
        participantId: user?.id,
        participantName: user?.name || '匿名',
      });

      // 连接信令流
      connectSignaling(rId);

      setRoomState('connected');
      setParticipants([{
        id: user?.id || '',
        name: user?.name || '我',
        hasVideo: localVideoEnabled,
        hasAudio: localAudioEnabled,
        isHandRaised: false,
      }]);
    } catch (err) {
      console.error('[LiveClassroom] join room error:', err);
      setErrorMessage('加入课堂失败');
      setRoomState('error');
    }
  }, [courseId, user?.id, user?.name, getLocalStream, connectSignaling, localVideoEnabled, localAudioEnabled]);

  // ============================================
  // 离开房间
  // ============================================

  const leaveRoom = useCallback(async () => {
    // 关闭所有 PeerConnection
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();

    // 停止本地流
    localStream.current?.getTracks().forEach(t => t.stop());
    screenStream.current?.getTracks().forEach(t => t.stop());

    // 关闭 SSE
    eventSourceRef.current?.close();

    // 通知服务器
    if (roomId) {
      try {
        await apiClient.post('/cloud-course/live/signal', {
          action: 'leave-room',
          roomId,
          participantId: user?.id,
        });
      } catch { /* ignore */ }
    }

    setRoomState('idle');
    setParticipants([]);
    router.back();
  }, [roomId, user?.id, router]);

  // ============================================
  // 切换音视频
  // ============================================

  const toggleAudio = useCallback(() => {
    const stream = localStream.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setLocalAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    const stream = localStream.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setLocalVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // 停止屏幕共享，恢复摄像头
      screenStream.current?.getTracks().forEach(t => t.stop());
      screenStream.current = null;
      if (localStream.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream.current;
      }
      // 替换所有 PeerConnection 的视频轨道
      peerConnections.current.forEach(pc => {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        if (videoSender && localStream.current) {
          const videoTrack = localStream.current.getVideoTracks()[0];
          if (videoTrack) videoSender.replaceTrack(videoTrack);
        }
      });
      setIsScreenSharing(false);
    } else {
      try {
        const sStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStream.current = sStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = sStream;
        }
        // 替换所有 PeerConnection 的视频轨道
        peerConnections.current.forEach(pc => {
          const senders = pc.getSenders();
          const videoSender = senders.find(s => s.track?.kind === 'video');
          if (videoSender) {
            const screenTrack = sStream.getVideoTracks()[0];
            if (screenTrack) videoSender.replaceTrack(screenTrack);
          }
        });
        sStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
        };
        setIsScreenSharing(true);
      } catch { /* user cancelled */ }
    }
  }, [isScreenSharing]);

  // ============================================
  // 发送聊天消息
  // ============================================

  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || !roomId) return;
    const message = chatInput.trim();
    setChatInput('');

    // 立即显示自己的消息
    setChatMessages(prev => [...prev, {
      id: `self-${Date.now()}`,
      from: user?.id || '',
      name: user?.name || '我',
      content: message,
      timestamp: Date.now(),
      isSelf: true,
    }]);

    try {
      await apiClient.post('/cloud-course/live/signal', {
        action: 'chat',
        roomId,
        participantId: user?.id,
        participantName: user?.name,
        message,
      });
    } catch { /* ignore */ }
  }, [chatInput, roomId, user?.id, user?.name]);

  // 滚动到最新消息
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // 页面卸载时清理
  useEffect(() => {
    return () => {
      peerConnections.current.forEach(pc => pc.close());
      localStream.current?.getTracks().forEach(t => t.stop());
      screenStream.current?.getTracks().forEach(t => t.stop());
      eventSourceRef.current?.close();
    };
  }, []);

  // ============================================
  // 渲染
  // ============================================

  // 未加入房间 - 入口页面
  if (roomState === 'idle' || roomState === 'error') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Radio className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-xl font-bold mb-2">在线云课堂</h1>
            <p className="text-muted-foreground mb-6">
              点击下方按钮加入课堂，将使用您的摄像头和麦克风
            </p>
            {errorMessage && (
              <div className="bg-destructive/10 text-destructive text-sm rounded-md p-3 mb-4">
                {errorMessage}
              </div>
            )}
            <Button size="lg" onClick={joinRoom} className="w-full">
              <Video className="h-5 w-5 mr-2" />加入课堂
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 正在连接
  if (roomState === 'connecting') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <span className="text-muted-foreground">正在连接课堂...</span>
        </div>
      </div>
    );
  }

  // 课堂主界面
  const remoteParticipants = participants.filter(p => p.id !== user?.id);

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* 顶部栏 */}
      <header className="bg-card border-b border-border px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant="destructive" className="animate-pulse">
            <Radio className="h-3 w-3 mr-1" />直播中
          </Badge>
          <span className="text-sm font-medium">在线云课堂</span>
          <span className="text-xs text-muted-foreground">{participants.length} 人在线</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowChat(prev => !prev)}>
            <MessageSquare className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setHandRaised(prev => !prev)}>
            <Hand className={`h-4 w-4 ${handRaised ? 'text-amber-500' : ''}`} />
          </Button>
          <Button variant="destructive" size="sm" onClick={leaveRoom}>
            <PhoneOff className="h-4 w-4 mr-1" />离开
          </Button>
        </div>
      </header>

      {/* 主体区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 视频区域 */}
        <div className="flex-1 p-4 flex flex-col gap-4 overflow-auto">
          {/* 主视频（自己） */}
          <div className="flex-1 flex items-center justify-center">
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <Badge variant="secondary" className="bg-black/60 text-white">
                  {user?.name || '我'} {isScreenSharing && '(共享屏幕)'}
                </Badge>
                {!localAudioEnabled && <MicOff className="h-4 w-4 text-red-400" />}
              </div>
            </div>
          </div>

          {/* 远程参与者视频网格 */}
          {remoteParticipants.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {remoteParticipants.map(p => (
                <div key={p.id} className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                  <video
                    ref={el => {
                      if (el) remoteVideoRefs.current.set(p.id, el);
                    }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="bg-black/60 text-white text-xs">
                      {p.name}
                      {p.isHandRaised && <Hand className="h-3 w-3 ml-1 text-amber-400" />}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 无远程参与者时 */}
          {remoteParticipants.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">等待其他参与者加入...</p>
            </div>
          )}
        </div>

        {/* 聊天面板 */}
        {showChat && (
          <aside className="w-80 border-l border-border bg-card flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />课堂讨论
              </h3>
            </div>
            <ScrollArea className="flex-1 p-4">
              {chatMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">暂无消息</p>
              ) : (
                <div className="space-y-3">
                  {chatMessages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'}`}>
                      <span className="text-xs text-muted-foreground mb-0.5">{msg.name}</span>
                      <div className={`rounded-lg px-3 py-1.5 text-sm max-w-[85%] ${
                        msg.isSelf
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              )}
            </ScrollArea>
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="输入消息..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  className="text-sm"
                />
                <Button size="sm" onClick={sendChat} disabled={!chatInput.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* 底部控制栏 */}
      <footer className="bg-card border-t border-border px-6 py-3 flex items-center justify-center gap-4 shrink-0">
        <Button
          variant={localAudioEnabled ? 'outline' : 'destructive'}
          size="sm"
          onClick={toggleAudio}
        >
          {localAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          <span className="ml-1 text-xs">{localAudioEnabled ? '静音' : '取消静音'}</span>
        </Button>
        <Button
          variant={localVideoEnabled ? 'outline' : 'destructive'}
          size="sm"
          onClick={toggleVideo}
        >
          {localVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          <span className="ml-1 text-xs">{localVideoEnabled ? '关闭摄像头' : '开启摄像头'}</span>
        </Button>
        <Button
          variant={isScreenSharing ? 'default' : 'outline'}
          size="sm"
          onClick={toggleScreenShare}
        >
          {isScreenSharing ? <MonitorOff className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          <span className="ml-1 text-xs">{isScreenSharing ? '停止共享' : '共享屏幕'}</span>
        </Button>
      </footer>
    </div>
  );
}
