/**
 * 智能分工与排课一体化API
 * 
 * 流程：
 * 1. 获取基础配置 → 生成分工指导
 * 2. 执行智能分工 → 生成分工方案
 * 3. 执行智能排课 → 生成完整课表
 */

import { NextResponse } from 'next/server';
import { 
  DEFAULT_SCHOOL_CONFIG, 
  calculateSubjectRequirements,
  calculateTeacherRequirements 
} from '@/lib/smart-scheduling/configs';
import { 
  generateDivisionPlan, 
  generateDivisionGuidance 
} from '@/lib/smart-scheduling/division';
import { generateSchedule, oneClickSchedule } from '@/lib/smart-scheduling/schedule';

/**
 * GET - 获取分工指导和配置信息
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'guidance';
  
  try {
    switch (action) {
      case 'guidance':
        // 返回分工指导和配置信息
        const guidance = generateDivisionGuidance(DEFAULT_SCHOOL_CONFIG);
        const subjectReqs = calculateSubjectRequirements(DEFAULT_SCHOOL_CONFIG);
        const teacherReqs = calculateTeacherRequirements(DEFAULT_SCHOOL_CONFIG);
        
        return NextResponse.json({
          success: true,
          config: {
            school: DEFAULT_SCHOOL_CONFIG.name,
            classCount: DEFAULT_SCHOOL_CONFIG.classCount,
            classesPerGrade: DEFAULT_SCHOOL_CONFIG.classesPerGrade,
            teacherCount: DEFAULT_SCHOOL_CONFIG.teacherCount,
          },
          guidance,
          subjectRequirements: subjectReqs,
          teacherRequirements: teacherReqs,
        });
        
      case 'division':
        // 执行智能分工
        const division = generateDivisionPlan(DEFAULT_SCHOOL_CONFIG);
        
        return NextResponse.json({
          success: true,
          division: {
            id: division.id,
            name: division.name,
            quality: division.quality,
            recommendations: division.recommendations,
            warnings: division.warnings,
            // 返回部分分配结果用于预览
            assignments: division.assignments.slice(0, 20),
            totalAssignments: division.assignments.length,
          },
        });
        
      case 'schedule':
        // 执行完整的一键排课
        const result = oneClickSchedule(DEFAULT_SCHOOL_CONFIG);
        
        return NextResponse.json({
          success: true,
          division: {
            id: result.division.id,
            name: result.division.name,
            quality: result.division.quality,
          },
          schedule: {
            id: result.schedule.id,
            totalSlots: result.schedule.slots.length,
            quality: result.schedule.quality,
            // 返回部分课表用于预览
            slots: result.schedule.slots.slice(0, 100),
          },
        });
        
      case 'full-schedule':
        // 返回完整课表（用于导出）
        const fullResult = oneClickSchedule(DEFAULT_SCHOOL_CONFIG);
        
        return NextResponse.json({
          success: true,
          division: fullResult.division,
          schedule: {
            ...fullResult.schedule,
            slots: fullResult.schedule.slots,
          },
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Smart scheduling error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

/**
 * POST - 自定义配置后排课
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { config, constraints } = body;
    
    // 合并默认配置
    const mergedConfig = {
      ...DEFAULT_SCHOOL_CONFIG,
      ...config,
    };
    
    // 执行一键排课
    const result = oneClickSchedule(mergedConfig, constraints);
    
    return NextResponse.json({
      success: true,
      division: result.division,
      schedule: result.schedule,
    });
  } catch (error) {
    console.error('Smart scheduling error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
