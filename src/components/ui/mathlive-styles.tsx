'use client';

import { useEffect } from 'react';

/**
 * 动态注入 MathLive CSS 样式表
 *
 * MathLive 的渲染需要 mathlive-static.css 和 mathlive-fonts.css。
 * 由于 Next.js App Router 不支持在 layout 中直接使用 <head> 标签，
 * 通过客户端动态注入避免 hydration mismatch。
 */
export function MathLiveStyles() {
  useEffect(() => {
    const existingStatic = document.querySelector('link[data-mathlive-static]');
    const existingFonts = document.querySelector('link[data-mathlive-fonts]');
    if (existingStatic && existingFonts) return;

    if (!existingStatic) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/mathlive@0.109.1/mathlive-static.css';
      link.setAttribute('data-mathlive-static', 'true');
      document.head.appendChild(link);
    }

    if (!existingFonts) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/mathlive@0.109.1/mathlive-fonts.css';
      link.setAttribute('data-mathlive-fonts', 'true');
      document.head.appendChild(link);
    }
  }, []);

  return null;
}
