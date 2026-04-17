/**
 * LaTeX 公式规范化工具
 *
 * 处理 LLM 输出的常见不规范 LaTeX 格式，统一为标准格式后再渲染。
 *
 * 设计原则：
 * - **保守转换**：只做高置信度的转换，宁可保留原文也不错误转换
 * - **不转换纯文本分数**：3/4 等纯文本可能是日期、课时编号等，不自动转
 *   为 $\frac{3}{4}$（如果 LLM 输出的是分数，应该用 $\frac{}{}$ 格式）
 *
 * 主要处理：
 * 1. $$...$$ 行间公式 → $...$
 * 2. \dfrac → \frac
 * 3. 裸 LaTeX 命令（无 $ 包裹）→ 自动加 $ 包裹
 * 4. (a)/(b) 括号分数 → $\frac{a}{b}$
 * 5. 多余空格清理
 *
 * @module lib/latex-normalize
 */

// ==================== LaTeX 规范化 ====================

/**
 * 规范化文本中的 LaTeX 公式
 * 在 renderMathInElement / renderLatexToHtml / parseLatexToDocxChildren 之前调用
 */
export function normalizeLatex(text: string): string {
  if (!text) return '';

  let result = text;

  // ---- Step 1: 处理 $$...$$ 行间公式 → $...$ ----
  // LLM 有时输出 $$\frac{1}{2}$$，需要转为 $...$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
    return `$${formula.trim()}$`;
  });

  // ---- Step 2: \dfrac → \frac ----
  // \dfrac 是 \frac 的 display 模式变体，在行内公式中等价
  // 必须在 wrapBareLatexCommands 之前执行，否则 \dfrac 会被单独包裹
  result = result.replace(/\\dfrac/g, '\\frac');

  // ---- Step 3: 裸 LaTeX 命令自动包裹 $...$ ----
  // 处理没有 $ 包裹的 \frac{a}{b}、\sqrt{x}、\times 等
  result = wrapBareLatexCommands(result);

  // ---- Step 4: 括号分数 (a)/(b) → $\frac{a}{b}$ ----
  // 仅匹配数字括号分数，这是高置信度的转换
  // (1)/(2) → $\frac{1}{2}$ ✓
  // (3.5)/(7) → $\frac{3.5}{7}$ ✓
  result = result.replace(
    /\((\d+(?:\.\d+)?)\)\s*\/\s*\((\d+(?:\.\d+)?)\)/g,
    (_match, num: string, den: string) => {
      return `$\\frac{${num}}{${den}}$`;
    }
  );

  // ---- Step 5: 清理多余的 $ 包裹 ----
  // 处理连续的 $ 符号（如 $$ → $，空公式 $$ → $）
  result = result.replace(/\$\s*\$/g, '$');

  // ---- Step 6: 确保 LaTeX 命令后无多余空格 ----
  // \frac {1} {2} → \frac{1}{2}
  result = result.replace(/\\frac\s+\{/g, '\\frac{');
  result = result.replace(/\\sqrt\s+\{/g, '\\sqrt{');

  return result;
}

/**
 * 为裸 LaTeX 命令添加 $ 包裹
 *
 * 处理模式：
 * - \frac{1}{2} → $\frac{1}{2}$
 * - \sqrt{x} → $\sqrt{x}$
 * - \times → $\times$
 *
 * 注意：不会对已在 $...$ 内的命令重复包裹
 */
function wrapBareLatexCommands(text: string): string {
  // 先标记已有的 $...$ 区域，避免重复包裹
  const protectedRanges: Array<[number, number]> = [];
  const dollarRegex = /\$[^$]+?\$/g;
  let m: RegExpExecArray | null;
  while ((m = dollarRegex.exec(text)) !== null) {
    protectedRanges.push([m.index, m.index + m[0].length]);
  }

  function isProtected(pos: number): boolean {
    return protectedRanges.some(([start, end]) => pos >= start && pos < end);
  }

  let result = text;

  // 包裹带参数的命令：\frac{...}{...}、\sqrt{...}、\text{...} 等
  const commandsWithArgs = /\\(?:frac|dfrac|sqrt|text|mathrm|mathbf|boldsymbol)\{[^}]*\}(?:\{[^}]*\})?/g;
  result = result.replace(commandsWithArgs, (match, offset) => {
    if (isProtected(offset)) return match;
    // 检查前后是否已经有 $（避免重复包裹）
    const before = text.substring(Math.max(0, offset - 1), offset);
    const afterStart = offset + match.length;
    const after = text.substring(afterStart, Math.min(text.length, afterStart + 1));
    if (before === '$' || after === '$') return match;
    return `$${match}$`;
  });

  // 重新计算保护区域（因为文本已变化）
  protectedRanges.length = 0;
  while ((m = dollarRegex.exec(result)) !== null) {
    protectedRanges.push([m.index, m.index + m[0].length]);
  }

  // 包裹符号命令：\times、\div、\pi 等
  const symbolCommands = /\\(?:times|div|pm|mp|neq|leq|geq|approx|equiv|infty|angle|degree|circ|perp|parallel|triangle|pi|theta|alpha|beta|gamma|sum|prod|int|cdot|ldots|cdots|rightarrow|leftarrow|Rightarrow|Leftarrow)/g;
  result = result.replace(symbolCommands, (match, offset) => {
    if (isProtected(offset)) return match;
    return `$${match}$`;
  });

  return result;
}

/**
 * 从文本中提取所有 LaTeX 公式（已规范化），返回分割后的片段
 * 用于 Word 导出（docx Math 组件）
 */
export function extractLatexSegments(text: string): Array<{ type: 'text' | 'formula'; content: string }> {
  const normalized = normalizeLatex(text);
  const segments: Array<{ type: 'text' | 'formula'; content: string }> = [];

  // 按 $...$ 分割
  const parts = normalized.split(/(\$[^$\n]+?\$)/g);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      // LaTeX 公式
      segments.push({ type: 'formula', content: part.slice(1, -1).trim() });
    } else {
      segments.push({ type: 'text', content: part });
    }
  }

  return segments;
}
