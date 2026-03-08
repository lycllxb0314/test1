/**
 * 习惯养成类别配置
 */

export const HABIT_CATEGORIES = [
  { value: '文明习惯', label: '文明习惯', color: 'red' },
  { value: '书写习惯', label: '书写习惯', color: 'blue' },
  { value: '阅读习惯', label: '阅读习惯', color: 'green' },
  { value: '运动习惯', label: '运动习惯', color: 'orange' },
  { value: '劳动习惯', label: '劳动习惯', color: 'purple' },
  { value: '安全习惯', label: '安全习惯', color: 'yellow' },
  { value: '卫生习惯', label: '卫生习惯', color: 'cyan' },
  { value: '审美习惯', label: '审美习惯', color: 'pink' },
] as const;

export type HabitCategory = typeof HABIT_CATEGORIES[number]['value'];

// 类别颜色映射
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '文明习惯': { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  '书写习惯': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  '阅读习惯': { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  '运动习惯': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  '劳动习惯': { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  '安全习惯': { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' },
  '卫生习惯': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  '审美习惯': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
};

// 类别图标映射（用于家长端展示）
export const CATEGORY_ICONS: Record<string, string> = {
  '文明习惯': '🙏',
  '书写习惯': '✍️',
  '阅读习惯': '📚',
  '运动习惯': '🏃',
  '劳动习惯': '🧹',
  '安全习惯': '🛡️',
  '卫生习惯': '🧼',
  '审美习惯': '🎨',
};

// 难度标签
export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

// 状态标签
export const STATUS_LABELS: Record<string, string> = {
  pending: '待开始',
  active: '进行中',
  completed: '已完成',
  failed: '未达标',
};

// 审核状态标签
export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
};
