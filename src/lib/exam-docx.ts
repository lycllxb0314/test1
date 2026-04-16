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
  HeadingLevel,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType,
  PageBreak,
  ShadingType,
  TableBorders,
} from 'docx';
import type { ExamTask, Question, QuestionType } from '@/types/smart-homework';
import {
  QUESTION_TYPE_LABELS,
  COGNITIVE_LEVEL_LABELS,
  EXAM_TYPE_LABELS,
} from '@/types/smart-homework';

/** 题型出场顺序 */
const TYPE_ORDER: QuestionType[] = ['choice', 'judge', 'fill', 'short_answer', 'calculation', 'application', 'reading', 'writing', 'other'];

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
      spacing: { after: 200 },
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
      spacing: { after: 400 },
      children: [
        new TextRun({
          text: `考试时间：${spec.duration}分钟    满分：${spec.totalScore}分    试卷类型：${examTypeLabel}`,
          size: 22, // 11pt
          font: 'SimSun',
        }),
      ],
    })
  );

  // 学生信息栏
  children.push(
    new Paragraph({
      spacing: { after: 400 },
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
        spacing: { before: 300, after: 200 },
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
      // 题干
      children.push(
        new Paragraph({
          spacing: { before: 100, after: 60 },
          children: [
            new TextRun({
              text: `${globalIdx}. `,
              bold: true,
              size: 24, // 12pt
              font: 'SimSun',
            }),
            new TextRun({
              text: q.content,
              size: 24,
              font: 'SimSun',
            }),
            new TextRun({
              text: `（${q.score}分）`,
              size: 20, // 10pt
              color: '555555',
              font: 'SimSun',
            }),
          ],
        })
      );

      // 选择题选项
      if (section.questionType === 'choice' && q.options?.length) {
        for (const opt of q.options) {
          children.push(
            new Paragraph({
              spacing: { after: 20 },
              indent: { left: 720 }, // 2em
              children: [
                new TextRun({
                  text: `${opt.label}. ${opt.content}`,
                  size: 24,
                  font: 'SimSun',
                }),
              ],
            })
          );
        }
      }

      // 填空题/主观题：留空
      if (section.questionType === 'fill') {
        children.push(
          new Paragraph({
            spacing: { after: 100 },
            children: [
              new TextRun({ text: '', size: 24 }),
            ],
          })
        );
      }

      if (['short_answer', 'calculation', 'application', 'reading', 'writing'].includes(section.questionType)) {
        const lineCount = section.questionType === 'writing' ? 8 : section.questionType === 'reading' ? 6 : 3;
        for (let li = 0; li < lineCount; li++) {
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
      spacing: { before: 400 },
      pageBreakBefore: true,
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '参考答案',
          bold: true,
          size: 32, // 16pt
          font: 'SimSun',
        }),
      ],
    })
  );

  let ansIdx = 1;
  for (const section of sections) {
    for (const q of section.questions) {
      let answerText = `${ansIdx}. ${q.answer}`;
      if (q.answerExplanation) {
        answerText += `（${q.answerExplanation}）`;
      }
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: answerText,
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
            top: 1440,   // 25mm ~ 1440 twips
            right: 1440,
            bottom: 1152, // 20mm
            left: 1440,
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
