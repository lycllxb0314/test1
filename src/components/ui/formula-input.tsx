/**
 * 可视化公式编辑器（contenteditable 混排 + 内联 MathLive）
 *
 * 核心架构：
 * - FormulaInput：一个输入框，文字和渲染好的公式混排
 *   - 文字直接打字，公式是内联渲染块
 *   - 点「插入公式」→ 下方展开 MathLive 编辑器 → 确认后公式插入输入框
 *   - 点击已有公式 → 下方展开编辑器（编辑模式）
 *   - 用户全程看不到 LaTeX 代码
 *
 * - FormulaField：纯公式编辑器
 *   - 点输入框 → 下方展开 MathLive → 确认后显示渲染结果
 *
 * 关键设计：
 * - 内联展开（非弹窗 overlay），彻底避免 z-index / Dialog 冲突
 * - 虚拟键盘由 MathLive 管理，点击编辑区外自动关闭
 * - 导出 isFormulaEditorActive() 供外部 Dialog 防止误关
 *
 * @module components/ui/formula-input
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sigma, X, Check, Pencil } from 'lucide-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// ==================== 全局状态：公式编辑器是否激活 ====================

let _formulaEditorActive = false;

/** 外部 Dialog 可用此函数判断公式编辑器是否激活，防止误关 */
export function isFormulaEditorActive(): boolean {
  return _formulaEditorActive;
}

// ==================== KaTeX 渲染 ====================

/**
 * 将 LaTeX 渲染为 HTML 字符串（同步，用于 formula chip）
 */
function renderLatex(latex: string): string {
  try {
    if (!katex || typeof katex.renderToString !== 'function') {
      console.warn('[FormulaInput] katex 未正确加载');
      return `<span style="color:var(--destructive);font-size:12px">[公式加载失败]</span>`;
    }
    return katex.renderToString(latex, {
      throwOnError: false,
      strict: false,
      displayMode: false,
    });
  } catch (err) {
    console.warn('[FormulaInput] KaTeX 渲染失败:', latex, err);
    return `<span style="color:var(--destructive);font-size:12px">[${latex}]</span>`;
  }
}

// ==================== $...$ 混排 ↔ HTML 互转 ====================

/** 将 $...$ 混排文本转为 contenteditable 用的 HTML */
function mixedToHTML(value: string): string {
  if (!value) return '';
  return value.replace(/\$([^$]+)\$/g, (_match, latex: string) => {
    const rendered = renderLatex(latex);
    return `<span data-formula="${encodeURIComponent(latex)}" contenteditable="false" ` +
      `class="formula-chip" ` +
      `title="点击编辑公式">${rendered}</span>`;
  });
}

/** 从 contenteditable DOM 提取 $...$ 混排文本 */
function extractFromDOM(container: HTMLElement): string {
  let result = '';
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.dataset.formula !== undefined) {
        result += `$${decodeURIComponent(el.dataset.formula)}$`;
      } else if (el.tagName === 'BR') {
        result += '\n';
      } else if (el.tagName === 'DIV' && result.length > 0) {
        result += '\n';
        el.childNodes.forEach(walk);
      } else {
        el.childNodes.forEach(walk);
      }
    }
  };
  container.childNodes.forEach(walk);
  return result;
}

// ==================== 内联 MathLive 编辑器 ====================

type InlineEditorProps = {
  initialLatex: string;
  onConfirm: (latex: string) => void;
  onCancel: () => void;
  title?: string;
};

function InlineEditor({ initialLatex, onConfirm, onCancel, title = '编辑公式' }: InlineEditorProps) {
  const mfContainerRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<HTMLElement | null>(null);
  const [currentLatex, setCurrentLatex] = useState(initialLatex);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;

    const loadAndCreate = async () => {
      try {
        await import('mathlive');
      } catch (err) {
        console.error('[InlineEditor] MathLive 加载失败:', err);
        return;
      }
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
        placeholder: '输入公式，如 sqrt 得根号、frac 得分数',
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
      mf.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.12)';

      mfContainerRef.current.appendChild(mf);
      mfRef.current = mf;

      // 延迟聚焦 + 滚动到视图
      setTimeout(() => {
        mf.focus();
        editorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    };

    loadAndCreate();

    return () => {
      mounted = false;
      // 清理 math-field
      if (mfRef.current && mfRef.current.parentNode) {
        mfRef.current.parentNode.removeChild(mfRef.current);
      }
      // 关闭虚拟键盘
      try {
        const vk = (window as unknown as Record<string, unknown>).mathVirtualKeyboard;
        if (vk && typeof (vk as { hide: () => void }).hide === 'function') {
          (vk as { hide: () => void }).hide();
        }
      } catch { /* ignore */ }
    };
  }, [initialLatex]);

  // 点击编辑器外部关闭虚拟键盘
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      // 如果点击在 math-field 内或虚拟键盘内，不处理
      if (target.closest('math-field')) return;
      if (target.closest('#mathlive-virtual-keyboard-panel')) return;
      if (target.closest('.ML__keyboard')) return;

      // 点击在编辑器面板内，不关闭
      if (editorRef.current && editorRef.current.contains(target)) return;

      // 点击在其他区域，关闭虚拟键盘
      try {
        const vk = (window as unknown as Record<string, unknown>).mathVirtualKeyboard;
        if (vk && typeof (vk as { hide: () => void }).hide === 'function') {
          (vk as { hide: () => void }).hide();
        }
      } catch { /* ignore */ }
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, []);

  return (
    <div
      ref={editorRef}
      className="mt-2 border rounded-lg bg-card overflow-hidden animate-in slide-in-from-top-2 duration-200"
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <span className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
          <Sigma className="w-3.5 h-3.5 text-primary" />
          {title}
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* MathLive 编辑区 */}
      <div className="p-3">
        <div ref={mfContainerRef} className="w-full" />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          输入 sqrt 得根号、frac 得分数、^ 得上标，点击编辑区弹出虚拟键盘
        </p>
      </div>

      {/* 底部按钮 */}
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t bg-muted/30">
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onCancel}>取消</Button>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => onConfirm(currentLatex)}>
          <Check className="w-3 h-3" />
          确认
        </Button>
      </div>
    </div>
  );
}

// ==================== FormulaInput ====================

type FormulaInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
  disabled?: boolean;
};

/**
 * 文字+公式混排编辑器
 *
 * - 一个 contenteditable 输入框，文字和渲染好的公式混在一起
 * - 点「插入公式」→ 下方展开 MathLive 编辑器 → 确认后公式以渲染形式插入
 * - 点击已有公式 → 下方展开编辑器（编辑模式）
 * - 用户全程看不到 LaTeX 代码
 */
export function FormulaInput({
  value,
  onChange,
  placeholder = '输入内容，需要公式时点击下方按钮',
  minRows = 3,
  className,
  disabled = false,
}: FormulaInputProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineLatex, setInlineLatex] = useState('');
  const [editMode, setEditMode] = useState(false); // false=插入, true=编辑
  const editingChipRef = useRef<HTMLElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isLocalEdit = useRef(false);
  const prevValueRef = useRef(value);

  // 同步全局编辑器激活状态
  useEffect(() => {
    _formulaEditorActive = inlineOpen;
    return () => {
      if (inlineOpen) _formulaEditorActive = false;
    };
  }, [inlineOpen]);

  // 初始化内容
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = mixedToHTML(value);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 外部 value 变化时同步 DOM（非本地编辑引起）
  useEffect(() => {
    if (isLocalEdit.current) {
      isLocalEdit.current = false;
      prevValueRef.current = value;
      return;
    }
    if (value !== prevValueRef.current && editorRef.current) {
      editorRef.current.innerHTML = mixedToHTML(value);
      prevValueRef.current = value;
    }
  }, [value]);

  // 提取内容并同步到父组件
  const syncToParent = useCallback(() => {
    if (!editorRef.current) return;
    const v = extractFromDOM(editorRef.current);
    isLocalEdit.current = true;
    prevValueRef.current = v;
    onChange(v);
  }, [onChange]);

  // contenteditable 输入事件
  const handleInput = useCallback(() => {
    syncToParent();
  }, [syncToParent]);

  // 保存光标位置（打开编辑器前调用）
  const saveCursor = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  // 恢复光标位置
  const restoreCursor = useCallback(() => {
    if (savedRangeRef.current && editorRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      }
    }
  }, []);

  // 点击事件：检测是否点击了公式
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const chip = target.closest('[data-formula]') as HTMLElement | null;
    if (chip) {
      e.preventDefault();
      saveCursor();
      editingChipRef.current = chip;
      setInlineLatex(decodeURIComponent(chip.dataset.formula || ''));
      setEditMode(true);
      setInlineOpen(true);
    }
  }, [saveCursor]);

  // 插入公式按钮
  const handleInsertFormula = useCallback(() => {
    if (!editorRef.current) return;

    // 如果内容为空或只有 placeholder，清空再插入
    if (!editorRef.current.textContent?.trim() && !editorRef.current.querySelector('[data-formula]')) {
      editorRef.current.innerHTML = '';
    }

    saveCursor();
    editingChipRef.current = null;
    setInlineLatex('');
    setEditMode(false);
    setInlineOpen(true);
  }, [saveCursor]);

  // 内联编辑器确认
  const handleInlineConfirm = useCallback((latex: string) => {
    if (!latex.trim()) {
      setInlineOpen(false);
      return;
    }

    if (editingChipRef.current) {
      // 编辑已有公式 — 更新 data-formula 和渲染内容
      editingChipRef.current.dataset.formula = encodeURIComponent(latex);
      editingChipRef.current.innerHTML = renderLatex(latex);
    } else {
      // 插入新公式
      const span = document.createElement('span');
      span.dataset.formula = encodeURIComponent(latex);
      span.contentEditable = 'false';
      span.className = 'formula-chip';
      span.title = '点击编辑公式';
      span.innerHTML = renderLatex(latex);

      // 在光标位置插入
      const sel = window.getSelection();
      if (savedRangeRef.current) {
        const range = savedRangeRef.current;
        range.deleteContents();
        range.insertNode(span);
        const space = document.createTextNode('\u00A0');
        span.after(space);
        range.setStartAfter(space);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else {
        const space = document.createTextNode('\u00A0');
        editorRef.current?.appendChild(span);
        editorRef.current?.appendChild(space);
      }
    }

    setInlineOpen(false);
    editingChipRef.current = null;
    syncToParent();
  }, [syncToParent]);

  // 内联编辑器取消
  const handleInlineCancel = useCallback(() => {
    setInlineOpen(false);
    editingChipRef.current = null;
    setTimeout(restoreCursor, 50);
  }, [restoreCursor]);

  // 粘贴时只保留纯文本
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // 失焦时同步
  const handleBlur = useCallback(() => {
    syncToParent();
  }, [syncToParent]);

  return (
    <div className={cn('space-y-0', className)}>
      {/* contenteditable 编辑区 */}
      <div
        ref={editorRef}
        contentEditable={!disabled}
        onInput={handleInput}
        onClick={handleClick}
        onBlur={handleBlur}
        onPaste={handlePaste}
        className={cn(
          'min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background placeholder:text-muted-foreground',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'whitespace-pre-wrap break-words',
          inlineOpen && 'rounded-b-none border-b-0',
        )}
        style={{ minHeight: `${(minRows || 3) * 24}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* 操作栏 + 内联编辑器容器 */}
      <div className={cn(
        'border border-t-0 rounded-b-md',
        inlineOpen ? 'border-input' : 'border-transparent',
      )}>
        {/* 操作按钮 */}
        <div className="flex items-center gap-2 px-1 py-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-primary"
            onClick={handleInsertFormula}
            disabled={disabled || inlineOpen}
          >
            <Sigma className="w-3 h-3" />
            插入公式
          </Button>
          <span className="text-[10px] text-muted-foreground/60">
            点击已有公式可编辑
          </span>
        </div>

        {/* 内联 MathLive 编辑器 */}
        {inlineOpen && (
          <InlineEditor
            initialLatex={inlineLatex}
            onConfirm={handleInlineConfirm}
            onCancel={handleInlineCancel}
            title={editMode ? '编辑公式' : '插入公式'}
          />
        )}
      </div>
    </div>
  );
}

// ==================== FormulaField ====================

type FormulaFieldProps = {
  value: string;
  onChange: (latex: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

/**
 * 纯公式编辑器
 * - 显示渲染好的公式，点击下方展开编辑器
 * - 存储纯 LaTeX（不含 $ 包裹）
 */
export function FormulaField({
  value,
  onChange,
  placeholder = '点击输入公式',
  className,
  disabled = false,
}: FormulaFieldProps) {
  const [inlineOpen, setInlineOpen] = useState(false);
  const displayRef = useRef<HTMLSpanElement>(null);

  // 同步全局编辑器激活状态
  useEffect(() => {
    _formulaEditorActive = inlineOpen;
    return () => {
      if (inlineOpen) _formulaEditorActive = false;
    };
  }, [inlineOpen]);

  // 渲染公式预览
  useEffect(() => {
    if (!displayRef.current) return;
    if (!value) {
      displayRef.current.innerHTML = '';
      return;
    }
    const html = renderLatex(value);
    const container = document.createElement('span');
    container.innerHTML = html;
    displayRef.current.replaceChildren(container);
  }, [value]);

  const handleConfirm = useCallback((latex: string) => {
    onChange(latex);
    setInlineOpen(false);
  }, [onChange]);

  return (
    <div className={cn('space-y-0', className)}>
      {/* 显示/触发区 */}
      <div
        className={cn(
          'border rounded-md px-3 py-2 text-sm cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-primary/5',
          'flex items-center gap-2 min-h-[36px]',
          disabled && 'opacity-50 cursor-not-allowed',
          !value && 'border-dashed',
          inlineOpen && 'rounded-b-none border-b-0 border-primary/50',
        )}
        onClick={() => !disabled && !inlineOpen && setInlineOpen(true)}
      >
        {value ? (
          <span ref={displayRef} className="inline-block align-middle flex-1" />
        ) : (
          <span className="text-muted-foreground text-xs flex items-center gap-1 flex-1">
            <Sigma className="w-3.5 h-3.5" />
            {placeholder}
          </span>
        )}
        {!inlineOpen && (
          <span className="text-[10px] text-primary/40 ml-auto shrink-0 flex items-center gap-0.5">
            <Pencil className="w-2.5 h-2.5" />
            编辑
          </span>
        )}
      </div>

      {/* 内联编辑器 */}
      {inlineOpen && (
        <div className="border border-t-0 rounded-b-md border-primary/50">
          <InlineEditor
            initialLatex={value}
            onConfirm={handleConfirm}
            onCancel={() => setInlineOpen(false)}
            title="编辑公式"
          />
        </div>
      )}
    </div>
  );
}
