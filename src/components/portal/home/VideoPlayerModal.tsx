'use client';

import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import type { CarouselItem } from './types';

export type VideoPlayerModalProps = {
  video: CarouselItem | null;
  onClose: () => void;
};

/**
 * VideoPlayerModal — 视频播放弹窗
 *
 * 支持 B站 iframe 和自托管 video 两种模式。
 */
export function VideoPlayerModal({ video, onClose }: VideoPlayerModalProps) {
  if (!video) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl mx-4 bg-black rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition"
        >
          <X className="h-6 w-6" />
        </button>

        {/* 视频标题 + B站高清链接 */}
        <div className="absolute top-4 left-4 right-16 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {video.tag && (
              <span className="text-xs bg-[#C9A96E] text-[#5C4A3A] px-2 py-1 rounded-full">
                {video.tag}
              </span>
            )}
            <span className="text-white font-medium">{video.title}</span>
          </div>

          {/* B站高清观看按钮 */}
          {video.type === 'bilibili' && video.bilibiliBvid && (
            <a
              href={`https://www.bilibili.com/video/${video.bilibiliBvid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#FB7299] hover:bg-[#E85D87] text-white px-3 py-1.5 rounded-lg transition text-xs font-medium"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              B站高清
            </a>
          )}
        </div>

        {/* B站视频播放器 */}
        {video.type === 'bilibili' && video.bilibiliUrl && (
          <iframe
            src={video.bilibiliUrl}
            className="w-full aspect-video"
            scrolling="no"
            frameBorder="no"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        )}

        {/* 自托管视频播放器 */}
        {video.type === 'video' && video.videoUrl && (
          <video
            src={video.videoUrl}
            controls
            autoPlay
            className="w-full aspect-video"
            poster={video.image}
          >
            您的浏览器不支持视频播放
          </video>
        )}
      </div>
    </div>
  );
}
