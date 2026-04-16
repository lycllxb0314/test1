/**
 * 试卷 Word 文档生成
 *
 * 使用 docx 库生成标准试卷 .docx 文件
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
} from 'docx';
import type { ExamTask, Question, QuestionType } from '@/types/smart-homework';
import {
  QUESTION_TYPE_LABELS,
  EXAM_TYPE_LABELS,
} from '@/types/smart-homework';

/**
 * 将 LaTeX 标记转换为可读的纯文本
 * - $x^2$ → x²
 * - $\frac{a}{b}$ → a/b
 * - $\sqrt{x}$ → √x
 * - 剥离所有 $ 标记
 */
function stripLatex(text: string): string {
  if (!text) return '';
  let result = text;

  // 行间公式 $$...$$
  result = result.replace(/\$\$([\s\S]*?)\$\$/g, (_match, formula: string) => {
    return convertLatexToText(formula.trim());
  });

  // 行内公式 $...$
  result = result.replace(/\$([^\$\n]+?)\$/g, (_match, formula: string) => {
    return convertLatexToText(formula.trim());
  });

  return result;
}

/**
 * 基础 LaTeX → 纯文本转换（不依赖任何库）
 */
function convertLatexToText(latex: string): string {
  let text = latex;

  // 分数 \frac{a}{b} → a/b
  text = text.replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, '($1)/($2)');

  // 平方根 \sqrt{x} → √x
  text = text.replace(/\\sqrt\{([^}]*)\}/g, '√($1)');

  // n次方根 \sqrt[n]{x} → ⁿ√x
  text = text.replace(/\\sqrt\[(\d+)\]\{([^}]*)\}/g, '$1√($2)');

  // 上标 x^{2} → x², x^{n} → xⁿ
  text = text.replace(/\^{([^}]*)}/g, (_m: string, exp: string) => toSuperscript(exp));
  text = text.replace(/\^(\d)/g, (_m: string, d: string) => toSuperscript(d));

  // 下标 x_{i} → xᵢ
  text = text.replace(/_{([^}]*)}/g, (_m: string, sub: string) => toSubscript(sub));
  text = text.replace(/_(\d)/g, (_m: string, d: string) => toSubscript(d));

  // 常见数学符号
  text = text.replace(/\\times/g, '×');
  text = text.replace(/\\div/g, '÷');
  text = text.replace(/\\pm/g, '±');
  text = text.replace(/\\neq/g, '≠');
  text = text.replace(/\\leq/g, '≤');
  text = text.replace(/\\geq/g, '≥');
  text = text.replace(/\\approx/g, '≈');
  text = text.replace(/\\equiv/g, '≡');
  text = text.replace(/\\infty/g, '∞');
  text = text.replace(/\\angle/g, '∠');
  text = text.replace(/\\degree/g, '°');
  text = text.replace(/\\circ/g, '°');
  text = text.replace(/\\perp/g, '⊥');
  text = text.replace(/\\parallel/g, '∥');
  text = text.replace(/\\triangle/g, '△');
  text = text.replace(/\\pi/g, 'π');
  text = text.replace(/\\theta/g, 'θ');
  text = text.replace(/\\alpha/g, 'α');
  text = text.replace(/\\beta/g, 'β');
  text = text.replace(/\\gamma/g, 'γ');
  text = text.replace(/\\sum/g, '∑');
  text = text.replace(/\\prod/g, '∏');
  text = text.replace(/\\int/g, '∫');
  text = text.replace(/\\cdot/g, '·');
  text = text.replace(/\\ldots/g, '…');
  text = text.replace(/\\cdots/g, '⋯');

  // \text{...} → ...
  text = text.replace(/\\text\{([^}]*)\}/g, '$1');
  text = text.replace(/\\mathrm\{([^}]*)\}/g, '$1');
  text = text.replace(/\\textbf\{([^}]*)\}/g, '$1');

  // \left \right 和各种括号
  text = text.replace(/\\left[\(\|\\{]/g, '');
  text = text.replace(/\\right[\)\|\\}]/g, '');

  // 清理剩余的 LaTeX 命令（\command → 空格）
  text = text.replace(/\\[a-zA-Z]+/g, '');
  // 清理多余花括号
  text = text.replace(/[{}]/g, '');
  // 清理多余空格
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

/** 数字和常见字符转上标 */
function toSuperscript(s: string): string {
  const map: Record<string, string> = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    '+': '⁺', '-': '⁻', '=': '⁼', 'n': 'ⁿ', 'i': 'ⁱ',
  };
  return s.split('').map(c => map[c] || c).join('');
}

/** 数字转下标 */
function toSubscript(s: string): string {
  const map: Record<string, string> = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
    '+': '₊', '-': '₋', '=': '₌', 'i': 'ᵢ', 'n': 'ₙ',
  };
  return s.split('').map(c => map[c] || c).join('');
}

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
          size: 44, // 22pt
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
            size: 28, // 14pt
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
      const contentText = stripLatex(q.content);

      // 题干
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          children: [
            new TextRun({
              text: `${globalIdx}. `,
              bold: true,
              size: 24,
              font: 'SimSun',
            }),
            new TextRun({
              text: contentText,
              size: 24,
              font: 'SimSun',
            }),
            new TextRun({
              text: `（${q.score}分）`,
              size: 20,
              color: '555555',
              font: 'SimSun',
            }),
          ],
        })
      );

      // 选择题选项
      if (section.questionType === 'choice' && q.options?.length) {
        for (const opt of q.options) {
          const optText = stripLatex(opt.content);
          children.push(
            new Paragraph({
              spacing: { after: 10 },
              indent: { left: 480 }, // 紧凑缩进
              children: [
                new TextRun({
                  text: `${opt.label}. ${optText}`,
                  size: 24,
                  font: 'SimSun',
                }),
              ],
            })
          );
        }
      }

      // 填空题：1行空
      if (section.questionType === 'fill') {
        children.push(
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: '', size: 24 }),
            ],
          })
        );
      }

      // 主观题：少量答题线（紧凑排版，避免几百页）
      if (['short_answer', 'calculation', 'application'].includes(section.questionType)) {
        // 简答/计算/应用题：2条答题线
        for (let li = 0; li < 2; li++) {
          children.push(
            new Paragraph({
              spacing: { after: 0 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              },
              children: [new TextRun({ text: ' ', size: 24 })],
            })
          );
        }
      } else if (section.questionType === 'reading') {
        // 阅读题：3条答题线
        for (let li = 0; li < 3; li++) {
          children.push(
            new Paragraph({
              spacing: { after: 0 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              },
              children: [new TextRun({ text: ' ', size: 24 })],
            })
          );
        }
      } else if (section.questionType === 'writing') {
        // 写作题：4条答题线
        for (let li = 0; li < 4; li++) {
          children.push(
            new Paragraph({
              spacing: { after: 0 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
              },
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
      const answerText = stripLatex(q.answer);
      const explanationText = q.answerExplanation ? stripLatex(q.answerExplanation) : '';
      let fullAnswer = `${ansIdx}. ${answerText}`;
      if (explanationText) {
        fullAnswer += `（${explanationText}）`;
      }
      children.push(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: fullAnswer,
              size: 22,
              font: 'SimSun',
            }),
          ],
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
          size: {
            width: 11906, // A4
            height: 16838,
          },
          margin: {
            top: 1134,   // ~20mm
            right: 1134,
            bottom: 850,  // ~15mm
            left: 1134,
          },
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
