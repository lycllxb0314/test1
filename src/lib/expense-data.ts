/**
 * 费用报销数据模块
 * 
 * v3.0: 移除Mock数据，保留静态配置
 */

import type { ExpenseCategory } from '@/types';

// 报销类别配置
export const expenseCategories: { id: ExpenseCategory; name: string; icon: string }[] = [
  { id: 'office_supplies', name: '办公用品', icon: '📝' },
  { id: 'travel', name: '差旅费', icon: '✈️' },
  { id: 'training', name: '培训费用', icon: '📚' },
  { id: 'teaching_materials', name: '教学材料', icon: '📖' },
  { id: 'activity', name: '活动经费', icon: '🎉' },
  { id: 'transportation', name: '交通费', icon: '🚗' },
  { id: 'communication', name: '通讯费', icon: '📱' },
  { id: 'equipment', name: '设备费用', icon: '💻' },
  { id: 'maintenance', name: '维修费用', icon: '🔧' },
  { id: 'other', name: '其他', icon: '📋' },
];

/**
 * 获取报销类别名称
 */
export function getExpenseCategoryName(category: ExpenseCategory): string {
  return expenseCategories.find(c => c.id === category)?.name || category;
}
