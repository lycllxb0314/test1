/**
 * 可视化公式编辑器组件（基于 MathLive）
 *
 * 核心设计：
 * - 点击编辑区域直接弹出 MathLive 可视化编辑器
 * - 用户看到的是渲染好的数学公式，不是 LaTeX 代码
 * - 支持虚拟键盘，触屏设备也能输入
 * - 内部存储 LaTeX，外部接口以 $...$ 形式混排
 *
 * 两种使用模式：
 * 1. FormulaInput（完整编辑器）：题目内容、答案解析等大段文本
 *    - 普通文本 + 公式混排
 *    - 点击"插入公式"按钮弹出 MathLive 编辑器
 *    - 插入后公式在文本中显示为渲染好的公式块
 *
 * 2. FormulaField（纯公式编辑）：单行公式输入
 *    - 点击后弹出 MathLive 编辑器
 *    - 适合答案、选项等纯公式场景
 *
 * @module components/ui/formula-input
 */

'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sigma, Plus, X, Edit3 } from 'lucide-react';

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
      // convertLatexToMarkup 可从 mathlive 或 mathlive-ssr 获取
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

// ==================== 公式块渲染（只读预览）====================

type FormulaBlockProps = {
  latex: string;
  onRemove?: () => void;
  onEdit?: () => void;
};

/**
 * 只读公式块预览
 * 优先使用 MathLive 的 convertLatexToMarkup 渲染，
 * 回退到 KaTeX
 */
function FormulaBlock({ latex, onRemove, onEdit }: FormulaBlockProps) {
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
            // 使用独立容器避免与 React 节点冲突
            const container = document.createElement('span');
            container.innerHTML = html;
            ref.current.replaceChildren(container);
            setRendered(true);
            return;
          } catch {
            // 渲染失败，回退到 KaTeX
          }
        }
        // 回退：用 KaTeX
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
    <span
      className="inline-flex items-center gap-1 align-middle bg-primary/5 border border-primary/20 rounded px-1.5 py-0.5 mx-0.5 group relative"
    >
      {/* 公式渲染容器：纯 DOM 占位，不含 React 子节点 */}
      <span ref={ref} />
      {/* 加载指示器：用 CSS 显示/隐藏，避免 React 管理的子节点被 innerHTML 替换 */}
      {!rendered && (
        <span className="text-muted-foreground text-xs animate-pulse ml-1">...</span>
      )}
      {/* 编辑/删除按钮 */}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-primary"
          title="编辑公式"
        >
          <Edit3 className="w-3 h-3" />
        </button>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4 flex items-center justify-center text-muted-foreground hover:text-destructive"
          title="删除公式"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// ==================== MathLive 弹窗编辑器 ====================

type MathLiveEditorProps = {
  /** 初始 LaTeX */
  initialLatex: string;
  /** 确认回调 */
  onConfirm: (latex: string) => void;
  /** 取消回调 */
  onCancel: () => void;
  /** 标题 */
  title?: string;
};

/**
 * MathLive 弹窗编辑器
 * 在模态窗口中打开 MathLive mathfield，用户编辑完点确认
 */
function MathLiveEditor({ initialLatex, onConfirm, onCancel, title = '编辑公式' }: MathLiveEditorProps) {
  const mfContainerRef = useRef<HTMLDivElement>(null);
  const [mfReady, setMfReady] = useState(false);
  const [currentLatex, setCurrentLatex] = useState(initialLatex);
  const mfRef = useRef<HTMLElement | null>(null);

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
        placeholder: '输入公式...',
      });

      mf.addEventListener('input', () => {
        setCurrentLatex((mf as unknown as { value: string }).value);
      });

      mf.style.width = '100%';
      mf.style.minHeight = '64px';
      mf.style.fontSize = '18px';
      mf.style.border = '1px solid var(--border)';
      mf.style.borderRadius = '8px';
      mf.style.padding = '8px 12px';
      mf.style.background = 'var(--background)';

      // 直接 appendChild，不影响 React 管理的其他节点
      mfContainerRef.current.appendChild(mf);
      mfRef.current = mf;
      setMfReady(true);

      setTimeout(() => mf.focus(), 150);
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 animate-in fade-in duration-150"
      onClick={onCancel}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl mx-4 animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <div className="flex items-center gap-2">
            <Sigma className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 编辑区 */}
        <div className="p-5">
          {/* math-field 渲染容器：纯 DOM 占位，不含 React 子节点 */}
          <div ref={mfContainerRef} className="w-full" />
          {!mfReady && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs py-3">
              <span className="animate-pulse">加载公式编辑器...</span>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">
            点击编辑区域后，键盘上方会弹出虚拟数学键盘。支持键盘快捷输入，如输入 &quot;sqrt&quot; 得到根号，&quot;frac&quot; 得到分数。
          </p>
        </div>

        {/* 底部 */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
          <Button variant="outline" size="sm" onClick={onCancel}>取消</Button>
          <Button size="sm" onClick={handleConfirm}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            确认插入
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

/**
 * 将 "$...$" 混排文本拆分为段
 */
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

/**
 * 从段落数组重建 $...$ 混排字符串
 */
function buildMixedContent(segments: ContentSegment[]): string {
  return segments.map(seg => {
    if (seg.type === 'formula') return `$${seg.content}$`;
    return seg.content;
  }).join('');
}

// ==================== FormulaInput（完整混排编辑器）====================

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
 * 完整公式输入器
 *
 * 交互流程：
 * 1. 文本区：输入普通文字
 * 2. 点击「插入公式」→ 弹出 MathLive 可视化编辑器
 * 3. 编辑完确认 → 公式以渲染好的视觉块插入文本中
 * 4. 鼠标悬停公式块 → 出现编辑/删除按钮
 * 5. 最终存储格式仍然是 $...$ 混排字符串
 */
export function FormulaInput({
  value,
  onChange,
  placeholder = '输入内容，点击下方「插入公式」添加数学公式',
  minRows = 3,
  className,
  disabled = false,
}: FormulaInputProps) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 解析当前值为段落
  const segments = useMemo(() => parseMixedContent(value), [value]);

  // 插入新公式
  const handleInsertFormula = useCallback(() => {
    setEditingIndex(null);
    setEditorOpen(true);
  }, []);

  // 编辑已有公式
  const handleEditFormula = useCallback((segIndex: number) => {
    setEditingIndex(segIndex);
    setEditorOpen(true);
  }, []);

  // 删除公式
  const handleRemoveFormula = useCallback((segIndex: number) => {
    const newSegments = segments.filter((_, i) => i !== segIndex);
    onChange(buildMixedContent(newSegments));
  }, [segments, onChange]);

  // 确认编辑
  const handleEditorConfirm = useCallback((latex: string) => {
    if (editingIndex !== null) {
      // 编辑已有公式
      const newSegments = [...segments];
      newSegments[editingIndex] = { ...newSegments[editingIndex], content: latex };
      onChange(buildMixedContent(newSegments));
    } else {
      // 插入新公式：追加到文本末尾
      const formula = `$${latex}$`;
      const currentText = value || '';
      const separator = currentText && !currentText.endsWith(' ') && !currentText.endsWith('\n') ? ' ' : '';
      onChange(currentText + separator + formula);
    }
    setEditorOpen(false);
    setEditingIndex(null);
    // 聚焦回 textarea
    setTimeout(() => textareaRef.current?.focus(), 50);
  }, [editingIndex, segments, value, onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      {/* 混排预览区：仅在有公式时显示 */}
      {segments.length > 0 && segments.some(s => s.type === 'formula') && (
        <div className="border rounded-lg p-3 bg-muted/20 min-h-[40px]">
          <div className="flex items-center gap-1 mb-1.5">
            <Sigma className="w-3 h-3 text-primary" />
            <span className="text-[10px] text-muted-foreground font-medium">内容预览</span>
          </div>
          <div className="text-sm leading-relaxed flex flex-wrap items-center gap-y-1">
            {segments.map((seg, idx) => (
              seg.type === 'text' ? (
                <span key={seg.id}>{seg.content}</span>
              ) : (
                <FormulaBlock
                  key={seg.id}
                  latex={seg.content}
                  onEdit={() => handleEditFormula(idx)}
                  onRemove={() => handleRemoveFormula(idx)}
                />
              )
            ))}
          </div>
        </div>
      )}

      {/* 文本输入区（编辑原始内容） */}
      <textarea
        ref={textareaRef}
        className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y font-mono"
        style={{ minHeight: `${(minRows || 3) * 24}px` }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
      />

      {/* 插入公式按钮 */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1"
          onClick={handleInsertFormula}
          disabled={disabled}
        >
          <Sigma className="w-3.5 h-3.5" />
          插入公式
        </Button>
        <span className="text-[10px] text-muted-foreground">
          也可直接在文本框中输入 <code className="px-1 py-0.5 bg-muted rounded text-[10px]">$...$</code> 格式
        </span>
      </div>

      {/* MathLive 弹窗编辑器 */}
      {editorOpen && (
        <MathLiveEditor
          initialLatex={editingIndex !== null ? (segments[editingIndex]?.content || '') : ''}
          onConfirm={handleEditorConfirm}
          onCancel={() => { setEditorOpen(false); setEditingIndex(null); }}
          title={editingIndex !== null ? '编辑公式' : '插入公式'}
        />
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
 * 点击输入框 → 弹出 MathLive 编辑器编辑纯数学公式。
 * 适合选择题选项、简短答案等纯公式场景。
 * 非编辑状态下显示渲染好的公式预览。
 */
export function FormulaField({
  value,
  onChange,
  placeholder = '点击输入公式',
  className,
  disabled = false,
}: FormulaFieldProps) {
  const [editorOpen, setEditorOpen] = useState(false);

  const handleConfirm = useCallback((latex: string) => {
    onChange(latex);
    setEditorOpen(false);
  }, [onChange]);

  return (
    <>
      {/* 只读预览/触发按钮 */}
      <div
        className={cn(
          'border rounded-md px-3 py-2 text-sm cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-muted/20',
          'flex items-center gap-2 min-h-[36px]',
          disabled && 'opacity-50 cursor-not-allowed',
          className,
        )}
        onClick={() => !disabled && setEditorOpen(true)}
      >
        {value ? (
          <FormulaBlock latex={value} />
        ) : (
          <span className="text-muted-foreground text-xs">{placeholder}</span>
        )}
        <Edit3 className="w-3.5 h-3.5 text-muted-foreground ml-auto shrink-0" />
      </div>

      {/* MathLive 弹窗编辑器 */}
      {editorOpen && (
        <MathLiveEditor
          initialLatex={value}
          onConfirm={handleConfirm}
          onCancel={() => setEditorOpen(false)}
          title="编辑公式"
        />
      )}
    </>
  );
}
