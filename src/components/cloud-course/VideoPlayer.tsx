'use client';

/**
 * 统一视频播放器组件
 * 
 * 功能：
 * - 自动检测视频格式（MP4/WebM/HLS）
 * - HLS 流媒体支持（通过 hls.js）
 * - 进度追踪（观看时长、当前进度）
 * - 断点续播（从上次位置继续）
 * - 自动保存进度回调
 * - 完成检测（观看 ≥90% 标记为完成）
 */

import { useRef, useEffect, useCallback, useState } from 'react';
import Hls from 'hls.js/dist/hls.js';

type VideoPlayerProps = {
  /** 视频URL */
  src: string;
  /** 上次观看位置（秒），用于断点续播 */
  initialTime?: number;
  /** 视频总时长（秒），用于进度计算 */
  duration?: number;
  /** 进度保存回调（每10秒或暂停时触发） */
  onProgressSave?: (data: { currentTime: number; watchDuration: number; progress: number }) => void;
  /** 观看完成回调（进度 ≥ 90%） */
  onComplete?: () => void;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 额外 className */
  className?: string;
};

export function VideoPlayer({
  src,
  initialTime = 0,
  duration = 0,
  onProgressSave,
  onComplete,
  autoPlay = false,
  className = '',
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watchDurationRef = useRef(0);
  const lastTimeUpdateRef = useRef<number>(Date.now());
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // 保存进度
  const saveProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onProgressSave) return;

    const currentTime = video.currentTime;
    const videoDuration = video.duration || duration;
    const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

    onProgressSave({
      currentTime,
      watchDuration: watchDurationRef.current,
      progress: Math.min(progress, 100),
    });

    // 完成检测
    if (progress >= 90 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    }
  }, [onProgressSave, onComplete, duration]);

  // 初始化播放器
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setLoading(true);
    hasCompletedRef.current = false;

    const isHLS = src.includes('.m3u8') || src.includes('m3u8');

    if (isHLS && Hls.isSupported()) {
      // HLS 流媒体
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
        if (autoPlay) {
          video.play().catch(() => {/* user gesture required */});
        }
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(`视频加载失败: ${data.type}`);
          hls.destroy();
        }
      });
    } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari 原生 HLS
      video.src = src;
      setLoading(false);
    } else {
      // 普通 MP4/WebM
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        if (initialTime > 0) {
          video.currentTime = initialTime;
        }
        if (autoPlay) {
          video.play().catch(() => {/* user gesture required */});
        }
      }, { once: true });
      video.addEventListener('error', () => {
        setError('视频加载失败，请检查链接是否有效');
      }, { once: true });
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, initialTime, autoPlay]);

  // 监听播放事件，累计观看时长
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => {
      lastTimeUpdateRef.current = Date.now();
    };

    const onTimeUpdate = () => {
      const now = Date.now();
      const delta = (now - lastTimeUpdateRef.current) / 1000;
      lastTimeUpdateRef.current = now;

      // 只在播放状态累计时长（允许最多2秒误差）
      if (!video.paused && delta > 0 && delta < 2) {
        watchDurationRef.current += delta;
      }
    };

    const onPause = () => {
      // 暂停时立即保存进度
      saveProgress();
    };

    video.addEventListener('play', onPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', onPause);
    };
  }, [saveProgress]);

  // 定时保存进度（每10秒）
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) {
        saveProgress();
      }
    }, 10000);

    return () => {
      if (saveTimerRef.current) {
        clearInterval(saveTimerRef.current);
      }
      // 页面卸载时保存最终进度
      saveProgress();
    };
  }, [saveProgress]);

  if (error) {
    return (
      <div className={`bg-muted rounded-lg flex flex-col items-center justify-center ${className}`}
        style={{ minHeight: '300px' }}>
        <div className="text-destructive text-sm mb-2">{error}</div>
        <div className="text-xs text-muted-foreground">请检查视频链接是否正确</div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-white/70 text-sm">加载视频中...</span>
          </div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        playsInline
        preload="metadata"
      />
    </div>
  );
}
