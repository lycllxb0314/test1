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

// 支持的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'general';

    if (!file) {
      return NextResponse.json({ error: '未找到文件' }, { status: 400 });
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: '不支持的文件类型，仅支持 JPG、PNG、GIF、WebP' 
      }, { status: 400 });
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ 
        error: '文件大小超过限制（最大 10MB）' 
      }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名：category/原始文件名
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `homepage/${category}/${timestamp}_${originalName}`;

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成签名 URL
    const signedUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 86400 * 30, // 30 天有效期
    });

    return NextResponse.json({
      success: true,
      key: fileKey,
      url: signedUrl,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ 
      error: '上传失败，请稍后重试' 
    }, { status: 500 });
  }
}

// 获取图片列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || 'homepage/';
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
        // 从 key 中提取文件名
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
    console.error('List files error:', error);
    return NextResponse.json({ 
      error: '获取文件列表失败' 
    }, { status: 500 });
  }
}

// 删除文件
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
    console.error('Delete error:', error);
    return NextResponse.json({ 
      error: '删除失败' 
    }, { status: 500 });
  }
}
