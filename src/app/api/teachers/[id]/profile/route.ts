/**
 * 教师档案 API（含教研数据）
 * 
 * 整合教师基本信息、教研活动、听课评课、培训研修等数据
 * 
 * 架构：API Route → Service → Repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { teacherService } from '@/services/teacher.service';
import { error, ErrorCode } from '@/lib/api';

/**
 * GET - 获取教师档案（含教研数据）
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await teacherService.getResearchProfile(id);
    
    if (!result.success) {
      const statusCode = result.code === 'NOT_FOUND' ? 404 : 500;
      return NextResponse.json(
        { success: false, error: result.error || '获取教师档案失败' },
        { status: statusCode }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
  } catch (err) {
    console.error('Failed to fetch teacher profile:', err);
    return NextResponse.json({
      success: false,
      error: '获取教师档案失败',
    }, { status: 500 });
  }
}
