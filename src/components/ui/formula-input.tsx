/**
 * 可视化公式编辑器组件（基于 MathLive）
 *
 * 设计原则：
 * - 不使用弹窗/模态框（MathLive 虚拟键盘与模态冲突）
 * - 预览区即主编辑区，用户看到的就是渲染好的公式
 * - 公式可点击编辑，文本可直接修改
 * - 内联展开 MathLive 编辑器，虚拟键盘自然弹出
 *
 * 两种使用模式：
 * 1. FormulaInput（混排编辑器）：题目内容、答案解析等文本+公式混排
 * 2. FormulaField（纯公式编辑器）：选择题选项、简短答案等纯公式场景
 *
 * @module components/ui/formula-input
 */

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sigma, X, Edit3, Check, Code2, Eye } from 'lucide-react';

// ==================== MathLive 动态加载 ====================

type ConvertLatexToMarkup = (text: string, options?: Record<string, unknown>) => string;

let mathliveLoaded = false;
let mathliveLoadPromise: Promise<ConvertLatexToMarkup | null> | null = null;

async function loadMathlive(): Promise<ConvertLatexToMarkup | null> {
  if (mathliveLoaded && mathliveLoadPromise) {
    return mathliveLoadPromise;
  }
  if (mathliveLoadPromise) return mathliveLoadPromise;

  mathliveLoadPromise = (async () => {
    try {
      const ml = await import('mathlive');
      mathliveLoaded = true;
      if (typeof ml.convertLatexToMarkup === 'function') {
        return ml.convertLatexToMarkup as ConvertLatexToMarkup;
      }
      return null;
    } catch (err) {
      console.error('[FormulaInput] MathLive 加载失败:', err);
      mathliveLoadPromise = null;
      throw err;
    }
  })();

  return mathliveLoadPromise;
}

// ==================== 只读公式渲染 ====================

type FormulaDisplayProps = {
  latex: string;
  className?: string;
};

/**
 * 只读公式渲染——将 LaTeX 渲染为可视化数学公式
 * 优先用 MathLive convertLatexToMarkup，回退到 KaTeX
 */
function FormulaDisplay({ latex, className }: FormulaDisplayProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadMathlive()
      .then(convertFn => {
        if (!mounted || !ref.current) return;
        if (convertFn) {
          try {
            const html = convertFn(latex, { defaultMode: 'textstyle' });
            const container = document.createElement('span');
            container.innerHTML = html;
            ref.current.replaceChildren(container);
            setRendered(true);
            return;
          } catch {
            // 回退到 KaTeX
          }
        }
        return import('katex').then(katex => {
          if (!mounted || !ref.current) return;
          const html = katex.default.renderToString(latex, {
            throwOnError: false,
            strict: false,
            displayMode: false,
          });
          const container = document.createElement('span');
          container.innerHTML = html;
          ref.current.replaceChildren(container);
          setRendered(true);
        });
      })
      .catch(() => {
        if (!mounted || !ref.current) return;
        ref.current.textContent = latex;
        setRendered(true);
      });

    return () => { mounted = false; };
  }, [latex]);

  return (
    <span className={cn('inline-block align-middle', className)}>
      <span ref={ref} />
      {!rendered && <span className="text-muted-foreground text-xs animate-pulse">...</span>}
    </span>
  );
}

// ==================== 内联 MathLive 编辑器 ====================

type InlineMathFieldProps = {
  /** 初始 LaTeX */
  initialLatex: string;
  /** 确认回调 */
  onConfirm: (latex: string) => void;
  /** 取消回调 */
  onCancel: () => void;
};

/**
 * 内联 MathLive 编辑器（非弹窗）
 * 直接在页面中展开 math-field，虚拟键盘自然弹出，不会与任何弹窗冲突
 */
function InlineMathField({ initialLatex, onConfirm, onCancel }: InlineMathFieldProps) {
  const mfContainerRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<HTMLElement | null>(null);
  const [currentLatex, setCurrentLatex] = useState(initialLatex);

  useEffect(() => {
    let mounted = true;

    loadMathlive().then(() => {
      if (!mounted || !mfContainerRef.current) return;

      const mf = document.createElement('math-field') as HTMLElement & {
        value: string;
        setOptions: (opts: Record<string, unknown>) => void;
        focus: () => void;
      };

      mf.value = initialLatex;

      mf.setOptions({
        defaultMode: 'math',
        mathVirtualKeyboardPolicy: 'auto',
        smartFence: true,
        smartMode: true,
        readOnly: false,
        placeholder: '输入公式，如 sqrt 得根号、frac 得分数...',
      });

      mf.addEventListener('input', () => {
        setCurrentLatex((mf as unknown as { value: string }).value);
      });

      mf.style.width = '100%';
      mf.style.minHeight = '56px';
      mf.style.fontSize = '18px';
      mf.style.border = '2px solid hsl(var(--primary))';
      mf.style.borderRadius = '8px';
      mf.style.padding = '8px 12px';
      mf.style.background = 'var(--background)';
      mf.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.15)';

      mfContainerRef.current.appendChild(mf);
      mfRef.current = mf;

      // 自动聚焦
      setTimeout(() => mf.focus(), 100);
    });

    return () => {
      mounted = false;
      if (mfRef.current && mfRef.current.parentNode) {
        mfRef.current.parentNode.removeChild(mfRef.current);
      }
    };
  }, [initialLatex]);

  const handleConfirm = useCallback(() => {
    onConfirm(currentLatex);
  }, [currentLatex, onConfirm]);

  return (
    <div className="border border-primary/30 rounded-lg bg-primary/5 p-3 space-y-2">
      {/* math-field 容器 */}
      <div ref={mfContainerRef} className="w-full" />

      {/* 操作按钮 */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          输入 sqrt 得根号、frac 得分数、^ 得上标
        </span>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
            取消
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1" onClick={handleConfirm}>
            <Check className="w-3.5 h-3.5" />
            确认
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== 混排内容段 ====================

type ContentSegment = {
  type: 'text' | 'formula';
  content: string;
  id: string;
};

function parseMixedContent(value: string): ContentSegment[] {
  if (!value) return [];

  const segments: ContentSegment[] = [];
  let counter = 0;
  const regex = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        content: value.substring(lastIndex, match.index),
        id: `text-${counter++}`,
      });
    }
    segments.push({
      type: 'formula',
      content: match[1],
      id: `formula-${counter++}`,
    });
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < value.length) {
    segments.push({
      type: 'text',
      content: value.substring(lastIndex),
      id: `text-${counter++}`,
    });
  }

  return segments;
}

function buildMixedContent(segments: ContentSegment[]): string {
  return segments.map(seg => {
    if (seg.type === 'formula') return `$${seg.content}$`;
    return seg.content;
  }).join('');
}

// ==================== FormulaInput（混排编辑器）====================

type FormulaInputProps = {
  /** 当前值（混排文本，如 "计算 $\\frac{1}{2}$ 的值"） */
  value: string;
  /** 值变更回调 */
  onChange: (value: string) => void;
  /** placeholder */
  placeholder?: string;
  /** 最小行数 */
  minRows?: number;
  /** 额外类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
};

/**
 * 混排公式编辑器
 *
 * 交互设计：
 * - 预览模式（默认）：文字 + 渲染好的公式，公式可点击编辑/删除
 * - 源码模式：显示原始 $...$ 文本，可直接编辑
 * - 点击「插入公式」：内联展开 MathLive 编辑器
 * - 点击已有公式：内联展开 MathLive 编辑器编辑该公式
 */
export function FormulaInput({
  value,
  onChange,
  placeholder = '输入内容，点击「插入公式」添加数学公式',
  minRows = 3,
  className,
  disabled = false,
}: FormulaInputProps) {
  const [mode, setMode] = useState<'preview' | 'source'>('preview');
  const [editingSegment, setEditingSegment] = useState<{ index: number | null; open: boolean }>({ index: null, open: false });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const segments = useMemo(() => parseMixedContent(value), [value]);
  const hasFormula = segments.some(s => s.type === 'formula');

  // 插入新公式
  const handleInsertFormula = useCallback(() => {
    setEditingSegment({ index: null, open: true });
  }, []);

  // 编辑已有公式
  const handleEditFormula = useCallback((segIndex: number) => {
    setEditingSegment({ index: segIndex, open: true });
  }, []);

  // 删除公式
  const handleRemoveFormula = useCallback((segIndex: number) => {
    const newSegments = segments.filter((_, i) => i !== segIndex);
    onChange(buildMixedContent(newSegments));
  }, [segments, onChange]);

  // 确认公式编辑
  const handleFormulaConfirm = useCallback((latex: string) => {
    if (editingSegment.index !== null) {
      const newSegments = [...segments];
      newSegments[editingSegment.index] = { ...newSegments[editingSegment.index], content: latex };
      onChange(buildMixedContent(newSegments));
    } else {
      const formula = `$${latex}$`;
      const currentText = value || '';
      const separator = currentText && !currentText.endsWith(' ') && !currentText.endsWith('\n') ? ' ' : '';
      onChange(currentText + separator + formula);
    }
    setEditingSegment({ index: null, open: false });
  }, [editingSegment.index, segments, value, onChange]);

  // 取消公式编辑
  const handleFormulaCancel = useCallback(() => {
    setEditingSegment({ index: null, open: false });
  }, []);

  // 切换到源码模式时自动聚焦 textarea
  const handleSwitchToSource = useCallback(() => {
    setMode('source');
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, []);

  return (
    <div className={cn('space-y-2', className)}>
      {/* ========== 预览模式（默认）========== */}
      {mode === 'preview' && (
        <>
          {/* 内容展示区 */}
          <div
            className={cn(
              'min-h-[60px] w-full rounded-md border bg-background px-3 py-2',
              'flex flex-wrap items-center gap-y-2 gap-x-1',
              !value && 'text-muted-foreground text-xs',
            )}
            style={{ minHeight: `${(minRows || 3) * 24}px` }}
          >
            {value ? (
              segments.map((seg, idx) => (
                seg.type === 'text' ? (
                  <span key={seg.id} className="text-sm whitespace-pre-wrap">{seg.content}</span>
                ) : (
                  <span
                    key={seg.id}
                    className="inline-flex items-center gap-1 bg-primary/10 border border-primary/30 rounded px-2 py-0.5 cursor-pointer hover:bg-primary/20 transition-colors group"
                    onClick={() => !disabled && handleEditFormula(idx)}
                    title="点击编辑公式"
                  >
                    <FormulaDisplay latex={seg.content} />
                    <Edit3 className="w-3 h-3 text-primary/50 group-hover:text-primary shrink-0" />
                    <button
                      type="button"
                      className="w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-destructive shrink-0"
                      onClick={(e) => { e.stopPropagation(); handleRemoveFormula(idx); }}
                      title="删除公式"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )
              ))
            ) : (
              <span className="text-muted-foreground text-xs">{placeholder}</span>
            )}
          </div>

          {/* 内联 MathLive 编辑器 */}
          {editingSegment.open && (
            <InlineMathField
              initialLatex={
                editingSegment.index !== null
                  ? (segments[editingSegment.index]?.content || '')
                  : ''
              }
              onConfirm={handleFormulaConfirm}
              onCancel={handleFormulaCancel}
            />
          )}

          {/* 操作栏 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleInsertFormula}
              disabled={disabled || editingSegment.open}
            >
              <Sigma className="w-3.5 h-3.5" />
              插入公式
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={handleSwitchToSource}
            >
              <Code2 className="w-3.5 h-3.5" />
              源码编辑
            </Button>
          </div>
        </>
      )}

      {/* ========== 源码模式 ========== */}
      {mode === 'source' && (
        <>
          <textarea
            ref={textareaRef}
            className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
            style={{ minHeight: `${(minRows || 3) * 24}px` }}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`${placeholder}（公式用 $...$ 包裹）`}
            disabled={disabled}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1 text-muted-foreground"
              onClick={() => setMode('preview')}
            >
              <Eye className="w-3.5 h-3.5" />
              切回预览
            </Button>
            <span className="text-[10px] text-muted-foreground">
              公式格式：<code className="px-1 py-0.5 bg-muted rounded text-[10px]">$\frac{1}{2}$</code>
            </span>
          </div>
        </>
      )}
    </div>
  );
}

// ==================== FormulaField（纯公式编辑器）====================

type FormulaFieldProps = {
  /** 当前值（纯 LaTeX，不含 $...$ 包裹） */
  value: string;
  /** 值变更回调（返回纯 LaTeX） */
  onChange: (latex: string) => void;
  /** placeholder */
  placeholder?: string;
  /** 额外类名 */
  className?: string;
  /** 是否禁用 */
  disabled?: boolean;
};

/**
 * 纯公式编辑器
 *
 * 交互设计：
 * - 默认显示渲染好的公式预览（或 placeholder）
 * - 点击展开内联 MathLive 编辑器
 * - 确认后回到预览模式
 * - 无弹窗，虚拟键盘正常工作
 */
export function FormulaField({
  value,
  onChange,
  placeholder = '点击输入公式',
  className,
  disabled = false,
}: FormulaFieldProps) {
  const [editing, setEditing] = useState(false);

  const handleConfirm = useCallback((latex: string) => {
    onChange(latex);
    setEditing(false);
  }, [onChange]);

  const handleCancel = useCallback(() => {
    setEditing(false);
  }, []);

  if (editing) {
    return (
      <InlineMathField
        initialLatex={value}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }

  return (
    <div
      className={cn(
        'border rounded-md px-3 py-2 text-sm cursor-pointer transition-colors',
        'hover:border-primary/50 hover:bg-primary/5',
        'flex items-center gap-2 min-h-[36px]',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
      onClick={() => !disabled && setEditing(true)}
    >
      {value ? (
        <FormulaDisplay latex={value} />
      ) : (
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <Sigma className="w-3.5 h-3.5" />
          {placeholder}
        </span>
      )}
      <Edit3 className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
    </div>
  );
}
