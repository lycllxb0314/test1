/**
 * 文件上传 API
 * 
 * 支持图片和文件上传到对象存储
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getUserFromSession } from '@/lib/auth/session';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

/** 允许的文件类型 */
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * 上传文件
 * 
 * POST /api/upload
 * Content-Type: multipart/form-data
 * 
 * 参数:
 * - file: 文件
 * - type: 'image' | 'document' | 'any' (默认 'any')
 * 
 * 返回:
 * - key: 存储的 key
 * - url: 访问 URL
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户登录
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json({
        success: false,
        error: '未登录，请先登录',
        code: 'AUTH_FAILED',
      }, { status: 401 });
    }

    // 解析表单数据
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string || 'any';

    if (!file) {
      return NextResponse.json({
        success: false,
        error: '请选择要上传的文件',
      }, { status: 400 });
    }

    // 检查文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({
        success: false,
        error: `文件大小不能超过 ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      }, { status: 400 });
    }

    // 检查文件类型
    if (type === 'image' && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: '只支持 JPG、PNG、GIF、WebP 格式的图片',
      }, { status: 400 });
    }

    if (type === 'document' && !ALLOWED_DOCUMENT_TYPES.includes(file.type) && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({
        success: false,
        error: '不支持的文件类型',
      }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名（按日期和类型分类）
    const now = new Date();
    const datePath = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
    const fileName = `announcements/${datePath}/${Date.now()}_${file.name}`;

    // 上传文件
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type || 'application/octet-stream',
    });

    // 生成访问 URL（有效期 30 天）
    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 30 * 24 * 60 * 60, // 30 天
    });

    return NextResponse.json({
      success: true,
      data: {
        key,
        url,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '上传失败',
    }, { status: 500 });
  }
}
