'use client';

/**
 * 全局水印组件
 * 
 * 功能：
 * - 在页面背景显示半透明水印
 * - 内容：用户姓名 + @福建省龙岩师范附小
 * - 防截图泄密、可溯源
 * - 使用CSS pointer-events确保不影响页面交互
 */

import React, { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WatermarkProps {
  /** 水印文字，默认使用当前用户姓名 */
  text?: string;
  /** 水印透明度，默认0.08 */
  opacity?: number;
  /** 字体大小，默认14px */
  fontSize?: number;
  /** 旋转角度，默认-22度 */
  rotate?: number;
  /** 间距，默认100px */
  gap?: number;
  /** 是否显示水印，默认true */
  visible?: boolean;
}

export default function Watermark({
  text,
  opacity = 0.06,
  fontSize = 16,
  rotate = -22,
  gap = 200,
  visible = true,
}: WatermarkProps) {
  const { user } = useAuth();
  
  // 生成水印文字
  const watermarkText = useMemo(() => {
    if (text) return text;
    if (!user?.name) return '';
    return `${user.name}@福建省龙岩师范附小`;
  }, [text, user?.name]);
  
  // 不显示条件
  if (!visible || !watermarkText) {
    return null;
  }
  
  // 使用SVG生成水印图案
  const svgText = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${gap * 2}" height="${gap * 2}">
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${fontSize}"
        font-family="system-ui, sans-serif"
        fill="rgba(0, 0, 0, ${opacity})"
        transform="rotate(${rotate}, ${gap}, ${gap})"
      >
        ${watermarkText}
      </text>
    </svg>
  `;
  
  // 转换为base64
  const encodedSvg = encodeURIComponent(svgText.trim());
  const backgroundImage = `url("data:image/svg+xml,${encodedSvg}")`;
  
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        backgroundImage,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
      }}
      aria-hidden="true"
    />
  );
}

/**
 * 服务端渲染的水印组件（不依赖useAuth）
 * 用于需要服务端渲染的场景
 */
export function WatermarkSSR({
  text,
  opacity = 0.08,
  fontSize = 14,
  rotate = -22,
  gap = 100,
  visible = true,
}: WatermarkProps) {
  // 不显示条件
  if (!visible || !text) {
    return null;
  }
  
  // 使用SVG生成水印图案
  const svgText = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${gap * 2}" height="${gap * 2}">
      <text
        x="50%"
        y="50%"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="${fontSize}"
        font-family="system-ui, sans-serif"
        fill="rgba(0, 0, 0, ${opacity})"
        transform="rotate(${rotate}, ${gap}, ${gap})"
      >
        ${text}
      </text>
    </svg>
  `;
  
  // 转换为base64
  const encodedSvg = encodeURIComponent(svgText.trim());
  const backgroundImage = `url("data:image/svg+xml,${encodedSvg}")`;
  
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{
        backgroundImage,
        backgroundRepeat: 'repeat',
        backgroundPosition: 'center',
      }}
      aria-hidden="true"
    />
  );
}
