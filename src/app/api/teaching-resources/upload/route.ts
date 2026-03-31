/**
 * 上传教学资源到备课中心
 * 
 * POST /api/teaching-resources/upload
 * 
 * 支持上传教案、课件、视频等文件资源
 */

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { teachingResourceRepository } from '@/repositories/teaching-resource.repository';
import type { ResourceCategory, ResourceType } from '@/types/teaching-resource';

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

/** 文件类型到资源分类的映射 */
const FILE_TYPE_MAP: Record<string, { category: ResourceCategory; type: ResourceType }> = {
  // 教案
  'application/pdf': { category: 'lesson_plan', type: 'lesson_plan_file' },
  'application/msword': { category: 'lesson_plan', type: 'lesson_plan_file' },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { category: 'lesson_plan', type: 'lesson_plan_file' },
  // 课件
  'application/vnd.ms-powerpoint': { category: 'courseware', type: 'courseware_file' },
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': { category: 'courseware', type: 'courseware_file' },
  // 视频
  'video/mp4': { category: 'video', type: 'video_file' },
  'video/quicktime': { category: 'video', type: 'video_file' },
  'video/x-msvideo': { category: 'video', type: 'video_file' },
  'video/webm': { category: 'video', type: 'video_file' },
  // 其他文档
  'text/plain': { category: 'other', type: 'document_file' },
  'application/vnd.ms-excel': { category: 'other', type: 'document_file' },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { category: 'other', type: 'document_file' },
};

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as ResourceCategory | null;
    const subject = formData.get('subject') as string | null;
    const grade = formData.get('grade') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '请选择文件' },
        { status: 400 }
      );
    }

    // 开发环境：使用默认教师ID
    const teacherId = process.env.NODE_ENV === 'production' ? 'teacher-001' : 'dev-teacher';
    const teacherName = '开发教师';

    // 根据文件类型确定分类
    const mimeType = file.type;
    const typeInfo = FILE_TYPE_MAP[mimeType] || { category: 'other' as ResourceCategory, type: 'document_file' as ResourceType };

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成文件名：teaching-resources/teacherId/时间戳_原文件名
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `teaching-resources/${teacherId}/${timestamp}_${originalName}`;

    // 上传到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: mimeType,
    });

    // 生成签名URL（有效期30天）
    const fileUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 30 * 24 * 60 * 60,
    });

    // 创建资源记录
    const teachingResource = await teachingResourceRepository.create({
      teacherId,
      teacherName,
      category: category || typeInfo.category,
      type: typeInfo.type,
      title: title || file.name,
      description: description || undefined,
      content: {},
      fileUrl,
      fileKey,
      fileName: file.name,
      fileSize: file.size,
      sourceType: 'upload',
      subject: subject || undefined,
      grade: grade ? parseInt(grade) : undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: teachingResource.id,
        title: teachingResource.title,
        fileUrl: teachingResource.fileUrl,
        fileName: teachingResource.fileName,
        fileSize: teachingResource.fileSize,
        message: '上传成功',
      },
    });
  } catch (err) {
    console.error('[UploadResource Error]:', err);
    return NextResponse.json(
      { success: false, error: '上传失败，请稍后重试' },
      { status: 500 }
    );
  }
}
