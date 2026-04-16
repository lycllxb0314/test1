/**
 * 数学公式渲染组件
 *
 * 支持在题目内容中渲染 LaTeX 数学公式：
 * - 行内公式：$E=mc^2$
 * - 行间公式：$$\frac{1}{2}$$
 *
 * 同时支持图片展示（数学图形题）
 *
 * 实现方式：直接使用 katex 包渲染，不依赖 react-markdown/remark-math/rehype-katex
 * （避免 estree-util-is-identifier-name 与 Next.js 16 SWC 编译器的兼容性问题）
 */

'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

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

/**
 * 将含有 LaTeX 公式的文本转换为 HTML
 * - 行内公式：$x^2$ 或 \\(x^2\\)
 * - 行间公式：$$\frac{1}{2}$$ 或 \\[\frac{1}{2}\\]
 */
function renderLatexToHtml(text: string): string {
  if (!text) return '';

  // 先处理行间公式 $$...$$ 和 \[...\]
  let result = text;

  // 行间公式：$$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<span class="katex-error" style="color:#d32f2f">${escapeHtml(formula)}</span>`;
    }
  });

  // 行间公式：\[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula: string) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<span class="katex-error" style="color:#d32f2f">${escapeHtml(formula)}</span>`;
    }
  });

  // 行内公式：$...$（注意不要匹配货币符号，排除 $$ 后的单个 $）
  result = result.replace(/(?<!\$)\$(?!\$)([^\$\n]+?)\$(?!\$)/g, (_match, formula: string) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<span class="katex-error" style="color:#d32f2f">${escapeHtml(formula)}</span>`;
    }
  });

  // 行内公式：\(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula: string) => {
    try {
      return katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      });
    } catch {
      return `<span class="katex-error" style="color:#d32f2f">${escapeHtml(formula)}</span>`;
    }
  });

  // 处理换行
  result = result.replace(/\n/g, '<br/>');

  return result;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
  const renderedHtml = useMemo(() => renderLatexToHtml(content), [content]);

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

      {/* LaTeX 渲染内容 */}
      <div
        className="math-content prose prose-sm max-w-none dark:prose-invert [&_.katex-display]:my-2 [&_.katex]:text-inherit"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    </div>
  );
}

/**
 * 纯文本数学公式渲染（轻量版，用于卡片、Badge等短文本场景）
 */
export function MathInline({ content }: { content: string }) {
  const renderedHtml = useMemo(() => renderLatexToHtml(content), [content]);

  return (
    <span
      className="math-content inline [&_.katex]:text-inherit"
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}
