/**
 * 学生体育健康管理 - 类型定义
 *
 * 模块归属：德育处（独立模块）
 * 数据共享：教务系统、班主任教师空间、家长端
 */

// ==================== 健康档案 ====================

type HealthProfile = {
  id: string;
  studentId: string;
  bloodType?: string;
  allergies?: string[];
  chronicConditions?: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalNotes?: string;
  createdAt: string;
  updatedAt: string;
};

// ==================== 体质测评 ====================

type FitnessAssessment = {
  id: string;
  studentId: string;
  studentName?: string;
  studentNo?: string;
  className?: string;
  academicYear: string;
  semester: string;
  testDate?: string;

  // 身体形态
  heightCm?: number;
  weightKg?: number;
  bmi?: number;

  // 身体机能
  vitalCapacity?: number;

  // 身体素质
  run50m?: number;
  run50x8?: number;
  sitAndReach?: number;
  sitUps1min?: number;
  ropeJump1min?: number;

  // 综合评价
  totalScore?: number;
  gradeLevel?: string;

  // 视力
  visionLeft?: number;
  visionRight?: number;

  // 体检扩展字段
  dentalCaries?: number;
  spineNormal?: boolean;
  systolicBp?: number;
  diastolicBp?: number;
  heartRate?: number;
  colorBlindness?: string;
  hearingLeft?: string;
  hearingRight?: string;
  checkupNotes?: string;

  // 数据来源
  source: string;
  importedBy?: string;
  importedAt?: string;

  createdAt: string;
  updatedAt: string;
};

type FitnessAssessmentRow = {
  id: string;
  student_id: string;
  academic_year: string;
  semester: string;
  test_date: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  bmi: number | null;
  vital_capacity: number | null;
  run_50m: number | null;
  run_50x8: number | null;
  sit_and_reach: number | null;
  sit_ups_1min: number | null;
  rope_jump_1min: number | null;
  total_score: number | null;
  grade_level: string | null;
  vision_left: number | null;
  vision_right: number | null;
  dental_caries: number | null;
  spine_normal: boolean | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  heart_rate: number | null;
  color_blindness: string | null;
  hearing_left: string | null;
  hearing_right: string | null;
  checkup_notes: string | null;
  source: string;
  imported_by: string | null;
  imported_at: string | null;
  created_at: string;
  updated_at: string;
};

// ==================== 家长每日观察 ====================

type SleepQuality = 'sufficient' | 'normal' | 'insufficient';
type DietQuality = 'balanced' | 'normal' | 'overeating';
type EnergyLevel = 'energetic' | 'normal' | 'tired';

type ParentDailyObservation = {
  id: string;
  parentId: string;
  studentId: string;
  observationDate: string;
  sleepQuality: SleepQuality;
  dietQuality: DietQuality;
  energyLevel: EnergyLevel;
  note?: string;
  createdAt: string;
  updatedAt: string;
};

type ParentDailyObservationRow = {
  id: string;
  parent_id: string;
  student_id: string;
  observation_date: string;
  sleep_quality: string;
  diet_quality: string;
  energy_level: string;
  note: string | null;
  created_at: string;
  updated_at: string;
};

type CreateObservationDTO = {
  studentId: string;
  observationDate: string;
  sleepQuality: SleepQuality;
  dietQuality: DietQuality;
  energyLevel: EnergyLevel;
  note?: string;
};

// ==================== 学生健康画像 ====================

type BmiStatus = 'underweight' | 'normal' | 'overweight' | 'obese';
type TrendType = 'improving' | 'stable' | 'worsening' | 'declining';
type FitnessLevel = 'excellent' | 'good' | 'pass' | 'fail';
type ExerciseFrequency = 'daily' | 'often' | 'sometimes' | 'rarely';
type OverallStatus = 'excellent' | 'good' | 'attention' | 'warning';

// 健康画像详细分析
type PortraitDimensionAnalysis = {
  status?: string;
  level?: string;
  pattern?: string;
  analysis: string;
  suggestion: string;
};

type PortraitDetailedAnalysis = {
  bmi?: PortraitDimensionAnalysis;
  fitness?: PortraitDimensionAnalysis;
  sleep?: PortraitDimensionAnalysis;
  diet?: PortraitDimensionAnalysis;
  exercise?: PortraitDimensionAnalysis;
};

type StudentHealthPortrait = {
  id: string;
  studentId: string;
  bmiStatus?: BmiStatus;
  bmiTrend?: TrendType;
  fitnessLevel?: FitnessLevel;
  fitnessTrend?: TrendType;
  exerciseHabitScore?: number;
  exerciseFrequency?: ExerciseFrequency;
  sleepScore?: number;
  sleepPattern?: string;
  dietScore?: number;
  dietPattern?: string;
  overallHealthScore?: number;
  overallStatus?: OverallStatus;
  aiSummary?: string;
  detailedAnalysis?: PortraitDetailedAnalysis;
  riskFactors?: string[];
  strengths?: string[];
  improvementSuggestions?: string[];
  lastAssessmentDate?: string;
  lastObservationDate?: string;
  dataSources?: string[];
  computedAt: string;
  updatedAt: string;
};

// ==================== 健康处方 ====================

type PrescriptionType = 'diet' | 'exercise' | 'comprehensive';
type PeriodType = 'weekly' | 'monthly' | 'quarterly';
type ExerciseIntensity = 'low' | 'medium' | 'high';

type NutritionAdvice = {
  carbs?: { target: number; unit: string; description: string; reason?: string };
  protein?: { target: number; unit: string; description: string; reason?: string };
  fat?: { target: number; unit: string; description: string; reason?: string };
  vitamins?: string[];
  minerals?: string[];
  hydrationAdvice?: string;
};

type MealSuggestion = {
  breakfast?: string;
  lunch?: string;
  dinner?: string;
  snacks?: string;
  cookingTips?: string;
};

type ExercisePlan = {
  warmUp: string;
  mainExercise: string;
  coolDown: string;
  weeklySchedule: string;
};

type HealthPrescription = {
  id: string;
  studentId: string;
  portraitId?: string;
  prescriptionType: PrescriptionType;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;

  // 膳食建议
  dailyCaloriesTarget?: number;
  nutritionAdvice?: NutritionAdvice;
  dietTaboos?: string[];
  dietTabooReasons?: string[];
  mealSuggestions?: MealSuggestion;

  // 运动处方
  exerciseType?: string;
  exerciseFrequency?: number;
  exerciseDurationMin?: number;
  exerciseIntensity?: ExerciseIntensity;
  exercisePlan?: ExercisePlan;
  exerciseNotes?: string;

  // AI 信息
  aiModel?: string;
  aiPromptVersion?: string;
  aiSummary?: string;
  expectedOutcomes?: string;

  // 状态
  status: 'active' | 'completed' | 'superseded';
  confirmedBy?: string;
  confirmedAt?: string;

  createdAt: string;
  updatedAt: string;
};

// ==================== 周期报告 ====================

type HealthCycleReport = {
  id: string;
  studentId: string;
  reportType: 'weekly' | 'monthly' | 'semester';
  periodStart: string;
  periodEnd: string;
  summary?: string;
  fitnessChanges?: string;
  exerciseStats?: Record<string, unknown>;
  dietAssessment?: string;
  sleepAssessment?: string;
  recommendations?: string;
  generatedBy: string;
  createdAt: string;
  updatedAt: string;
};

// ==================== 统计与 DTO ====================

type HealthStatsOverview = {
  totalStudents: number;
  profiledStudents: number;
  assessedStudents: number;
  observationActiveStudents: number;
  prescriptionActiveCount: number;
  excellentCount: number;
  goodCount: number;
  attentionCount: number;
  warningCount: number;
  bmiDistribution: { label: string; count: number }[];
  fitnessDistribution: { label: string; count: number }[];
  recentAssessments: FitnessAssessment[];
  recentObservations: ParentDailyObservation[];
};

type CreateFitnessAssessmentDTO = {
  studentId: string;
  academicYear: string;
  semester: string;
  testDate?: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  vitalCapacity?: number;
  run50m?: number;
  run50x8?: number;
  sitAndReach?: number;
  sitUps1min?: number;
  ropeJump1min?: number;
  totalScore?: number;
  gradeLevel?: string;
  visionLeft?: number;
  visionRight?: number;
  source?: string;
  importedBy?: string;
};

type CreateHealthPrescriptionDTO = {
  studentId: string;
  prescriptionType: PrescriptionType;
  periodType: PeriodType;
  periodStart: string;
  periodEnd: string;
  dailyCaloriesTarget?: number;
  nutritionAdvice?: NutritionAdvice;
  dietTaboos?: string[];
  dietTabooReasons?: string[];
  mealSuggestions?: MealSuggestion;
  exerciseType?: string;
  exerciseFrequency?: number;
  exerciseDurationMin?: number;
  exerciseIntensity?: ExerciseIntensity;
  exercisePlan?: ExercisePlan;
  exerciseNotes?: string;
  aiSummary?: string;
  expectedOutcomes?: string;
};

export type {
  HealthProfile,
  FitnessAssessment,
  FitnessAssessmentRow,
  ParentDailyObservation,
  ParentDailyObservationRow,
  CreateObservationDTO,
  SleepQuality,
  DietQuality,
  EnergyLevel,
  StudentHealthPortrait,
  PortraitDimensionAnalysis,
  PortraitDetailedAnalysis,
  BmiStatus,
  TrendType,
  FitnessLevel,
  OverallStatus,
  HealthPrescription,
  PrescriptionType,
  PeriodType,
  ExerciseIntensity,
  ExercisePlan,
  NutritionAdvice,
  MealSuggestion,
  HealthCycleReport,
  HealthStatsOverview,
  CreateFitnessAssessmentDTO,
  CreateHealthPrescriptionDTO,
};
