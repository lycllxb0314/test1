/**
 * 体育健康管理 Service
 * 
 * 核心业务逻辑：
 * 1. 健康档案 CRUD
 * 2. 体质测评数据导入与查询
 * 3. 家长观察数据提交与查询
 * 4. 健康画像计算（规则引擎 + AI）
 * 5. 健康处方生成
 * 6. 统计概览
 */
import { BaseService, type ServiceResult } from './base.service';
import { healthProfileRepository } from '@/repositories/health-profile.repository';
import { fitnessAssessmentRepository } from '@/repositories/fitness-assessment.repository';
import { parentObservationRepository } from '@/repositories/parent-observation.repository';
import { healthPortraitRepository } from '@/repositories/health-portrait.repository';
import { healthPrescriptionRepository } from '@/repositories/health-prescription.repository';
import type {
  HealthProfile,
  FitnessAssessment,
  FitnessAssessmentRow,
  ParentDailyObservationRow,
  CreateObservationDTO,
  StudentHealthPortrait,
  CreateFitnessAssessmentDTO,
  CreateHealthPrescriptionDTO,
  HealthStatsOverview,
} from '@/types/health-management';

export class HealthManagementService extends BaseService {
  // ==================== 健康档案 ====================

  async getProfileByStudentId(studentId: string) {
    const profile = await healthProfileRepository.findByStudentId(studentId);
    if (!profile) {
      return this.ok(null);
    }
    return this.ok(profile);
  }

  async upsertProfile(studentId: string, data: Partial<HealthProfile>) {
    const profile = await healthProfileRepository.upsertByStudentId(studentId, data);
    if (!profile) {
      return this.fail('保存健康档案失败', 'SAVE_ERROR');
    }
    return this.ok(profile);
  }

  // ==================== 体质测评 ====================

  async getFitnessByStudentId(studentId: string) {
    const records = await fitnessAssessmentRepository.findByStudentId(studentId);
    return this.ok(records.map(mapFitnessFromRow));
  }

  async getFitnessByYearSemester(academicYear: string, semester: string) {
    const records = await fitnessAssessmentRepository.findByYearSemester(academicYear, semester);
    return this.ok(records.map(mapFitnessFromRow));
  }

  async createFitnessAssessment(dto: CreateFitnessAssessmentDTO & { importedBy?: string }) {
    const row: Partial<FitnessAssessmentRow> = {
      student_id: dto.studentId,
      academic_year: dto.academicYear,
      semester: dto.semester,
      test_date: dto.testDate || null,
      height_cm: dto.heightCm ?? null,
      weight_kg: dto.weightKg ?? null,
      bmi: dto.bmi ?? null,
      vital_capacity: dto.vitalCapacity ?? null,
      run_50m: dto.run50m ?? null,
      run_50x8: dto.run50x8 ?? null,
      sit_and_reach: dto.sitAndReach ?? null,
      sit_ups_1min: dto.sitUps1min ?? null,
      rope_jump_1min: dto.ropeJump1min ?? null,
      total_score: dto.totalScore ?? null,
      grade_level: dto.gradeLevel ?? null,
      vision_left: dto.visionLeft ?? null,
      vision_right: dto.visionRight ?? null,
      // 体检字段
      dental_caries_left: (dto as Record<string, unknown>).dentalCariesLeft as number | null ?? null,
      dental_caries_right: (dto as Record<string, unknown>).dentalCariesRight as number | null ?? null,
      dental_filling_left: (dto as Record<string, unknown>).dentalFillingLeft as number | null ?? null,
      dental_filling_right: (dto as Record<string, unknown>).dentalFillingRight as number | null ?? null,
      dental_missing_left: (dto as Record<string, unknown>).dentalMissingLeft as number | null ?? null,
      dental_missing_right: (dto as Record<string, unknown>).dentalMissingRight as number | null ?? null,
      spine_normal: (dto as Record<string, unknown>).spineNormal as boolean | null ?? null,
      systolic_bp: (dto as Record<string, unknown>).systolicBp as number | null ?? null,
      diastolic_bp: (dto as Record<string, unknown>).diastolicBp as number | null ?? null,
      heart_rate: (dto as Record<string, unknown>).heartRate as number | null ?? null,
      color_blindness: (dto as Record<string, unknown>).colorBlindness as string | null ?? null,
      hearing_left: (dto as Record<string, unknown>).hearingLeft as string | null ?? null,
      hearing_right: (dto as Record<string, unknown>).hearingRight as string | null ?? null,
      checkup_notes: (dto as Record<string, unknown>).checkupNotes as string | null ?? null,
      source: dto.source || 'manual',
      imported_by: dto.importedBy ?? null,
      imported_at: new Date().toISOString(),
    };

    const result = await fitnessAssessmentRepository.create(row as Omit<FitnessAssessmentRow, 'id' | 'created_at' | 'updated_at'>);
    if (!result) {
      return this.fail('创建体质测评记录失败', 'SAVE_ERROR');
    }

    // 触发画像更新
    await this.computePortrait(dto.studentId);

    return this.ok(mapFitnessFromRow(result));
  }

  async bulkImportFitness(records: (CreateFitnessAssessmentDTO & { importedBy?: string })[]) {
    const rows: Partial<FitnessAssessmentRow>[] = records.map(dto => ({
      student_id: dto.studentId,
      academic_year: dto.academicYear,
      semester: dto.semester,
      test_date: dto.testDate || null,
      height_cm: dto.heightCm ?? null,
      weight_kg: dto.weightKg ?? null,
      bmi: dto.bmi ?? null,
      vital_capacity: dto.vitalCapacity ?? null,
      run_50m: dto.run50m ?? null,
      run_50x8: dto.run50x8 ?? null,
      sit_and_reach: dto.sitAndReach ?? null,
      sit_ups_1min: dto.sitUps1min ?? null,
      rope_jump_1min: dto.ropeJump1min ?? null,
      total_score: dto.totalScore ?? null,
      grade_level: dto.gradeLevel ?? null,
      vision_left: dto.visionLeft ?? null,
      vision_right: dto.visionRight ?? null,
      // 体检字段
      dental_caries_left: (dto as Record<string, unknown>).dentalCariesLeft as number | null ?? null,
      dental_caries_right: (dto as Record<string, unknown>).dentalCariesRight as number | null ?? null,
      dental_filling_left: (dto as Record<string, unknown>).dentalFillingLeft as number | null ?? null,
      dental_filling_right: (dto as Record<string, unknown>).dentalFillingRight as number | null ?? null,
      dental_missing_left: (dto as Record<string, unknown>).dentalMissingLeft as number | null ?? null,
      dental_missing_right: (dto as Record<string, unknown>).dentalMissingRight as number | null ?? null,
      spine_normal: (dto as Record<string, unknown>).spineNormal as boolean | null ?? null,
      systolic_bp: (dto as Record<string, unknown>).systolicBp as number | null ?? null,
      diastolic_bp: (dto as Record<string, unknown>).diastolicBp as number | null ?? null,
      heart_rate: (dto as Record<string, unknown>).heartRate as number | null ?? null,
      color_blindness: (dto as Record<string, unknown>).colorBlindness as string | null ?? null,
      hearing_left: (dto as Record<string, unknown>).hearingLeft as string | null ?? null,
      hearing_right: (dto as Record<string, unknown>).hearingRight as string | null ?? null,
      checkup_notes: (dto as Record<string, unknown>).checkupNotes as string | null ?? null,
      source: 'import',
      imported_by: dto.importedBy ?? null,
      imported_at: new Date().toISOString(),
    }));

    const count = await fitnessAssessmentRepository.bulkInsert(rows as FitnessAssessmentRow[]);
    if (count === 0) {
      return this.fail('批量导入失败', 'IMPORT_ERROR');
    }

    // 异步更新所有涉及学生的画像
    const studentIds = [...new Set(records.map(r => r.studentId))];
    for (const studentId of studentIds) {
      await this.computePortrait(studentId);
    }

    return this.ok({ imported: count });
  }

  // ==================== 家长观察 ====================

  async getObservationsByStudentId(studentId: string, days = 30) {
    const records = await parentObservationRepository.findByStudentId(studentId, days);
    return this.ok(records.map(mapObservationFromRow));
  }

  async getObservationsByParentId(parentId: string, days = 30) {
    const records = await parentObservationRepository.findByParentId(parentId, days);
    return this.ok(records.map(mapObservationFromRow));
  }

  async createOrUpdateObservation(parentId: string, studentId: string, dto: CreateObservationDTO) {
    const record = await parentObservationRepository.upsertByParentDate({
      parent_id: parentId,
      student_id: studentId,
      observation_date: dto.observationDate,
      sleep_quality: dto.sleepQuality,
      diet_quality: dto.dietQuality,
      energy_level: dto.energyLevel,
      note: dto.note ?? null,
    });

    if (!record) {
      return this.fail('保存观察数据失败', 'SAVE_ERROR');
    }

    // 触发画像更新
    await this.computePortrait(studentId);

    return this.ok(mapObservationFromRow(record));
  }

  // ==================== 健康画像 ====================

  async getPortraitByStudentId(studentId: string) {
    const portrait = await healthPortraitRepository.findByStudentId(studentId);
    return this.ok(portrait);
  }

  async getAllPortraits(page = 1, pageSize = 20, status?: string) {
    const result = await healthPortraitRepository.findAllWithStudentInfo(page, pageSize, status);
    return this.ok(result);
  }

  /** 计算学生健康画像（规则引擎） */
  async computePortrait(studentId: string) {
    // 1. 获取最新体质测评
    const assessments = await fitnessAssessmentRepository.findByStudentId(studentId);
    const latestAssessment = assessments[0] ?? null;

    // 2. 获取家长观察统计（近30天）
    const obsStats = await parentObservationRepository.getStudentObservationStats(studentId, 30);

    // 3. 获取运动打卡数据（复用习惯系统）
    // TODO: 从 habit_daily_records 获取运动类打卡

    // 4. 规则引擎计算画像
    const portrait: Partial<StudentHealthPortrait> = {};
    const dataSources: string[] = [];
    const riskFactors: string[] = [];
    const strengths: string[] = [];

    // BMI 评估
    if (latestAssessment?.bmi) {
      dataSources.push('fitness_assessment');
      const bmi = latestAssessment.bmi;
      if (bmi < 14) { portrait.bmiStatus = 'underweight'; riskFactors.push('偏瘦'); }
      else if (bmi < 18) { portrait.bmiStatus = 'normal'; strengths.push('BMI正常'); }
      else if (bmi < 20) { portrait.bmiStatus = 'overweight'; riskFactors.push('偏胖'); }
      else { portrait.bmiStatus = 'obese'; riskFactors.push('肥胖'); }
    }

    // 体质等级
    if (latestAssessment?.grade_level) {
      portrait.fitnessLevel = mapGradeLevel(latestAssessment.grade_level);
      if (['优秀', '良好'].includes(latestAssessment.grade_level)) {
        strengths.push(`体质${latestAssessment.grade_level}`);
      } else if (latestAssessment.grade_level === '不及格') {
        riskFactors.push('体质不及格');
      }
    }

    // 睡眠评估
    if (obsStats.total > 0) {
      dataSources.push('parent_observation');
      const sleepGoodRate = obsStats.sleepSufficient / obsStats.total;
      const sleepBadRate = obsStats.sleepInsufficient / obsStats.total;
      portrait.sleepScore = Math.round(sleepGoodRate * 100);
      portrait.sleepPattern = sleepGoodRate >= 0.7 ? 'good' : sleepBadRate >= 0.3 ? 'poor' : 'normal';
      if (sleepBadRate >= 0.3) riskFactors.push('睡眠不足');
      if (sleepGoodRate >= 0.7) strengths.push('睡眠充足');
    }

    // 饮食评估
    if (obsStats.total > 0) {
      const dietGoodRate = obsStats.dietBalanced / obsStats.total;
      portrait.dietScore = Math.round(dietGoodRate * 100);
      portrait.dietPattern = dietGoodRate >= 0.7 ? 'balanced' : dietGoodRate < 0.3 ? 'poor' : 'normal';
      if (dietGoodRate < 0.3) riskFactors.push('饮食不均衡');
    }

    // 精神状态评估
    if (obsStats.total > 0) {
      const energyGoodRate = obsStats.energyEnergetic / obsStats.total;
      if (obsStats.energyTired / obsStats.total >= 0.3) riskFactors.push('经常疲劳');
      if (energyGoodRate >= 0.5) strengths.push('精力充沛');
    }

    // 综合健康分计算
    const scores: number[] = [];
    if (portrait.sleepScore !== undefined) scores.push(portrait.sleepScore);
    if (portrait.dietScore !== undefined) scores.push(portrait.dietScore);
    if (latestAssessment?.total_score) scores.push(latestAssessment.total_score);
    
    if (scores.length > 0) {
      portrait.overallHealthScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }

    // 综合状态
    if (portrait.overallHealthScore !== undefined) {
      if (portrait.overallHealthScore >= 85) portrait.overallStatus = 'excellent';
      else if (portrait.overallHealthScore >= 70) portrait.overallStatus = 'good';
      else if (portrait.overallHealthScore >= 50) portrait.overallStatus = 'attention';
      else portrait.overallStatus = 'warning';
    }

    // 更新时间戳
    portrait.lastAssessmentDate = latestAssessment?.test_date ?? undefined;
    portrait.lastObservationDate = obsStats.total > 0 ? new Date().toISOString().split('T')[0] : undefined;
    portrait.dataSources = dataSources;
    portrait.riskFactors = riskFactors.length > 0 ? riskFactors : undefined;
    portrait.strengths = strengths.length > 0 ? strengths : undefined;

    // AI 摘要（简单模板，后续可接入 LLM）
    portrait.aiSummary = generateSummary(portrait, riskFactors, strengths);

    // 保存画像
    const result = await healthPortraitRepository.upsertByStudentId(studentId, portrait);
    return this.ok(result);
  }

  // ==================== 健康处方 ====================

  async getPrescriptionsByStudentId(studentId: string, status?: string) {
    const prescriptions = await healthPrescriptionRepository.findByStudentId(studentId, status);
    return this.ok(prescriptions);
  }

  async getActivePrescription(studentId: string) {
    const prescription = await healthPrescriptionRepository.findActiveByStudentId(studentId);
    return this.ok(prescription);
  }

  async createPrescription(dto: CreateHealthPrescriptionDTO) {
    const row: Record<string, unknown> = {
      student_id: dto.studentId,
      prescription_type: dto.prescriptionType,
      period_type: dto.periodType,
      period_start: dto.periodStart,
      period_end: dto.periodEnd,
      daily_calories_target: dto.dailyCaloriesTarget ?? null,
      nutrition_advice: dto.nutritionAdvice ?? null,
      diet_taboos: dto.dietTaboos ?? null,
      meal_suggestions: dto.mealSuggestions ?? null,
      exercise_type: dto.exerciseType ?? null,
      exercise_frequency: dto.exerciseFrequency ?? null,
      exercise_duration_min: dto.exerciseDurationMin ?? null,
      exercise_intensity: dto.exerciseIntensity ?? null,
      exercise_notes: dto.exerciseNotes ?? null,
      status: 'active',
    };

    const result = await healthPrescriptionRepository.create(row as Record<string, unknown>);
    if (!result) {
      return this.fail('创建健康处方失败', 'SAVE_ERROR');
    }
    return this.ok(result);
  }

  async confirmPrescription(prescriptionId: string, confirmedBy: string) {
    const result = await healthPrescriptionRepository.update(prescriptionId, {
      confirmed_by: confirmedBy,
      confirmed_at: new Date().toISOString(),
    } as Record<string, unknown>);
    if (!result) {
      return this.fail('确认处方失败', 'SAVE_ERROR');
    }
    return this.ok(result);
  }

  // ==================== 统计概览 ====================

  async getStatsOverview(): Promise<ServiceResult<HealthStatsOverview>> {
    try {
      const latestSemester = await fitnessAssessmentRepository.getLatestSemester();
      let gradeStats = { total: 0, excellent: 0, good: 0, pass: 0, fail: 0 };
      if (latestSemester) {
        gradeStats = await fitnessAssessmentRepository.getGradeStats(latestSemester.academicYear, latestSemester.semester);
      }

      const activePrescriptions = await healthPrescriptionRepository.countActive();

      // 画像状态分布
      const allPortraits = await healthPortraitRepository.findAllWithStudentInfo(1, 1000);
      let excellentCount = 0, goodCount = 0, attentionCount = 0, warningCount = 0;
      for (const p of allPortraits.portraits) {
        if (p.overallStatus === 'excellent') excellentCount++;
        else if (p.overallStatus === 'good') goodCount++;
        else if (p.overallStatus === 'attention') attentionCount++;
        else if (p.overallStatus === 'warning') warningCount++;
      }

      const overview: HealthStatsOverview = {
        totalStudents: gradeStats.total,
        profiledStudents: allPortraits.total,
        assessedStudents: gradeStats.total,
        observationActiveStudents: 0,
        prescriptionActiveCount: activePrescriptions,
        excellentCount,
        goodCount,
        attentionCount,
        warningCount,
        bmiDistribution: [
          { label: '偏瘦', count: allPortraits.portraits.filter(p => p.bmiStatus === 'underweight').length },
          { label: '正常', count: allPortraits.portraits.filter(p => p.bmiStatus === 'normal').length },
          { label: '偏胖', count: allPortraits.portraits.filter(p => p.bmiStatus === 'overweight').length },
          { label: '肥胖', count: allPortraits.portraits.filter(p => p.bmiStatus === 'obese').length },
        ],
        fitnessDistribution: [
          { label: '优秀', count: gradeStats.excellent },
          { label: '良好', count: gradeStats.good },
          { label: '及格', count: gradeStats.pass },
          { label: '不及格', count: gradeStats.fail },
        ],
        recentAssessments: [],
        recentObservations: [],
      };

      return this.ok(overview);
    } catch (err) {
      console.error('[HealthManagementService] getStatsOverview error:', err);
      return this.fail('获取统计概览失败', 'QUERY_ERROR');
    }
  }
}

// ==================== 辅助函数 ====================

function mapFitnessFromRow(row: FitnessAssessmentRow): FitnessAssessment {
  return {
    id: row.id,
    studentId: row.student_id,
    academicYear: row.academic_year,
    semester: row.semester,
    testDate: row.test_date ?? undefined,
    heightCm: row.height_cm ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    bmi: row.bmi ?? undefined,
    vitalCapacity: row.vital_capacity ?? undefined,
    run50m: row.run_50m ?? undefined,
    run50x8: row.run_50x8 ?? undefined,
    sitAndReach: row.sit_and_reach ?? undefined,
    sitUps1min: row.sit_ups_1min ?? undefined,
    ropeJump1min: row.rope_jump_1min ?? undefined,
    totalScore: row.total_score ?? undefined,
    gradeLevel: row.grade_level ?? undefined,
    visionLeft: row.vision_left ?? undefined,
    visionRight: row.vision_right ?? undefined,
    // 体检字段
    dentalCariesLeft: row.dental_caries_left ?? undefined,
    dentalCariesRight: row.dental_caries_right ?? undefined,
    dentalFillingLeft: row.dental_filling_left ?? undefined,
    dentalFillingRight: row.dental_filling_right ?? undefined,
    dentalMissingLeft: row.dental_missing_left ?? undefined,
    dentalMissingRight: row.dental_missing_right ?? undefined,
    spineNormal: row.spine_normal ?? undefined,
    systolicBp: row.systolic_bp ?? undefined,
    diastolicBp: row.diastolic_bp ?? undefined,
    heartRate: row.heart_rate ?? undefined,
    colorBlindness: row.color_blindness ?? undefined,
    hearingLeft: row.hearing_left ?? undefined,
    hearingRight: row.hearing_right ?? undefined,
    checkupNotes: row.checkup_notes ?? undefined,
    source: row.source,
    importedBy: row.imported_by ?? undefined,
    importedAt: row.imported_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapObservationFromRow(row: ParentDailyObservationRow) {
  return {
    id: row.id,
    parentId: row.parent_id,
    studentId: row.student_id,
    observationDate: row.observation_date,
    sleepQuality: row.sleep_quality as 'sufficient' | 'normal' | 'insufficient',
    dietQuality: row.diet_quality as 'balanced' | 'normal' | 'overeating',
    energyLevel: row.energy_level as 'energetic' | 'normal' | 'tired',
    note: row.note ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapGradeLevel(level: string): 'excellent' | 'good' | 'pass' | 'fail' {
  if (level === '优秀') return 'excellent';
  if (level === '良好') return 'good';
  if (level === '及格') return 'pass';
  return 'fail';
}

function generateSummary(
  portrait: Partial<StudentHealthPortrait>,
  risks: string[],
  strengths: string[]
): string {
  const parts: string[] = [];

  if (portrait.bmiStatus) {
    const bmiLabel: Record<string, string> = {
      underweight: '偏瘦', normal: 'BMI正常', overweight: '偏胖', obese: '肥胖'
    };
    parts.push(`体型${bmiLabel[portrait.bmiStatus] || '未知'}`);
  }

  if (portrait.fitnessLevel) {
    const fitLabel: Record<string, string> = {
      excellent: '体质优秀', good: '体质良好', pass: '体质及格', fail: '体质不及格'
    };
    parts.push(fitLabel[portrait.fitnessLevel] || '');
  }

  if (portrait.sleepPattern) {
    const sleepLabel: Record<string, string> = {
      good: '睡眠充足', normal: '睡眠一般', poor: '睡眠不足'
    };
    parts.push(sleepLabel[portrait.sleepPattern] || '');
  }

  if (portrait.dietPattern) {
    const dietLabel: Record<string, string> = {
      balanced: '饮食均衡', normal: '饮食一般', poor: '饮食不均衡'
    };
    parts.push(dietLabel[portrait.dietPattern] || '');
  }

  let summary = parts.join('，') + '。';

  if (risks.length > 0) {
    summary += `需关注：${risks.join('、')}。`;
  }

  if (strengths.length > 0) {
    summary += `优势：${strengths.join('、')}。`;
  }

  return summary;
}

export const healthManagementService = new HealthManagementService();
