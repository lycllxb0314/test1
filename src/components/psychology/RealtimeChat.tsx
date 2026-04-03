'use client';

/**
 * 实时视频对话组件
 * 
 * 功能：
 * - 视频通话界面（摄像头 + 麦克风）
 * - 用户视频画中画
 * - 童童数字人形象
 * - VAD 语音活动检测，自动识别说话结束
 * - 实时 ASR 转写 + LLM 流式对话 + TTS 语音合成
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TongtongAvatar, { type TongtongState, type TongtongEmotion } from './TongtongAvatar';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCrisis?: boolean;
};

type RealtimeChatProps = {
  studentId: string;
  sessionId?: string;
  initialMessages?: Message[];
  onCrisisDetected?: (keywords: string[]) => void;
  className?: string;
};

export const RealtimeChat: React.FC<RealtimeChatProps> = ({
  studentId,
  sessionId: initialSessionId,
  initialMessages = [],
  onCrisisDetected,
  className,
}) => {
  // 通话状态
  const [isInCall, setIsInCall] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  
  // 媒体状态
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  
  // 对话状态
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tongtongState, setTongtongState] = useState<TongtongState>('idle');
  const [tongtongEmotion, setTongtongEmotion] = useState<TongtongEmotion>('neutral');
  const [currentText, setCurrentText] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // VAD 状态
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);

  // Refs - 视频元素始终存在
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const vadIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSpeakingRef = useRef(false);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentText]);

  // 清理
  useEffect(() => {
    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (vadIntervalRef.current) {
        clearInterval(vadIntervalRef.current);
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  // 初始化会话
  useEffect(() => {
    const initSession = async () => {
      if (!sessionId) {
        try {
          const response = await fetch('/api/psychology/sessions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId }),
          });
          const data = await response.json();
          if (data.success && data.data?.session) {
            setSessionId(data.data.session.id);
          }
        } catch (err) {
          console.error('Failed to init session:', err);
        }
      }
    };
    initSession();
  }, [studentId, sessionId]);

  // VAD 语音活动检测
  const setupVAD = useCallback((stream: MediaStream) => {
    try {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const threshold = 25;
      const silenceDuration = 1500; // 1.5秒静音后认为说话结束
      
      vadIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || !isInCall || isProcessing || isPlaying) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        // 更新音量级别（用于UI显示）
        setVolumeLevel(Math.min(100, average * 2));
        
        if (average > threshold) {
          // 检测到语音
          setVolumeLevel(Math.min(100, average * 3));
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsUserSpeaking(true);
            setTongtongState('listening');
          }
          
          // 清除静音计时器
          if (silenceTimeoutRef.current) {
            clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = null;
          }
        } else if (isSpeakingRef.current) {
          // 可能静音了，启动计时器
          if (!silenceTimeoutRef.current) {
            silenceTimeoutRef.current = setTimeout(() => {
              // 用户停止说话，处理录音
              if (isSpeakingRef.current && mediaRecorderRef.current?.state === 'recording') {
                isSpeakingRef.current = false;
                setIsUserSpeaking(false);
                processRecording();
              }
            }, silenceDuration);
          }
        }
      }, 100);
    } catch (err) {
      console.error('VAD setup error:', err);
    }
  }, [isInCall, isProcessing, isPlaying]);

  // 开始通话
  const startCall = useCallback(async () => {
    try {
      setError(null);

      // 请求摄像头和麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });

      mediaStreamRef.current = stream;
      setHasPermission(true);
      setIsInCall(true);

      // 设置视频预览 - 直接赋值并播放
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      // 设置 VAD
      setupVAD(stream);

      // 开始持续录音
      startContinuousRecording(stream);

    } catch (err) {
      console.error('Failed to get media:', err);
      setHasPermission(false);
      setError('需要摄像头和麦克风权限才能开始视频通话');
    }
  }, [setupVAD]);

  // 结束通话
  const endCall = useCallback(() => {
    // 停止录音
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // 停止 VAD
    if (vadIntervalRef.current) {
      clearInterval(vadIntervalRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    // 停止媒体流
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // 关闭音频上下文
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    // 清理视频
    if (userVideoRef.current) {
      userVideoRef.current.srcObject = null;
    }

    setIsInCall(false);
    setIsProcessing(false);
    setIsPlaying(false);
    setIsUserSpeaking(false);
    setTongtongState('idle');
  }, []);

  // 切换麦克风
  const toggleMic = useCallback(() => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMicEnabled;
      });
      setIsMicEnabled(!isMicEnabled);
    }
  }, [isMicEnabled]);

  // 切换摄像头
  const toggleCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isCameraEnabled;
      });
      setIsCameraEnabled(!isCameraEnabled);
    }
  }, [isCameraEnabled]);

  // 开始持续录音
  const startContinuousRecording = useCallback((stream: MediaStream) => {
    // 检查支持的 MIME 类型
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/mp4';
      }
    }

    try {
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
    } catch (e) {
      // 使用默认编码器
      mediaRecorderRef.current = new MediaRecorder(stream);
    }

    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.start(100);
  }, []);

  // 重新开始录音
  const restartRecording = useCallback(() => {
    if (!mediaStreamRef.current || !isInCall) return;
    
    audioChunksRef.current = [];
    startContinuousRecording(mediaStreamRef.current);
  }, [isInCall, startContinuousRecording]);

  // 处理录音
  const processRecording = useCallback(async () => {
    // 停止当前录音
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    if (audioChunksRef.current.length === 0) {
      restartRecording();
      return;
    }

    setIsProcessing(true);
    setTongtongState('thinking');

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // 检查音频大小
      if (audioBlob.size < 1000) {
        // 音频太短，忽略
        restartRecording();
        setIsProcessing(false);
        setTongtongState('idle');
        return;
      }
      
      // 转换为 base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      await new Promise<void>((resolve) => {
        reader.onloadend = () => resolve();
      });

      const base64Audio = (reader.result as string).split(',')[1];

      // 调用 ASR API
      const asrResponse = await fetch('/api/psychology/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          audioData: base64Audio,
          format: 'webm',
        }),
      });

      const asrData = await asrResponse.json();
      
      if (!asrData.success || !asrData.data?.text?.trim()) {
        restartRecording();
        setIsProcessing(false);
        setTongtongState('idle');
        return;
      }

      const userText = asrData.data.text.trim();

      // 添加用户消息
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        content: userText,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // 调用流式对话 API
      await streamChat(userText);
      
    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : '处理失败，请重试');
    } finally {
      setIsProcessing(false);
      // 重新开始录音
      restartRecording();
    }
  }, [restartRecording]);

  // 流式对话
  const streamChat = async (userMessage: string) => {
    setTongtongState('speaking');
    setCurrentText('');

    try {
      const response = await fetch('/api/psychology/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentId,
          message: userMessage,
          history: messages.slice(-10).map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('对话服务暂时不可用');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('无法读取响应');

      const decoder = new TextDecoder();
      let fullResponse = '';
      let isCrisis = false;
      let crisisKeywords: string[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'text' && data.content) {
                fullResponse += data.content;
                setCurrentText(fullResponse);
              } else if (data.type === 'crisis') {
                isCrisis = true;
                crisisKeywords = data.crisisKeywords || [];
                setTongtongEmotion('concerned');
              }
            } catch {
              // 忽略解析错误
            }
          }
        }
      }

      // 添加助手消息
      const assistantMessage: Message = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date(),
        isCrisis,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setCurrentText('');

      // 触发危机回调
      if (isCrisis && onCrisisDetected) {
        onCrisisDetected(crisisKeywords);
      }

      // 播放 TTS
      if (fullResponse) {
        await playTTS(fullResponse);
      }
      
      setTongtongState('idle');
    } catch (err) {
      console.error('Chat error:', err);
      throw err;
    }
  };

  // 播放 TTS
  const playTTS = async (text: string) => {
    try {
      setIsPlaying(true);
      setTongtongState('speaking');

      const response = await fetch('/api/psychology/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          speaker: 'default',
          speed: 10,
          returnBase64: true,
        }),
      });

      const data = await response.json();

      if (data.success && data.audioData) {
        if (audioElementRef.current) {
          audioElementRef.current.pause();
        }
        
        audioElementRef.current = new Audio(data.audioData);
        audioElementRef.current.onended = () => {
          setIsPlaying(false);
          setTongtongState('idle');
        };
        
        await audioElementRef.current.play();
      } else {
        setIsPlaying(false);
        setTongtongState('idle');
      }
    } catch (err) {
      console.error('TTS error:', err);
      setIsPlaying(false);
      setTongtongState('idle');
    }
  };

  // 未开始通话 - 显示开始界面
  if (!isInCall) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800', className)}>
        <div className="mb-8">
          <TongtongAvatar 
            state="idle"
            emotion="happy"
            size="xl"
            animated={true}
          />
        </div>
        
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          童童哥哥在这里等你
        </h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 text-center max-w-md px-4">
          点击下方按钮开始视频通话，我会倾听你的心声
        </p>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm max-w-md">
            {error}
          </div>
        )}

        <Button
          size="lg"
          onClick={startCall}
          className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
        >
          <Phone className="w-7 h-7" />
        </Button>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          开始视频通话
        </p>
      </div>
    );
  }

  // 视频通话界面
  return (
    <div className={cn('relative h-full bg-black overflow-hidden', className)}>
      {/* 主画面 - 童童形象 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 via-slate-900 to-slate-900">
        <div className="mb-4">
          <TongtongAvatar 
            state={tongtongState}
            emotion={tongtongEmotion}
            size="xl"
            animated={true}
          />
        </div>

        {/* 当前回复文本 */}
        {currentText && (
          <div 
            className="absolute bottom-32 left-4 right-4 max-w-2xl mx-auto px-6 py-4 rounded-2xl shadow-xl backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
          >
            <p className="text-white text-lg whitespace-pre-wrap leading-relaxed">
              {currentText}
            </p>
          </div>
        )}

        {/* 状态提示 */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2">
          <div 
            className="px-4 py-2 rounded-full text-sm text-white backdrop-blur-md flex items-center gap-2"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          >
            {isUserSpeaking && <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
            {tongtongState === 'listening' && '🎤 正在倾听...'}
            {tongtongState === 'thinking' && '💭 让我想想...'}
            {tongtongState === 'speaking' && '💬 正在回复...'}
            {tongtongState === 'idle' && '🌈 我在这里，请说话'}
          </div>
        </div>
      </div>

      {/* 用户视频画中画 - 右下角 */}
      <div 
        className="absolute bottom-24 right-4 w-32 h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-800"
        style={{ aspectRatio: '9/16' }}
      >
        {/* 视频元素 - 始终存在 */}
        <video
          ref={userVideoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover',
            !isCameraEnabled && 'opacity-0'
          )}
        />
        {/* 摄像头关闭时显示占位 */}
        {!isCameraEnabled && (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <VideoOff className="w-8 h-8 text-slate-500" />
          </div>
        )}
        
        {/* 用户标识 */}
        <div 
          className="absolute bottom-2 left-2 px-2 py-1 rounded text-xs text-white backdrop-blur-sm"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
        >
          我
          {!isMicEnabled && <MicOff className="inline w-3 h-3 ml-1" />}
        </div>
      </div>

      {/* 音量指示器 */}
      {isUserSpeaking && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex items-end gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-2 bg-green-400 rounded-full transition-all duration-75"
              style={{
                height: `${8 + (volumeLevel / 100) * 24 * (1 + i * 0.2)}px`,
              }}
            />
          ))}
        </div>
      )}

      {/* 底部控制栏 */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
      >
        <div className="flex items-center justify-center gap-6">
          {/* 麦克风开关 */}
          <Button
            size="lg"
            variant="ghost"
            onClick={toggleMic}
            className={cn(
              'w-14 h-14 rounded-full',
              isMicEnabled 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-red-500/80 text-white hover:bg-red-600'
            )}
          >
            {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* 结束通话 */}
          <Button
            size="lg"
            onClick={endCall}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg"
          >
            <PhoneOff className="w-7 h-7" />
          </Button>

          {/* 摄像头开关 */}
          <Button
            size="lg"
            variant="ghost"
            onClick={toggleCamera}
            className={cn(
              'w-14 h-14 rounded-full',
              isCameraEnabled 
                ? 'bg-white/10 text-white hover:bg-white/20' 
                : 'bg-red-500/80 text-white hover:bg-red-600'
            )}
          >
            {isCameraEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* 消息记录 */}
      {messages.length > 0 && (
        <div 
          className="absolute top-16 left-4 w-64 max-h-48 overflow-y-auto rounded-lg p-2 backdrop-blur-md"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
        >
          {messages.slice(-5).map((message) => (
            <div
              key={message.id}
              className={cn(
                'text-xs mb-1 p-2 rounded',
                message.role === 'user' 
                  ? 'bg-blue-500/50 text-white ml-8' 
                  : 'bg-white/20 text-white mr-8'
              )}
            >
              <p className="line-clamp-2">{message.content}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}
    </div>
  );
};

export default RealtimeChat;
