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
 * 【根因】JSON 标准中 \b \f \n \r \t 是合法转义序列，JSON.parse 会将它们解析为控制字符：
 *   \frac   → \f 被解析为 0x0C (form feed)  → 变成 0x0C + "rac"
 *   \times  → \t 被解析为 0x09 (tab)        → 变成 0x09 + "imes"
 *   \neq    → \n 被解析为 0x0A (newline)     → 变成 0x0A + "eq"
 *   \beta   → \b 被解析为 0x08 (backspace)   → 变成 0x08 + "eta"
 *   \rho    → \r 被解析为 0x0D (carriage ret) → 变成 0x0D + "ho"
 *
 * 【通用修复策略】
 * 将控制字符替换为 "\" + 对应字母，让后跟的字母自动拼回完整 LaTeX 命令：
 *   0x0C → \f  → \frac{1}{2}、\forall、\flat ... 全部自动恢复
 *   0x09 → \t  → \times、\theta、\to、\therefore、\tilde、\tfrac ... 全部自动恢复
 *   0x08 → \b  → \beta、\bar、\begin ... 全部自动恢复
 *   0x0A → \n  → \neq、\nabla、\nu、\not ... 全部自动恢复
 *   0x0D → \r  → \rho、\rightarrow ... 全部自动恢复
 *
 * 对 0x0A (newline) 和 0x0D (carriage return) 采取保守策略：
 * 只在后面紧跟小写字母时替换（说明原本是 LaTeX 命令），否则保留原样（可能是真正的换行）。
 * 0x08 (backspace)、0x0C (form feed)、0x09 (tab) 在数学题文本中不可能有合法用途，全部替换。
 */
export function repairJsonParsedText(text: string): string {
  if (!text) return '';

  return text
    // 0x0C (form feed, from \f) → \f — 数学文本中不可能合法出现，全部替换
    .replace(/\x0C/g, '\\f')
    // 0x08 (backspace, from \b) → \b — 数学文本中不可能合法出现，全部替换
    .replace(/\x08/g, '\\b')
    // 0x09 (tab, from \t) → \t — 数学文本中极不可能作为对齐使用，全部替换
    .replace(/\x09/g, '\\t')
    // 0x0A (newline, from \n) → \n — 仅当后跟小写字母时替换（LaTeX 命令特征）
    // \neq, \nabla, \nu, \not, \nearrow, \nleftarrow, \nRightarrow, \nsubseteq ...
    .replace(/\x0A([a-z])/g, '\\n$1')
    // 0x0D (carriage return, from \r) → \r — 仅当后跟小写字母时替换
    // \rho, \rightarrow, \Rightarrow, \rangle, \rbrace, \rfloor ...
    .replace(/\x0D([a-z])/g, '\\r$1');
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

  // ---- Step -1: 清理数据库中已有的双重修复残留 ----
  // 之前版本的 Step 0 + Step 0.5 会双重修复，导致 \f\frac{ \t\times 等模式
  // 通用模式：\<control-letter>\<same-letter-starting-command> → \<command>
  // 例如 \f\frac → \frac, \t\times → \times, \b\beta → \beta, \n\neq → \neq, \r\rho → \rho
  result = result.replace(/\\([fbtrn])\\(\1[a-z]+)/g, '\\$2');

  // ---- Step 0: 控制字符兜底修复 ----
  // 数据库中可能残留 JSON.parse 产生的控制字符，在此统一清除
  // 与 repairJsonParsedText 相同的通用策略，确保从任何来源的数据都能被修复
  result = result
    .replace(/\x0C/g, '\\f')              // form feed → \f
    .replace(/\x08/g, '\\b')              // backspace → \b
    .replace(/\x09/g, '\\t')              // tab → \t
    .replace(/\x0A([a-z])/g, '\\n$1')    // newline + 小写字母 → \n + 字母
    .replace(/\x0D([a-z])/g, '\\r$1');   // carriage return + 小写字母 → \r + 字母

  // ---- Step 0.3: 清理 Step 0 可能产生的新的双重修复 ----
  // 如果 Step 0 将 0x0C → \f，而原文已有 \frac{，会形成 \f\frac{
  result = result.replace(/\\([fbtrn])\\(\1[a-z]+)/g, '\\$2');

  // ---- Step 0.5: 孤立后缀兜底修复 ----
  // 仅修复控制字符被完全删除后仅剩后缀的情况（如 "rac{" 而非 "\x0Crac{"）
  // 【关键】lookbehind 必须排除 Step 0 已正确重组的命令：
  //   \frac{ 中的 rac{ 前面是 \f，不能匹配（否则会插入多余 \f）
  //   \times 中的 imes 前面是 \t，不能匹配
  //   \neq   中的 eq   前面是 \n，不能匹配（且 n 是小写字母）
  //   \beta  中的 eta  前面是 \b，不能匹配（且 b 是小写字母）
  //   \theta 中的 heta 前面是 \t，不能匹配
  //   \rho   中的 ho   前面是 \r，不能匹配
  //   \forall 中的 orall 前面是 \f，不能匹配
  //   \nabla 中的 abla 前面是 \n，不能匹配
  result = result.replace(/(?<!\\f)rac\{/g, '\\frac{');
  result = result.replace(/(?<!\\f)orall\b/g, '\\forall');
  result = result.replace(/(?<!\\t)imes\b/g, '\\times');
  result = result.replace(/(?<!\\t)heta\b/g, '\\theta');
  result = result.replace(/(?<!\\n)(?<![a-z])eq\b/g, '\\neq');
  result = result.replace(/(?<!\\n)abla\b/g, '\\nabla');
  result = result.replace(/(?<!\\b)(?<!\\)(?<![a-z])eta\b/g, '\\beta');
  result = result.replace(/(?<!\\r)(?<!\\)(?<![a-z])ho\b/g, '\\rho');

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

  // ---- Step 4.5: 纯文本分数 a/b → $\frac{a}{b}$ ----
  // 匹配 数字/数字 模式（不在 $...$ 内，且不在已有 \frac 附近）
  // 只处理简单的整数/小数分数，避免误伤日期、比例等
  result = result.replace(
    /(?<!\$[\s\S]*?)(?<!\\frac\{)\b(\d+)\s*\/\s*(\d+)\b(?![\s\S]*?\$)/g,
    (_match, num: string, den: string, offset: number) => {
      // 检查是否在 $...$ 内部
      const before = result.substring(Math.max(0, offset - 50), offset);
      const after = result.substring(offset, Math.min(result.length, offset + 50));
      const dollarCount = (before.match(/\$/g) || []).length;
      if (dollarCount % 2 === 1) return _match; // 在公式内，不处理
      if (after.includes('\\frac')) return _match; // 已有 frac，不处理
      // 只转换看起来像分数的（分母大于1，分子小于分母或小于100）
      const n = parseInt(num);
      const d = parseInt(den);
      if (d <= 1 || n > 999 || d > 999) return _match;
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
