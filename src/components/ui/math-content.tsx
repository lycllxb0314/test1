/**
 * 数学公式渲染组件
 *
 * 使用 KaTeX 官方 auto-render 扩展（renderMathInElement）渲染数学公式。
 *
 * 渲染流程：
 * 1. normalizeLatex 规范化 LLM 不规范输出
 * 2. 设置容器的 textContent（纯文本，浏览器自动转义）
 * 3. 将换行符替换为 <br> 元素
 * 4. renderMathInElement 扫描文本节点，查找公式定界符并渲染
 *
 * 如果 auto-render 不可用或渲染失败，降级为纯文本显示。
 */

'use client';

import React, { useRef, useEffect, useMemo } from 'react';
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
 * 懒加载 renderMathInElement
 * 使用动态 import + 兼容 CommonJS export = 格式
 */
type RenderMathFn = (elem: HTMLElement, options?: Record<string, unknown>) => void;
let _renderMathFn: RenderMathFn | null = null;
let _loadPromise: Promise<RenderMathFn | null> | null = null;

async function getRenderMathFn(): Promise<RenderMathFn | null> {
  if (_renderMathFn) return _renderMathFn;
  if (_loadPromise) return _loadPromise;

  _loadPromise = import('katex/contrib/auto-render').then(mod => {
    // 兼容 export = 和 export default 两种格式
    const fn = mod.default || mod;
    _renderMathFn = typeof fn === 'function' ? fn : null;
    return _renderMathFn;
  }).catch(e => {
    console.warn('[MathContent] Failed to load auto-render:', e);
    return null;
  });

  return _loadPromise;
}

/**
 * 在 DOM 元素中渲染数学公式
 */
async function renderMath(el: HTMLElement, normalizedText: string): Promise<void> {
  try {
    const renderMathInElement = await getRenderMathFn();
    if (!renderMathInElement) {
      // auto-render 加载失败，降级为纯文本
      el.textContent = normalizedText;
      replaceNewlinesWithBr(el);
      return;
    }

    // 方式1：先设置 textContent（浏览器自动转义 HTML 特殊字符）
    // 这比 innerHTML + escapeHtml 更安全，且不破坏文本中的 \ \[ \( 等定界符
    el.textContent = normalizedText;

    // 方式2：将换行符替换为 <br>
    // 需要遍历文本节点，找到换行符并替换
    replaceNewlinesWithBr(el);

    // 方式3：KaTeX auto-render 扫描文本节点，渲染公式
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
        // $ 必须放最后，避免匹配 $$ 的前半部分
        { left: '$', right: '$', display: false },
      ],
      throwOnError: false,
      strict: false,
    });
  } catch (e) {
    // 降级：纯文本显示
    console.warn('[MathContent] renderMathInElement failed, fallback to plain text:', e);
    el.textContent = normalizedText;
    replaceNewlinesWithBr(el);
  }
}

/**
 * 将 DOM 元素中的换行符替换为 <br> 元素
 * 遍历所有文本节点，按 \n 分割后插入 <br>
 */
function replaceNewlinesWithBr(el: HTMLElement): void {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];

  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    if (node.textContent && node.textContent.includes('\n')) {
      textNodes.push(node);
    }
  }

  for (const textNode of textNodes) {
    const parts = textNode.textContent!.split('\n');
    const parent = textNode.parentNode;
    if (!parent) continue;

    const fragment = document.createDocumentFragment();
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) fragment.appendChild(document.createElement('br'));
      if (parts[i]) fragment.appendChild(document.createTextNode(parts[i]));
    }

    parent.replaceChild(fragment, textNode);
  }
}

/**
 * 渲染包含数学公式的题目内容
 */
export function MathContent({ content, imageUrl, imageAlt, className }: MathContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const normalized = useMemo(() => normalizeLatex(content), [content]);

  useEffect(() => {
    const el = containerRef.current;
    if (el && normalized) {
      // 先显示纯文本（防止闪烁），然后异步渲染公式
      el.textContent = normalized;
      replaceNewlinesWithBr(el);
      renderMath(el, normalized);
    }
  }, [normalized]);

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
    const el = spanRef.current;
    if (el && normalized) {
      el.textContent = normalized;
      renderMath(el, normalized);
    }
  }, [normalized]);

  return (
    <span
      ref={spanRef}
      className="math-content inline [&_.katex]:text-inherit"
    />
  );
}
