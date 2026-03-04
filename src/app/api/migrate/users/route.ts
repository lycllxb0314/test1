/**
 * 用户账号迁移脚本
 * 
 * 从教务系统的教师和家长数据创建正式用户账号
 * 
 * 角色体系说明：
 * - 主要角色（UserRole）：用于登录身份，来自教师的主要角色或家长
 * - 兼任职务（AdministrativeRole）：只增加权限，不作为登录身份
 */

import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 默认密码（用于没有设置密码的用户）
const DEFAULT_PASSWORD = 'lysf2026';

// 账号前缀
const ACCOUNT_PREFIX = 'ly';

// 密码加密函数
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

interface MigrationResult {
  step: string;
  status: 'success' | 'error' | 'skipped';
  message?: string;
  count?: number;
}

interface UserAccount {
  id?: string;              // 可选，让数据库自动生成 UUID
  employee_id: string;      // 工号/账号
  name: string;
  role: string;             // 主要角色
  additional_roles: string[]; // 兼任职务
  password_hash: string;    // 密码（生产环境应加密）
  phone?: string;
  email?: string;
  status: string;
  // 班主任相关
  class_id?: string;
  class_name?: string;
  // 家长相关
  children?: Array<{
    id: string;
    name: string;
    classId: string;
    className: string;
  }>;
}

export async function POST() {
  const client = getSupabaseClient();
  const results: MigrationResult[] = [];
  const accounts: Array<{ account: string; password: string; name: string; role: string }> = [];

  try {
    // 1. 获取所有教师数据
    console.log('Fetching teachers...');
    const { data: teachers, error: teacherError } = await client
      .from('teachers')
      .select('*');

    if (teacherError) {
      results.push({ step: 'fetch_teachers', status: 'error', message: teacherError.message });
      return NextResponse.json({ results });
    }

    results.push({ step: 'fetch_teachers', status: 'success', count: teachers?.length || 0 });

    // 2. 获取所有学生数据（用于创建家长账号）
    console.log('Fetching students...');
    const { data: students, error: studentError } = await client
      .from('students')
      .select('*');

    if (studentError) {
      results.push({ step: 'fetch_students', status: 'error', message: studentError.message });
      return NextResponse.json({ results });
    }

    results.push({ step: 'fetch_students', status: 'success', count: students?.length || 0 });

    // 3. 准备用户账号数据
    const userAccounts: UserAccount[] = [];
    let accountIndex = 1;

    // 处理教师数据
    for (const teacher of teachers || []) {
      // 映射角色
      const role = mapTeacherRole(teacher.role);
      const additionalRoles = teacher.additional_roles || [];

      // 生成工号（如果教师已有工号则使用现有的）
      const employeeId = teacher.employee_id || `${ACCOUNT_PREFIX}${String(accountIndex).padStart(4, '0')}`;
      accountIndex++;

      // 使用教师的原始密码（需要加密）
      const hashedPassword = await hashPassword(teacher.password || DEFAULT_PASSWORD);

      userAccounts.push({
        // 不指定 ID，让数据库自动生成 UUID
        employee_id: employeeId,
        name: teacher.name,
        role: role,
        additional_roles: additionalRoles,
        password_hash: hashedPassword,
        phone: teacher.phone,
        email: teacher.email,
        status: teacher.status || 'active',
        class_id: teacher.head_teacher_class_id || teacher.headTeacherClassId,
        class_name: teacher.head_teacher_class_name || teacher.headTeacherClassName,
      });

      accounts.push({
        account: employeeId,
        password: teacher.password || DEFAULT_PASSWORD,
        name: teacher.name,
        role: getRoleLabel(role),
      });
    }

    // 处理家长数据（从学生数据中提取）
    const parentMap = new Map<string, UserAccount>();
    
    for (const student of students || []) {
      const parents = student.parents || [];
      
      for (const parent of parents) {
        if (!parent.phone || parentMap.has(parent.phone)) continue;
        
        // 生成家长账号
        const employeeId = `${ACCOUNT_PREFIX}${String(accountIndex).padStart(4, '0')}`;
        accountIndex++;

        const parentAccount: UserAccount = {
          // 不指定 ID，让数据库自动生成 UUID
          employee_id: employeeId,
          name: parent.name || `${student.name}家长`,
          role: 'parent',
          additional_roles: [],
          password_hash: DEFAULT_PASSWORD,
          phone: parent.phone,
          status: 'active',
          children: [{
            id: student.id,
            name: student.name,
            classId: student.class_id,
            className: student.class_name,
          }],
        };

        parentMap.set(parent.phone, parentAccount);
        
        accounts.push({
          account: employeeId,
          password: DEFAULT_PASSWORD,
          name: parent.name || `${student.name}家长`,
          role: '家长',
        });
      }
    }

    // 合并家长账号
    userAccounts.push(...parentMap.values());

    // 4. 创建 users 表（如果不存在）
    console.log('Creating users table...');
    
    // 先尝试清空现有数据
    const { error: deleteError } = await client
      .from('users')
      .delete()
      .neq('id', 'xxx'); // 删除所有记录

    if (deleteError && !deleteError.message.includes('does not exist')) {
      console.log('Clear users warning:', deleteError.message);
    }

    // 5. 插入用户数据
    console.log('Inserting users...');
    const { error: insertError } = await client
      .from('users')
      .insert(userAccounts);

    if (insertError) {
      // 如果表不存在，尝试创建
      if (insertError.message.includes('does not exist') || insertError.message.includes('relation')) {
        results.push({ 
          step: 'create_users_table', 
          status: 'error', 
          message: 'users 表不存在，请先在数据库中创建该表' 
        });
        
        // 返回表结构说明
        return NextResponse.json({
          success: false,
          results,
          tableDefinition: `
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(30) NOT NULL,
  additional_roles JSONB DEFAULT '[]',
  password_hash VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  class_id VARCHAR(50),
  class_name VARCHAR(50),
  children JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
          `,
          accounts, // 返回账号列表供参考
        });
      }
      
      results.push({ step: 'insert_users', status: 'error', message: insertError.message });
      return NextResponse.json({ results });
    }

    results.push({ 
      step: 'insert_users', 
      status: 'success', 
      count: userAccounts.length,
      message: `已创建 ${userAccounts.length} 个用户账号`
    });

    return NextResponse.json({ 
      success: true, 
      results,
      summary: {
        totalAccounts: userAccounts.length,
        teacherAccounts: teachers?.length || 0,
        parentAccounts: parentMap.size,
      },
      accounts, // 返回账号列表
    });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ 
      success: false, 
      results: [...results, { step: 'error', status: 'error', message: String(err) }]
    });
  }
}

/**
 * 映射教师角色
 * 将数据库中的角色映射到标准 UserRole
 */
function mapTeacherRole(dbRole: string): string {
  const roleMap: Record<string, string> = {
    'principal': 'principal',
    'secretary': 'secretary',
    'academic_vice_principal': 'academic_vice_principal',
    'moral_vice_principal': 'moral_vice_principal',
    'general_vice_principal': 'general_vice_principal',
    'head_teacher': 'head_teacher',
    'subject_teacher': 'subject_teacher',
    'skill_teacher': 'skill_teacher',
    // 旧角色映射
    'grade_leader': 'head_teacher', // 年段长默认映射为班主任
    'research_group_leader': 'subject_teacher', // 教研组长映射为科任
    'research_group_deputy_leader': 'subject_teacher',
  };
  
  return roleMap[dbRole] || 'subject_teacher';
}

/**
 * 获取角色标签
 */
function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    'principal': '校长',
    'secretary': '书记',
    'academic_vice_principal': '教学副校长',
    'moral_vice_principal': '德育副校长',
    'general_vice_principal': '总务副校长',
    'head_teacher': '班主任',
    'subject_teacher': '科任教师',
    'skill_teacher': '技能课教师',
    'parent': '家长',
  };
  return labels[role] || role;
}
