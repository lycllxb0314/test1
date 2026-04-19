/**
 * 可视化公式编辑器（段落式，基于 MathLive）
 *
 * 设计理念：用户全程看不到任何 LaTeX 代码
 *
 * FormulaInput（混排编辑器）：
 *   内容由多个"段落"组成，每个段落要么是文字、要么是公式
 *   - 文字段：普通 input 输入框，可打字
 *   - 公式段：渲染好的数学公式，点击可编辑（内联 MathLive）
 *   - 底部有 [+文字] [+公式] 按钮，随时插入新段落
 *   - 最终存储格式仍是 $...$ 混排字符串，但用户看不到
 *
 * FormulaField（纯公式编辑器）：
 *   点击后内联展开 MathLive，确认后显示渲染结果
 *   适合选项、答案等纯公式场景
 *
 * @module components/ui/formula-input
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sigma, Type, X, Check, Trash2 } from 'lucide-react';

// ==================== MathLive 动态加载 ====================

type ConvertFn = (text: string, options?: Record<string, unknown>) => string;

let mathliveLoaded = false;
let mathliveLoadPromise: Promise<ConvertFn | null> | null = null;

async function loadMathlive(): Promise<ConvertFn | null> {
  if (mathliveLoaded && mathliveLoadPromise) return mathliveLoadPromise;
  if (mathliveLoadPromise) return mathliveLoadPromise;

  mathliveLoadPromise = (async () => {
    try {
      const ml = await import('mathlive');
      mathliveLoaded = true;
      if (typeof ml.convertLatexToMarkup === 'function') {
        return ml.convertLatexToMarkup as ConvertFn;
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

// ==================== 公式只读渲染 ====================

type FormulaDisplayProps = {
  latex: string;
  className?: string;
};

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
            const el = document.createElement('span');
            el.innerHTML = html;
            ref.current.replaceChildren(el);
            setRendered(true);
            return;
          } catch { /* fallback */ }
        }
        return import('katex').then(katex => {
          if (!mounted || !ref.current) return;
          const html = katex.default.renderToString(latex, {
            throwOnError: false, strict: false, displayMode: false,
          });
          const el = document.createElement('span');
          el.innerHTML = html;
          ref.current.replaceChildren(el);
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
  initialLatex: string;
  onConfirm: (latex: string) => void;
  onCancel: () => void;
};

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
        placeholder: '输入公式，如 sqrt 得根号...',
      });

      mf.addEventListener('input', () => {
        setCurrentLatex((mf as unknown as { value: string }).value);
      });

      mf.style.width = '100%';
      mf.style.minHeight = '52px';
      mf.style.fontSize = '18px';
      mf.style.border = '2px solid hsl(var(--primary))';
      mf.style.borderRadius = '8px';
      mf.style.padding = '6px 10px';
      mf.style.background = 'var(--background)';
      mf.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.12)';

      mfContainerRef.current.appendChild(mf);
      mfRef.current = mf;
      setTimeout(() => mf.focus(), 100);
    });

    return () => {
      mounted = false;
      if (mfRef.current && mfRef.current.parentNode) {
        mfRef.current.parentNode.removeChild(mfRef.current);
      }
    };
  }, [initialLatex]);

  return (
    <div className="border border-primary/30 rounded-lg bg-primary/5 p-2.5 space-y-2">
      <div ref={mfContainerRef} className="w-full" />
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground">
          输入 sqrt 得根号、frac 得分数、^ 得上标
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={onCancel}>取消</Button>
          <Button size="sm" className="h-7 text-xs gap-1 px-3" onClick={() => onConfirm(currentLatex)}>
            <Check className="w-3.5 h-3.5" />确认
          </Button>
        </div>
      </div>
    </div>
  );
}

// ==================== 段落数据模型 ====================

type Segment = {
  id: string;
  type: 'text' | 'formula';
  content: string; // text: 纯文字; formula: LaTeX（用户不可见）
};

/** 从 $...$ 混排字符串解析为段落数组 */
function valueToSegments(value: string): Segment[] {
  if (!value) return [];

  const segments: Segment[] = [];
  let counter = 0;
  const regex = /\$([^$]+)\$/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ id: `t${counter++}`, type: 'text', content: value.substring(lastIndex, match.index) });
    }
    segments.push({ id: `f${counter++}`, type: 'formula', content: match[1] });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < value.length) {
    segments.push({ id: `t${counter++}`, type: 'text', content: value.substring(lastIndex) });
  }

  return segments;
}

/** 从段落数组还原为 $...$ 混排字符串 */
function segmentsToValue(segments: Segment[]): string {
  return segments.map(s => s.type === 'formula' ? `$${s.content}$` : s.content).join('');
}

let segIdCounter = 0;
function nextId(prefix: string) {
  return `${prefix}${++segIdCounter}_${Date.now()}`;
}

// ==================== FormulaInput（段落式混排编辑器）====================

type FormulaInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
  disabled?: boolean;
};

/**
 * 段落式公式+文字混排编辑器
 *
 * 交互：
 * - 内容区由文字段和公式段交替排列
 * - 文字段：普通输入框，可自由打字
 * - 公式段：渲染好的数学公式块，点击可编辑（内联 MathLive）
 * - 底部 [+文字] [+公式] 按钮追加新段落
 * - 每段右侧有删除按钮
 * - 存储格式是 $...$ 混排，但用户全程看不到 LaTeX
 */
export function FormulaInput({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
}: FormulaInputProps) {
  const [segments, setSegments] = useState<Segment[]>(() => valueToSegments(value));
  const [editingId, setEditingId] = useState<string | null>(null);

  // 外部 value 变化时重新解析（如父组件 reset）
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      setSegments(valueToSegments(value));
      setEditingId(null);
    }
  }, [value]);

  // 更新段落并同步到父组件
  const updateSegments = useCallback((newSegments: Segment[]) => {
    setSegments(newSegments);
    const newValue = segmentsToValue(newSegments);
    prevValueRef.current = newValue;
    onChange(newValue);
  }, [onChange]);

  // 更新某个段落的 content
  const updateSegmentContent = useCallback((id: string, content: string) => {
    const newSegments = segments.map(s => s.id === id ? { ...s, content } : s);
    updateSegments(newSegments);
  }, [segments, updateSegments]);

  // 删除段落
  const removeSegment = useCallback((id: string) => {
    const newSegments = segments.filter(s => s.id !== id);
    // 如果删完后没有段落，保留一个空文字段
    if (newSegments.length === 0) {
      newSegments.push({ id: nextId('t'), type: 'text', content: '' });
    }
    updateSegments(newSegments);
    if (editingId === id) setEditingId(null);
  }, [segments, updateSegments, editingId]);

  // 在指定段落之后插入新段落
  const insertAfter = useCallback((afterId: string, type: 'text' | 'formula') => {
    const idx = segments.findIndex(s => s.id === afterId);
    const newSeg: Segment = { id: nextId(type === 'text' ? 't' : 'f'), type, content: '' };
    const newSegments = [...segments];
    newSegments.splice(idx + 1, 0, newSeg);
    updateSegments(newSegments);
    // 如果插入的是公式段，自动进入编辑模式
    if (type === 'formula') {
      setEditingId(newSeg.id);
    }
  }, [segments, updateSegments]);

  // 追加新段落到末尾
  const appendSegment = useCallback((type: 'text' | 'formula') => {
    const lastId = segments.length > 0 ? segments[segments.length - 1].id : '';
    insertAfter(lastId, type);
  }, [segments, insertAfter]);

  // 确认公式编辑
  const handleFormulaConfirm = useCallback((id: string, latex: string) => {
    if (!latex.trim()) {
      // 空公式直接删除
      removeSegment(id);
      return;
    }
    const newSegments = segments.map(s => s.id === id ? { ...s, content: latex } : s);
    updateSegments(newSegments);
    setEditingId(null);
  }, [segments, updateSegments, removeSegment]);

  // 取消公式编辑
  const handleFormulaCancel = useCallback((id: string) => {
    const seg = segments.find(s => s.id === id);
    if (!seg || !seg.content) {
      // 新建的空公式，删除
      removeSegment(id);
    } else {
      setEditingId(null);
    }
  }, [segments, removeSegment]);

  // 如果没有段落，初始化一个空文字段
  const displaySegments = segments.length > 0 ? segments : [{ id: nextId('t'), type: 'text' as const, content: '' }];

  return (
    <div className={cn('space-y-1.5', className)}>
      {/* 段落列表 */}
      <div className="space-y-1.5">
        {displaySegments.map((seg, idx) => (
          <div key={seg.id} className="group flex items-center gap-1.5">
            {/* 段落类型标签 */}
            <span className={cn(
              'shrink-0 text-[9px] font-medium px-1 py-0.5 rounded',
              seg.type === 'text'
                ? 'bg-muted text-muted-foreground'
                : 'bg-primary/10 text-primary',
            )}>
              {seg.type === 'text' ? '文字' : '公式'}
            </span>

            {/* 段落内容 */}
            <div className="flex-1 min-w-0">
              {seg.type === 'text' ? (
                <input
                  type="text"
                  className="w-full h-8 rounded-md border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
                  value={seg.content}
                  onChange={e => updateSegmentContent(seg.id, e.target.value)}
                  placeholder={idx === 0 ? (placeholder || '输入文字内容') : '继续输入文字'}
                  disabled={disabled}
                />
              ) : editingId === seg.id ? (
                <InlineMathField
                  initialLatex={seg.content}
                  onConfirm={latex => handleFormulaConfirm(seg.id, latex)}
                  onCancel={() => handleFormulaCancel(seg.id)}
                />
              ) : (
                <div
                  className={cn(
                    'h-8 rounded-md border px-2.5 flex items-center gap-2 cursor-pointer transition-colors',
                    seg.content
                      ? 'border-primary/30 bg-primary/5 hover:bg-primary/10'
                      : 'border-dashed border-muted-foreground/30 bg-muted/30 hover:bg-muted/50',
                  )}
                  onClick={() => !disabled && setEditingId(seg.id)}
                >
                  {seg.content ? (
                    <>
                      <FormulaDisplay latex={seg.content} />
                      <span className="text-[10px] text-primary/50 shrink-0">点击编辑</span>
                    </>
                  ) : (
                    <span className="text-xs text-muted-foreground">点击输入公式</span>
                  )}
                </div>
              )}
            </div>

            {/* 删除按钮 */}
            {displaySegments.length > 1 && (
              <button
                type="button"
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeSegment(seg.id)}
                title="删除此段"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 追加按钮 */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => appendSegment('text')}
          disabled={disabled}
        >
          <Type className="w-3.5 h-3.5" />
          +文字
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => appendSegment('formula')}
          disabled={disabled}
        >
          <Sigma className="w-3.5 h-3.5" />
          +公式
        </Button>
      </div>
    </div>
  );
}

// ==================== FormulaField（纯公式编辑器）====================

type FormulaFieldProps = {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * 纯公式编辑器
 * 点击展开内联 MathLive，确认后显示渲染结果，用户全程看不到 LaTeX
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
        onCancel={value ? handleCancel : () => { onChange(''); setEditing(false); }}
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
        !value && 'border-dashed',
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
      <span className="text-[10px] text-primary/40 ml-auto shrink-0">点击编辑</span>
    </div>
  );
}
