import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { StudentListItem } from '@/hooks/useStudentData';

/**
 * 学生列表项（Mock数据）
 */
const mockStudents: StudentListItem[] = [
  {
    id: 's001',
    studentNo: '2024001',
    name: '张三',
    gender: 'male',
    grade: 6,
    gradeName: '六年级',
    classId: 'c6-1',
    className: '六年级1班',
    headTeacherName: '王明华',
    status: '在校',
  },
  {
    id: 's002',
    studentNo: '2024002',
    name: '李四',
    gender: 'female',
    grade: 6,
    gradeName: '六年级',
    classId: 'c6-1',
    className: '六年级1班',
    headTeacherName: '王明华',
    status: '在校',
  },
  {
    id: 's003',
    studentNo: '2024003',
    name: '王五',
    gender: 'male',
    grade: 5,
    gradeName: '五年级',
    classId: 'c5-2',
    className: '五年级2班',
    headTeacherName: '李芳',
    status: '在校',
  },
  {
    id: 's004',
    studentNo: '2024004',
    name: '赵六',
    gender: 'female',
    grade: 5,
    gradeName: '五年级',
    classId: 'c5-2',
    className: '五年级2班',
    headTeacherName: '李芳',
    status: '请假',
  },
  {
    id: 's005',
    studentNo: '2024005',
    name: '孙七',
    gender: 'male',
    grade: 4,
    gradeName: '四年级',
    classId: 'c4-1',
    className: '四年级1班',
    headTeacherName: '张强',
    status: '在校',
  },
  {
    id: 's006',
    studentNo: '2024006',
    name: '周八',
    gender: 'female',
    grade: 4,
    gradeName: '四年级',
    classId: 'c4-1',
    className: '四年级1班',
    headTeacherName: '张强',
    status: '在校',
  },
  {
    id: 's007',
    studentNo: '2024007',
    name: '吴九',
    gender: 'male',
    grade: 3,
    gradeName: '三年级',
    classId: 'c3-3',
    className: '三年级3班',
    headTeacherName: '刘洋',
    status: '在校',
  },
  {
    id: 's008',
    studentNo: '2024008',
    name: '郑十',
    gender: 'female',
    grade: 3,
    gradeName: '三年级',
    classId: 'c3-3',
    className: '三年级3班',
    headTeacherName: '刘洋',
    status: '休学',
  },
  {
    id: 's009',
    studentNo: '2024009',
    name: '陈小明',
    gender: 'male',
    grade: 2,
    gradeName: '二年级',
    classId: 'c2-1',
    className: '二年级1班',
    headTeacherName: '陈红',
    status: '在校',
  },
  {
    id: 's010',
    studentNo: '2024010',
    name: '林小红',
    gender: 'female',
    grade: 2,
    gradeName: '二年级',
    classId: 'c2-1',
    className: '二年级1班',
    headTeacherName: '陈红',
    status: '在校',
  },
  {
    id: 's011',
    studentNo: '2024011',
    name: '黄小华',
    gender: 'male',
    grade: 1,
    gradeName: '一年级',
    classId: 'c1-2',
    className: '一年级2班',
    headTeacherName: '赵刚',
    status: '在校',
  },
  {
    id: 's012',
    studentNo: '2024012',
    name: '杨小芳',
    gender: 'female',
    grade: 1,
    gradeName: '一年级',
    classId: 'c1-2',
    className: '一年级2班',
    headTeacherName: '赵刚',
    status: '在校',
  },
];

/**
 * GET - 获取学生列表
 * 支持搜索、年级、班级、状态筛选
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const grade = searchParams.get('grade');
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');

    // 尝试从数据库获取
    const client = getSupabaseClient();
    
    let query = client
      .from('students')
      .select('id, student_no, name, gender, grade, grade_name, class_id, class_name, status, head_teacher_name, created_at', { count: 'exact' });

    // 应用筛选条件
    if (search) {
      query = query.or(`name.ilike.%${search}%,student_no.ilike.%${search}%`);
    }
    if (grade && grade !== 'all') {
      query = query.eq('grade', parseInt(grade));
    }
    if (classId && classId !== 'all') {
      query = query.eq('class_id', classId);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.log('Database query failed, using mock data:', error.message);
      // 数据库查询失败，使用Mock数据
      let filteredData = [...mockStudents];

      if (search) {
        filteredData = filteredData.filter(s => 
          s.name.includes(search) || s.studentNo.includes(search)
        );
      }
      if (grade && grade !== 'all') {
        filteredData = filteredData.filter(s => s.grade === parseInt(grade));
      }
      if (classId && classId !== 'all') {
        filteredData = filteredData.filter(s => s.classId === classId);
      }
      if (status && status !== 'all') {
        filteredData = filteredData.filter(s => s.status === status);
      }

      const paginatedData = filteredData.slice((page - 1) * pageSize, page * pageSize);

      return NextResponse.json({
        success: true,
        data: paginatedData,
        pagination: {
          page,
          pageSize,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / pageSize),
        },
        source: 'mock',
      });
    }

    // 转换数据库字段为前端格式
    const formattedData = data?.map(item => ({
      id: item.id,
      studentNo: item.student_no,
      name: item.name,
      gender: item.gender,
      grade: item.grade,
      gradeName: item.grade_name,
      classId: item.class_id,
      className: item.class_name,
      headTeacherName: item.head_teacher_name,
      status: item.status,
    })) || [];

    return NextResponse.json({
      success: true,
      data: formattedData,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
      source: 'database',
    });
  } catch (error) {
    console.error('Failed to fetch students:', error);
    return NextResponse.json({
      success: false,
      error: '获取学生列表失败',
    }, { status: 500 });
  }
}

/**
 * POST - 新增学生
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('students')
      .insert({
        student_no: body.studentNo,
        name: body.name,
        gender: body.gender,
        grade: body.grade,
        grade_name: body.gradeName,
        class_id: body.classId,
        class_name: body.className,
        birth_date: body.birthDate,
        status: body.status || '在校',
        parents: body.parents || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      // Mock模式：返回模拟成功响应
      return NextResponse.json({
        success: true,
        data: {
          id: `s${Date.now()}`,
          ...body,
          createdAt: new Date().toISOString(),
        },
        message: '学生添加成功（模拟）',
        source: 'mock',
      });
    }

    return NextResponse.json({
      success: true,
      data,
      message: '学生添加成功',
    });
  } catch (error) {
    console.error('Failed to create student:', error);
    return NextResponse.json({
      success: false,
      error: '添加学生失败',
    }, { status: 500 });
  }
}
