/**
 * 数学公式渲染组件
 *
 * 支持在题目内容中渲染 LaTeX 数学公式：
 * - 行内公式：$E=mc^2$
 * - 行间公式：$$\frac{1}{2}$$
 *
 * 同时支持图片展示（数学图形题）
 *
 * 实现方式：
 * 1. 先用 normalizeLatex 规范化 LLM 不规范输出
 * 2. 再用 KaTeX 渲染公式为 HTML
 * 3. 通过 dangerouslySetInnerHTML 展示
 */

'use client';

import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
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

/**
 * 修复常见 LaTeX 语法问题（KaTeX 渲染失败时使用）
 */
function repairLatex(formula: string): string {
  let repaired = formula;

  // \dfrac → \frac
  repaired = repaired.replace(/\\dfrac/g, '\\frac');

  // \frac 后缺少花括号：\frac12 → \frac{1}{2}
  repaired = repaired.replace(/\\frac(\d)(\d)/g, '\\frac{$1}{$2}');

  // \frac 后缺少花括号：\frac1{2} → \frac{1}{2}
  repaired = repaired.replace(/\\frac(\d)\{/g, '\\frac{$1}{');
  repaired = repaired.replace(/\\frac\{(\d+)\}(\d)/g, '\\frac{$1}{$2}');

  // 去除多余空格
  repaired = repaired.replace(/\\frac\s+\{/g, '\\frac{');

  // 未闭合的花括号：补充
  const openCount = (repaired.match(/\{/g) || []).length;
  const closeCount = (repaired.match(/\}/g) || []).length;
  if (openCount > closeCount) {
    repaired += '}'.repeat(openCount - closeCount);
  }

  return repaired;
}

/**
 * 将含有 LaTeX 公式的文本转换为 HTML
 *
 * 渲染流程：
 * 1. normalizeLatex 规范化（处理裸命令、括号分数等）
 * 2. 提取公式占位符（避免 escapeHtml 破坏公式）
 * 3. KaTeX 渲染（失败时自动 repairLatex 重试）
 * 4. 非公式部分 HTML 转义
 * 5. 还原占位符
 */
function renderLatexToHtml(text: string): string {
  if (!text) return '';

  // Step 1: 规范化 LaTeX（处理 LLM 不规范输出）
  const normalized = normalizeLatex(text);

  // Step 2: 提取所有公式，用占位符替换
  const formulas: string[] = [];
  let result = normalized;

  // 提取行间公式 $$...$$（规范化后通常不存在，但保留安全处理）
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
    const idx = formulas.length;
    try {
      formulas.push(katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      }));
    } catch {
      formulas.push(`<span class="katex-error" style="color:#d32f2f">${escapeHtml(formula.trim())}</span>`);
    }
    return `%%FORMULA_${idx}%%`;
  });

  // 提取行内公式 $...$
  result = result.replace(/\$([^$\n]+?)\$/g, (_match, formula: string) => {
    const idx = formulas.length;
    try {
      formulas.push(katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      }));
    } catch {
      // KaTeX 渲染失败，尝试修复后重试
      const repaired = repairLatex(formula.trim());
      try {
        formulas.push(katex.renderToString(repaired, {
          displayMode: false,
          throwOnError: false,
          strict: false,
        }));
      } catch {
        formulas.push(`<span class="katex-error" style="color:#d32f2f">${escapeHtml(formula.trim())}</span>`);
      }
    }
    return `%%FORMULA_${idx}%%`;
  });

  // 提取行内公式：\(...\)
  result = result.replace(/\\\(([\s\S]*?)\\\)/g, (_match, formula: string) => {
    const idx = formulas.length;
    try {
      formulas.push(katex.renderToString(formula.trim(), {
        displayMode: false,
        throwOnError: false,
        strict: false,
      }));
    } catch {
      const repaired = repairLatex(formula.trim());
      try {
        formulas.push(katex.renderToString(repaired, {
          displayMode: false,
          throwOnError: false,
          strict: false,
        }));
      } catch {
        formulas.push(`<span class="katex-error" style="color:#d32f2f">${escapeHtml(formula.trim())}</span>`);
      }
    }
    return `%%FORMULA_${idx}%%`;
  });

  // 提取行间公式：\[...\]
  result = result.replace(/\\\[([\s\S]*?)\\\]/g, (_match, formula: string) => {
    const idx = formulas.length;
    try {
      formulas.push(katex.renderToString(formula.trim(), {
        displayMode: true,
        throwOnError: false,
        strict: false,
      }));
    } catch {
      const repaired = repairLatex(formula.trim());
      try {
        formulas.push(katex.renderToString(repaired, {
          displayMode: true,
          throwOnError: false,
          strict: false,
        }));
      } catch {
        formulas.push(`<span class="katex-error" style="color:#d32f2f">${escapeHtml(formula.trim())}</span>`);
      }
    }
    return `%%FORMULA_${idx}%%`;
  });

  // Step 3: 对非公式部分执行 HTML 转义
  result = escapeHtml(result);

  // Step 4: 还原公式占位符
  result = result.replace(/%%FORMULA_(\d+)%%/g, (_match, idx: string) => {
    return formulas[parseInt(idx)] || '';
  });

  // 处理可能被 escapeHtml 修改的占位符（%% 不会被修改，但以防万一）
  result = result.replace(/%%FORMULA_(\d+)%%/g, (_match, idx: string) => {
    return formulas[parseInt(idx)] || '';
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
