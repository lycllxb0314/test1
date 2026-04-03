'use client';

/**
 * 实时视频对话组件
 * 
 * 真正的实时体验：
 * - 用户视频正常显示
 * - 说完话立即响应
 * - 不会自言自语
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import TongtongAvatar, { type TongtongState } from './TongtongAvatar';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Phone } from 'lucide-react';

type RealtimeChatProps = {
  studentId: string;
  className?: string;
};

export const RealtimeChat: React.FC<RealtimeChatProps> = ({ studentId, className }) => {
  // 状态
  const [isInCall, setIsInCall] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [sessionId, setSessionId] = useState('');
  const [tongtongState, setTongtongState] = useState<TongtongState>('idle');
  const [responseText, setResponseText] = useState('');
  const [status, setStatus] = useState('点击开始通话');
  const [error, setError] = useState('');

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const isProcessingRef = useRef(false);
  const isPlayingRef = useRef(false);

  // 初始化会话
  useEffect(() => {
    fetch('/api/psychology/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId }),
    })
      .then(r => r.json())
      .then(d => d.success && setSessionId(d.data?.session?.id || ''))
      .catch(() => {});
  }, [studentId]);

  // 清理
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      audioContextRef.current?.close();
    };
  }, []);

  // 开始通话
  const startCall = async () => {
    try {
      setError('');
      setStatus('正在获取权限...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: true,
      });

      streamRef.current = stream;

      // 立即设置视频 - 关键！
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        try {
          await video.play();
        } catch (e) {
          console.error('视频播放失败:', e);
        }
      }

      setIsInCall(true);
      setIsMicOn(true);
      setIsCameraOn(true);
      setStatus('请说话');

      // 设置VAD（但不录音，等用户说话才录）
      setupVAD(stream);

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '获取权限失败';
      setError(msg);
      setStatus('权限被拒绝');
    }
  };

  // VAD - 只检测是否在说话
  const setupVAD = (stream: MediaStream) => {
    try {
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);
      
      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      let speaking = false;
      let silenceTimer: NodeJS.Timeout | null = null;
      let recordTimer: NodeJS.Timeout | null = null;

      const check = () => {
        if (!streamRef.current) return;
        
        analyser.getByteFrequencyData(data);
        const vol = data.reduce((a, b) => a + b, 0) / data.length;

        // 正在播放TTS时不处理
        if (isPlayingRef.current || isProcessingRef.current) {
          requestAnimationFrame(check);
          return;
        }

        if (vol > 35) {
          if (!speaking) {
            speaking = true;
            setStatus('正在听...');
            // 开始录音
            startRecording(stream);
            // 最多录10秒
            recordTimer = setTimeout(() => {
              if (speaking) {
                speaking = false;
                processAudio();
              }
            }, 10000);
          }
          if (silenceTimer) {
            clearTimeout(silenceTimer);
            silenceTimer = null;
          }
        } else if (speaking) {
          if (!silenceTimer) {
            silenceTimer = setTimeout(() => {
              speaking = false;
              if (recordTimer) clearTimeout(recordTimer);
              processAudio();
            }, 1000); // 1秒静音
          }
        }

        requestAnimationFrame(check);
      };

      requestAnimationFrame(check);
    } catch (e) {
      console.error('VAD setup error:', e);
    }
  };

  // 开始录音
  const startRecording = (stream: MediaStream) => {
    chunksRef.current = [];
    
    let mimeType = '';
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/webm')) {
      mimeType = 'audio/webm';
    }

    const recorder = mimeType 
      ? new MediaRecorder(stream, { mimeType }) 
      : new MediaRecorder(stream);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.start(100);
    recorderRef.current = recorder;
  };

  // 处理音频
  const processAudio = async () => {
    if (isProcessingRef.current) return;
    
    const recorder = recorderRef.current;
    if (recorder && recorder.state === 'recording') {
      recorder.stop();
    }

    // 等数据收集
    await new Promise(r => setTimeout(r, 200));

    const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
    chunksRef.current = [];

    // 太短忽略
    if (blob.size < 3000) {
      setStatus('请说话');
      return;
    }

    isProcessingRef.current = true;
    setTongtongState('thinking');
    setStatus('思考中...');

    try {
      // ASR
      const base64 = await blobToBase64(blob);
      const asrRes = await fetch('/api/psychology/asr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audioData: base64, format: 'webm' }),
      });
      const asrData = await asrRes.json();

      if (!asrData.success || !asrData.data?.text?.trim()) {
        setStatus('没听清，请再说');
        isProcessingRef.current = false;
        setTongtongState('idle');
        return;
      }

      const text = asrData.data.text.trim();
      setStatus('');

      // LLM + TTS 并行
      setTongtongState('speaking');
      setResponseText('');

      const chatRes = await fetch('/api/psychology/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, studentId, message: text }),
      });

      const reader = chatRes.body?.getReader();
      if (!reader) throw new Error('无法读取');

      const decoder = new TextDecoder();
      let response = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.type === 'text' && d.content) {
                response += d.content;
                setResponseText(response);
              }
            } catch {}
          }
        }
      }

      // 播放TTS
      if (response) {
        isPlayingRef.current = true;
        const ttsRes = await fetch('/api/psychology/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: response, returnBase64: true }),
        });
        const ttsData = await ttsRes.json();

        if (ttsData.success && ttsData.audioData) {
          const audio = new Audio(ttsData.audioData);
          audioRef.current = audio;
          await audio.play();
          await new Promise<void>(r => { audio.onended = () => { isPlayingRef.current = false; r(); }; });
        }
        isPlayingRef.current = false;
      }

      setTongtongState('idle');
      setStatus('请说话');

    } catch (err) {
      console.error('Error:', err);
      setStatus('出错了，请重试');
      setTongtongState('idle');
    } finally {
      isProcessingRef.current = false;
    }
  };

  const blobToBase64 = (blob: Blob): Promise<string> => 
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  // 结束通话
  const endCall = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    audioContextRef.current?.close();
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsInCall(false);
    setTongtongState('idle');
  };

  const toggleMic = () => {
    const tracks = streamRef.current?.getAudioTracks() || [];
    tracks.forEach(t => t.enabled = !isMicOn);
    setIsMicOn(!isMicOn);
  };

  const toggleCamera = () => {
    const tracks = streamRef.current?.getVideoTracks() || [];
    tracks.forEach(t => t.enabled = !isCameraOn);
    setIsCameraOn(!isCameraOn);
  };

  // 未通话
  if (!isInCall) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full bg-slate-900', className)}>
        <TongtongAvatar state="idle" emotion="happy" size="xl" />
        <h2 className="text-xl text-white mt-6 mb-2">童童哥哥在这里等你</h2>
        {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
        <Button onClick={startCall} className="w-14 h-14 rounded-full bg-green-500 hover:bg-green-600">
          <Phone className="w-6 h-6" />
        </Button>
        <p className="text-slate-400 text-sm mt-3">{status}</p>
      </div>
    );
  }

  // 视频通话
  return (
    <div className={cn('relative h-full bg-black', className)}>
      {/* 童童背景 */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-blue-900 to-slate-900">
        <TongtongAvatar state={tongtongState} emotion="neutral" size="xl" />
        
        {responseText && (
          <div className="absolute bottom-24 left-4 right-4 px-4 py-3 rounded-xl bg-black/60 backdrop-blur">
            <p className="text-white text-sm leading-relaxed">{responseText}</p>
          </div>
        )}

        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm">
          {status || '通话中'}
        </div>
      </div>

      {/* 用户视频 */}
      <div className="absolute bottom-20 right-3 w-24 h-32 rounded-lg overflow-hidden border border-white/20 bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {!isCameraOn && (
          <div className="absolute inset-0 bg-slate-800 flex items-center justify-center">
            <VideoOff className="w-5 h-5 text-slate-500" />
          </div>
        )}
      </div>

      {/* 控制 */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center gap-3 bg-black/30">
        <Button onClick={toggleMic} className={`w-11 h-11 rounded-full ${isMicOn ? 'bg-white/20' : 'bg-red-500'}`}>
          {isMicOn ? <Mic className="w-5 h-5 text-white" /> : <MicOff className="w-5 h-5 text-white" />}
        </Button>
        <Button onClick={endCall} className="w-12 h-12 rounded-full bg-red-500 hover:bg-red-600">
          <PhoneOff className="w-5 h-5 text-white" />
        </Button>
        <Button onClick={toggleCamera} className={`w-11 h-11 rounded-full ${isCameraOn ? 'bg-white/20' : 'bg-red-500'}`}>
          {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
        </Button>
      </div>
    </div>
  );
};

export default RealtimeChat;
