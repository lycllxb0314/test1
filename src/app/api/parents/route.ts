/**
 * 家长列表 API
 * 
 * GET /api/parents - 获取家长列表（支持分页、筛选）
 */

import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { ok, fail, serverError, paginated } from '@/lib/api';

// 年级名称映射
const GRADE_NAMES = ['', '一年级', '二年级', '三年级', '四年级', '五年级', '六年级'];

// 关系名称映射
const RELATION_NAMES: Record<string, string> = {
  father: '父亲',
  mother: '母亲',
  grandfather: '爷爷/外公',
  grandmother: '奶奶/外婆',
  other: '其他',
};

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseClient();
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '500');
    
    // 筛选参数
    const search = searchParams.get('search');
    const classId = searchParams.get('classId');
    const studentId = searchParams.get('studentId');
    const relation = searchParams.get('relation');
    const hasAccount = searchParams.get('hasAccount');
    
    // 构建查询
    let query = client
      .from('parents')
      .select('*', { count: 'exact' });
    
    // 应用筛选
    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (classId && classId !== 'all') {
      query = query.eq('class_id', classId);
    }
    if (studentId && studentId !== 'all') {
      query = query.eq('student_id', studentId);
    }
    if (relation && relation !== 'all') {
      query = query.eq('relation', relation);
    }
    if (hasAccount !== null && hasAccount !== 'all') {
      query = query.eq('has_account', hasAccount === 'true');
    }
    
    // 排序
    query = query.order('created_at', { ascending: false });
    
    // 分页
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) {
      return fail(error.message);
    }
    
    // 转换数据格式（下划线转驼峰）
    const formattedData = (data || []).map(p => ({
      id: p.id,
      name: p.name,
      relation: p.relation,
      relationName: p.relation_name || RELATION_NAMES[p.relation] || '其他',
      phone: p.phone,
      wechat: p.wechat,
      email: p.email,
      
      // 个人信息
      gender: p.gender,
      birthDate: p.birth_date,
      idCard: p.id_card,
      education: p.education,
      politicalStatus: p.political_status,
      
      // 地址信息
      householdAddress: p.household_address,
      currentAddress: p.current_address,
      
      // 紧急联系人
      emergencyContact: p.emergency_contact,
      emergencyPhone: p.emergency_phone,
      
      // 工作信息
      company: p.work_unit,
      position: p.position,
      occupation: p.occupation,
      
      // 账号信息
      userId: p.user_id || p.account_id,
      hasAccount: p.has_account || false,
      password: p.password,
      lastLoginAt: p.last_login_at,
      
      // 学生绑定
      studentId: p.student_id,
      studentName: p.student_name,
      isPrimary: p.is_primary || false,
      
      // 班级信息
      classId: p.class_id,
      className: p.class_name,
      grade: p.grade,
      gradeName: p.grade ? GRADE_NAMES[p.grade] : '',
      
      // 班主任信息
      headTeacherId: p.head_teacher_id,
      headTeacherName: p.head_teacher_name,
      
      // 其他信息
      status: p.status,
      remark: p.remark,
      
      // 通知设置
      notificationSettings: p.notification_settings || {
        homework: true,
        notice: true,
        attendance: true,
        activity: true,
      },
      
      // 时间戳
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));
    
    // 获取统计数据（基于筛选条件，不分页）
    // 构建统计查询的筛选条件
    let statsQuery = client.from('parents').select('has_account, is_primary, relation, class_id', { count: 'exact' });
    
    // 应用相同的筛选条件
    if (search) {
      statsQuery = statsQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    if (classId && classId !== 'all') {
      statsQuery = statsQuery.eq('class_id', classId);
    }
    if (studentId && studentId !== 'all') {
      statsQuery = statsQuery.eq('student_id', studentId);
    }
    if (relation && relation !== 'all') {
      statsQuery = statsQuery.eq('relation', relation);
    }
    if (hasAccount !== null && hasAccount !== 'all') {
      statsQuery = statsQuery.eq('has_account', hasAccount === 'true');
    }
    
    const { data: statsData, error: statsError } = await statsQuery;
    
    // 计算统计数据（基于筛选后的全部数据）
    const allFilteredData = statsData || [];
    const statistics = {
      total: count || 0,
      hasAccountCount: allFilteredData.filter(p => p.has_account).length,
      primaryParentCount: allFilteredData.filter(p => p.is_primary).length,
      classCount: new Set(allFilteredData.map(p => p.class_id).filter(Boolean)).size,
      relationDistribution: allFilteredData.reduce((acc, p) => {
        acc[p.relation] = (acc[p.relation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    return paginated(formattedData, count || 0, page, pageSize, { statistics });
  } catch (error) {
    console.error('Failed to fetch parents:', error);
    return serverError('获取家长列表失败');
  }
}
