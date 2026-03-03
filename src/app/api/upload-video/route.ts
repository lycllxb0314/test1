import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

// 初始化存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 支持的视频类型
const ALLOWED_TYPES = [
  'video/mp4',
  'video/quicktime', // .mov
  'video/x-msvideo', // .avi
  'video/x-ms-wmv', // .wmv
  'video/webm',
  'video/ogg',
];
const MAX_SIZE = 500 * 1024 * 1024; // 500MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string || '';
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: '不支持的视频格式，支持 MP4、MOV、AVI、WMV、WebM、OGG' 
      }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: '文件大小超过限制（最大 500MB）' 
      }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `videos/carousel/${timestamp}_${originalName}`;

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成签名 URL（30天有效期）
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400 * 30,
    });

    return NextResponse.json({
      success: true,
      key: fileKey,
      url: signedUrl,
      title: title || file.name.replace(/\.[^/.]+$/, ''),
      description,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Video upload error:', error);
    return NextResponse.json({ 
      error: '上传失败，请稍后重试' 
    }, { status: 500 });
  }
}

// 获取视频列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || 'videos/';
    const maxKeys = parseInt(searchParams.get('maxKeys') || '100');

    const result = await storage.listFiles({
      prefix,
      maxKeys,
    });

    // 为每个文件生成签名 URL
    const files = await Promise.all(
      result.keys.map(async (key) => {
        const url = await storage.generatePresignedUrl({
          key,
          expireTime: 86400 * 30,
        });
        const fileName = key.split('/').pop() || key;
        return {
          key,
          url,
          fileName,
        };
      })
    );

    return NextResponse.json({
      files,
      isTruncated: result.isTruncated,
      nextToken: result.nextContinuationToken,
    });
  } catch (error) {
    console.error('List videos error:', error);
    return NextResponse.json({ 
      error: '获取视频列表失败' 
    }, { status: 500 });
  }
}

// 删除视频
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: '缺少文件 key' }, { status: 400 });
    }

    await storage.deleteFile({ fileKey: key });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete video error:', error);
    return NextResponse.json({ 
      error: '删除失败' 
    }, { status: 500 });
  }
}
