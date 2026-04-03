/**
 * 学生荣誉 API
 * 
 * GET: 获取学生荣誉列表
 * POST: 创建学生荣誉
 * DELETE: 批量删除荣誉
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentHonorService } from '@/services/misc.service';
import type { StudentHonorRecord } from '@/repositories/misc.repository';
import { success, error, ErrorCode } from '@/lib/api';

/**
 * 将数据库字段映射为前端期望的驼峰格式
 */
function mapHonorToFrontend(record: StudentHonorRecord & { grade?: number; school_year?: string }) {
  return {
    id: record.id,
    studentId: record.student_id,
    studentName: record.student_name,
    classId: record.class_id,
    className: record.class_name,
    grade: record.grade,
    title: record.title,
    level: record.level,
    category: record.category,
    issuer: record.issuer,
    date: record.date,
    certificateNo: record.certificate_no,
    description: record.description,
    schoolYear: record.school_year,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

/**
 * GET - 获取学生荣誉列表
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || undefined;
  const classId = searchParams.get('classId') || undefined;
  const honorType = searchParams.get('honorType') || searchParams.get('category') || undefined;
  const level = searchParams.get('level') || undefined;
  const keyword = searchParams.get('keyword') || undefined;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;
  const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize')!) : 20;
  const needStatistics = searchParams.get('statistics') === 'true';

  const result = await studentHonorService.getList({ 
    studentId, 
    classId, 
    honorType, 
    level, 
    keyword,
    page, 
    pageSize 
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取学生荣誉列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  // 映射字段为驼峰格式
  const mappedData = result.data.data.map(mapHonorToFrontend);

  // 构建响应
  const response: Record<string, unknown> = {
    data: mappedData,
    pagination: {
      total: result.data.total,
      page: result.data.page,
      pageSize: result.data.pageSize,
      totalPages: result.data.totalPages,
    },
  };

  // 如果需要统计数据，计算统计信息
  if (needStatistics) {
    // 获取所有数据用于统计（不分页）
    const allDataResult = await studentHonorService.getList({ 
      page: 1, 
      pageSize: 10000, // 获取足够多的数据用于统计
    });
    
    if (allDataResult.success && allDataResult.data) {
      const allHonors = allDataResult.data.data;
      
      // 计算统计数据
      const statistics = {
        total: allDataResult.data.total,
        uniqueStudents: new Set(allHonors.map(h => h.student_id)).size,
        byLevel: {} as Record<string, number>,
        byCategory: {} as Record<string, number>,
        byGrade: {} as Record<number, number>,
        byMonth: {} as Record<string, number>,
        topStudents: [] as Array<{ studentId: string; studentName: string; count: number }>,
      };

      // 按级别统计
      allHonors.forEach(h => {
        const lvl = h.level || '校级';
        statistics.byLevel[lvl] = (statistics.byLevel[lvl] || 0) + 1;
      });

      // 按类别统计
      allHonors.forEach(h => {
        const cat = h.category || '综合';
        statistics.byCategory[cat] = (statistics.byCategory[cat] || 0) + 1;
      });

      // 按年级统计
      allHonors.forEach(h => {
        const grade = (h as StudentHonorRecord & { grade?: number }).grade;
        if (grade) {
          statistics.byGrade[grade] = (statistics.byGrade[grade] || 0) + 1;
        }
      });

      // 按月份统计（本年度）
      const currentYear = new Date().getFullYear();
      allHonors.forEach(h => {
        const date = h.date;
        if (date) {
          const year = parseInt(date.split('-')[0]);
          if (year === currentYear) {
            const month = date.split('-')[1] || '01';
            statistics.byMonth[month] = (statistics.byMonth[month] || 0) + 1;
          }
        }
      });

      // 获奖之星（TOP 10）
      const studentHonorCount: Record<string, { name: string; count: number }> = {};
      allHonors.forEach(h => {
        if (!studentHonorCount[h.student_id]) {
          studentHonorCount[h.student_id] = { 
            name: h.student_name || '未知学生', 
            count: 0 
          };
        }
        studentHonorCount[h.student_id].count++;
      });

      statistics.topStudents = Object.entries(studentHonorCount)
        .map(([studentId, data]) => ({
          studentId,
          studentName: data.name,
          count: data.count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      response.statistics = statistics;
    }
  }

  return NextResponse.json(success(response));
}

/**
 * POST - 创建学生荣誉
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // 映射字段：前端字段 -> 数据库字段
  const result = await studentHonorService.create({
    id: body.id || `honor-${Date.now()}`,
    student_id: body.studentId,
    student_name: body.studentName,
    class_id: body.classId,
    class_name: body.className,
    title: body.title || body.honorName,
    level: body.level || body.honorLevel,
    category: body.category || body.honorType,
    issuer: body.issuer,
    date: body.date || body.awardDate,
    certificate_no: body.certificateNo,
    description: body.description,
  });

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '创建学生荣誉失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(mapHonorToFrontend(result.data!)));
}

/**
 * DELETE - 批量删除荣誉
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get('ids')?.split(',').filter(Boolean);

  if (!ids || ids.length === 0) {
    return NextResponse.json(
      error('请选择要删除的荣誉记录', ErrorCode.VALIDATION_ERROR),
      { status: 400 }
    );
  }

  const result = await studentHonorService.batchDelete(ids);

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '批量删除失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success({ 
    message: `成功删除 ${result.data!.count} 条记录`,
    count: result.data!.count 
  }));
}
