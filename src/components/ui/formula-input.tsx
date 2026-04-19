/**
 * 可视化公式编辑器（contenteditable 混排 + 弹窗 MathLive）
 *
 * 核心交互：
 * - FormulaInput：一个输入框，文字和渲染好的公式混排
 *   - 文字直接打字，公式是内联渲染块
 *   - 点「插入公式」→ 弹窗打开 MathLive → 确认后公式插入输入框
 *   - 点击已有公式 → 弹窗编辑
 *   - 用户全程看不到 LaTeX 代码
 *
 * - FormulaField：纯公式编辑器
 *   - 点输入框 → 弹窗 MathLive → 确认后显示渲染结果
 *
 * 弹窗设计：
 * - 只能通过「取消」「确认」按钮关闭
 * - 不响应背景点击（解决 MathLive 虚拟键盘冲突）
 *
 * @module components/ui/formula-input
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Sigma, X, Check } from 'lucide-react';

// ==================== KaTeX 渲染 ====================

/**
 * 将 LaTeX 渲染为 HTML 字符串（同步，用于 formula chip）
 */
function renderLatex(latex: string): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const katex = require('katex');
    return katex.renderToString(latex, {
      throwOnError: false,
      strict: false,
      displayMode: false,
    });
  } catch {
    return `<span style="color:red;font-size:12px">${latex}</span>`;
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
        // contenteditable 的换行产生 <div>，转为 \n
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

// ==================== MathLive 弹窗编辑器 ====================

type PopupEditorProps = {
  initialLatex: string;
  onConfirm: (latex: string) => void;
  onCancel: () => void;
  title?: string;
};

function PopupEditor({ initialLatex, onConfirm, onCancel, title = '编辑公式' }: PopupEditorProps) {
  const mfContainerRef = useRef<HTMLDivElement>(null);
  const mfRef = useRef<HTMLElement | null>(null);
  const [currentLatex, setCurrentLatex] = useState(initialLatex);

  useEffect(() => {
    let mounted = true;

    const loadAndCreate = async () => {
      try {
        await import('mathlive');
      } catch (err) {
        console.error('[PopupEditor] MathLive 加载失败:', err);
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
      mf.style.minHeight = '60px';
      mf.style.fontSize = '18px';
      mf.style.border = '2px solid hsl(var(--primary))';
      mf.style.borderRadius = '8px';
      mf.style.padding = '8px 12px';
      mf.style.background = 'var(--background)';
      mf.style.boxShadow = '0 0 0 3px hsl(var(--primary) / 0.12)';

      mfContainerRef.current.appendChild(mf);
      mfRef.current = mf;
      setTimeout(() => mf.focus(), 100);
    };

    loadAndCreate();

    return () => {
      mounted = false;
      if (mfRef.current && mfRef.current.parentNode) {
        mfRef.current.parentNode.removeChild(mfRef.current);
      }
    };
  }, [initialLatex]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* 背景遮罩 — 不绑定关闭事件，防止虚拟键盘冲突 */}
      <div className="absolute inset-0 bg-black/40" />

      {/* 弹窗主体 */}
      <div className="relative bg-background border rounded-xl shadow-2xl w-full max-w-xl mx-4 z-10 animate-in zoom-in-95 duration-150">
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <span className="text-sm font-medium flex items-center gap-2">
            <Sigma className="w-4 h-4 text-primary" />
            {title}
          </span>
          <button
            type="button"
            onClick={onCancel}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* MathLive 编辑区 */}
        <div className="p-5">
          <div ref={mfContainerRef} className="w-full" />
          <p className="text-[10px] text-muted-foreground mt-2">
            输入 sqrt 得根号、frac 得分数、^ 得上标，点击编辑区弹出虚拟键盘
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t">
          <Button variant="outline" size="sm" onClick={onCancel}>取消</Button>
          <Button size="sm" className="gap-1" onClick={() => onConfirm(currentLatex)}>
            <Check className="w-3.5 h-3.5" />
            确认
          </Button>
        </div>
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
 * - 点「插入公式」→ 弹窗 MathLive → 确认后公式以渲染形式插入
 * - 点击已有公式 → 弹窗编辑
 * - 悬停公式 → 显示编辑/删除
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
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupLatex, setPopupLatex] = useState('');
  const editingChipRef = useRef<HTMLElement | null>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const isLocalEdit = useRef(false);
  const prevValueRef = useRef(value);

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

  // 保存光标位置（打开弹窗前调用）
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
      setPopupLatex(decodeURIComponent(chip.dataset.formula || ''));
      setPopupOpen(true);
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
    setPopupLatex('');
    setPopupOpen(true);
  }, [saveCursor]);

  // 弹窗确认
  const handlePopupConfirm = useCallback((latex: string) => {
    if (!latex.trim()) {
      // 空公式不插入
      setPopupOpen(false);
      return;
    }

    if (editingChipRef.current) {
      // 编辑已有公式
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
        // 在公式后插入一个空格文本节点，方便继续输入
        const space = document.createTextNode('\u00A0');
        span.after(space);
        // 光标移到空格后
        range.setStartAfter(space);
        range.collapse(true);
        sel?.removeAllRanges();
        sel?.addRange(range);
      } else {
        // 没有保存的光标位置，追加到末尾
        const space = document.createTextNode('\u00A0');
        editorRef.current?.appendChild(span);
        editorRef.current?.appendChild(space);
      }
    }

    setPopupOpen(false);
    editingChipRef.current = null;
    syncToParent();
  }, [syncToParent]);

  // 弹窗取消
  const handlePopupCancel = useCallback(() => {
    setPopupOpen(false);
    editingChipRef.current = null;
    // 恢复光标
    setTimeout(restoreCursor, 50);
  }, [restoreCursor]);

  // 删除公式
  const handleDeleteFormula = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const chip = target.closest('[data-formula]') as HTMLElement | null;
    if (chip) {
      e.preventDefault();
      e.stopPropagation();
      // 删除公式后面可能的空格
      const next = chip.nextSibling;
      if (next && next.nodeType === Node.TEXT_NODE && next.textContent === '\u00A0') {
        next.remove();
      }
      chip.remove();
      syncToParent();
    }
  }, [syncToParent]);

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
    <div className={cn('space-y-2', className)}>
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
        )}
        style={{ minHeight: `${(minRows || 3) * 24}px` }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />

      {/* 操作栏 */}
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
          点击已有公式可编辑或删除
        </span>
      </div>

      {/* MathLive 弹窗 */}
      {popupOpen && (
        <PopupEditor
          initialLatex={popupLatex}
          onConfirm={handlePopupConfirm}
          onCancel={handlePopupCancel}
          title={editingChipRef.current ? '编辑公式' : '插入公式'}
        />
      )}

      {/* 公式编辑/删除悬停按钮（通过事件委托） */}
      {/* 用全局样式实现悬停效果 */}
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
 * - 显示渲染好的公式，点击弹窗编辑
 * - 存储纯 LaTeX（不含 $ 包裹）
 */
export function FormulaField({
  value,
  onChange,
  placeholder = '点击输入公式',
  className,
  disabled = false,
}: FormulaFieldProps) {
  const [popupOpen, setPopupOpen] = useState(false);
  const displayRef = useRef<HTMLSpanElement>(null);

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
    setPopupOpen(false);
  }, [onChange]);

  return (
    <>
      <div
        className={cn(
          'border rounded-md px-3 py-2 text-sm cursor-pointer transition-colors',
          'hover:border-primary/50 hover:bg-primary/5',
          'flex items-center gap-2 min-h-[36px]',
          disabled && 'opacity-50 cursor-not-allowed',
          !value && 'border-dashed',
          className,
        )}
        onClick={() => !disabled && setPopupOpen(true)}
      >
        {value ? (
          <span ref={displayRef} className="inline-block align-middle" />
        ) : (
          <span className="text-muted-foreground text-xs flex items-center gap-1">
            <Sigma className="w-3.5 h-3.5" />
            {placeholder}
          </span>
        )}
        <span className="text-[10px] text-primary/40 ml-auto shrink-0">点击编辑</span>
      </div>

      {popupOpen && (
        <PopupEditor
          initialLatex={value}
          onConfirm={handleConfirm}
          onCancel={() => setPopupOpen(false)}
          title="编辑公式"
        />
      )}
    </>
  );
}
