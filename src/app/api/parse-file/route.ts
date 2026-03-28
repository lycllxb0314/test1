/**
 * 文件解析 API
 * 
 * POST /api/parse-file
 * 
 * 支持解析多种文件格式：
 * - Word (docx)
 * - Excel (xlsx)
 * - TXT
 * - 图片（使用 Vision 模型）
 * 
 * 注意：PDF解析因兼容性问题暂不支持
 */

import { NextRequest, NextResponse } from 'next/server';
import { LLMClient, Config } from 'coze-coding-dev-sdk';

// PDF 解析暂不可用（pdf-parse 与 Next.js 存在兼容性问题）
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function parsePDF(buffer: Buffer): Promise<string> {
  throw new Error('PDF 解析暂不支持，请将 PDF 转换为 Word 或 TXT 格式后上传');
}

async function parseWord(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function parseExcel(buffer: Buffer): Promise<string> {
  const xlsx = await import('xlsx');
  const workbook = xlsx.read(buffer, { type: 'buffer' });
  const sheets: string[] = [];
  
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = xlsx.utils.sheet_to_csv(sheet);
    sheets.push(`【${sheetName}】\n${csv}`);
  }
  
  return sheets.join('\n\n');
}

function parseTXT(buffer: Buffer): string {
  return buffer.toString('utf-8');
}

async function parseImageWithVision(base64Data: string, mimeType: string): Promise<string> {
  const config = new Config();
  const client = new LLMClient(config);
  
  const dataUri = `data:${mimeType};base64,${base64Data}`;
  
  const messages = [
    {
      role: 'user' as const,
      content: [
        { type: 'text' as const, text: '请详细描述这张图片的内容，包括文字信息、图像元素、布局等。如果图片中有文字，请完整提取出来。' },
        {
          type: 'image_url' as const,
          image_url: {
            url: dataUri,
            detail: 'high' as const,
          },
        },
      ],
    },
  ];
  
  const response = await client.invoke(messages, {
    model: 'doubao-seed-1-6-vision-250815',
    temperature: 0.3,
  });
  
  return response.content;
}

/** 解析结果类型 */
type ParseResult = {
  success: boolean;
  content?: string;
  error?: string;
  fileType?: string;
  fileName?: string;
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json<ParseResult>(
        { success: false, error: '未找到文件' },
        { status: 400 }
      );
    }
    
    const fileName = file.name;
    const mimeType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    let content = '';
    let fileType = '';
    
    // 根据文件类型解析
    if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
      fileType = 'PDF';
      return NextResponse.json<ParseResult>(
        { success: false, error: 'PDF 解析暂不支持，请将 PDF 转换为 Word 或 TXT 格式后上传' },
        { status: 400 }
      );
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      fileType = 'Word';
      content = await parseWord(buffer);
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      fileName.endsWith('.xlsx') ||
      fileName.endsWith('.xls')
    ) {
      fileType = 'Excel';
      content = await parseExcel(buffer);
    } else if (mimeType.startsWith('text/') || fileName.endsWith('.txt')) {
      fileType = '文本';
      content = parseTXT(buffer);
    } else if (mimeType.startsWith('image/')) {
      fileType = '图片';
      const base64Data = buffer.toString('base64');
      content = await parseImageWithVision(base64Data, mimeType);
    } else {
      return NextResponse.json<ParseResult>(
        { success: false, error: `不支持的文件类型: ${mimeType || fileName}` },
        { status: 400 }
      );
    }
    
    // 清理内容
    content = content.trim();
    
    if (!content) {
      return NextResponse.json<ParseResult>(
        { success: false, error: '文件内容为空或无法解析' },
        { status: 400 }
      );
    }
    
    // 截断过长的内容
    const maxLength = 50000;
    if (content.length > maxLength) {
      content = content.slice(0, maxLength) + '\n\n...（内容过长，已截断）';
    }
    
    return NextResponse.json<ParseResult>({
      success: true,
      content,
      fileType,
      fileName,
    });
  } catch (error) {
    console.error('[Parse File Error]:', error);
    return NextResponse.json<ParseResult>(
      { success: false, error: '文件解析失败，请检查文件格式是否正确' },
      { status: 500 }
    );
  }
}
