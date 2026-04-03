'use client';

/**
 * 实时语音对话组件
 * 
 * 功能：
 * - 麦克风录音（带 VAD 语音活动检测）
 * - 实时 ASR 转写
 * - 流式 LLM 对话
 * - TTS 语音合成播放
 * - 与数字人童童联动
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TongtongAvatar, { type TongtongState, type TongtongEmotion } from './TongtongAvatar';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isCrisis?: boolean;
};

type RealtimeChatProps = {
  // 学生 ID
  studentId: string;
  // 会话 ID（可选，用于继续对话）
  sessionId?: string;
  // 初始历史消息
  initialMessages?: Message[];
  // 危机回调
  onCrisisDetected?: (keywords: string[]) => void;
  // 自定义类名
  className?: string;
};

// 简易 VAD（语音活动检测）
const useVAD = (audioContext: AudioContext | null, analyser: AnalyserNode | null) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const speakingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!audioContext || !analyser) return;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const threshold = 30; // 音量阈值
    const silenceDuration = 1000; // 静音持续时间（毫秒）

    const checkAudio = () => {
      analyser.getByteFrequencyData(dataArray);
      
      // 计算平均音量
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      
      if (average > threshold) {
        // 检测到语音
        if (!speakingRef.current) {
          speakingRef.current = true;
          setIsSpeaking(true);
        }
        
        // 清除静音计时器
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else if (speakingRef.current) {
        // 可能静音了，启动计时器
        if (!silenceTimerRef.current) {
          silenceTimerRef.current = setTimeout(() => {
            speakingRef.current = false;
            setIsSpeaking(false);
          }, silenceDuration);
        }
      }
    };

    const intervalId = setInterval(checkAudio, 100);
    return () => {
      clearInterval(intervalId);
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [audioContext, analyser]);

  return isSpeaking;
};

export const RealtimeChat: React.FC<RealtimeChatProps> = ({
  studentId,
  sessionId: initialSessionId,
  initialMessages = [],
  onCrisisDetected,
  className,
}) => {
  // 状态
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [tongtongState, setTongtongState] = useState<TongtongState>('idle');
  const [tongtongEmotion, setTongtongEmotion] = useState<TongtongEmotion>('neutral');
  const [currentText, setCurrentText] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // VAD
  const isSpeaking = useVAD(audioContextRef.current, analyserRef.current);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentText]);

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
          if (data.success && data.data.session) {
            setSessionId(data.data.session.id);
            if (data.data.messages?.length) {
              setMessages(data.data.messages.map((m: any) => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: new Date(m.createdAt),
              })));
            }
          }
        } catch (err) {
          console.error('Failed to init session:', err);
        }
      }
    };
    initSession();
  }, [studentId, sessionId]);

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      setError(null);
      
      // 获取麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });

      // 设置音频分析器（用于 VAD）
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // 创建录音器
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        processRecording();
      };

      mediaRecorderRef.current.start(100); // 每 100ms 收集一次数据
      setIsRecording(true);
      setTongtongState('listening');
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('无法访问麦克风，请检查权限设置');
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // 处理录音
  const processRecording = async () => {
    if (audioChunksRef.current.length === 0) return;

    setIsProcessing(true);
    setTongtongState('thinking');

    try {
      // 合并音频数据
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
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
          format: 'wav',
        }),
      });

      const asrData = await asrResponse.json();
      
      if (!asrData.success) {
        throw new Error(asrData.error || '语音识别失败');
      }

      const userText = asrData.data.text;
      
      if (!userText?.trim()) {
        setIsProcessing(false);
        setTongtongState('idle');
        return;
      }

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
      setTongtongState('idle');
    } finally {
      setIsProcessing(false);
    }
  };

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
              } else if (data.type === 'done') {
                // 完成
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
        // 播放音频
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

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 数字人区域 */}
      <div className="flex-shrink-0 flex flex-col items-center py-8 bg-gradient-to-b from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <TongtongAvatar 
          state={tongtongState}
          emotion={tongtongEmotion}
          size="xl"
          animated={true}
        />
        
        {/* 当前回复文本（打字机效果） */}
        {currentText && (
          <div className="mt-6 max-w-md px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {currentText}
            </p>
          </div>
        )}
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex',
              message.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] px-4 py-2 rounded-2xl',
                message.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground',
                message.isCrisis && 'border-2 border-red-500'
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {message.timestamp.toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="px-4 py-2 bg-red-50 text-red-600 text-sm text-center">
          {error}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setError(null)}
            className="ml-2"
          >
            关闭
          </Button>
        </div>
      )}

      {/* 录音控制 */}
      <div className="flex-shrink-0 p-4 border-t bg-background">
        <div className="flex items-center justify-center gap-4">
          {/* 录音按钮 */}
          <Button
            size="lg"
            variant={isRecording ? 'destructive' : 'default'}
            className={cn(
              'w-16 h-16 rounded-full',
              isRecording && 'animate-pulse'
            )}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing || isPlaying}
          >
            {isRecording ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </Button>
        </div>

        {/* 状态提示 */}
        <div className="mt-2 text-center text-sm text-muted-foreground">
          {isRecording && '正在聆听...点击停止'}
          {isProcessing && '正在思考...'}
          {isPlaying && '正在回复...'}
          {!isRecording && !isProcessing && !isPlaying && '点击麦克风开始对话'}
        </div>

        {/* VAD 指示器 */}
        {isRecording && (
          <div className="flex items-center justify-center mt-2 gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-1 rounded-full transition-all duration-100',
                  isSpeaking ? 'bg-green-500' : 'bg-gray-300',
                  isSpeaking ? 'h-4' : 'h-2'
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RealtimeChat;
