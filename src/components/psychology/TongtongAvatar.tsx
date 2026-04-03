'use client';

/**
 * 数字人童童组件
 * 
 * 功能：
 * - 显示童童形象
 * - 口型同步动画（说话时嘴巴动画）
 * - 表情动画（根据情感变化）
 * - 播放状态控制
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
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

// 眼睛眨眼动画
const BlinkingEyes: React.FC<{ emotion: TongtongEmotion }> = ({ emotion }) => {
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    // 随机眨眼
    const blinkInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        setIsBlinking(true);
        setTimeout(() => setIsBlinking(false), 150);
      }
    }, 2000);

    return () => clearInterval(blinkInterval);
  }, []);

  // 根据情感调整眼睛
  const getEyeStyle = () => {
    switch (emotion) {
      case 'happy':
        return 'animate-pulse';
      case 'sad':
        return 'opacity-80';
      case 'surprised':
        return 'scale-125';
      case 'thinking':
        return 'animate-pulse';
      default:
        return '';
    }
  };

  return (
    <div className={cn(
      'absolute flex gap-4 transition-all duration-200',
      getEyeStyle(),
      isBlinking && 'opacity-0'
    )}>
      {/* 左眼 */}
      <div className="w-4 h-5 bg-primary rounded-full" />
      {/* 右眼 */}
      <div className="w-4 h-5 bg-primary rounded-full" />
    </div>
  );
};

// 嘴巴动画（说话时）
const SpeakingMouth: React.FC<{ 
  isSpeaking: boolean;
  emotion: TongtongEmotion;
}> = ({ isSpeaking, emotion }) => {
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    if (isSpeaking) {
      // 模拟说话时嘴巴开合
      const interval = setInterval(() => {
        setMouthOpen(prev => !prev);
      }, 100 + Math.random() * 100);

      return () => clearInterval(interval);
    } else {
      setMouthOpen(false);
    }
  }, [isSpeaking]);

  // 根据情感调整嘴巴形状
  const getMouthStyle = () => {
    if (isSpeaking) {
      return mouthOpen ? 'h-4 w-6 rounded-full' : 'h-2 w-6 rounded-full';
    }
    
    switch (emotion) {
      case 'happy':
        return 'h-3 w-6 rounded-b-full';
      case 'sad':
        return 'h-2 w-6 rounded-t-full';
      case 'surprised':
        return 'h-4 w-4 rounded-full';
      default:
        return 'h-2 w-4 rounded-full';
    }
  };

  return (
    <div className={cn(
      'bg-primary/80 transition-all duration-100',
      getMouthStyle()
    )} />
  );
};

// 状态指示器
const StateIndicator: React.FC<{ 
  state: TongtongState;
}> = ({ state }) => {
  const indicators = {
    idle: { text: '我在这里', color: 'bg-muted' },
    listening: { text: '正在倾听...', color: 'bg-blue-500 animate-pulse' },
    speaking: { text: '正在回复...', color: 'bg-green-500 animate-pulse' },
    thinking: { text: '让我想想...', color: 'bg-yellow-500 animate-pulse' },
  };

  const indicator = indicators[state];

  return (
    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
      <span className={cn(
        'px-3 py-1 rounded-full text-xs text-white',
        indicator.color
      )}>
        {indicator.text}
      </span>
    </div>
  );
};

// 主组件
export const TongtongAvatar: React.FC<TongtongAvatarProps> = ({
  state = 'idle',
  emotion = 'neutral',
  animated = true,
  size = 'lg',
  className,
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // 尺寸配置
  const sizeConfig = {
    sm: { container: 'w-24 h-24', avatar: 'w-20 h-20' },
    md: { container: 'w-32 h-32', avatar: 'w-28 h-28' },
    lg: { container: 'w-48 h-48', avatar: 'w-40 h-40' },
    xl: { container: 'w-64 h-64', avatar: 'w-56 h-56' },
  };

  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';

  // 头部微动动画
  useEffect(() => {
    if (!animated || !containerRef.current) return;

    const container = containerRef.current;
    
    // 轻微晃动效果
    const wobble = () => {
      const rotate = Math.sin(Date.now() / 1000) * 2;
      container.style.transform = `rotate(${rotate}deg)`;
      requestAnimationFrame(wobble);
    };

    const animationId = requestAnimationFrame(wobble);
    return () => cancelAnimationFrame(animationId);
  }, [animated]);

  return (
    <div 
      className={cn(
        'relative flex items-center justify-center',
        sizeConfig[size].container,
        className
      )}
      onClick={onClick}
    >
      {/* 光环效果 */}
      {(isSpeaking || isListening) && (
        <div className={cn(
          'absolute inset-0 rounded-full',
          'bg-gradient-to-r from-blue-400/20 to-green-400/20',
          'animate-ping'
        )} />
      )}

      {/* 头像容器 */}
      <div 
        ref={containerRef}
        className={cn(
          'relative rounded-full overflow-hidden',
          'bg-gradient-to-b from-blue-100 to-purple-100',
          'border-4 border-white shadow-lg',
          sizeConfig[size].avatar,
          'transition-transform duration-300',
          isSpeaking && 'scale-105',
          onClick && 'cursor-pointer hover:scale-110'
        )}
      >
        {/* 使用项目已有的童童头像图片 */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/tongtong-avatar.png)' }}
        />

        {/* 如果图片不存在，显示备用卡通头像 */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-amber-100 to-orange-100">
          {/* 脸部 */}
          <div className="relative flex flex-col items-center pt-8">
            {/* 眼睛区域 */}
            <div className="relative mb-4">
              <BlinkingEyes emotion={emotion} />
            </div>
            
            {/* 腮红 */}
            <div className="absolute -left-6 top-2 w-4 h-2 bg-pink-300 rounded-full opacity-50" />
            <div className="absolute -right-6 top-2 w-4 h-2 bg-pink-300 rounded-full opacity-50" />
            
            {/* 嘴巴 */}
            <div className="mt-2">
              <SpeakingMouth isSpeaking={isSpeaking} emotion={emotion} />
            </div>
          </div>
        </div>
      </div>

      {/* 状态指示器 */}
      <StateIndicator state={state} />

      {/* 情感装饰 */}
      {emotion === 'happy' && (
        <div className="absolute -top-2 -right-2 text-2xl animate-bounce">
          ✨
        </div>
      )}
      {emotion === 'thinking' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl animate-bounce">
          💭
        </div>
      )}
      {emotion === 'concerned' && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xl">
          🤗
        </div>
      )}
    </div>
  );
};

export default TongtongAvatar;
