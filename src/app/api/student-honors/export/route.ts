/**
 * 学生荣誉导出 API
 * 
 * GET: 导出荣誉数据为 CSV/Excel 格式
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { studentHonorService } from '@/services/misc.service';
import { error, ErrorCode } from '@/lib/api';

/**
 * GET - 导出荣誉数据
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get('studentId') || undefined;
  const classId = searchParams.get('classId') || undefined;
  const honorType = searchParams.get('honorType') || searchParams.get('category') || undefined;
  const level = searchParams.get('level') || undefined;
  const ids = searchParams.get('ids')?.split(',').filter(Boolean);
  const format = searchParams.get('format') || 'csv'; // csv 或 excel

  const result = await studentHonorService.exportData({
    studentId,
    classId,
    honorType,
    level,
    ids,
  });

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '导出数据失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const data = result.data;

  // 定义导出列
  const columns = [
    { key: 'student_id', label: '学生ID' },
    { key: 'student_name', label: '学生姓名' },
    { key: 'grade', label: '年级' },
    { key: 'class_name', label: '班级' },
    { key: 'title', label: '荣誉名称' },
    { key: 'level', label: '荣誉级别' },
    { key: 'category', label: '荣誉类型' },
    { key: 'issuer', label: '颁发单位' },
    { key: 'date', label: '获奖日期' },
    { key: 'certificate_no', label: '证书编号' },
    { key: 'description', label: '备注' },
  ];

  if (format === 'csv') {
    // 生成 CSV
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row => 
      columns.map(c => {
        const value = row[c.key as keyof typeof row];
        // 处理包含逗号或引号的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');

    // 添加 BOM 以支持中文
    const bom = '\uFEFF';
    const csvContent = bom + csv;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=student_honors_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  }

  // Excel 格式 - 返回 JSON，前端使用库生成
  const excelData = data.map(row => {
    const obj: Record<string, unknown> = {};
    columns.forEach(c => {
      obj[c.label] = row[c.key as keyof typeof row] ?? '';
    });
    return obj;
  });

  return NextResponse.json({
    success: true,
    data: {
      columns: columns.map(c => c.label),
      rows: excelData,
      filename: `student_honors_${new Date().toISOString().split('T')[0]}.xlsx`,
    },
  });
}
