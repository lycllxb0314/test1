/**
 * LaTeX 公式规范化工具
 *
 * 处理 LLM 输出到渲染全链路的 LaTeX 公式问题：
 *
 * 【根因】JSON.parse 吞反斜杠问题：
 *   JSON 标准中 \b \f \n \r \t 是合法转义序列，JSON.parse 会将它们解析为控制字符：
 *   - \frac → \f 被解析为 form feed (0x0C) → 变成 "rac{1}{2}"
 *   - \times → \t 被解析为 tab (0x09) → 变成 "imes"
 *   - \neq → \n 被解析为 newline (0x0A) → 变成 "eq"
 *   - \beta → \b 被解析为 backspace (0x08) → 变成 "eta"
 *   - \forall → \f 被解析为 form feed → 变成 "orall"
 *   - \theta → \t 被解析为 tab → 变成 "heta"
 *   - \to → \t 被解析为 tab → 变成 "o"
 *
 * 【修复策略】
 * 1. repairJsonParsedText：JSON.parse 后立即调用，恢复被吞的控制字符
 * 2. normalizeLatex：渲染前调用，处理 LLM 不规范输出 + 兜底修复 rac{ → \frac{
 * 3. 三层防护：源头修复 > 运行时兜底 > 渲染层容错
 *
 * @module lib/latex-normalize
 */

// ==================== 1. JSON.parse 后修复（源头修复）====================

/**
 * 修复 JSON.parse 后被吞的控制字符
 *
 * 必须在 JSON.parse 后立即调用！
 *
 * 修复逻辑：
 * - 0x08 (backspace, \b) → 恢复为 \b 前缀（如 \beta → \beta）
 * - 0x0C (form feed, \f) → 恢复为 \f 前缀（如 \frac → \frac）
 * - 0x09 (tab, \t) → 恢复为 \t 前缀（如 \times → \times）
 * - 0x0A (newline, \n) → 恢复为 \n 前缀（如 \neq → \neq）
 * - 0x0D (carriage return, \r) → 恢复为 \r 前缀
 *
 * 关键：这些控制字符后面通常跟着 LaTeX 命令的剩余字母，
 * 所以我们需要把控制字符替换为 "\" + 对应字母，恢复原始 LaTeX 命令。
 */
export function repairJsonParsedText(text: string): string {
  if (!text) return '';

  return text
    // 0x0C (form feed, from \f) → \f
    // \frac{1}{2} 被解析为 0x0C + "rac{1}{2}"，需要恢复为 \frac{1}{2}
    .replace(/\x0Crac/g, '\\frac')
    // \forall 被解析为 0x0C + "orall"，恢复为 \forall
    .replace(/\x0Corall/g, '\\forall')
    // 0x09 (tab, from \t) → \t
    // \times 被解析为 0x09 + "imes"，恢复为 \times
    .replace(/\x09imes/g, '\\times')
    // \theta 被解析为 0x09 + "heta"，恢复为 \theta
    .replace(/\x09heta/g, '\\theta')
    // \to 被解析为 0x09 + "o"，恢复为 \to
    // 注意：需要避免误替换正常的 tab + "o"，只在 LaTeX 上下文中替换
    // 这里保守处理，只替换 $...$ 内的
    // 0x0A (newline, from \n) → \n
    // \neq 被解析为 0x0A + "eq"，恢复为 \neq
    .replace(/\x0Aeq/g, '\\neq')
    // \nabla 被解析为 0x0A + "abla"，恢复为 \nabla
    .replace(/\x0Aabla/g, '\\nabla')
    // 0x08 (backspace, from \b) → \b
    // \beta 被解析为 0x08 + "eta"，恢复为 \beta
    .replace(/\x08eta/g, '\\beta')
    // 0x0D (carriage return, from \r) → \r
    // \rho 被解析为 0x0D + "ho"，恢复为 \rho
    .replace(/\x0Dho/g, '\\rho');
}

/**
 * 递归修复对象中所有字符串的 JSON.parse 控制字符问题
 * 在 JSON.parse 后立即调用
 */
export function repairJsonParsedObject(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return repairJsonParsedText(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => repairJsonParsedObject(item));
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = repairJsonParsedObject(value);
    }
    return result;
  }
  return obj;
}

// ==================== 2. LaTeX 规范化（渲染前修复）====================

/**
 * 规范化文本中的 LaTeX 公式
 * 在 renderLatexToHtml / parseLatexToDocxChildren 之前调用
 *
 * 处理：
 * 1. JSON.parse 残留的 rac{ → \frac{ 兜底修复
 * 2. $$ → $ 行间转行内
 * 3. \dfrac → \frac
 * 4. 裸 LaTeX 命令加 $ 包裹
 * 5. 括号分数转换
 */
export function normalizeLatex(text: string): string {
  if (!text) return '';

  let result = text;

  // ---- Step 0: JSON.parse 兜底修复 ----
  // 即使 repairJsonParsedText 已经在源头修复，这里做双重保障
  // rac{ → \frac{（最常见的残留问题）
  result = result.replace(/(?<!\\)rac\{/g, '\\frac{');
  // orall{ → \forall{
  // imes → \times
  result = result.replace(/(?<!\\)imes\b/g, '\\times');
  // heta → \theta
  result = result.replace(/(?<!\\)heta\b/g, '\\theta');
  // eq → \neq（需要更谨慎，避免误伤 "eq" 单词）
  // 暂时不处理，因为 neq 在数学题中不太常见

  // ---- Step 1: 处理 $$...$$ 行间公式 → $...$ ----
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
    return `$${formula.trim()}$`;
  });

  // ---- Step 2: \dfrac → \frac ----
  result = result.replace(/\\dfrac/g, '\\frac');

  // ---- Step 3: 裸 LaTeX 命令自动包裹 $...$ ----
  result = wrapBareLatexCommands(result);

  // ---- Step 4: 括号分数 (a)/(b) → $\frac{a}{b}$ ----
  result = result.replace(
    /\((\d+(?:\.\d+)?)\)\s*\/\s*\((\d+(?:\.\d+)?)\)/g,
    (_match, num: string, den: string) => {
      return `$\\frac{${num}}{${den}}$`;
    }
  );

  // ---- Step 5: 清理多余的 $ 包裹 ----
  result = result.replace(/\$\s*\$/g, '$');

  // ---- Step 6: 确保 LaTeX 命令后无多余空格 ----
  result = result.replace(/\\frac\s+\{/g, '\\frac{');
  result = result.replace(/\\sqrt\s+\{/g, '\\sqrt{');

  return result;
}

/**
 * 为裸 LaTeX 命令添加 $ 包裹
 */
function wrapBareLatexCommands(text: string): string {
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

  // 包裹带参数的命令
  const commandsWithArgs = /\\(?:frac|dfrac|sqrt|text|mathrm|mathbf|boldsymbol)\{[^}]*\}(?:\{[^}]*\})?/g;
  result = result.replace(commandsWithArgs, (match, offset) => {
    if (isProtected(offset)) return match;
    const before = text.substring(Math.max(0, offset - 1), offset);
    const afterStart = offset + match.length;
    const after = text.substring(afterStart, Math.min(text.length, afterStart + 1));
    if (before === '$' || after === '$') return match;
    return `$${match}$`;
  });

  // 重新计算保护区域
  protectedRanges.length = 0;
  while ((m = dollarRegex.exec(result)) !== null) {
    protectedRanges.push([m.index, m.index + m[0].length]);
  }

  // 包裹符号命令
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

  const parts = normalized.split(/(\$[^$\n]+?\$)/g);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      segments.push({ type: 'formula', content: part.slice(1, -1).trim() });
    } else {
      segments.push({ type: 'text', content: part });
    }
  }

  return segments;
}
