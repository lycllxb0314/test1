/**
 * 数据脱敏工具
 * 
 * 提供多种数据脱敏规则，支持根据角色差异化展示
 * 
 * @module lib/masking
 */

import { UserRole } from '@/types';

// ============================================
// 类型定义
// ============================================

/**
 * 脱敏类型
 */
export type MaskType = 'phone' | 'idCard' | 'bankAccount' | 'name' | 'address' | 'email';

/**
 * 脱敏配置
 */
export interface MaskConfig {
  /** 脱敏类型 */
  type: MaskType;
  /** 是否启用 */
  enabled: boolean;
  /** 自定义脱敏规则（覆盖默认） */
  customRule?: (value: string) => string;
}

/**
 * 角色脱敏权限配置
 */
export interface RoleMaskPermission {
  /** 角色 */
  role: UserRole;
  /** 各字段的脱敏权限：true=完整显示，false=脱敏显示 */
  permissions: Record<string, boolean>;
}

// ============================================
// 脱敏规则实现
// ============================================

/**
 * 手机号脱敏
 * 规则：保留前3后4位，中间用*代替
 * 示例：13812345678 → 138****5678
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}****${cleaned.slice(-4)}`;
  }
  
  // 非标准手机号，保留前后各2位
  if (cleaned.length > 4) {
    return `${cleaned.slice(0, 2)}${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-2)}`;
  }
  
  return phone;
}

/**
 * 身份证号脱敏
 * 规则：保留前3后4位，中间用*代替
 * 示例：350802199001011234 → 350***********1234
 */
export function maskIdCard(idCard: string): string {
  if (!idCard || idCard.length < 8) return idCard;
  
  const cleaned = idCard.replace(/\D/g, '');
  
  if (cleaned.length === 18) {
    return `${cleaned.slice(0, 3)}${'*'.repeat(11)}${cleaned.slice(-4)}`;
  }
  
  if (cleaned.length === 15) {
    return `${cleaned.slice(0, 3)}${'*'.repeat(8)}${cleaned.slice(-4)}`;
  }
  
  // 非标准身份证号
  if (cleaned.length > 7) {
    return `${cleaned.slice(0, 3)}${'*'.repeat(cleaned.length - 7)}${cleaned.slice(-4)}`;
  }
  
  return idCard;
}

/**
 * 银行账号脱敏
 * 规则：保留后4位，前面用*代替
 * 示例：6222021234567890123 → ************0123
 */
export function maskBankAccount(account: string): string {
  if (!account || account.length < 5) return account;
  
  const cleaned = account.replace(/\D/g, '');
  
  if (cleaned.length >= 8) {
    return `${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-4)}`;
  }
  
  return account;
}

/**
 * 姓名脱敏
 * 规则：保留姓，名用*代替
 * 示例：张三 → 张*，欧阳娜娜 → 欧阳**
 */
export function maskName(name: string): string {
  if (!name || name.length < 2) return name;
  
  // 复姓处理
  const doubleSurnames = ['欧阳', '司马', '上官', '诸葛', '东方', '皇甫', '尉迟', '令狐', '宇文', '长孙'];
  
  for (const surname of doubleSurnames) {
    if (name.startsWith(surname)) {
      return `${surname}${'*'.repeat(name.length - surname.length)}`;
    }
  }
  
  // 普通姓名
  return `${name[0]}${'*'.repeat(name.length - 1)}`;
}

/**
 * 地址脱敏
 * 规则：隐藏门牌号
 * 示例：龙岩市新罗区东城街道XX路123号 → 龙岩市新罗区东城街道XX路**号
 */
export function maskAddress(address: string): string {
  if (!address) return address;
  
  // 隐藏门牌号
  return address.replace(/(\d+)(号|栋|幢|室|层)/g, (match, num, unit) => {
    if (num.length <= 2) {
      return `**${unit}`;
    }
    return `${'*'.repeat(num.length - 2)}${num.slice(-2)}${unit}`;
  });
}

/**
 * 邮箱脱敏
 * 规则：用户名部分保留首尾字符，@及域名完整显示
 * 示例：zhangsan@example.com → z*****n@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  
  const [username, domain] = email.split('@');
  
  if (username.length <= 2) {
    return `${username[0]}*@${domain}`;
  }
  
  return `${username[0]}${'*'.repeat(username.length - 2)}${username.slice(-1)}@${domain}`;
}

// ============================================
// 脱敏规则映射
// ============================================

const maskFunctions: Record<MaskType, (value: string) => string> = {
  phone: maskPhone,
  idCard: maskIdCard,
  bankAccount: maskBankAccount,
  name: maskName,
  address: maskAddress,
  email: maskEmail,
};

// ============================================
// 角色差异化展示
// ============================================

/**
 * 角色字段权限配置
 * true: 完整显示
 * false: 脱敏显示
 * 
 * 注意：兼任职务的权限通过主要角色 + 兼任职务合并计算
 */
export const roleFieldPermissions: RoleMaskPermission[] = [
  // 学校领导层
  {
    role: 'principal',
    permissions: { phone: true, id_card: true, home_address: true, bank_account: true },
  },
  {
    role: 'secretary',
    permissions: { phone: true, id_card: true, home_address: true, bank_account: true },
  },
  {
    role: 'vice_principal',
    permissions: { phone: true, id_card: true, home_address: true, bank_account: false },
  },
  // 教师群体
  {
    role: 'head_teacher',
    permissions: { phone: false, id_card: false, home_address: false, bank_account: false },
  },
  {
    role: 'subject_teacher',
    permissions: { phone: false, id_card: false, home_address: false, bank_account: false },
  },
  {
    role: 'skill_teacher',
    permissions: { phone: false, id_card: false, home_address: false, bank_account: false },
  },
  // 家长
  {
    role: 'parent',
    permissions: { phone: true, id_card: true, home_address: true, bank_account: false }, // 本人完整
  },
];

/**
 * 获取角色的字段权限
 */
export function getRoleFieldPermission(role: UserRole): Record<string, boolean> {
  const permission = roleFieldPermissions.find(p => p.role === role);
  return permission?.permissions || {};
}

/**
 * 判断角色是否可以查看完整字段
 */
export function canViewFullField(role: UserRole, field: string): boolean {
  const permissions = getRoleFieldPermission(role);
  return permissions[field] === true;
}

// ============================================
// 核心脱敏函数
// ============================================

/**
 * 对单个字段进行脱敏
 */
export function maskField(value: string, type: MaskType): string {
  if (!value) return value;
  
  const maskFn = maskFunctions[type];
  if (!maskFn) return value;
  
  return maskFn(value);
}

/**
 * 根据角色对字段进行脱敏
 */
export function maskFieldByRole(
  value: string,
  field: string,
  role: UserRole,
  type: MaskType
): string {
  // 检查权限
  if (canViewFullField(role, field)) {
    return value;
  }
  
  // 执行脱敏
  return maskField(value, type);
}

/**
 * 对对象进行批量脱敏
 */
export function maskObject<T extends Record<string, unknown>>(
  obj: T,
  fields: Array<{ field: string; type: MaskType }>
): T {
  const result = { ...obj };
  
  for (const { field, type } of fields) {
    const value = result[field];
    if (typeof value === 'string' && value) {
      (result as Record<string, unknown>)[field] = maskField(value, type);
    }
  }
  
  return result;
}

/**
 * 根据角色对对象进行批量脱敏
 */
export function maskObjectByRole<T extends Record<string, unknown>>(
  obj: T,
  role: UserRole,
  fields: Array<{ field: string; type: MaskType }>
): T {
  const result = { ...obj };
  const permissions = getRoleFieldPermission(role);
  
  for (const { field, type } of fields) {
    // 如果有权限查看完整字段，跳过
    if (permissions[field]) continue;
    
    const value = result[field];
    if (typeof value === 'string' && value) {
      (result as Record<string, unknown>)[field] = maskField(value, type);
    }
  }
  
  return result;
}

/**
 * 对数组中的每个对象进行脱敏
 */
export function maskArray<T extends Record<string, unknown>>(
  arr: T[],
  fields: Array<{ field: string; type: MaskType }>
): T[] {
  return arr.map(item => maskObject(item, fields));
}

/**
 * 根据角色对数组进行脱敏
 */
export function maskArrayByRole<T extends Record<string, unknown>>(
  arr: T[],
  role: UserRole,
  fields: Array<{ field: string; type: MaskType }>
): T[] {
  return arr.map(item => maskObjectByRole(item, role, fields));
}

// ============================================
// 预定义敏感字段配置
// ============================================

/**
 * 常用敏感字段配置
 */
export const SENSITIVE_FIELD_CONFIGS = [
  { field: 'phone', type: 'phone' as MaskType },
  { field: 'emergency_phone', type: 'phone' as MaskType },
  { field: 'emergencyPhone', type: 'phone' as MaskType },
  { field: 'id_card', type: 'idCard' as MaskType },
  { field: 'idCard', type: 'idCard' as MaskType },
  { field: 'bank_account', type: 'bankAccount' as MaskType },
  { field: 'bankAccount', type: 'bankAccount' as MaskType },
  { field: 'home_address', type: 'address' as MaskType },
  { field: 'homeAddress', type: 'address' as MaskType },
  { field: 'address', type: 'address' as MaskType },
  { field: 'name', type: 'name' as MaskType },
  { field: 'email', type: 'email' as MaskType },
];

/**
 * 快捷方法：对学生数据脱敏
 */
export function maskStudentData<T extends Record<string, unknown>>(
  student: T,
  role: UserRole
): T {
  return maskObjectByRole(student, role, [
    { field: 'phone', type: 'phone' },
    { field: 'emergencyPhone', type: 'phone' },
    { field: 'idCard', type: 'idCard' },
    { field: 'homeAddress', type: 'address' },
  ]);
}

/**
 * 快捷方法：对家长数据脱敏
 */
export function maskParentData<T extends Record<string, unknown>>(
  parent: T,
  role: UserRole
): T {
  return maskObjectByRole(parent, role, [
    { field: 'phone', type: 'phone' },
    { field: 'idCard', type: 'idCard' },
  ]);
}

/**
 * 快捷方法：对教师数据脱敏
 */
export function maskTeacherData<T extends Record<string, unknown>>(
  teacher: T,
  role: UserRole
): T {
  return maskObjectByRole(teacher, role, [
    { field: 'phone', type: 'phone' },
    { field: 'idCard', type: 'idCard' },
    { field: 'homeAddress', type: 'address' },
  ]);
}

// ============================================
// 导出
// ============================================

export default {
  maskPhone,
  maskIdCard,
  maskBankAccount,
  maskName,
  maskAddress,
  maskEmail,
  maskField,
  maskFieldByRole,
  maskObject,
  maskObjectByRole,
  maskArray,
  maskArrayByRole,
  canViewFullField,
  getRoleFieldPermission,
};
