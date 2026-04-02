/**
 * 信息采集响应 API
 * 
 * GET: 获取信息采集响应列表
 * POST: 提交信息采集响应
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 */

import { NextRequest, NextResponse } from 'next/server';
import { collectionResponseService } from '@/services/information-collection.service';
import { informationCollectionService } from '@/services/information-collection.service';
import { success, error, ErrorCode } from '@/lib/api';
import { getSupabaseClient } from '@/storage/database/supabase-client';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * 响应数据库行类型（下划线命名）
 */
interface ResponseRow {
  id: string;
  collection_id: string;
  student_id: string;
  parent_id: string;
  parent_name: string;
  responses: Record<string, unknown>;
  submitted_at: string;
  created_at: string;
}

/**
 * 转换响应数据库行到前端格式
 */
function transformResponseToFrontend(row: ResponseRow, studentName?: string) {
  return {
    id: row.id,
    collectionId: row.collection_id,
    studentId: row.student_id,
    studentName: studentName || '',
    parentId: row.parent_id,
    parentName: row.parent_name,
    responses: row.responses || {},
    submittedAt: row.submitted_at,
    createdAt: row.created_at,
  };
}

/**
 * GET - 获取信息采集响应列表
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  
  // 获取响应列表
  const result = await collectionResponseService.getByCollection(id);

  if (!result.success || !result.data) {
    return NextResponse.json(
      error(result.error || '获取响应列表失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  const responseRows = result.data as unknown as ResponseRow[];

  // 获取信息采集详情以获取班级ID
  const collectionResult = await informationCollectionService.getById(id);
  let notSubmitted: Array<{ studentId: string; studentName: string; parentId: string | null; parentName: string }> = [];
  let statistics = { total: 0, submitted: responseRows.length, notSubmitted: 0 };

  if (collectionResult.success && collectionResult.data) {
    const collection = collectionResult.data as { class_id?: string };
    const classId = (collection as Record<string, unknown>).class_id as string | undefined;
    
    if (classId) {
      const client = getSupabaseClient();
      
      // 获取班级学生列表（包含姓名）
      const { data: students, error: studentsError } = await client
        .from('students')
        .select('id, name, parents')
        .eq('class_id', classId)
        .eq('status', '在校');

      if (!studentsError && students) {
        // 构建学生ID到姓名的映射
        const studentNameMap = new Map<string, string>();
        students.forEach(s => studentNameMap.set(s.id, s.name));
        
        // 已提交的学生ID集合
        const submittedStudentIds = new Set(responseRows.map(r => r.student_id));
        
        // 转换响应数据，添加学生姓名
        const responses = responseRows.map(row => 
          transformResponseToFrontend(row, studentNameMap.get(row.student_id))
        );
        
        // 构建未提交列表
        notSubmitted = students
          .filter(s => !submittedStudentIds.has(s.id))
          .map(s => {
            const parents = s.parents as Array<{ id?: string; name?: string; isPrimary?: boolean }> | null;
            const primaryParent = parents?.find(p => p.isPrimary) || parents?.[0];
            return {
              studentId: s.id,
              studentName: s.name,
              parentId: primaryParent?.id || null,
              parentName: primaryParent?.name || '',
            };
          });
        
        statistics.total = students.length;
        statistics.notSubmitted = notSubmitted.length;
        
        return NextResponse.json(success({
          data: responses,
          notSubmitted,
          statistics,
        }));
      }
    }
  }

  // 如果没有班级信息，返回基本响应
  const responses = responseRows.map(row => transformResponseToFrontend(row));
  
  return NextResponse.json(success({
    data: responses,
    notSubmitted,
    statistics,
  }));
}

/**
 * POST - 提交信息采集响应
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await request.json();

  const result = await collectionResponseService.submit(
    id,
    body.respondentId || '',
    body.respondentName || '',
    body.answers || {}
  );

  if (!result.success) {
    return NextResponse.json(
      error(result.error || '提交响应失败', ErrorCode.DATABASE_ERROR),
      { status: 500 }
    );
  }

  return NextResponse.json(success(transformResponseToFrontend(result.data as unknown as ResponseRow)));
}
