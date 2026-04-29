'use client';

/**
 * 统一视频播放器组件
 *
 * 支持多种视频来源：
 * 1. 直接视频文件（MP4/WebM/OGG）
 * 2. HLS 流媒体（.m3u8，通过 hls.js）
 * 3. Bilibili（bilibili.com / b23.tv）
 * 4. YouTube（youtube.com / youtu.be）
 * 5. 优酷（youku.com）
 * 6. 腾讯视频（v.qq.com）
 * 7. 其他 iframe 嵌入（自定义 embed URL）
 *
 * 对于 iframe 嵌入类视频，无法精确追踪播放进度，
 * 使用 postMessage 通信（B站支持）或手动确认完成。
 */

import { useRef, useEffect, useCallback, useState, memo } from 'react';
import Hls from 'hls.js/dist/hls.js';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ExternalLink, AlertCircle } from 'lucide-react';

/* ─── 视频类型检测 ─── */

const getHostname = (input: string): string => {
  try {
    return new URL(input).hostname.toLowerCase();
  } catch {
    try {
      return new URL(`https://${input}`).hostname.toLowerCase();
    } catch {
      return '';
    }
  }
};

const isHost = (hostname: string, baseDomain: string): boolean => {
  return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
};

export type VideoType = 'native' | 'hls' | 'bilibili' | 'youtube' | 'youku' | 'qq' | 'iframe';

type ParsedVideoInfo = {
  type: VideoType;
  src: string;           // 最终用于播放的 URL（iframe src 或视频直链）
  originalUrl: string;   // 用户输入的原始 URL
  platform?: string;     // 平台名称（中文）
};

function parseVideoUrl(url: string): ParsedVideoInfo {
  if (!url) return { type: 'native', src: '', originalUrl: '' };

  const lower = url.toLowerCase();

  // ── Bilibili ──
  // https://www.bilibili.com/video/BV1xxxxx
  // https://www.bilibili.com/video/av12345
  // https://b23.tv/xxxxx
  if (lower.includes('bilibili.com') || lower.includes('b23.tv')) {
    let embedSrc = '';

    // BV 号
    const bvMatch = url.match(/\/video\/(BV[a-zA-Z0-9]+)/i);
    if (bvMatch) {
      embedSrc = `https://player.bilibili.com/player.html?bvid=${bvMatch[1]}&autoplay=0&high_quality=1&danmaku=0`;
    }

    // AV 号
    if (!embedSrc) {
      const avMatch = url.match(/\/video\/av(\d+)/i);
      if (avMatch) {
        embedSrc = `https://player.bilibili.com/player.html?aid=${avMatch[1]}&autoplay=0&high_quality=1&danmaku=0`;
      }
    }

    // b23.tv 短链 — 直接用 iframe 加载，B站会重定向
    if (!embedSrc && lower.includes('b23.tv')) {
      embedSrc = url;
    }

    // 如果 URL 本身就是 player.bilibili.com
    if (!embedSrc && lower.includes('player.bilibili.com')) {
      embedSrc = url;
    }

    // 带分P参数: ?p=2
    const pMatch = url.match(/[?&]p=(\d+)/);
    if (embedSrc && pMatch) {
      embedSrc += `&page=${pMatch[1]}`;
    }

    return {
      type: 'bilibili',
      src: embedSrc || url,
      originalUrl: url,
      platform: 'Bilibili',
    };
  }

  // ── YouTube ──
  // https://www.youtube.com/watch?v=xxxxx
  // https://youtu.be/xxxxx
  // https://www.youtube.com/embed/xxxxx
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) {
    let videoId = '';

    const watchMatch = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) videoId = watchMatch[1];

    if (!videoId) {
      const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
      if (shortMatch) videoId = shortMatch[1];
    }

    if (!videoId) {
      const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
      if (embedMatch) videoId = embedMatch[1];
    }

    const embedSrc = videoId
      ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`
      : url;

    return {
      type: 'youtube',
      src: embedSrc,
      originalUrl: url,
      platform: 'YouTube',
    };
  }

  // ── 优酷 ──
  // https://v.youku.com/v_show/id_Xxxxxx.html
  const youkuHostname = getHostname(url);
  if (youkuHostname === 'youku.com' || youkuHostname.endsWith('.youku.com')) {
    const idMatch = url.match(/id_([a-zA-Z0-9=]+)/);
    const embedSrc = idMatch
      ? `https://player.youku.com/embed/${idMatch[1]}`
      : url;

    return {
      type: 'youku',
      src: embedSrc,
      originalUrl: url,
      platform: '优酷',
    };
  }

  // ── 腾讯视频 ──
  // https://v.qq.com/x/page/xxxxx.html
  // https://v.qq.com/x/cover/xxxxx/xxxxx.html
  const hostname = getHostname(url);
  if (isHost(hostname, 'v.qq.com')) {
    const vidMatch = url.match(/\/([a-zA-Z0-9]+)\.html/);
    const vid = vidMatch ? vidMatch[1] : '';
    const embedSrc = vid
      ? `https://v.qq.com/txp/iframe/player.html?vid=${vid}`
      : url;

    return {
      type: 'qq',
      src: embedSrc,
      originalUrl: url,
      platform: '腾讯视频',
    };
  }

  // ── HLS ──
  if (lower.includes('.m3u8') || lower.includes('m3u8')) {
    return { type: 'hls', src: url, originalUrl: url };
  }

  // ── 直链视频（MP4/WebM/OGG 等） ──
  return { type: 'native', src: url, originalUrl: url };
}

/* ─── 原生视频播放器（MP4/WebM/HLS） ─── */

type NativePlayerProps = {
  src: string;
  isHls: boolean;
  initialTime?: number;
  onProgressSave?: (data: { currentTime: number; watchDuration: number; progress: number }) => void;
  onComplete?: () => void;
  className?: string;
};

const NativeVideoPlayer = memo(function NativeVideoPlayer({
  src,
  isHls,
  initialTime = 0,
  onProgressSave,
  onComplete,
  className = '',
}: NativePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const watchDurationRef = useRef(0);
  const lastTimeUpdateRef = useRef<number>(Date.now());
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasCompletedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onProgressSave) return;

    const currentTime = video.currentTime;
    const videoDuration = video.duration || 0;
    const progress = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

    onProgressSave({
      currentTime,
      watchDuration: watchDurationRef.current,
      progress: Math.min(progress, 100),
    });

    if (progress >= 90 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    }
  }, [onProgressSave, onComplete]);

  // 初始化
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setError(null);
    setLoading(true);
    hasCompletedRef.current = false;

    if (isHls && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        if (initialTime > 0) video.currentTime = initialTime;
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setError(`视频加载失败: ${data.type}`);
          hls.destroy();
        }
      });
    } else if (isHls && video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      setLoading(false);
    } else {
      video.src = src;
      video.addEventListener('loadedmetadata', () => {
        setLoading(false);
        if (initialTime > 0) video.currentTime = initialTime;
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
  }, [src, isHls, initialTime]);

  // 播放事件
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => { lastTimeUpdateRef.current = Date.now(); };
    const onTimeUpdate = () => {
      const now = Date.now();
      const delta = (now - lastTimeUpdateRef.current) / 1000;
      lastTimeUpdateRef.current = now;
      if (!video.paused && delta > 0 && delta < 2) {
        watchDurationRef.current += delta;
      }
    };
    const onPause = () => { saveProgress(); };

    video.addEventListener('play', onPlay);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', onPause);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', onPause);
    };
  }, [saveProgress]);

  // 定时保存
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      const video = videoRef.current;
      if (video && !video.paused) saveProgress();
    }, 10000);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      saveProgress();
    };
  }, [saveProgress]);

  if (error) {
    return (
      <div className={`bg-muted rounded-lg flex flex-col items-center justify-center ${className}`} style={{ minHeight: '300px' }}>
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <div className="text-destructive text-sm mb-1">{error}</div>
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
      <video ref={videoRef} className="w-full h-full object-contain" controls playsInline preload="metadata" />
    </div>
  );
});

/* ─── Iframe 嵌入播放器（B站/YouTube/优酷/腾讯等） ─── */

type IframePlayerProps = {
  src: string;
  platform?: string;
  originalUrl: string;
  initialCompleted?: boolean;
  onComplete?: () => void;
  className?: string;
};

function IframeVideoPlayer({
  src,
  platform,
  originalUrl,
  initialCompleted = false,
  onComplete,
  className = '',
}: IframePlayerProps) {
  const [watchStarted, setWatchStarted] = useState(false);
  const [watchTimer, setWatchTimer] = useState(0);
  const [completed, setCompleted] = useState(initialCompleted);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 当外部 initialCompleted 变化（如切换回已完成章节）时同步状态
  useEffect(() => {
    setCompleted(initialCompleted);
  }, [initialCompleted]);

  // 监听 B站播放器的 postMessage
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      // B站播放器会发送播放状态消息
      if (e.data && typeof e.data === 'object') {
        if (e.data.type === 'playerStatus' || e.data.event === 'playerStatus') {
          setWatchStarted(true);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // 简易计时器：iframe 加载后开始计时，模拟观看进度（已完成章节不启动计时器）
  useEffect(() => {
    if (initialCompleted) return;
    timerRef.current = setInterval(() => {
      setWatchTimer(prev => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [initialCompleted]);

  // 自动标记完成（观看 5 分钟以上）
  useEffect(() => {
    if (watchTimer >= 300 && !completed) {
      setCompleted(true);
      onComplete?.();
    }
  }, [watchTimer, completed, onComplete]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* 平台标识 */}
      {platform && (
        <div className="absolute top-2 left-2 z-20 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded flex items-center gap-1">
          <ExternalLink className="h-3 w-3" />
          {platform}
        </div>
      )}

      {/* 观看计时 */}
      <div className="absolute top-2 right-2 z-20 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
        已观看 {formatTimer(watchTimer)}
      </div>

      {/* iframe 播放器 */}
      <iframe
        src={src}
        className="w-full h-full border-0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
        style={{ minHeight: '360px' }}
      />

      {/* 手动确认完成按钮（观看 1 分钟后显示） */}
      {watchTimer >= 60 && !completed && (
        <div className="absolute bottom-3 right-3 z-20">
          <Button
            size="sm"
            variant="secondary"
            className="shadow-lg text-xs"
            onClick={() => {
              setCompleted(true);
              onComplete?.();
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
            标记为已学完
          </Button>
        </div>
      )}

      {/* 已完成标识 */}
      {completed && (
        <div className="absolute bottom-3 right-3 z-20 bg-emerald-600/90 text-white text-xs px-2.5 py-1 rounded flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          已完成
        </div>
      )}

      {/* 原始链接（底部） */}
      <div className="absolute bottom-3 left-3 z-20">
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/50 hover:text-white/80 text-xs underline-offset-2 hover:underline transition-colors"
        >
          在{platform || '原平台'}打开 &rarr;
        </a>
      </div>
    </div>
  );
}

/* ─── 主组件：统一视频播放器 ─── */

type VideoPlayerProps = {
  /** 视频 URL（支持直链、B站、YouTube、优酷、腾讯视频等） */
  src: string;
  /** 上次观看位置（秒），用于断点续播（仅直链视频） */
  initialTime?: number;
  /** 视频总时长（秒），用于进度计算（仅直链视频） */
  duration?: number;
  /** 章节是否已完成（用于 iframe 视频 显示已完成标识） */
  initialCompleted?: boolean;
  /** 进度保存回调 */
  onProgressSave?: (data: { currentTime: number; watchDuration: number; progress: number }) => void;
  /** 观看完成回调 */
  onComplete?: () => void;
  /** 是否自动播放 */
  autoPlay?: boolean;
  /** 额外 className */
  className?: string;
};

export function VideoPlayer({
  src,
  initialTime = 0,
  duration,
  initialCompleted = false,
  onProgressSave,
  onComplete,
  autoPlay = false,
  className = '',
}: VideoPlayerProps) {
  const videoInfo = parseVideoUrl(src);

  if (!src) {
    return (
      <div className={`bg-muted rounded-lg flex items-center justify-center ${className}`} style={{ minHeight: '300px' }}>
        <p className="text-muted-foreground text-sm">暂无视频内容</p>
      </div>
    );
  }

  // iframe 嵌入类视频
  if (videoInfo.type !== 'native' && videoInfo.type !== 'hls') {
    return (
      <IframeVideoPlayer
        src={videoInfo.src}
        platform={videoInfo.platform}
        originalUrl={videoInfo.originalUrl}
        initialCompleted={initialCompleted}
        onComplete={onComplete}
        className={className}
      />
    );
  }

  // 直链视频（MP4/WebM/HLS）
  return (
    <NativeVideoPlayer
      src={videoInfo.src}
      isHls={videoInfo.type === 'hls'}
      initialTime={initialTime}
      onProgressSave={onProgressSave}
      onComplete={onComplete}
      className={className}
    />
  );
}

/* ─── 导出 URL 解析工具函数 ─── */

export { parseVideoUrl };
export type { ParsedVideoInfo };
