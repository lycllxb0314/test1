/**
 * 文件上传 API
 * 
 * 功能：
 * - 上传文件到对象存储
 * - 返回文件 key
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const folder = formData.get('folder') as string || 'uploads';
    
    if (!file) {
      return NextResponse.json(error('请选择文件', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 生成文件名
    const ext = file.name.split('.').pop() || 'bin';
    const timestamp = Date.now();
    const fileName = `${folder}/${timestamp}_${file.name}`;
    
    // 上传到对象存储
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type || 'application/octet-stream',
    });
    
    // 构建文件访问 URL（30天有效期）
    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 30 * 24 * 60 * 60,
    });
    
    return NextResponse.json({
      success: true,
      data: {
        url,
        key,
        name: file.name,
        size: file.size,
        type: file.type,
      },
    });
  } catch (err) {
    console.error('文件上传失败:', err);
    return NextResponse.json(error('上传失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
