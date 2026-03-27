/**
 * SOP 材料上传 API
 * POST - 上传文件到对象存储，返回文件 key 和访问 URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化存储客户端
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 支持的文件类型
const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  video: ['video/mp4', 'video/webm', 'video/quicktime'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
};

// 文件大小限制 (bytes)
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// 获取文件类型分类
function getFileCategory(mimeType: string): string {
  for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return 'other';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const executionId = formData.get('executionId') as string | null;
    const stepOrder = formData.get('stepOrder') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '未提供文件' },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: '文件大小超过 50MB 限制' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileCategory = getFileCategory(file.type);
    if (fileCategory === 'other') {
      return NextResponse.json(
        { success: false, error: `不支持的文件类型: ${file.type}` },
        { status: 400 }
      );
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const fileContent = Buffer.from(arrayBuffer);

    // 生成文件名（包含执行ID和步骤序号）
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `sop-evidence/${executionId || 'unknown'}/${stepOrder || '0'}_${timestamp}_${sanitizedFileName}`;

    // 上传文件
    const fileKey = await storage.uploadFile({
      fileContent,
      fileName,
      contentType: file.type,
    });

    // 生成访问 URL（有效期 7 天）
    const accessUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 7 * 24 * 60 * 60, // 7 天
    });

    // 确定证据类型
    const evidenceType = fileCategory === 'image' ? 'photo' :
                         fileCategory === 'video' ? 'video' :
                         fileCategory === 'audio' ? 'audio' : 'document';

    return NextResponse.json({
      success: true,
      data: {
        key: fileKey,
        url: accessUrl,
        name: file.name,
        size: file.size,
        type: file.type,
        category: fileCategory,
        evidenceType,
      },
    });
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    );
  }
}
