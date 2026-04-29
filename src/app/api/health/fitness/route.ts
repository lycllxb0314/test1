/**
 * 体质测评 / 体检数据 API
 * GET  /api/health/fitness?studentId=xxx&academicYear=xxx&semester=xxx&page=1&pageSize=50
 * GET  /api/health/fitness/template?type=fitness|checkup&academicYear=xxx&semester=xxx&classId=xxx
 * POST /api/health/fitness  创建/批量导入
 */
import { NextResponse } from 'next/server';
import { protectedRoute } from '@/lib/auth';
import { healthManagementService } from '@/services/health-management.service';
import type { CreateFitnessAssessmentDTO } from '@/types/health-management';
import { getService } from '@/lib/di';
import { SERVICE_IDENTIFIERS } from '@/lib/di/container';
import type { StudentRepository } from '@/repositories/student.repository';

export const GET = protectedRoute(async (request) => {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId');
  const academicYear = searchParams.get('academicYear');
  const semester = searchParams.get('semester');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);
  const templateType = searchParams.get('template');

  // 模板下载：生成含学生姓名的 CSV
  if (templateType) {
    return handleTemplateDownload(templateType, academicYear, semester, searchParams.get('classId'));
  }

  if (studentId) {
    const result = await healthManagementService.getFitnessByStudentId(studentId);
    return NextResponse.json({ success: result.success, data: result.data });
  }

  if (academicYear && semester) {
    const result = await healthManagementService.getFitnessByYearSemester(academicYear, semester);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    const allData = result.data || [];
    // 分页
    const total = allData.length;
    const start = (page - 1) * pageSize;
    const paged = allData.slice(start, start + pageSize);
    return NextResponse.json({
      success: true,
      data: paged,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  }

  return NextResponse.json({ success: false, error: '需要 studentId 或 academicYear+semester 参数' }, { status: 400 });
});

export const POST = protectedRoute(async (request, { user }) => {
  const body = await request.json();

  if (Array.isArray(body)) {
    // 批量导入
    const records = body.map((item: CreateFitnessAssessmentDTO) => ({
      ...item,
      importedBy: user.employeeId || user.id,
    }));
    const result = await healthManagementService.bulkImportFitness(records);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.data });
  }

  // 单条创建
  const result = await healthManagementService.createFitnessAssessment({
    ...body,
    importedBy: user.employeeId || user.id,
  });
  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: result.data }, { status: 201 });
});

// ==================== 模板生成 ====================

async function handleTemplateDownload(
  type: string,
  academicYear: string | null,
  semester: string | null,
  classId: string | null,
) {
  const studentRepo = getService<StudentRepository>(SERVICE_IDENTIFIERS.StudentRepository);

  // 获取学生列表（数据库返回的是下划线格式行）
  const rawList = classId
    ? await studentRepo.findByClass(classId)
    : await studentRepo.findAll();

  // 统一用下划线格式读取，因为 BaseRepository 不做映射
  const students = (rawList as unknown as Record<string, unknown>[]).map(s => ({
    id: s.id as string,
    name: s.name as string,
    student_no: (s.student_no || s.studentNo || '') as string,
    class_name: (s.class_name || s.className || '') as string,
  }));

  // 按班级+学号排序，保证两个模板顺序一致
  students.sort((a, b) => {
    if (a.class_name !== b.class_name) return (a.class_name || '').localeCompare(b.class_name || '', 'zh-CN');
    return (a.student_no || '').localeCompare(b.student_no || '');
  });

  const yearLabel = academicYear || '2025-2026';
  const semLabel = semester || '上学期';

  let csv = '';

  if (type === 'fitness') {
    csv = '\uFEFF学号,姓名,班级,学年,学期,身高(cm),体重(kg),BMI,肺活量(ml),50米跑(秒),50米×8往返跑(秒),坐位体前屈(cm),1分钟仰卧起坐(次),1分钟跳绳(次),总分,等级\n';
    for (const s of students) {
      csv += `${s.student_no},${s.name},${s.class_name},${yearLabel},${semLabel},,,,,,,,,,\n`;
    }
  } else if (type === 'checkup') {
    csv = '\uFEFF学号,姓名,班级,学年,学期,左眼视力,右眼视力,龋齿(颗),脊柱,收缩压,舒张压,心率,色觉,左耳听力,右耳听力,备注\n';
    for (const s of students) {
      csv += `${s.student_no},${s.name},${s.class_name},${yearLabel},${semLabel},,,,,,,,,,,\n`;
    }
  } else {
    return NextResponse.json({ success: false, error: '无效的模板类型，支持 fitness 或 checkup' }, { status: 400 });
  }

  const fileName = type === 'fitness'
    ? `体质测试导入模板_${yearLabel}_${semLabel}.csv`
    : `体检数据导入模板_${yearLabel}_${semLabel}.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=${encodeURIComponent(fileName)}`,
    },
  });
}
