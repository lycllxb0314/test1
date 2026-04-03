/**
 * 家长列表 API
 * 
 * 架构：API Route → Service → Repository
 * 
 * ⚠️ 架构原则：
 * - 通过 Service 层访问数据，禁止直接操作数据库
 * - 使用统一认证中间件
 */

import { NextRequest } from 'next/server';
import { getService, SERVICE_IDENTIFIERS } from '@/lib/di';
import { withAuth } from '@/lib/auth/middleware';
import { paginated, fail, serverError } from '@/lib/api';
import type { ParentService } from '@/services/parent.service';

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

/**
 * GET - 获取家长列表
 */
export const GET = withAuth(async (request: NextRequest) => {
  try {
    const parentService = getService<ParentService>(SERVICE_IDENTIFIERS.ParentService);
    const { searchParams } = new URL(request.url);
    
    // 分页参数
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '500');
    
    // 筛选参数
    const search = searchParams.get('search') || undefined;
    const classId = searchParams.get('classId') || undefined;
    const studentId = searchParams.get('studentId') || undefined;
    const relation = searchParams.get('relation') || undefined;
    const hasAccount = searchParams.get('hasAccount');
    const status = searchParams.get('status') || undefined;
    
    // 调用 Service 层
    const result = await parentService.getList({
      search,
      classId,
      studentId,
      status,
      hasAccount: hasAccount === 'true' ? true : hasAccount === 'false' ? false : undefined,
      page,
      pageSize,
    });
    
    if (!result.success) {
      return fail(result.error || '获取家长列表失败');
    }
    
    // 转换数据格式（下划线转驼峰）
    const formattedData = (result.data || []).map(p => {
      const item = p as unknown as Record<string, unknown>;
      return {
        id: item.id,
        name: item.name,
        relation: item.relation,
        relationName: (item.relation_name as string) || RELATION_NAMES[item.relation as string] || '其他',
        phone: item.phone,
        wechat: item.wechat,
        email: item.email,
        
        // 个人信息
        gender: item.gender,
        birthDate: item.birth_date,
        idCard: item.id_card,
        education: item.education,
        politicalStatus: item.political_status,
        
        // 地址信息
        householdAddress: item.household_address,
        currentAddress: item.current_address,
        
        // 紧急联系人
        emergencyContact: item.emergency_contact,
        emergencyPhone: item.emergency_phone,
        
        // 工作信息
        company: item.work_unit,
        position: item.position,
        occupation: item.occupation,
        
        // 账号信息
        userId: item.user_id || item.account_id,
        hasAccount: item.has_account || false,
        password: item.password,
        lastLoginAt: item.last_login_at,
        
        // 学生绑定
        studentId: item.student_id,
        studentName: item.student_name,
        isPrimary: item.is_primary || false,
        
        // 班级信息
        classId: item.class_id,
        className: item.class_name,
        grade: item.grade,
        gradeName: item.grade ? GRADE_NAMES[item.grade as number] : '',
        
        // 班主任信息
        headTeacherId: item.head_teacher_id,
        headTeacherName: item.head_teacher_name,
        
        // 其他信息
        status: item.status,
        remark: item.remark,
        
        // 通知设置
        notificationSettings: item.notification_settings || {
          homework: true,
          notice: true,
          attendance: true,
          activity: true,
        },
        
        // 时间戳
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    });
    
    // 获取统计数据
    const statistics = {
      total: result.pagination?.total || 0,
      hasAccountCount: formattedData.filter(p => p.hasAccount).length,
      primaryParentCount: formattedData.filter(p => p.isPrimary).length,
      classCount: new Set(formattedData.map(p => p.classId).filter(Boolean)).size,
      relationDistribution: formattedData.reduce((acc, p) => {
        const relation = p.relation as string;
        acc[relation] = (acc[relation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };
    
    return paginated(formattedData, result.pagination?.total || 0, page, pageSize, { statistics });
  } catch (error) {
    console.error('Failed to fetch parents:', error);
    return serverError('获取家长列表失败');
  }
});
