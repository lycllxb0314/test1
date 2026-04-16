/**
 * 试卷 Word 文档生成
 *
 * 使用 docx 库生成标准试卷 .docx 文件
 * 数学公式使用 docx Math 组件（OMML），支持竖式分数、上下标、根号等
 *
 * @module lib/exam-docx
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  Math,
  MathRun,
  MathFraction,
  MathSuperScript,
  MathSubScript,
  MathRadical,
} from 'docx';
import type { ExamTask, Question, QuestionType } from '@/types/smart-homework';
import {
  QUESTION_TYPE_LABELS,
  EXAM_TYPE_LABELS,
} from '@/types/smart-homework';

// ==================== LaTeX → docx Math 组件转换 ====================

/** Paragraph children 的类型（TextRun | Math） */
type ParagraphChild = InstanceType<typeof TextRun> | InstanceType<typeof Math>;

/**
 * 将包含 LaTeX 的文本转换为 docx Paragraph children 数组
 * - `$...$` 包裹的公式 → Math 组件（竖式分数、上下标等）
 * - 普通文本 → TextRun
 */
function parseLatexToDocxChildren(text: string): ParagraphChild[] {
  if (!text) return [];

  const children: ParagraphChild[] = [];
  // 用正则按 $...$ 分割文本
  const parts = text.split(/(\$[^\$]+?\$)/g);

  for (const part of parts) {
    if (!part) continue;

    if (part.startsWith('$') && part.endsWith('$')) {
      // LaTeX 公式 → Math 组件
      const formula = part.slice(1, -1);
      const mathChildren = parseLatexFormula(formula);
      if (mathChildren.length > 0) {
        children.push(new Math({ children: mathChildren }));
      }
    } else {
      // 普通文本 → TextRun（清理残留的 LaTeX 命令）
      const cleanText = cleanPlainText(part);
      if (cleanText) {
        children.push(new TextRun({ text: cleanText, size: 24, font: 'SimSun' }));
      }
    }
  }

  return children;
}

/**
 * 解析 LaTeX 公式为 docx Math 组件子元素数组
 * 递归处理嵌套结构（如 \frac{\sqrt{x}}{2}）
 */
function parseLatexFormula(latex: string): InstanceType<typeof MathRun | typeof MathFraction | typeof MathSuperScript | typeof MathSubScript | typeof MathRadical>[] {
  const tokens = tokenizeLatex(latex);
  const result = parseTokens(tokens, 0);
  return result.elements;
}

/** LaTeX token 类型 */
type LatexToken = {
  type: 'text' | 'command' | 'group';
  value: string;
  children?: LatexToken[];
};

/** 将 LaTeX 字符串 tokenize */
function tokenizeLatex(latex: string): LatexToken[] {
  const tokens: LatexToken[] = [];
  let i = 0;

  while (i < latex.length) {
    if (latex[i] === '\\') {
      // LaTeX 命令
      let cmd = '\\';
      i++;
      while (i < latex.length && /[a-zA-Z]/.test(latex[i])) {
        cmd += latex[i];
        i++;
      }
      tokens.push({ type: 'command', value: cmd });
    } else if (latex[i] === '{') {
      // 花括号分组
      let depth = 1;
      let start = i + 1;
      i++;
      while (i < latex.length && depth > 0) {
        if (latex[i] === '{') depth++;
        else if (latex[i] === '}') depth--;
        i++;
      }
      const inner = latex.substring(start, i - 1);
      tokens.push({ type: 'group', value: inner, children: tokenizeLatex(inner) });
    } else if (latex[i] === '^') {
      tokens.push({ type: 'command', value: '^' });
      i++;
    } else if (latex[i] === '_') {
      tokens.push({ type: 'command', value: '_' });
      i++;
    } else if (latex[i] === ' ' || latex[i] === '\t') {
      i++; // 跳过空格
    } else {
      // 普通文本
      let text = '';
      while (i < latex.length && !'\\{}^_ '.includes(latex[i])) {
        text += latex[i];
        i++;
      }
      if (text) tokens.push({ type: 'text', value: text });
    }
  }

  return tokens;
}

/** 递归解析 token 数组为 docx Math 元素 */
function parseTokens(tokens: LatexToken[], startIdx: number): {
  elements: InstanceType<typeof MathRun | typeof MathFraction | typeof MathSuperScript | typeof MathSubScript | typeof MathRadical>[];
  nextIdx: number;
} {
  const elements: InstanceType<typeof MathRun | typeof MathFraction | typeof MathSuperScript | typeof MathSubScript | typeof MathRadical>[] = [];
  let i = startIdx;

  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'command') {
      switch (token.value) {
        case '\\frac': {
          // \frac{num}{den}
          const numToken = tokens[i + 1];
          const denToken = tokens[i + 2];
          if (numToken?.type === 'group' && denToken?.type === 'group') {
            const numElements = parseTokens(numToken.children || tokenizeLatex(numToken.value), 0).elements;
            const denElements = parseTokens(denToken.children || tokenizeLatex(denToken.value), 0).elements;
            elements.push(new MathFraction({
              numerator: numElements.length > 0 ? numElements : [new MathRun('1')],
              denominator: denElements.length > 0 ? denElements : [new MathRun('1')],
            }));
            i += 3;
          } else {
            elements.push(new MathRun('\\frac'));
            i++;
          }
          break;
        }
        case '\\sqrt': {
          // \sqrt{radicand}
          const radToken = tokens[i + 1];
          if (radToken?.type === 'group') {
            const radElements = parseTokens(radToken.children || tokenizeLatex(radToken.value), 0).elements;
            elements.push(new MathRadical({
              children: radElements.length > 0 ? radElements : [new MathRun('x')],
            }));
            i += 2;
          } else {
            elements.push(new MathRun('√'));
            i++;
          }
          break;
        }
        case '^': {
          // 上标：前一个元素 + 上标内容
          const supToken = tokens[i + 1];
          const baseElement = elements.pop() || new MathRun('x');
          let supElements: InstanceType<typeof MathRun | typeof MathFraction | typeof MathSuperScript | typeof MathSubScript | typeof MathRadical>[];

          if (supToken?.type === 'group') {
            supElements = parseTokens(supToken.children || tokenizeLatex(supToken.value), 0).elements;
          } else if (supToken?.type === 'text') {
            supElements = [new MathRun(translateSymbols(supToken.value))];
          } else {
            supElements = [new MathRun('n')];
            i++;
            break;
          }

          elements.push(new MathSuperScript({
            children: [baseElement],
            superScript: supElements.length > 0 ? supElements : [new MathRun('n')],
          }));
          i += 2;
          break;
        }
        case '_': {
          // 下标
          const subToken = tokens[i + 1];
          const baseElement = elements.pop() || new MathRun('x');
          let subElements: InstanceType<typeof MathRun | typeof MathFraction | typeof MathSuperScript | typeof MathSubScript | typeof MathRadical>[];

          if (subToken?.type === 'group') {
            subElements = parseTokens(subToken.children || tokenizeLatex(subToken.value), 0).elements;
          } else if (subToken?.type === 'text') {
            subElements = [new MathRun(translateSymbols(subToken.value))];
          } else {
            subElements = [new MathRun('i')];
            i++;
            break;
          }

          elements.push(new MathSubScript({
            children: [baseElement],
            subScript: subElements.length > 0 ? subElements : [new MathRun('i')],
          }));
          i += 2;
          break;
        }
        default: {
          // 其他 LaTeX 命令 → Unicode 符号
          const symbol = translateCommand(token.value);
          if (symbol) {
            elements.push(new MathRun(symbol));
          }
          i++;
          break;
        }
      }
    } else if (token.type === 'text') {
      elements.push(new MathRun(translateSymbols(token.value)));
      i++;
    } else if (token.type === 'group') {
      // 裸花括号分组，递归解析
      const subResult = parseTokens(token.children || tokenizeLatex(token.value), 0);
      elements.push(...subResult.elements);
      i++;
    } else {
      i++;
    }
  }

  return { elements, nextIdx: i };
}

/** LaTeX 命令 → Unicode 符号映射 */
function translateCommand(cmd: string): string {
  const map: Record<string, string> = {
    '\\times': '×',
    '\\div': '÷',
    '\\pm': '±',
    '\\mp': '∓',
    '\\neq': '≠',
    '\\leq': '≤',
    '\\geq': '≥',
    '\\approx': '≈',
    '\\equiv': '≡',
    '\\infty': '∞',
    '\\angle': '∠',
    '\\degree': '°',
    '\\circ': '°',
    '\\perp': '⊥',
    '\\parallel': '∥',
    '\\triangle': '△',
    '\\pi': 'π',
    '\\theta': 'θ',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\sum': '∑',
    '\\prod': '∏',
    '\\int': '∫',
    '\\cdot': '·',
    '\\ldots': '…',
    '\\cdots': '⋯',
    '\\rightarrow': '→',
    '\\leftarrow': '←',
    '\\Rightarrow': '⇒',
    '\\Leftarrow': '⇐',
  };
  return map[cmd] || '';
}

/** 文本中的符号转换 */
function translateSymbols(text: string): string {
  return text
    .replace(/\\times/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\pm/g, '±')
    .replace(/\\pi/g, 'π')
    .replace(/\\angle/g, '∠')
    .replace(/\\circ/g, '°')
    .replace(/\\cdot/g, '·')
    .replace(/\\neq/g, '≠')
    .replace(/\\leq/g, '≤')
    .replace(/\\geq/g, '≥');
}

/** 清理纯文本中的残留 LaTeX 命令 */
function cleanPlainText(text: string): string {
  return translateSymbols(text)
    .replace(/\\frac/g, '')
    .replace(/\\sqrt/g, '√')
    .replace(/\\text\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// ==================== 试卷文档生成 ====================

/**
 * 生成试卷 Word 文档
 */
export async function generateExamDocx(task: ExamTask): Promise<Buffer> {
  const questions = task.questions;
  const spec = task.specification;
  const examTypeLabel = EXAM_TYPE_LABELS[spec.examType] || spec.examType;

  // 按题型分组
  const sections = groupQuestionsByType(questions);

  const children: Paragraph[] = [];

  // ===== 试卷头 =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: task.title || spec.scope || '试卷',
          bold: true,
          size: 44,
          font: 'SimSun',
        }),
      ],
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `考试时间：${spec.duration}分钟    满分：${spec.totalScore}分    试卷类型：${examTypeLabel}`,
          size: 22,
          font: 'SimSun',
        }),
      ],
    })
  );

  // 学生信息栏
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      border: {
        top: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        bottom: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        left: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
        right: { style: BorderStyle.SINGLE, size: 1, color: '000000' },
      },
      children: [
        new TextRun({ text: '姓名：__________    班级：__________    学号：__________    成绩：__________', size: 22, font: 'SimSun' }),
      ],
    })
  );

  // ===== 各大题 =====
  const chineseNums = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  let globalIdx = 1;

  for (let si = 0; si < sections.length; si++) {
    const section = sections[si];
    const sectionScore = section.questions.reduce((s, q) => s + q.score, 0);
    const typeLabel = QUESTION_TYPE_LABELS[section.questionType as QuestionType] || section.questionType;

    // 大题标题
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 120 },
        border: {
          bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
        },
        children: [
          new TextRun({
            text: `${chineseNums[si + 1] || si + 1}、${typeLabel}`,
            bold: true,
            size: 28,
            font: 'SimSun',
          }),
          new TextRun({
            text: `（共${section.questions.length}题，共${sectionScore}分）`,
            size: 22,
            font: 'SimSun',
          }),
        ],
      })
    );

    // 每道题
    for (const q of section.questions) {
      // 题干：混合 TextRun 和 Math 组件
      const contentChildren: ParagraphChild[] = [
        new TextRun({ text: `${globalIdx}. `, bold: true, size: 24, font: 'SimSun' }),
        ...parseLatexToDocxChildren(q.content),
        new TextRun({ text: `（${q.score}分）`, size: 20, color: '555555', font: 'SimSun' }),
      ];

      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: contentChildren,
        })
      );

      // 选择题选项
      if (section.questionType === 'choice' && q.options?.length) {
        for (const opt of q.options) {
          const optChildren: ParagraphChild[] = [
            new TextRun({ text: `${opt.label}. `, size: 24, font: 'SimSun' }),
            ...parseLatexToDocxChildren(opt.content),
          ];
          children.push(
            new Paragraph({
              spacing: { after: 10 },
              indent: { left: 480 },
              children: optChildren,
            })
          );
        }
      }

      // 填空题：1行空
      if (section.questionType === 'fill') {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [new TextRun({ text: '', size: 24 })],
          })
        );
      }

      // 主观题：少量答题线
      if (['short_answer', 'calculation', 'application'].includes(section.questionType)) {
        for (let li = 0; li < 2; li++) {
          children.push(
            new Paragraph({
              spacing: { after: 0 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
              children: [new TextRun({ text: ' ', size: 24 })],
            })
          );
        }
      } else if (section.questionType === 'reading') {
        for (let li = 0; li < 3; li++) {
          children.push(
            new Paragraph({
              spacing: { after: 0 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
              children: [new TextRun({ text: ' ', size: 24 })],
            })
          );
        }
      } else if (section.questionType === 'writing') {
        for (let li = 0; li < 4; li++) {
          children.push(
            new Paragraph({
              spacing: { after: 0 },
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' } },
              children: [new TextRun({ text: ' ', size: 24 })],
            })
          );
        }
      }

      globalIdx++;
    }
  }

  // ===== 答案部分 =====
  children.push(
    new Paragraph({
      spacing: { before: 300 },
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '参考答案',
          bold: true,
          size: 32,
          font: 'SimSun',
        }),
      ],
    })
  );

  let ansIdx = 1;
  for (const section of sections) {
    for (const q of section.questions) {
      const answerChildren: ParagraphChild[] = [
        new TextRun({ text: `${ansIdx}. `, bold: true, size: 22, font: 'SimSun' }),
        ...parseLatexToDocxChildren(q.answer),
      ];
      if (q.answerExplanation) {
        answerChildren.push(
          new TextRun({ text: '（', size: 22, font: 'SimSun', color: '666666' }),
        );
        answerChildren.push(...parseLatexToDocxChildren(q.answerExplanation));
        answerChildren.push(
          new TextRun({ text: '）', size: 22, font: 'SimSun', color: '666666' }),
        );
      }

      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: answerChildren,
        })
      );
      ansIdx++;
    }
  }

  // 创建文档
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'SimSun',
            size: 24,
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1134, right: 1134, bottom: 850, left: 1134 },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}

/** 按题型分组题目 */
function groupQuestionsByType(questions: Question[]): {
  order: number;
  questionType: string;
  questions: Question[];
}[] {
  const sectionMap = new Map<string, { order: number; questionType: string; questions: Question[] }>();
  let order = 0;

  for (const q of questions) {
    const key = q.questionType;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, { order: ++order, questionType: key, questions: [] });
    }
    sectionMap.get(key)!.questions.push(q);
  }

  return Array.from(sectionMap.values()).sort((a, b) => a.order - b.order);
}
