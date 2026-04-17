/**
 * 数学公式渲染组件
 *
 * 使用 KaTeX 官方 auto-render 扩展（renderMathInElement）渲染数学公式。
 *
 * 为什么不用自研 regex + dangerouslySetInnerHTML：
 * 1. 自研正则无法可靠提取公式边界（嵌套花括号、转义字符等）
 * 2. 占位符方案（%%FORMULA_N%%）在 edge case 下会被 escapeHtml 破坏
 * 3. dangerouslySetInnerHTML 与 React 水合存在冲突
 * 4. CSS 加载时序不可控
 *
 * auto-render 的优势：
 * - 字符级状态机解析公式边界（findEndOfMath），非简单正则
 * - 正确处理嵌套花括号、转义字符
 * - 支持 $...$、$$...$$、\(...\)、\[...\] 四种定界符
 * - 直接操作 DOM，不经过 React virtual DOM
 * - KaTeX 官方维护，久经考验
 *
 * 渲染流程：
 * 1. normalizeLatex 规范化 LLM 不规范输出
 * 2. 转义 HTML + 保留换行 → 设置 innerHTML
 * 3. renderMathInElement 扫描文本节点 → KaTeX 渲染公式
 */

'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';
import { normalizeLatex } from '@/lib/latex-normalize';

type MathContentProps = {
  /** 题目内容（支持 LaTeX 公式） */
  content: string;
  /** 图片URL（数学图形题） */
  imageUrl?: string;
  /** 图片说明 */
  imageAlt?: string;
  /** 额外 className */
  className?: string;
};

/** KaTeX auto-render 配置 */
const KATEX_RENDER_OPTIONS: renderMathInElement.RenderMathInElementOptions = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '\\(', right: '\\)', display: false },
    { left: '\\[', right: '\\]', display: true },
    // $ 必须放最后，避免匹配 $$ 的前半部分
    { left: '$', right: '$', display: false },
  ],
  throwOnError: false,
  strict: false,
  // 不忽略任何标签（我们的内容已转义，不存在 script/style 等）
  ignoredTags: [],
};

/**
 * HTML 转义（仅转义非公式部分的安全字符）
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 在 DOM 元素中渲染数学公式
 *
 * 流程：
 * 1. 将规范化后的文本转义 HTML 并保留换行
 * 2. 设置 innerHTML（浏览器解析为文本节点 + <br> 元素）
 * 3. renderMathInElement 扫描所有文本节点，查找公式定界符并渲染
 */
function renderMath(el: HTMLElement, normalizedText: string): void {
  // 设置 innerHTML：转义 HTML 实体，换行转 <br>
  el.innerHTML = escapeHtml(normalizedText).replace(/\n/g, '<br>');

  // KaTeX auto-render 扫描文本节点，渲染公式
  renderMathInElement(el, KATEX_RENDER_OPTIONS);
}

/**
 * 渲染包含数学公式的题目内容
 *
 * 使用方式：
 * - 行内公式：$x^2 + y^2 = r^2$
 * - 行间公式：$$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$
 * - 图片：传入 imageUrl 即可显示在内容上方
 */
export function MathContent({ content, imageUrl, imageAlt, className }: MathContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // 预规范化 LaTeX（处理 LLM 不规范输出）
  const normalized = useMemo(() => normalizeLatex(content), [content]);

  useEffect(() => {
    if (containerRef.current && normalized) {
      renderMath(containerRef.current, normalized);
    }
  }, [normalized]);

  return (
    <div className={className}>
      {/* 图片展示 */}
      {imageUrl && (
        <div className="mb-3">
          <img
            src={imageUrl}
            alt={imageAlt || '题目图片'}
            className="max-w-full max-h-[300px] rounded-lg border border-border object-contain"
            loading="lazy"
          />
        </div>
      )}

      {/* 数学公式渲染区域 */}
      <div
        ref={containerRef}
        className="math-content prose prose-sm max-w-none dark:prose-invert [&_.katex-display]:my-2 [&_.katex]:text-inherit"
      />
    </div>
  );
}

/**
 * 纯文本数学公式渲染（轻量版，用于卡片、Badge 等短文本场景）
 */
export function MathInline({ content }: { content: string }) {
  const spanRef = useRef<HTMLSpanElement>(null);

  const normalized = useMemo(() => normalizeLatex(content), [content]);

  useEffect(() => {
    if (spanRef.current && normalized) {
      renderMath(spanRef.current, normalized);
    }
  }, [normalized]);

  return (
    <span
      ref={spanRef}
      className="math-content inline [&_.katex]:text-inherit"
    />
  );
}
