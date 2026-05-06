import React from 'react';
import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  Heart,
  Users,
  FileText,
  Wrench,
  ShoppingCart,
  DollarSign,
  Shield,
  Package,
  Calendar,
  BookOpen,
  ClipboardList,
  BarChart3,
  Award,
  Target,
  CheckSquare,
  UserCircle,
  School,
  Edit3,
  DoorOpen,
  CalendarClock,
  UserPlus,
  ClipboardCheck,
  Activity,
  Brain,
  Trophy,
  Apple,
  TrendingUp,
  Pill,
  Dumbbell,
  HeartHandshake,
} from 'lucide-react';
import type { ModuleType } from '@/types';

// ─── NavItem 类型 ────────────────────────────────────────────────

export interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  color?: string;
  badge?: string | number;
  children?: NavItem[];
  module?: ModuleType;
  description?: string;
  group?: string; // 分组标签，同组的项会归到一起显示分组标题
}

// ─── 模块元数据 ──────────────────────────────────────────────────

export interface ModuleMeta {
  key: ModuleType;
  label: string;
  icon: React.ElementType;
  activeBg: string;
  activeShadow: string;
  hoverBg: string;
  hoverText: string;
}

export const MODULE_METAS: ModuleMeta[] = [
  {
    key: 'general',
    label: '总务后勤',
    icon: Building2,
    activeBg: 'bg-orange-500',
    activeShadow: 'shadow-orange-500/25',
    hoverBg: 'hover:bg-orange-50',
    hoverText: 'hover:text-orange-600',
  },
  {
    key: 'academic',
    label: '教务教研',
    icon: GraduationCap,
    activeBg: 'bg-blue-500',
    activeShadow: 'shadow-blue-500/25',
    hoverBg: 'hover:bg-blue-50',
    hoverText: 'hover:text-blue-600',
  },
  {
    key: 'moral',
    label: '德育管理',
    icon: Heart,
    activeBg: 'bg-green-500',
    activeShadow: 'shadow-green-500/25',
    hoverBg: 'hover:bg-green-50',
    hoverText: 'hover:text-green-600',
  },
  {
    key: 'health',
    label: '体育健康',
    icon: Activity,
    activeBg: 'bg-teal-500',
    activeShadow: 'shadow-teal-500/25',
    hoverBg: 'hover:bg-teal-50',
    hoverText: 'hover:text-teal-600',
  },
  {
    key: 'mental',
    label: '心理健康',
    icon: HeartHandshake,
    activeBg: 'bg-rose-500',
    activeShadow: 'shadow-rose-500/25',
    hoverBg: 'hover:bg-rose-50',
    hoverText: 'hover:text-rose-600',
  },
  {
    key: 'teacher',
    label: '教师空间',
    icon: Users,
    activeBg: 'bg-purple-500',
    activeShadow: 'shadow-purple-500/25',
    hoverBg: 'hover:bg-purple-50',
    hoverText: 'hover:text-purple-600',
  },
  {
    key: 'parent',
    label: '家长端',
    icon: Heart,
    activeBg: 'bg-cyan-500',
    activeShadow: 'shadow-cyan-500/25',
    hoverBg: 'hover:bg-cyan-50',
    hoverText: 'hover:text-cyan-600',
  },
];

// ─── 各模块导航配置 ──────────────────────────────────────────────

// 总务后勤导航
export const generalNav: NavItem[] = [
  { name: '总务概览', href: '/general', icon: LayoutDashboard, description: '总务工作看板' },
  { name: '资产管理', href: '/general/assets', icon: Package, description: '资产登记与管理' },
  { name: '设备管理', href: '/general/devices', icon: School, description: '智慧设备控制' },
  { name: '报修管理', href: '/general/repairs', icon: Wrench, description: '设施报修与维修' },
  { name: '采购管理', href: '/general/purchase', icon: ShoppingCart, description: '物资采购申请' },
  { name: '财务管理', href: '/general/finance', icon: DollarSign, description: '费用报销管理' },
  { name: '安全管理', href: '/general/security', icon: Shield, description: '校园安全保障' },
  { name: '门禁管理', href: '/general/access', icon: DoorOpen, description: '门禁通行管理' },
  { name: '环境管理', href: '/general/environment', icon: School, description: '校园环境维护' },
  { name: '人员管理', href: '/general/staff', icon: Users, description: '后勤人员管理' },
];

// 教务教研导航
export const academicNav: NavItem[] = [
  { name: '教务概览', href: '/academic', icon: LayoutDashboard, description: '教务工作看板' },
  { name: '学生管理', href: '/academic/students', icon: Users, description: '学生信息管理' },
  { name: '家长管理', href: '/academic/parents', icon: Heart, description: '学生家长信息管理' },
  { name: '新生注册', href: '/academic/enrollment', icon: UserPlus, description: '新生信息采集与注册' },
  { name: '教师管理', href: '/academic/teachers', icon: UserCircle, description: '教师信息管理' },
  { name: '班级管理', href: '/academic/classes', icon: School, description: '班级信息管理' },
  {
    name: '手动排课', href: '/academic/manual-schedule', icon: Edit3, description: '编排班级课表',
    children: [
      { name: '全校课表', href: '/academic/school-schedule', icon: Calendar, description: '全校课表总览' },
      { name: '一年级', href: '/academic/manual-schedule/1', icon: Edit3, description: '一年级排课' },
      { name: '二年级', href: '/academic/manual-schedule/2', icon: Edit3, description: '二年级排课' },
      { name: '三年级', href: '/academic/manual-schedule/3', icon: Edit3, description: '三年级排课' },
      { name: '四年级', href: '/academic/manual-schedule/4', icon: Edit3, description: '四年级排课' },
      { name: '五年级', href: '/academic/manual-schedule/5', icon: Edit3, description: '五年级排课' },
      { name: '六年级', href: '/academic/manual-schedule/6', icon: Edit3, description: '六年级排课' },
    ],
  },
  { name: '工作量统计', href: '/academic/workload', icon: BarChart3, description: '教师工作量统计' },
  { name: '考试管理', href: '/academic/exams', icon: ClipboardList, description: '考试安排管理' },
  { name: '教室管理', href: '/academic/rooms', icon: DoorOpen, description: '教室资源与预约' },
  { name: '教研活动', href: '/academic/research', icon: Target, description: '集体备课与听课评课' },
  { name: '教师考勤', href: '/academic/attendance', icon: CheckSquare, description: '教师考勤管理' },
  { name: '云教学管理', href: '/academic/cloud-course', icon: GraduationCap, description: '教师研修·家长课程·学生课程管理' },
  { name: '课后服务', href: '/academic/after-school', icon: CalendarClock, description: '课后服务选课管理与点名' },
];

// 德育管理导航
export const moralNav: NavItem[] = [
  { name: '德育工作台', href: '/moral', icon: LayoutDashboard, description: '德育处工作台' },
  { name: '习惯养成', href: '/moral/habit', icon: Target, description: '八大习惯目标管理' },
  { name: '德育活动', href: '/moral/activities', icon: Calendar, description: '发布管理德育活动' },
  { name: '学生荣誉', href: '/moral/honors', icon: Award, description: '学生荣誉管理与可视化' },
  { name: '班级常规', href: '/moral/routine', icon: ClipboardCheck, description: '班级常规评比与值日管理' },
  { name: '云教学管理', href: '/moral/cloud-course', icon: GraduationCap, description: '家长课程·学生课程管理' },
];

// 学生体育健康管理导航
export const healthNav: NavItem[] = [
  { name: '健康概览', href: '/health', icon: LayoutDashboard, description: '体育健康管理看板' },
  { name: '体质与体检', href: '/health/fitness', icon: Activity, description: '体质测试与体检数据管理' },
  { name: '锻炼打卡', href: '/health/exercise', icon: Dumbbell, description: '学生锻炼打卡数据' },
  { name: '健康画像', href: '/health/portraits', icon: TrendingUp, description: '学生综合健康画像' },
  { name: '健康处方', href: '/health/prescriptions', icon: Pill, description: '膳食建议与运动处方' },
  { name: '家长观察', href: '/health/observations', icon: Apple, description: '家长每日观察数据查看' },
  { name: '周期报告', href: '/health/reports', icon: BarChart3, description: '周/月/学期健康报告' },
];

// 心理健康管理导航（校领导 + 德育处）
export const mentalHealthNav: NavItem[] = [
  { name: '心理概览', href: '/mental', icon: LayoutDashboard, description: '学生心理健康看板' },
  { name: '预警管理', href: '/mental/warnings', icon: Brain, description: '学生心理预警记录' },
  { name: '授权密钥', href: '/mental/auth-keys', icon: DoorOpen, description: '班主任查看授权管理' },
  { name: '会话记录', href: '/mental/sessions', icon: FileText, description: '智能体对话记录查看' },
];

// 教师空间导航 - 基础功能（所有教师可见）
// 分组逻辑：按使用场景划分，而非功能属性
// - 无 group：首页入口，独立置顶
// - 教学：每天要用的高频教学工具
// - 教研：周期性教研与研修活动
// - 办事：偶发性的行政/后勤申请
// - 个人：低频的个人设置
export const teacherBaseNav: NavItem[] = [
  { name: '工作台', href: '/teacher', icon: LayoutDashboard, description: '教师工作台' },
  { name: '个人档案', href: '/teacher/profile', icon: UserCircle, description: '个人信息维护' },
  { name: '我的课表', href: '/teacher/schedule', icon: Calendar, description: '查看我的课程安排', group: '教学教研' },
  { name: '备课中心', href: '/teacher/lesson-prep', icon: BookOpen, description: '学科备课支持，文本解读', group: '教学教研' },
  { name: '智慧作业', href: '/teacher/smart-homework', icon: Brain, description: 'AI智能命题·校本题库·标准排版', group: '教学教研' },
  { name: '教研活动', href: '/teacher/research', icon: Target, description: '参与教研活动与集体备课', group: '教学教研' },
  { name: '云教学', href: '/teacher/research-cloud', icon: GraduationCap, description: '教师研修·在线学习', group: '教学教研' },
  { name: '课后服务', href: '/teacher/after-school', icon: CalendarClock, description: '查看点名表·AI期末评语', group: '教学教研' },
  { name: '请假调课', href: '/teacher/leave', icon: FileText, description: '请假和调课申请', group: '办事' },
  { name: '报修申请', href: '/teacher/repair', icon: Wrench, description: '提交设施设备报修', group: '办事' },
  { name: '采购申请', href: '/teacher/purchase', icon: ShoppingCart, description: '提交物资采购申请', group: '办事' },
  { name: '报销申请', href: '/teacher/expense', icon: DollarSign, description: '费用报销申请', group: '办事' },
  { name: '教室预约', href: '/teacher/room-booking', icon: DoorOpen, description: '预约使用教室', group: '办事' },
];

// 教师空间导航 - 班主任专属功能
// 统一归入"班级"组——对班主任而言，习惯/荣誉/活动/SOP都是班级事务
export const headTeacherNav: NavItem[] = [
  { name: '班级管理', href: '/teacher/class', icon: Users, description: '学生家长信息', group: '班级' },
  { name: '信息收集', href: '/teacher/collection', icon: ClipboardList, description: '创建表单收集信息', group: '班级' },
  { name: '云教学管理', href: '/teacher/cloud-course-manage', icon: GraduationCap, description: '推送家长/学生课程·查看本班学习进度', group: '班级' },
  { name: '习惯养成', href: '/teacher/habit', icon: Target, description: '制定班级月度习惯目标', group: '班级' },
  { name: '荣誉管理', href: '/teacher/honors', icon: Trophy, description: '管理本班学生荣誉', group: '班级' },
  { name: '德育活动', href: '/teacher/activities', icon: Calendar, description: '参与德育活动提交材料', group: '班级' },
  { name: 'SOP台账', href: '/teacher/class-sop', icon: ClipboardCheck, description: '标准化操作流程与台账管理', group: '班级' },
  { name: '心理健康', href: '/teacher/mental', icon: HeartHandshake, description: '查看本班学生心理状况', group: '班级' },
];

// 教师空间导航 - 科任教师（副班主任）功能
export const subTeacherNav: NavItem[] = [
  { name: '班级管理', href: '/teacher/class', icon: Users, description: '学生家长信息', group: '班级' },
  { name: '荣誉管理', href: '/teacher/honors', icon: Trophy, description: '管理本班学生荣誉', group: '班级' },
];

// 教师空间导航 - 年段长专属功能
export const gradeLeaderNav: NavItem[] = [
  { name: '年级管理', href: '/teacher/grade', icon: Users, description: '年级教师学生管理', group: '年级' },
  { name: '调课管理', href: '/teacher/adjust', icon: CalendarClock, description: '处理年级调课申请', group: '年级' },
  { name: '年级课表', href: '/teacher/grade-schedule', icon: Calendar, description: '查看年级课表', group: '年级' },
  { name: '德育活动', href: '/teacher/activities', icon: Calendar, description: '参与德育活动提交材料', group: '年级' },
];

// 家长端导航
export const parentNav: NavItem[] = [
  { name: '家长工作台', href: '/parent', icon: LayoutDashboard, description: '家长端工作台' },
  { name: '暖心童童', href: '/parent/mental', icon: HeartHandshake, description: '与树洞朋友聊天' },
  { name: '体育健康', href: '/parent/health', icon: Heart, description: '孩子体育健康数据与建议' },
  { name: '云教学', href: '/parent/cloud-course', icon: GraduationCap, description: '家长课程·子女学习' },
  { name: '课后选课', href: '/parent/after-school', icon: CalendarClock, description: '课后服务一键选课' },
  { name: '荣誉申报', href: '/parent/honor-application', icon: Trophy, description: '为孩子申报学校荣誉' },
  { name: '信息收集', href: '/parent/collection', icon: ClipboardList, description: '填写信息收集表' },
  { name: '习惯打卡', href: '/parent/habit', icon: Target, description: '子女习惯养成打卡' },
  { name: '个人资料', href: '/parent/profile', icon: UserCircle, description: '维护个人信息' },
  { name: '子女信息', href: '/parent/children', icon: Users, description: '子女信息管理' },
  { name: '成绩查看', href: '/parent/grades', icon: BookOpen, description: '查看子女成绩' },
  { name: '通知公告', href: '/parent/announcements', icon: Heart, description: '学校通知公告' },
  { name: '新生注册', href: '/parent/enrollment', icon: UserPlus, description: '新生入学注册' },
];

// ─── 导航分组工具函数 ────────────────────────────────────────────

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/** 将平铺的 NavItem[] 按 group 字段归组 */
export function groupNavItems(items: NavItem[]): NavGroup[] {
  if (!Array.isArray(items) || items.length === 0) return [];
  const groups: NavGroup[] = [];
  let currentGroup: string | null = null;
  for (const item of items) {
    const group = item.group || '';
    if (group !== currentGroup) {
      groups.push({ label: group, items: [item] });
      currentGroup = group;
    } else {
      groups[groups.length - 1]!.items.push(item);
    }
  }
  return groups;
}
