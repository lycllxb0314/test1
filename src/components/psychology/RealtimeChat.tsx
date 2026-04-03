'use client';

/**
 * 实时视频对话组件
 * 
 * 真正的实时视频通话体验：
 * - 用户摄像头实时显示
 * - 说话时实时转写+回复+语音播放（并行处理）
 * - 童童同步显示回复动画
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TongtongAvatar, { type TongtongState } from './TongtongAvatar';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';

type RealtimeChatProps = {
  studentId: string;
  onCrisisDetected?: (keywords: string[]) => void;
  className?: string;
};

export const RealtimeChat: React.FC<RealtimeChatProps> = ({
  studentId,
  className,
}) => {
  // 通话状态
  const [isInCall, setIsInCall] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  
  // 对话状态
  const [sessionId, setSessionId] = useState<string>('');
  const [tongtongState, setTongtongState] = useState<TongtongState>('idle');
  const [responseText, setResponseText] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const processingRef = useRef(false);
  const speakingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // 初始化会话
  useEffect(() => {
    fetch('/api/psychology/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.session?.id) {
          setSessionId(data.data.session.id);
        }
      })
      .catch(console.error);
  }, [studentId]);

  // 清理
  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const stopAll = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
  };

  // 开始通话
  const startCall = async () => {
    try {
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: { echoCancellation: true, noiseSuppression: true },
      });

      streamRef.current = stream;
      
      // 立即设置视频
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsInCall(true);
      setIsMicEnabled(true);
      setIsCameraEnabled(true);

      // 设置音频分析
      setupAudioAnalysis(stream);
      
      // 开始录音
      startRecording(stream);

    } catch (err) {
      console.error('获取媒体失败:', err);
      setError('需要摄像头和麦克风权限');
    }
  };

  // 设置音频分析（VAD）
  const setupAudioAnalysis = (stream: MediaStream) => {
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);
    
    audioContextRef.current = ctx;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    
    const checkAudio = () => {
      if (!streamRef.current) return;
      
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      
      // 检测是否在说话
      if (avg > 30) {
        if (!speakingRef.current) {
          speakingRef.current = true;
        }
        // 重置静音计时器
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = null;
        }
      } else if (speakingRef.current && !silenceTimerRef.current) {
        // 静音800ms后处理
        silenceTimerRef.current = setTimeout(() => {
          if (speakingRef.current && !processingRef.current) {
            speakingRef.current = false;
            processAudio();
          }
        }, 800);
      }
      
      requestAnimationFrame(checkAudio);
    };
    
    requestAnimationFrame(checkAudio);
  };

  // 开始录音
  const startRecording = (stream: MediaStream) => {
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
      ? 'audio/webm;codecs=opus' 
      : 'audio/webm';
    
    const recorder = new MediaRecorder(stream, { mimeType });
    chunksRef.current = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    recorder.start(100);
    recorderRef.current = recorder;
  };

  // 处理音频
  const processAudio = async () => {
    if (!recorderRef.current || processingRef.current) return;
    
    // 停止当前录音
    recorderRef.current.stop();
    
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    chunksRef.current = [];
    
    if (blob.size < 3000) {
      // 太短，重新开始录音
      if (streamRef.current) startRecording(streamRef.current);
      return;
    }

    processingRef.current = true;
    setTongtongState('thinking');

    try {
      // 转base64
      const base64 = await blobToBase64(blob);
      
      // ASR
      const asrRes = await fetch('/api/psychology/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64, format: 'webm' }),
      });
      const asrData = await asrRes.json();
      
      if (!asrData.success || !asrData.data?.text?.trim()) {
        processingRef.current = false;
        setTongtongState('idle');
        if (streamRef.current) startRecording(streamRef.current);
        return;
      }

      const text = asrData.data.text.trim();
      
      // 立即开始LLM流式回复
      setTongtongState('speaking');
      setResponseText('');
      setIsResponding(true);
      
      const chatRes = await fetch('/api/psychology/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          studentId,
          message: text,
        }),
      });

      const reader = chatRes.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      // 流式读取并实时TTS
      const ttsQueue: string[] = [];
      let isTtsPlaying = false;

      const playNextTts = async () => {
        if (isTtsPlaying || ttsQueue.length === 0) return;
        isTtsPlaying = true;
        
        const textToSpeak = ttsQueue.shift()!;
        try {
          const ttsRes = await fetch('/api/psychology/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: textToSpeak, returnBase64: true }),
          });
          const ttsData = await ttsRes.json();
          
          if (ttsData.success && ttsData.audioData) {
            const audio = new Audio(ttsData.audioData);
            audioRef.current = audio;
            await audio.play();
            await new Promise<void>(r => { audio.onended = () => r(); });
          }
        } catch {}
        
        isTtsPlaying = false;
        if (ttsQueue.length > 0) playNextTts();
      };

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'text' && data.content) {
                fullResponse += data.content;
                setResponseText(fullResponse);
                
                // 每积累一定字数就播放TTS
                if (fullResponse.length > 0 && (fullResponse.endsWith('。') || fullResponse.endsWith('？') || fullResponse.endsWith('！') || fullResponse.endsWith('，'))) {
                  ttsQueue.push(fullResponse.slice(-10));
                  playNextTts();
                }
              }
            } catch {}
          }
        }
      }

      // 播放剩余内容
      if (fullResponse && ttsQueue.length === 0) {
        // 整段播放
        try {
          const ttsRes = await fetch('/api/psychology/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: fullResponse, returnBase64: true }),
          });
          const ttsData = await ttsRes.json();
          
          if (ttsData.success && ttsData.audioData) {
            const audio = new Audio(ttsData.audioData);
            audioRef.current = audio;
            await audio.play();
            await new Promise<void>(r => { audio.onended = () => r(); });
          }
        } catch {}
      }

      setIsResponding(false);
      setTongtongState('idle');
      processingRef.current = false;
      
      // 重新开始录音
      if (streamRef.current) startRecording(streamRef.current);

    } catch (err) {
      console.error('处理失败:', err);
      processingRef.current = false;
      setTongtongState('idle');
      if (streamRef.current) startRecording(streamRef.current);
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // 结束通话
  const endCall = () => {
    stopAll();
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsInCall(false);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !isMicEnabled);
      setIsMicEnabled(!isMicEnabled);
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.enabled = !isCameraEnabled);
      setIsCameraEnabled(!isCameraEnabled);
    }
  };

  // 未通话界面
  if (!isInCall) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full bg-gradient-to-b from-slate-900 to-slate-800', className)}>
        <TongtongAvatar state="idle" emotion="happy" size="xl" animated />
        <h2 className="text-2xl font-bold text-white mt-6 mb-2">童童哥哥在这里等你</h2>
        <p className="text-slate-400 mb-8">点击开始视频通话</p>
        {error && <p className="text-red-400 mb-4">{error}</p>}
        <Button
          onClick={startCall}
          className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600"
        >
          <Phone className="w-7 h-7" />
        </Button>
      </div>
    );
  }

  // 视频通话界面
  return (
    <div className={cn('relative h-full bg-black', className)}>
      {/* 背景 - 童童 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-slate-900">
        <TongtongAvatar state={tongtongState} emotion="neutral" size="xl" animated />
        
        {/* 回复文本 */}
        {responseText && (
          <div 
            className="absolute bottom-28 left-4 right-4 max-w-xl mx-auto px-4 py-3 rounded-xl backdrop-blur-md"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <p className="text-white text-base">{responseText}</p>
          </div>
        )}

        {/* 状态 */}
        <div 
          className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm text-white"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          {isResponding ? '💬 回复中...' : '🎤 请说话'}
        </div>
      </div>

      {/* 用户视频 - 画中画 */}
      <div className="absolute bottom-24 right-4 w-28 h-40 rounded-xl overflow-hidden border-2 border-white/20 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isCameraEnabled && (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <VideoOff className="w-6 h-6 text-slate-500" />
          </div>
        )}
        <div 
          className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded text-xs text-white"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          我
        </div>
      </div>

      {/* 控制栏 */}
      <div 
        className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
      >
        <Button
          onClick={toggleMic}
          className={cn(
            'w-12 h-12 rounded-full',
            isMicEnabled ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
          )}
        >
          {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </Button>

        <Button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white"
        >
          <PhoneOff className="w-6 h-6" />
        </Button>

        <Button
          onClick={toggleCamera}
          className={cn(
            'w-12 h-12 rounded-full',
            isCameraEnabled ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
          )}
        >
          {isCameraEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Button>
      </div>
    </div>
  );
};

export default RealtimeChat;
