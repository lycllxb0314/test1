import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// Mock班级数据
const mockClasses = [
  { id: 'c1-1', name: '一年级1班', grade: 1, headTeacherId: 't001', headTeacherName: '王明华', studentCount: 45, classroomName: '教学楼A101', building: 'A栋', status: 'active' },
  { id: 'c1-2', name: '一年级2班', grade: 1, headTeacherId: 't002', headTeacherName: '李芳', studentCount: 44, classroomName: '教学楼A102', building: 'A栋', status: 'active' },
  { id: 'c2-1', name: '二年级1班', grade: 2, headTeacherId: 't003', headTeacherName: '张强', studentCount: 46, classroomName: '教学楼A201', building: 'A栋', status: 'active' },
  { id: 'c2-2', name: '二年级2班', grade: 2, headTeacherId: 't004', headTeacherName: '刘洋', studentCount: 43, classroomName: '教学楼A202', building: 'A栋', status: 'active' },
  { id: 'c3-1', name: '三年级1班', grade: 3, headTeacherId: 't005', headTeacherName: '陈红', studentCount: 47, classroomName: '教学楼B101', building: 'B栋', status: 'active' },
  { id: 'c3-2', name: '三年级2班', grade: 3, headTeacherId: 't006', headTeacherName: '赵刚', studentCount: 45, classroomName: '教学楼B102', building: 'B栋', status: 'active' },
  { id: 'c4-1', name: '四年级1班', grade: 4, headTeacherId: 't007', headTeacherName: '孙丽', studentCount: 44, classroomName: '教学楼B201', building: 'B栋', status: 'active' },
  { id: 'c4-2', name: '四年级2班', grade: 4, headTeacherId: 't008', headTeacherName: '周伟', studentCount: 46, classroomName: '教学楼B202', building: 'B栋', status: 'active' },
  { id: 'c5-1', name: '五年级1班', grade: 5, headTeacherId: 't009', headTeacherName: '吴明', studentCount: 45, classroomName: '教学楼C101', building: 'C栋', status: 'active' },
  { id: 'c5-2', name: '五年级2班', grade: 5, headTeacherId: 't010', headTeacherName: '郑华', studentCount: 44, classroomName: '教学楼C102', building: 'C栋', status: 'active' },
  { id: 'c6-1', name: '六年级1班', grade: 6, headTeacherId: 't011', headTeacherName: '王明华', studentCount: 48, classroomName: '教学楼C201', building: 'C栋', status: 'active' },
  { id: 'c6-2', name: '六年级2班', grade: 6, headTeacherId: 't012', headTeacherName: '李芳', studentCount: 47, classroomName: '教学楼C202', building: 'C栋', status: 'active' },
];

/**
 * GET - 获取班级列表
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const grade = searchParams.get('grade');
    const headTeacherId = searchParams.get('headTeacherId');
    const search = searchParams.get('search');

    // 尝试数据库查询
    const client = getSupabaseClient();
    
    let query = client
      .from('classes')
      .select('*', { count: 'exact' });

    if (grade) query = query.eq('grade', parseInt(grade));
    if (headTeacherId) query = query.eq('head_teacher_id', headTeacherId);
    if (search) query = query.ilike('name', `%${search}%`);

    const from = (page - 1) * pageSize;
    query = query.range(from, from + pageSize - 1);
    query = query.order('grade', { ascending: true });

    const { data, error, count } = await query;

    if (error) {
      // 数据库失败，使用Mock数据
      let filteredData = [...mockClasses];
      if (grade) filteredData = filteredData.filter(c => c.grade === parseInt(grade));
      if (headTeacherId) filteredData = filteredData.filter(c => c.headTeacherId === headTeacherId);
      if (search) filteredData = filteredData.filter(c => c.name.includes(search));

      const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

      return NextResponse.json({
        success: true,
        data: {
          data: paginatedData,
          total: filteredData.length,
          page,
          pageSize,
          totalPages: Math.ceil(filteredData.length / pageSize),
        },
        source: 'mock',
      });
    }

    const classes = (data || []).map(c => ({
      id: c.id,
      name: c.name,
      grade: c.grade,
      headTeacherId: c.head_teacher_id,
      headTeacherName: c.head_teacher_name,
      studentCount: c.student_count || 0,
      classroomId: c.classroom_id,
      classroomName: c.classroom_name,
      building: c.building,
      status: c.status,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    }));

    return NextResponse.json({
      success: true,
      data: {
        data: classes,
        total: count || 0,
        page,
        pageSize,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch classes:', error);
    // 异常情况也返回Mock数据
    return NextResponse.json({
      success: true,
      data: {
        data: mockClasses.slice(0, 10),
        total: mockClasses.length,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      },
      source: 'mock',
    });
  }
}
