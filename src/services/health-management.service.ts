/**
 * 体育健康管理 Service
 * 
 * 核心业务逻辑：
 * 1. 健康档案 CRUD
 * 2. 体质测评数据导入与查询
 * 3. 家长观察数据提交与查询
 * 4. 健康画像计算（LLM AI + 规则兜底）
 * 5. 健康处方生成（LLM AI + 规则兜底）
 * 6. 统计概览
 */
import { BaseService, type ServiceResult } from './base.service';
import { healthProfileRepository } from '@/repositories/health-profile.repository';
import { fitnessAssessmentRepository } from '@/repositories/fitness-assessment.repository';
import { parentObservationRepository } from '@/repositories/parent-observation.repository';
import { healthPortraitRepository } from '@/repositories/health-portrait.repository';
import { healthPrescriptionRepository } from '@/repositories/health-prescription.repository';
import { generatePortraitAI, generatePrescriptionAI } from './health-ai.service';
import type {
  HealthProfile,
  FitnessAssessmentRow,
  ParentDailyObservationRow,
  CreateObservationDTO,
  StudentHealthPortrait,
  HealthPrescription,
  CreateFitnessAssessmentDTO,
  CreateHealthPrescriptionDTO,
  HealthStatsOverview,
} from '@/types/health-management';

export class HealthManagementService extends BaseService {
  /** 内存缓存：画像列表查询（5分钟有效） */
  private portraitListCache: { key: string; data: { portraits: (StudentHealthPortrait & { studentName?: string; className?: string; classId?: string })[]; total: number }; ts: number } | null = null;
  private static CACHE_TTL = 5 * 60 * 1000; // 5 分钟

  /** 内存缓存：处方列表查询（5分钟有效） */
  private prescriptionListCache: { key: string; data: { prescriptions: (HealthPrescription & { studentName?: string; className?: string })[]; total: number }; ts: number } | null = null;

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
    // 根据总分自动修正等级
    const autoGrade = computeGradeLevel(dto.totalScore);
    const gradeLevel = autoGrade || dto.gradeLevel;

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
      grade_level: gradeLevel ?? null,
      vision_left: dto.visionLeft ?? null,
      vision_right: dto.visionRight ?? null,
      // 体检字段
      dental_caries: (dto as Record<string, unknown>).dentalCaries as number | null ?? null,
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
      grade_level: (computeGradeLevel(dto.totalScore) || dto.gradeLevel) ?? null,
      vision_left: dto.visionLeft ?? null,
      vision_right: dto.visionRight ?? null,
      // 体检字段
      dental_caries: (dto as Record<string, unknown>).dentalCaries as number | null ?? null,
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

  async getAllPortraits(page = 1, pageSize = 20, statusOrStudentIds?: string | string[] | null) {
    const cacheKey = `p${page}_ps${pageSize}_${JSON.stringify(statusOrStudentIds)}`;
    const now = Date.now();

    if (this.portraitListCache && this.portraitListCache.key === cacheKey && now - this.portraitListCache.ts < HealthManagementService.CACHE_TTL) {
      return this.ok(this.portraitListCache.data);
    }

    const result = await healthPortraitRepository.findAllWithStudentInfo(page, pageSize, statusOrStudentIds);
    this.portraitListCache = { key: cacheKey, data: result, ts: now };
    return this.ok(result);
  }

  /** 使画像缓存失效 */
  invalidatePortraitCache() {
    this.portraitListCache = null;
  }

  /** 计算学生健康画像（规则引擎 + LLM AI摘要） */
  async computePortrait(studentId: string) {
    // 1. 获取最新体质测评
    const assessments = await fitnessAssessmentRepository.findByStudentId(studentId);
    const latestAssessment = assessments[0] ?? null;

    // 2. 获取家长观察统计（近30天）
    const obsStats = await parentObservationRepository.getStudentObservationStats(studentId, 30);

    // 前置检查：必须有体质测评或观察数据，否则无法生成有效画像
    if (!latestAssessment && obsStats.total === 0) {
      return this.fail('该学生无体质测评和家长观察数据，无法生成画像', 'NO_DATA');
    }

    // 3. 规则引擎计算基础评分
    const portrait: Partial<StudentHealthPortrait> = {};
    const dataSources: string[] = [];

    // BMI 评估
    if (latestAssessment?.bmi) {
      dataSources.push('fitness_assessment');
      const bmi = latestAssessment.bmi;
      if (bmi < 14) { portrait.bmiStatus = 'underweight'; }
      else if (bmi < 18) { portrait.bmiStatus = 'normal'; }
      else if (bmi < 20) { portrait.bmiStatus = 'overweight'; }
      else { portrait.bmiStatus = 'obese'; }
    }

    // 体质等级
    if (latestAssessment?.grade_level) {
      portrait.fitnessLevel = mapGradeLevel(latestAssessment.grade_level);
    }

    // 睡眠评估
    if (obsStats.total > 0) {
      dataSources.push('parent_observation');
      const sleepGoodRate = obsStats.sleepSufficient / obsStats.total;
      const sleepBadRate = obsStats.sleepInsufficient / obsStats.total;
      portrait.sleepScore = Math.round(sleepGoodRate * 100);
      portrait.sleepPattern = sleepGoodRate >= 0.7 ? 'good' : sleepBadRate >= 0.3 ? 'poor' : 'normal';
    }

    // 饮食评估
    if (obsStats.total > 0) {
      const dietGoodRate = obsStats.dietBalanced / obsStats.total;
      portrait.dietScore = Math.round(dietGoodRate * 100);
      portrait.dietPattern = dietGoodRate >= 0.7 ? 'balanced' : dietGoodRate < 0.3 ? 'poor' : 'normal';
    }

    // 精神状态评估
    if (obsStats.total > 0) {
      const energyGoodRate = obsStats.energyEnergetic / obsStats.total;
      // 运动习惯评分：基于精力充沛率和运动频率
      portrait.exerciseHabitScore = Math.round(
        (energyGoodRate * 0.5 + (portrait.sleepScore ?? 50) / 100 * 0.3 + 0.2) * 100
      );
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

    // 4. 调用 LLM 生成 AI 摘要、风险标签、优势标签
    //    仅在有足够数据时调用 LLM（至少有BMI或体质等级）
    const hasRichData = !!(latestAssessment?.bmi || latestAssessment?.grade_level || obsStats.total > 0);
    
    if (hasRichData) {
      try {
      const aiResult = await generatePortraitAI({
        studentId,
        bmi: latestAssessment?.bmi ?? undefined,
        bmiStatus: portrait.bmiStatus,
        fitnessLevel: portrait.fitnessLevel,
        fitnessScore: latestAssessment?.total_score ?? undefined,
        sleepScore: portrait.sleepScore,
        sleepPattern: portrait.sleepPattern,
        dietScore: portrait.dietScore,
        dietPattern: portrait.dietPattern,
        exerciseHabitScore: portrait.exerciseHabitScore,
        overallHealthScore: portrait.overallHealthScore,
        observationDays: obsStats.total,
        sleepSufficientRate: obsStats.total > 0 ? obsStats.sleepSufficient / obsStats.total : undefined,
        sleepInsufficientRate: obsStats.total > 0 ? obsStats.sleepInsufficient / obsStats.total : undefined,
        dietBalancedRate: obsStats.total > 0 ? obsStats.dietBalanced / obsStats.total : undefined,
        energyEnergeticRate: obsStats.total > 0 ? obsStats.energyEnergetic / obsStats.total : undefined,
        energyTiredRate: obsStats.total > 0 ? obsStats.energyTired / obsStats.total : undefined,
        dentalCaries: latestAssessment?.dental_caries ?? undefined,
        spineNormal: latestAssessment?.spine_normal ?? undefined,
        visionLeft: latestAssessment?.vision_left ?? undefined,
        visionRight: latestAssessment?.vision_right ?? undefined,
        systolicBp: latestAssessment?.systolic_bp ?? undefined,
        diastolicBp: latestAssessment?.diastolic_bp ?? undefined,
        heartRate: latestAssessment?.heart_rate ?? undefined,
        colorBlindness: latestAssessment?.color_blindness ?? undefined,
      });

      portrait.aiSummary = aiResult.aiSummary;
      portrait.detailedAnalysis = aiResult.detailedAnalysis;
      portrait.riskFactors = aiResult.riskFactors.length > 0 ? aiResult.riskFactors : undefined;
      portrait.strengths = aiResult.strengths.length > 0 ? aiResult.strengths : undefined;
      portrait.improvementSuggestions = aiResult.improvementSuggestions?.length > 0 ? aiResult.improvementSuggestions : undefined;
      if (aiResult.exerciseHabitScore) portrait.exerciseHabitScore = aiResult.exerciseHabitScore;
    } catch (err) {
      console.error('[HealthManagementService] LLM portrait generation failed, using fallback:', err);
      // LLM 失败时使用兜底逻辑
      const riskFactors: string[] = [];
      const strengths: string[] = [];
      if (portrait.bmiStatus === 'underweight') riskFactors.push('偏瘦');
      else if (portrait.bmiStatus === 'overweight') riskFactors.push('偏胖');
      else if (portrait.bmiStatus === 'obese') riskFactors.push('肥胖');
      else if (portrait.bmiStatus === 'normal') strengths.push('BMI正常');
      if (portrait.fitnessLevel === 'fail') riskFactors.push('体质不及格');
      if (obsStats.total > 0 && obsStats.sleepInsufficient / obsStats.total >= 0.3) riskFactors.push('睡眠不足');
      if (obsStats.total > 0 && obsStats.sleepSufficient / obsStats.total >= 0.7) strengths.push('睡眠充足');
      portrait.riskFactors = riskFactors.length > 0 ? riskFactors : undefined;
      portrait.strengths = strengths.length > 0 ? strengths : undefined;
      portrait.aiSummary = generateFallbackSummary(portrait, riskFactors, strengths);
    }
    } else {
      // 数据不足，使用兜底逻辑
      const riskFactors: string[] = [];
      const strengths: string[] = [];
      if (portrait.bmiStatus === 'normal') strengths.push('BMI正常');
      else if (portrait.bmiStatus) riskFactors.push(`BMI${portrait.bmiStatus === 'underweight' ? '偏瘦' : portrait.bmiStatus === 'overweight' ? '偏胖' : '肥胖'}`);
      if (portrait.fitnessLevel === 'fail') riskFactors.push('体质不及格');
      portrait.riskFactors = riskFactors.length > 0 ? riskFactors : undefined;
      portrait.strengths = strengths.length > 0 ? strengths : undefined;
      portrait.aiSummary = generateFallbackSummary(portrait, riskFactors, strengths);
    }

    // 保存画像
    const result = await healthPortraitRepository.upsertByStudentId(studentId, portrait);

    // 失效画像缓存
    this.invalidatePortraitCache();

    // 延迟生成处方（不阻塞画像计算的返回）
    setImmediate(() => {
      this.generatePrescriptionFromPortrait(studentId).catch(err => {
        console.error('[HealthManagementService] delayed prescription generation error:', err);
      });
    });

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

  /** 管理端：处方列表（分页 + 学生信息 + 缓存） */
  async getAllPrescriptions(page = 1, pageSize = 20, filterStudentIds?: string[] | null, status?: string | null) {
    const cacheKey = `p${page}_ps${pageSize}_${JSON.stringify(filterStudentIds)}_${status || ''}`;
    const now = Date.now();

    if (this.prescriptionListCache && this.prescriptionListCache.key === cacheKey && now - this.prescriptionListCache.ts < HealthManagementService.CACHE_TTL) {
      return this.ok(this.prescriptionListCache.data);
    }

    const result = await healthPrescriptionRepository.findAllWithStudentInfo(page, pageSize, filterStudentIds, status);
    this.prescriptionListCache = { key: cacheKey, data: result, ts: now };
    return this.ok(result);
  }

  /** 使处方缓存失效 */
  invalidatePrescriptionCache() {
    this.prescriptionListCache = null;
  }

  /** 根据画像用 LLM 自动生成健康处方 */
  async generatePrescriptionFromPortrait(studentId: string) {
    // 获取画像
    const portrait = await healthPortraitRepository.findByStudentId(studentId);
    if (!portrait) return this.fail('无画像数据，无法生成处方', 'NO_PORTRAIT');

    // 检查画像数据是否足够（至少有综合健康分或BMI状态）
    if (portrait.overallHealthScore === undefined && !portrait.bmiStatus) {
      return this.fail('画像数据不足，无法生成有效处方', 'INSUFFICIENT_DATA');
    }

    // 检查是否已有生效处方（避免重复生成）
    const existingActive = await healthPrescriptionRepository.findActiveByStudentId(studentId);
    if (existingActive) {
      // 如果画像未更新，跳过生成
      const portraitUpdated = new Date(portrait.updatedAt).getTime();
      const prescriptionCreated = new Date(existingActive.createdAt).getTime();
      if (portraitUpdated <= prescriptionCreated) {
        return this.ok(existingActive); // 画像没更新，无需重新生成
      }
    }

    // 将旧处方置为已替代
    await healthPrescriptionRepository.supersedeByStudentId(studentId);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + 30);

    // 调用 LLM 生成处方
    try {
      // 获取体检数据
      const assessments = await fitnessAssessmentRepository.findByStudentId(studentId);
      const latest = assessments[0] ?? null;

      const aiResult = await generatePrescriptionAI({
        studentId,
        bmi: latest?.bmi ?? undefined,
        bmiStatus: portrait.bmiStatus,
        fitnessLevel: portrait.fitnessLevel,
        fitnessScore: portrait.fitnessLevel === 'excellent' ? 95 : portrait.fitnessLevel === 'good' ? 80 : portrait.fitnessLevel === 'pass' ? 60 : 40,
        overallHealthScore: portrait.overallHealthScore,
        riskFactors: portrait.riskFactors,
        strengths: portrait.strengths,
        sleepPattern: portrait.sleepPattern,
        dietPattern: portrait.dietPattern,
        dentalCaries: latest?.dental_caries ?? undefined,
        visionLeft: latest?.vision_left ?? undefined,
        visionRight: latest?.vision_right ?? undefined,
        detailedAnalysis: portrait.detailedAnalysis,
      });

      const dto: CreateHealthPrescriptionDTO = {
        studentId,
        prescriptionType: 'comprehensive',
        periodType: 'monthly',
        periodStart: now.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        dailyCaloriesTarget: aiResult.dailyCaloriesTarget,
        nutritionAdvice: aiResult.nutritionAdvice,
        dietTaboos: aiResult.dietTaboos,
        dietTabooReasons: aiResult.dietTabooReasons,
        mealSuggestions: aiResult.mealSuggestions,
        exerciseType: aiResult.exerciseType,
        exerciseFrequency: aiResult.exerciseFrequency,
        exerciseDurationMin: aiResult.exerciseDurationMin,
        exerciseIntensity: aiResult.exerciseIntensity,
        exercisePlan: aiResult.exercisePlan,
        exerciseNotes: aiResult.exerciseNotes,
        aiSummary: aiResult.aiSummary,
        expectedOutcomes: aiResult.expectedOutcomes,
      };

      const result = await this.createPrescription(dto);
      this.invalidatePrescriptionCache();
      return result;
    } catch (err) {
      console.error('[HealthManagementService] LLM prescription generation failed, using fallback:', err);
      // LLM 失败时使用兜底逻辑
      const dto: CreateHealthPrescriptionDTO = {
        studentId,
        prescriptionType: 'comprehensive',
        periodType: 'monthly',
        periodStart: now.toISOString().split('T')[0],
        periodEnd: periodEnd.toISOString().split('T')[0],
        dailyCaloriesTarget: portrait.bmiStatus === 'underweight' ? 2000 : portrait.bmiStatus === 'overweight' || portrait.bmiStatus === 'obese' ? 1500 : 1800,
        nutritionAdvice: {
          carbs: { target: 250, unit: 'g', description: '均衡碳水摄入' },
          protein: { target: 55, unit: 'g', description: '保证优质蛋白' },
          fat: { target: 55, unit: 'g', description: '适量健康脂肪' },
          vitamins: ['维生素D', '维生素C'],
          minerals: ['钙', '铁'],
        },
        dietTaboos: ['含糖饮料', '油炸食品'],
        mealSuggestions: { breakfast: '全麦面包+牛奶+鸡蛋', lunch: '米饭+鸡肉+蔬菜', dinner: '杂粮粥+鱼肉+蔬菜', snacks: '水果+坚果' },
        exerciseType: portrait.fitnessLevel === 'fail' || portrait.fitnessLevel === 'pass' ? '体能训练' : '综合运动',
        exerciseFrequency: portrait.fitnessLevel === 'fail' ? 5 : 4,
        exerciseDurationMin: portrait.fitnessLevel === 'fail' ? 40 : 30,
        exerciseIntensity: portrait.fitnessLevel === 'fail' ? 'medium' : 'low',
        exerciseNotes: '建议在老师和家长指导下进行锻炼',
      };

      const result = await this.createPrescription(dto);
      this.invalidatePrescriptionCache();
      return result;
    }
  }

  /** 批量刷新处方（对所有有画像的学生重新生成处方） */
  /** 批量刷新画像+处方（只处理有数据的学生，并发控制） */
  async batchRegeneratePrescriptions(filterStudentIds?: string[] | null) {
    let studentIds: string[] = [];

    if (filterStudentIds && filterStudentIds.length > 0) {
      // 外部传入的筛选列表，还需过滤出有数据的
      const { getSupabaseClient } = await import('@/storage/database/supabase-client');
      const client = getSupabaseClient();
      // 有体质测评或观察数据的学生
      const { data: fitStudents } = await client
        .from('fitness_assessments')
        .select('student_id')
        .in('student_id', filterStudentIds);
      const { data: obsStudents } = await client
        .from('parent_daily_observations')
        .select('student_id')
        .in('student_id', filterStudentIds);
      const idSet = new Set<string>();
      for (const s of (fitStudents || [])) idSet.add(s.student_id as string);
      for (const s of (obsStudents || [])) idSet.add(s.student_id as string);
      studentIds = [...idSet];
    } else {
      // 没有筛选条件时，取所有有数据的学生
      const { getSupabaseClient } = await import('@/storage/database/supabase-client');
      const client = getSupabaseClient();
      const { data: fitStudents } = await client
        .from('fitness_assessments')
        .select('student_id');
      const { data: obsStudents } = await client
        .from('parent_daily_observations')
        .select('student_id');
      const idSet = new Set<string>();
      for (const s of (fitStudents || [])) idSet.add(s.student_id as string);
      for (const s of (obsStudents || [])) idSet.add(s.student_id as string);
      studentIds = [...idSet];
    }

    if (studentIds.length === 0) {
      return this.ok({ total: 0, success: 0, fail: 0 });
    }

    let successCount = 0;
    let failCount = 0;

    // 并发控制：最多3个并发，避免LLM限流
    const CONCURRENCY = 3;
    const chunks: string[][] = [];
    for (let i = 0; i < studentIds.length; i += CONCURRENCY) {
      chunks.push(studentIds.slice(i, i + CONCURRENCY));
    }

    for (const chunk of chunks) {
      const results = await Promise.allSettled(
        chunk.map(studentId => this.computePortrait(studentId))
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.success) {
          successCount++;
        } else {
          failCount++;
          if (r.status === 'rejected') {
            console.error('[HealthManagementService] batchRegenerate failed:', r.reason);
          }
        }
      }
    }

    this.invalidatePortraitCache();
    this.invalidatePrescriptionCache();
    return this.ok({ total: studentIds.length, success: successCount, fail: failCount });
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
      diet_taboo_reasons: dto.dietTabooReasons ?? null,
      meal_suggestions: dto.mealSuggestions ?? null,
      exercise_type: dto.exerciseType ?? null,
      exercise_frequency: dto.exerciseFrequency ?? null,
      exercise_duration_min: dto.exerciseDurationMin ?? null,
      exercise_intensity: dto.exerciseIntensity ?? null,
      exercise_plan: dto.exercisePlan ?? null,
      exercise_notes: dto.exerciseNotes ?? null,
      ai_summary: dto.aiSummary ?? null,
      expected_outcomes: dto.expectedOutcomes ?? null,
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

  async getStatsOverview(filterStudentIds?: string[] | null): Promise<ServiceResult<HealthStatsOverview>> {
    try {
      const latestSemester = await fitnessAssessmentRepository.getLatestSemester();
      let gradeStats = { total: 0, excellent: 0, good: 0, pass: 0, fail: 0 };
      if (latestSemester) {
        gradeStats = await fitnessAssessmentRepository.getGradeStats(latestSemester.academicYear, latestSemester.semester, filterStudentIds);
      }

      const activePrescriptions = filterStudentIds
        ? await healthPrescriptionRepository.countByStudentIds(filterStudentIds)
        : await healthPrescriptionRepository.countActive();

      // 画像状态分布
      const allPortraits = await healthPortraitRepository.findAllWithStudentInfo(1, 1000, filterStudentIds);
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

function mapFitnessFromRow(row: FitnessAssessmentRow): FitnessAssessmentRow {
  return row;
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

/**
 * 根据总分自动计算体质等级（国标）
 * 优秀: >=86  良好: >=76  及格: >=60  不及格: <60
 */
function computeGradeLevel(totalScore: number | undefined | null): string | undefined {
  if (totalScore === undefined || totalScore === null) return undefined;
  if (totalScore >= 86) return '优秀';
  if (totalScore >= 76) return '良好';
  if (totalScore >= 60) return '及格';
  return '不及格';
}

function generateFallbackSummary(
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
