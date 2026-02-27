/**
 * 班级管理 API
 * 
 * GET: 获取班级列表
 * POST: 创建/更新班级
 */

import { NextRequest, NextResponse } from 'next/server';
// 导入统一数据源
import { TEACHERS_DATA, CLASSES_DATA } from '@/lib/data/classes-teachers';

/**
 * GET - 获取班级列表
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const grade = searchParams.get('grade');
  const search = searchParams.get('search') || '';
  
  let filtered = [...CLASSES_DATA];
  
  if (grade && grade !== 'all') {
    filtered = filtered.filter(c => c.grade === parseInt(grade));
  }
  
  if (search) {
    filtered = filtered.filter(c => 
      c.name.includes(search) || 
      c.headTeacherName.includes(search)
    );
  }
  
  return NextResponse.json({
    success: true,
    data: {
      classes: filtered,
      teachers: TEACHERS_DATA,
    },
    source: 'mock',
  });
}

/**
 * POST - 更新班级信息
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, classId, data } = body;
    
    if (action === 'update') {
      // 实际应该更新数据库
      // 这里返回模拟成功响应
      return NextResponse.json({
        success: true,
        data: { id: classId, ...data, updatedAt: new Date().toISOString() },
        message: '班级信息更新成功',
      });
    }
    
    return NextResponse.json({
      success: false,
      message: '未知操作',
    }, { status: 400 });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: '操作失败',
    }, { status: 500 });
  }
}
