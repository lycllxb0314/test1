/**
 * 智能排课测试API - 完整版
 * 
 * 核心功能：
 * 1. 自动根据教师配置生成最优分工方案
 * 2. 实现课表交替分布和时段轮换
 * 3. 返回完整的排课结果和质量指标
 */

import { NextResponse } from 'next/server';
import { smartSchedule, SchoolConfig } from '@/lib/smart-scheduling';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teacherCount = parseInt(searchParams.get('teachers') || '107');
  const chineseCount = parseInt(searchParams.get('chinese') || '30');
  const mathCount = parseInt(searchParams.get('math') || '30');
  
  console.log(`=== 智能排课测试 (${teacherCount}位教师) ===`);
  
  // 1. 配置学校情况
  const config: SchoolConfig = {
    teacherCount,
    chineseTeachers: chineseCount,
    mathTeachers: mathCount,
    skillTeachers: {
      moral: 10,
      science: 8,
      english: 8,
      pe: 8,
      music: 7,
      art: 6,
    },
    classCount: 60,
  };
  
  // 2. 执行智能排课
  const result = smartSchedule(config);
  
  // 3. 计算预期覆盖率
  const totalNeeded = 1520;
  const expectedCoverage = 100;
  
  return NextResponse.json({
    success: true,
    config: {
      teacherCount,
      chineseTeachers: chineseCount,
      mathTeachers: mathCount,
      skillTeachers: config.skillTeachers,
      classCount: config.classCount,
    },
    strategy: result.strategy,
    quality: result.quality,
    teacherWorkload: result.teacherWorkload,
    slots: result.slots,  // 返回完整数据
  });
}
