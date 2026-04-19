/**
 * LaTeX 公式输入器组件
 *
 * 功能：
 * - 快捷符号栏：常用数学符号一键插入
 * - 实时预览：输入 LaTeX 即时渲染预览
 * - 文本输入区：支持混排普通文本与 $...$ 公式
 *
 * @module components/ui/formula-input
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sigma, ChevronDown, ChevronUp, FunctionSquare } from 'lucide-react';

// ==================== 快捷符号分组 ====================

type SymbolItem = {
  /** 显示标签 */
  label: string;
  /** 插入的 LaTeX 代码 */
  latex: string;
  /** 是否为包裹型（如 \frac{}{} 需要光标移到第一个花括号内） */
  wrap?: boolean;
  /** 光标偏移量（从插入文本末尾往回偏移几个字符） */
  cursorOffset?: number;
};

type SymbolGroup = {
  name: string;
  items: SymbolItem[];
};

const SYMBOL_GROUPS: SymbolGroup[] = [
  {
    name: '分数/根号',
    items: [
      { label: 'a/b', latex: '\\frac{a}{b}', wrap: true, cursorOffset: 3 },
      { label: '√', latex: '\\sqrt{}', wrap: true, cursorOffset: 1 },
      { label: 'ⁿ√', latex: '\\sqrt[n]{}', wrap: true, cursorOffset: 1 },
    ],
  },
  {
    name: '运算',
    items: [
      { label: '×', latex: '\\times ' },
      { label: '÷', latex: '\\div ' },
      { label: '±', latex: '\\pm ' },
      { label: '≠', latex: '\\neq ' },
      { label: '≤', latex: '\\leq ' },
      { label: '≥', latex: '\\geq ' },
      { label: '≈', latex: '\\approx ' },
      { label: '·', latex: '\\cdot ' },
    ],
  },
  {
    name: '关系',
    items: [
      { label: '<', latex: '< ' },
      { label: '>', latex: '> ' },
      { label: '=', latex: '= ' },
      { label: '∞', latex: '\\infty ' },
      { label: '∝', latex: '\\propto ' },
    ],
  },
  {
    name: '集合',
    items: [
      { label: '∈', latex: '\\in ' },
      { label: '∉', latex: '\\notin ' },
      { label: '⊂', latex: '\\subset ' },
      { label: '⊃', latex: '\\supset ' },
      { label: '∪', latex: '\\cup ' },
      { label: '∩', latex: '\\cap ' },
      { label: '∅', latex: '\\emptyset ' },
    ],
  },
  {
    name: '希腊',
    items: [
      { label: 'α', latex: '\\alpha ' },
      { label: 'β', latex: '\\beta ' },
      { label: 'γ', latex: '\\gamma ' },
      { label: 'θ', latex: '\\theta ' },
      { label: 'π', latex: '\\pi ' },
      { label: 'ρ', latex: '\\rho ' },
      { label: 'σ', latex: '\\sigma ' },
      { label: 'φ', latex: '\\varphi ' },
    ],
  },
  {
    name: '上下标',
    items: [
      { label: 'x²', latex: '^{}', cursorOffset: 1 },
      { label: 'xₙ', latex: '_{}', cursorOffset: 1 },
      { label: 'xₙ²', latex: '_{}^{}', cursorOffset: 4 },
    ],
  },
  {
    name: '箭头',
    items: [
      { label: '→', latex: '\\rightarrow ' },
      { label: '←', latex: '\\leftarrow ' },
      { label: '⇒', latex: '\\Rightarrow ' },
      { label: '⇔', latex: '\\Leftrightarrow ' },
    ],
  },
  {
    name: '其他',
    items: [
      { label: '∠', latex: '\\angle ' },
      { label: '°', latex: '^\\circ ' },
      { label: '△', latex: '\\triangle ' },
      { label: '⊥', latex: '\\perp ' },
      { label: '∥', latex: '\\parallel ' },
      { label: '∑', latex: '\\sum ' },
      { label: '∏', latex: '\\prod ' },
      { label: '…', latex: '\\ldots ' },
    ],
  },
];

// ==================== 公式预览渲染 ====================

function renderFormulaPreview(latex: string): string {
  if (!latex.trim()) return '';
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      strict: false,
      displayMode: false,
    });
  } catch {
    return `<span style="color:red">公式语法错误</span>`;
  }
}

/**
 * 从文本中提取并渲染所有 $...$ 公式，返回 HTML
 */
function renderMixedPreview(text: string): string {
  if (!text) return '';
  return text.replace(/\$([^$]+)\$/g, (_match, formula: string) => {
    return renderFormulaPreview(formula);
  });
}

// ==================== 组件 ====================

type FormulaInputProps = {
  /** 当前值（混排文本，如 "计算 $\\frac{1}{2}$ 的值"） */
  value: string;
  /** 值变更回调 */
  onChange: (value: string) => void;
  /** placeholder */
  placeholder?: string;
  /** 最小行数 */
  minRows?: number;
  /** 最大行数 */
  maxRows?: number;
  /** 额外类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
};

export function FormulaInput({
  value,
  onChange,
  placeholder = '输入题目内容，公式用 $...$ 包裹，如：计算 $\\frac{1}{2}$ 的值',
  minRows = 3,
  className,
  disabled = false,
}: FormulaInputProps) {
  const [showSymbols, setShowSymbols] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewHtml, setPreviewHtml] = useState('');

  // 实时预览
  useEffect(() => {
    if (!value) {
      setPreviewHtml('');
      return;
    }
    // 转义非公式部分 HTML
    const result = value.replace(/\$([^$]+)\$/g, (_match, formula: string) => {
      return renderFormulaPreview(formula);
    });
    // 转义非公式文本
    const escaped = result.replace(/<span[^>]*>[\s\S]*?<\/span>/g, (m) => `__FORMULA_PLACEHOLDER_${Math.random()}__`);
    let html = escaped
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // 还原公式
    const placeholders = result.match(/<span[^>]*>[\s\S]*?<\/span>/g) || [];
    for (const ph of placeholders) {
      html = html.replace(/__FORMULA_PLACEHOLDER_[\d.]+__/, ph);
    }
    setPreviewHtml(html);
  }, [value]);

  // 插入符号
  const insertSymbol = useCallback((item: SymbolItem) => {
    const textarea = textareaRef.current;
    if (!textarea || disabled) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = value.substring(0, start);
    const after = value.substring(end);

    // 如果光标不在 $...$ 内，自动包裹
    const dollarBefore = (before.match(/\$/g) || []).length;
    const inFormula = dollarBefore % 2 === 1;

    let insertText = item.latex;
    if (!inFormula) {
      // 不在公式内，加 $ 包裹
      insertText = `$${item.latex.trimEnd()}$`;
    }

    const newValue = before + insertText + after;
    onChange(newValue);

    // 设置光标位置
    requestAnimationFrame(() => {
      const cursorPos = start + insertText.length - (item.cursorOffset || 0);
      textarea.setSelectionRange(cursorPos, cursorPos);
      textarea.focus();
    });
  }, [value, onChange, disabled]);

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* 工具栏 */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => setShowSymbols(!showSymbols)}
          disabled={disabled}
        >
          <Sigma className="w-3.5 h-3.5" />
          公式符号
          {showSymbols ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </Button>
        <span className="text-[10px] text-muted-foreground">
          公式用 <code className="px-1 py-0.5 bg-muted rounded text-[10px]">$...$</code> 包裹
        </span>
      </div>

      {/* 快捷符号面板 */}
      {showSymbols && (
        <div className="border rounded-lg p-2 bg-muted/30 space-y-2">
          {/* 分组 Tab */}
          <div className="flex gap-1 flex-wrap">
            {SYMBOL_GROUPS.map((group, idx) => (
              <Button
                key={group.name}
                type="button"
                variant={activeGroup === idx ? 'default' : 'ghost'}
                size="sm"
                className="h-6 text-[10px] px-2"
                onClick={() => setActiveGroup(idx)}
              >
                {group.name}
              </Button>
            ))}
          </div>
          {/* 符号按钮 */}
          <div className="flex gap-1 flex-wrap">
            {SYMBOL_GROUPS[activeGroup].items.map((item) => (
              <Button
                key={item.latex}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2 min-w-[32px]"
                onClick={() => insertSymbol(item)}
                title={item.latex}
                disabled={disabled}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* 文本输入 */}
      <textarea
        ref={textareaRef}
        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
        style={{ minHeight: `${minRows * 24}px` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />

      {/* 实时预览 */}
      {value && (
        <div className="border rounded-md p-2 bg-background">
          <div className="flex items-center gap-1 mb-1">
            <FunctionSquare className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground font-medium">预览</span>
          </div>
          <div
            className="text-xs leading-relaxed prose-sm"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      )}
    </div>
  );
}
