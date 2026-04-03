'use client';

/**
 * 数字人童童组件
 * 
 * 功能：
 * - 显示童童形象（绿色植物头发、学士帽、粉色T恤、红领巾）
 * - 动态效果：呼吸浮动、说话抖动、状态光环
 * - 口型同步动画（说话时轻微缩放）
 * - 表情动画（根据情感变化装饰）
 */

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// 童童表情类型
export type TongtongEmotion = 'neutral' | 'happy' | 'sad' | 'surprised' | 'thinking' | 'concerned';

// 童童状态
export type TongtongState = 'idle' | 'listening' | 'speaking' | 'thinking';

type TongtongAvatarProps = {
  // 播放状态
  state?: TongtongState;
  // 当前情感
  emotion?: TongtongEmotion;
  // 是否显示动画
  animated?: boolean;
  // 尺寸
  size?: 'sm' | 'md' | 'lg' | 'xl';
  // 自定义类名
  className?: string;
  // 点击回调
  onClick?: () => void;
};

// 状态指示器配置
const STATE_CONFIG = {
  idle: { text: '我在这里', emoji: '🌱', color: 'bg-gradient-to-r from-green-400 to-emerald-500' },
  listening: { text: '正在倾听...', emoji: '👂', color: 'bg-gradient-to-r from-blue-400 to-cyan-500' },
  speaking: { text: '正在回复...', emoji: '💬', color: 'bg-gradient-to-r from-pink-400 to-rose-500' },
  thinking: { text: '让我想想...', emoji: '💭', color: 'bg-gradient-to-r from-amber-400 to-orange-500' },
};

// 表情装饰配置
const EMOTION_DECORATION = {
  neutral: null,
  happy: { emoji: '✨', position: 'top-right' },
  sad: { emoji: '💧', position: 'top-left' },
  surprised: { emoji: '❗', position: 'top-center' },
  thinking: { emoji: '💭', position: 'top-center' },
  concerned: { emoji: '🤗', position: 'top-center' },
};

export const TongtongAvatar: React.FC<TongtongAvatarProps> = ({
  state = 'idle',
  emotion = 'neutral',
  animated = true,
  size = 'lg',
  className,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [floatOffset, setFloatOffset] = useState(0);
  const [scale, setScale] = useState(1);

  // 尺寸配置
  const sizeConfig = {
    sm: { container: 'w-24 h-32', avatar: 'w-20 h-28', textSize: 'text-xs' },
    md: { container: 'w-36 h-44', avatar: 'w-32 h-40', textSize: 'text-sm' },
    lg: { container: 'w-48 h-60', avatar: 'w-44 h-56', textSize: 'text-base' },
    xl: { container: 'w-64 h-80', avatar: 'w-60 h-76', textSize: 'text-lg' },
  };

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isThinking = state === 'thinking';
  const stateConfig = STATE_CONFIG[state];
  const decoration = EMOTION_DECORATION[emotion];

  // 呼吸浮动动画
  useEffect(() => {
    if (!animated) return;

    let animationId: number;
    let startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      // 平滑的上下浮动
      const float = Math.sin(elapsed / 1500) * 6;
      setFloatOffset(float);

      // 说话时的缩放动画
      if (isSpeaking) {
        const speakScale = 1 + Math.sin(elapsed / 150) * 0.03;
        setScale(speakScale);
      } else {
        setScale(1);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [animated, isSpeaking]);

  return (
    <div 
      className={cn(
        'relative flex flex-col items-center',
        sizeConfig[size].container,
        className
      )}
      onClick={onClick}
    >
      {/* 背景光环效果 */}
      {(isSpeaking || isListening || isThinking) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div 
            className={cn(
              'absolute rounded-full opacity-20 animate-ping',
              isSpeaking && 'bg-gradient-to-r from-pink-300 to-rose-400',
              isListening && 'bg-gradient-to-r from-blue-300 to-cyan-400',
              isThinking && 'bg-gradient-to-r from-amber-300 to-orange-400',
              size === 'sm' && 'w-20 h-20',
              size === 'md' && 'w-32 h-32',
              size === 'lg' && 'w-44 h-44',
              size === 'xl' && 'w-60 h-60',
            )}
            style={{ animationDuration: '2s' }}
          />
          <div 
            className={cn(
              'absolute rounded-full opacity-30',
              isSpeaking && 'bg-gradient-to-r from-pink-200 to-rose-300',
              isListening && 'bg-gradient-to-r from-blue-200 to-cyan-300',
              isThinking && 'bg-gradient-to-r from-amber-200 to-orange-300',
              size === 'sm' && 'w-24 h-24',
              size === 'md' && 'w-36 h-36',
              size === 'lg' && 'w-48 h-48',
              size === 'xl' && 'w-64 h-64',
            )}
          />
        </div>
      )}

      {/* 童童形象容器 */}
      <div 
        ref={containerRef}
        className={cn(
          'relative transition-transform duration-200',
          sizeConfig[size].avatar,
          onClick && 'cursor-pointer hover:scale-105'
        )}
        style={{ 
          transform: `translateY(${floatOffset}px) scale(${scale})`,
        }}
      >
        {/* 童童形象图片 */}
        <div 
          className={cn(
            'w-full h-full bg-contain bg-center bg-no-repeat',
            'drop-shadow-lg',
            isSpeaking && 'animate-pulse',
          )}
          style={{ 
            backgroundImage: 'url(/tongtong-avatar.png)',
            filter: isSpeaking ? 'brightness(1.05)' : 'brightness(1)',
          }}
        />

        {/* 说话时的波纹效果 */}
        {isSpeaking && (
          <>
            <div 
              className="absolute inset-0 rounded-full border-2 border-pink-300/50 animate-ping"
              style={{ animationDuration: '1s' }}
            />
            <div 
              className="absolute inset-0 rounded-full border-2 border-pink-300/30 animate-ping"
              style={{ animationDuration: '1.5s', animationDelay: '0.3s' }}
            />
          </>
        )}
      </div>

      {/* 状态指示器 */}
      <div className={cn(
        'absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap z-10',
        sizeConfig[size].textSize
      )}>
        <span className={cn(
          'px-3 py-1 rounded-full text-white font-medium shadow-md',
          stateConfig.color,
          'backdrop-blur-sm',
        )}>
          {stateConfig.text}
        </span>
      </div>

      {/* 情感装饰 */}
      {decoration && (
        <div 
          className={cn(
            'absolute text-2xl animate-bounce',
            decoration.position === 'top-right' && 'top-0 right-0',
            decoration.position === 'top-left' && 'top-0 left-0',
            decoration.position === 'top-center' && 'top-0 left-1/2 -translate-x-1/2',
          )}
          style={{ animationDelay: '0.1s' }}
        >
          {decoration.emoji}
        </div>
      )}

      {/* 思考时的星星效果 */}
      {isThinking && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
          <span className="text-lg animate-ping" style={{ animationDelay: '0s' }}>⭐</span>
          <span className="text-lg animate-ping" style={{ animationDelay: '0.3s' }}>⭐</span>
          <span className="text-lg animate-ping" style={{ animationDelay: '0.6s' }}>⭐</span>
        </div>
      )}

      {/* 快乐时的闪光效果 */}
      {emotion === 'happy' && !isThinking && (
        <div className="absolute -top-2 -right-2">
          <span className="text-xl animate-spin" style={{ animationDuration: '3s' }}>✨</span>
        </div>
      )}
    </div>
  );
};

export default TongtongAvatar;
