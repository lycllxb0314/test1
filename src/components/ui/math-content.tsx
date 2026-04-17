/**
 * 数学公式渲染组件
 *
 * 使用 KaTeX renderToString + dangerouslySetInnerHTML 渲染数学公式。
 *
 * 渲染流程：
 * 1. normalizeLatex 规范化 LLM 不规范输出
 * 2. 用占位符保护公式 → escapeHtml 非公式部分 → 还原占位符
 * 3. 通过 dangerouslySetInnerHTML 展示
 *
 * 与 auto-render 方案对比：
 * - auto-render 需要操作 DOM（useRef + useEffect），在 Next.js SSR/hydration 中
 *   容易出现时序问题，导致页面白屏
 * - renderToString 是纯函数，不依赖 DOM，SSR/CSR 一致性好
 */

'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { normalizeLatex } from '@/lib/latex-normalize';

type MathContentProps = {
  content: string;
  imageUrl?: string;
  imageAlt?: string;
  className?: string;
};

/**
 * 修复常见 LaTeX 语法问题（KaTeX 渲染失败时使用）
 */
function repairLatex(formula: string): string {
  let r = formula;
  r = r.replace(/\\dfrac/g, '\\frac');
  r = r.replace(/\\frac(\d)(\d)/g, '\\frac{$1}{$2}');
  r = r.replace(/\\frac(\d)\{/g, '\\frac{$1}{');
  r = r.replace(/\\frac\{(\d+)\}(\d)/g, '\\frac{$1}{$2}');
  r = r.replace(/\\frac\s+\{/g, '\\frac{');
  // 补充未闭合的花括号
  const opens = (r.match(/\{/g) || []).length;
  const closes = (r.match(/\}/g) || []).length;
  if (opens > closes) r += '}'.repeat(opens - closes);
  return r;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * 用 KaTeX 渲染单个公式，返回 HTML 字符串
 */
function renderFormula(formula: string, displayMode: boolean): string {
  const trimmed = formula.trim();
  try {
    return katex.renderToString(trimmed, { displayMode, throwOnError: false, strict: false });
  } catch {
    // 失败后尝试修复
    try {
      const repaired = repairLatex(trimmed);
      return katex.renderToString(repaired, { displayMode, throwOnError: false, strict: false });
    } catch {
      return `<span style="color:#d32f2f">${escapeHtml(trimmed)}</span>`;
    }
  }
}

/**
 * 将含有 LaTeX 公式的文本转换为 HTML
 */
function renderLatexToHtml(text: string): string {
  if (!text) return '';

  const normalized = normalizeLatex(text);
  const formulas: string[] = [];
  let result = normalized;

  // 提取行间公式 $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
    const idx = formulas.length;
    formulas.push(renderFormula(formula, true));
    return `\x00F${idx}\x00`;
  });

  // 提取行内公式 $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_match, formula: string) => {
    const idx = formulas.length;
    formulas.push(renderFormula(formula, false));
    return `\x00F${idx}\x00`;
  });

  // 提取 \(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula: string) => {
    const idx = formulas.length;
    formulas.push(renderFormula(formula, false));
    return `\x00F${idx}\x00`;
  });

  // 提取 \[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula: string) => {
    const idx = formulas.length;
    formulas.push(renderFormula(formula, true));
    return `\x00F${idx}\x00`;
  });

  // 转义非公式部分
  result = escapeHtml(result);

  // 还原公式占位符
  result = result.replace(/\x00F(\d+)\x00/g, (_match, idx: string) => {
    return formulas[parseInt(idx)] || '';
  });

  // 换行
  result = result.replace(/\n/g, '<br/>');

  return result;
}

/**
 * 渲染包含数学公式的题目内容
 */
export function MathContent({ content, imageUrl, imageAlt, className }: MathContentProps) {
  const html = useMemo(() => renderLatexToHtml(content), [content]);

  return (
    <div className={className}>
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
      <div
        className="math-content prose prose-sm max-w-none dark:prose-invert [&_.katex-display]:my-2 [&_.katex]:text-inherit"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

/**
 * 纯文本数学公式渲染（轻量版，用于卡片、Badge 等短文本场景）
 */
export function MathInline({ content }: { content: string }) {
  const html = useMemo(() => renderLatexToHtml(content), [content]);

  return (
    <span
      className="math-content inline [&_.katex]:text-inherit"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
