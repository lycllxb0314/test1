/**
 * 学科配色系统
 * 统一管理各学科的显示颜色
 */

export const SUBJECT_COLORS: Record<string, { bg: string; text: string; border: string; light: string }> = {
  '语文': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', light: 'bg-amber-50' },
  '数学': { bg: 'bg-sky-100', text: 'text-sky-800', border: 'border-sky-200', light: 'bg-sky-50' },
  '英语': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', light: 'bg-teal-50' },
  '科学': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', light: 'bg-emerald-50' },
  '音乐': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', light: 'bg-rose-50' },
  '美术': { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', light: 'bg-orange-50' },
  '体育': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200', light: 'bg-green-50' },
  '道德与法治': { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', light: 'bg-violet-50' },
  '信息技术': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', light: 'bg-cyan-50' },
  '综合实践': { bg: 'bg-stone-100', text: 'text-stone-800', border: 'border-stone-200', light: 'bg-stone-50' },
  '劳动': { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200', light: 'bg-lime-50' },
  '书法': { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', light: 'bg-pink-50' },
  '校本': { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', light: 'bg-indigo-50' },
  '班会': { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', light: 'bg-slate-50' },
};

/**
 * 获取学科颜色配置
 */
export function getSubjectColor(subject: string) {
  return SUBJECT_COLORS[subject] || { bg: 'bg-neutral-100', text: 'text-neutral-800', border: 'border-neutral-200', light: 'bg-neutral-50' };
}
