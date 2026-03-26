/**
 * 文件下载 API
 * 
 * 功能：
 * - 生成文件签名 URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getUserFromSession } from '@/lib/auth/session';
import { success, error, ErrorCode } from '@/lib/api-route-utils';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromSession(request);
    if (!user) {
      return NextResponse.json(error('未登录', ErrorCode.UNAUTHORIZED), { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(error('缺少文件标识', ErrorCode.BAD_REQUEST), { status: 400 });
    }
    
    // 生成签名 URL（有效期1小时）
    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 3600,
    });
    
    return NextResponse.json({
      success: true,
      url,
    });
  } catch (err) {
    console.error('生成下载链接失败:', err);
    return NextResponse.json(error('获取下载链接失败', ErrorCode.INTERNAL_ERROR), { status: 500 });
  }
}
