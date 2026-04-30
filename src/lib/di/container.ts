/**
 * 轻量级依赖注入容器
 * 
 * 用于解耦各层依赖，遵循依赖倒置原则：
 * - 高层模块不应该依赖低层模块，两者都应该依赖抽象
 * - Service 层通过接口/类型依赖 Repository，而非直接导入具体实现
 * 
 * @module lib/di/container
 */

/**
 * 服务标识符类型
 */
type ServiceIdentifier<T = unknown> = string | symbol;

/**
 * 工厂函数类型
 */
type Factory<T> = () => T;

/**
 * 服务注册信息
 */
interface ServiceRegistration<T = unknown> {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
}

/**
 * DI 容器类
 */
class DIContainer {
  private registrations = new Map<ServiceIdentifier, ServiceRegistration>();
  private resolving = new Set<ServiceIdentifier>();

  /**
   * 注册单例服务
   */
  registerSingleton<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>): void {
    this.registrations.set(identifier, {
      factory,
      singleton: true,
    });
  }

  /**
   * 注册瞬态服务（每次获取都创建新实例）
   */
  registerTransient<T>(identifier: ServiceIdentifier<T>, factory: Factory<T>): void {
    this.registrations.set(identifier, {
      factory,
      singleton: false,
    });
  }

  /**
   * 获取服务实例
   */
  resolve<T>(identifier: ServiceIdentifier<T>): T {
    const registration = this.registrations.get(identifier);
    
    if (!registration) {
      throw new Error(`Service '${String(identifier)}' is not registered`);
    }

    // 检测循环依赖
    if (this.resolving.has(identifier)) {
      throw new Error(`Circular dependency detected for service '${String(identifier)}'`);
    }

    // 单例模式：返回已存在的实例
    if (registration.singleton && registration.instance) {
      return registration.instance as T;
    }

    // 创建新实例
    this.resolving.add(identifier);
    try {
      const instance = registration.factory();
      
      if (registration.singleton) {
        registration.instance = instance;
      }
      
      return instance as T;
    } finally {
      this.resolving.delete(identifier);
    }
  }

  /**
   * 检查服务是否已注册
   */
  has(identifier: ServiceIdentifier): boolean {
    return this.registrations.has(identifier);
  }

  /**
   * 清除所有注册（用于测试）
   */
  clear(): void {
    this.registrations.clear();
  }
}

// 全局容器实例
export const container = new DIContainer();

/**
 * 服务标识符常量
 * 使用 Symbol 确保唯一性
 */
export const SERVICE_IDENTIFIERS = {
  // Repositories
  UserRepository: Symbol.for('UserRepository'),
  TeacherRepository: Symbol.for('TeacherRepository'),
  StudentRepository: Symbol.for('StudentRepository'),
  ClassRepository: Symbol.for('ClassRepository'),
  AttendanceRepository: Symbol.for('AttendanceRepository'),
  ScheduleRepository: Symbol.for('ScheduleRepository'),
  ActualScheduleRepository: Symbol.for('ActualScheduleRepository'),
  GradeRepository: Symbol.for('GradeRepository'),
  ApprovalRepository: Symbol.for('ApprovalRepository'),
  MessageRepository: Symbol.for('MessageRepository'),
  LeaveRepository: Symbol.for('LeaveRepository'),
  CourseRepository: Symbol.for('CourseRepository'),
  ExamRepository: Symbol.for('ExamRepository'),
  ExamScoreRepository: Symbol.for('ExamScoreRepository'),
  HomeworkRepository: Symbol.for('HomeworkRepository'),
  HomeworkSubmissionRepository: Symbol.for('HomeworkSubmissionRepository'),
  ResearchActivityRepository: Symbol.for('ResearchActivityRepository'),
  ResearchStageRepository: Symbol.for('ResearchStageRepository'),
  ResearchAchievementRepository: Symbol.for('ResearchAchievementRepository'),
  ResearchResourceRepository: Symbol.for('ResearchResourceRepository'),
  MoralActivityRepository: Symbol.for('MoralActivityRepository'),
  MoralActivitySubmissionRepository: Symbol.for('MoralActivitySubmissionRepository'),
  HabitGoalRepository: Symbol.for('HabitGoalRepository'),
  StudentHabitGoalRepository: Symbol.for('StudentHabitGoalRepository'),
  HabitRecordRepository: Symbol.for('HabitRecordRepository'),
  HabitStarRepository: Symbol.for('HabitStarRepository'),
  InformationCollectionRepository: Symbol.for('InformationCollectionRepository'),
  CollectionResponseRepository: Symbol.for('CollectionResponseRepository'),
  // 新增 Repositories
  SeatingPlanRepository: Symbol.for('SeatingPlanRepository'),
  ClassSOPRepository: Symbol.for('ClassSOPRepository'),
  ClassRoutineRepository: Symbol.for('ClassRoutineRepository'),
  ConversationRepository: Symbol.for('ConversationRepository'),
  SharedResourceRepository: Symbol.for('SharedResourceRepository'),
  TeachingResourceRepository: Symbol.for('TeachingResourceRepository'),
  LessonPrepRepository: Symbol.for('LessonPrepRepository'),
  MathTeachingContentRepository: Symbol.for('MathTeachingContentRepository'),
  DutyTeacherRepository: Symbol.for('DutyTeacherRepository'),
  WeeklyEvaluationRepository: Symbol.for('WeeklyEvaluationRepository'),
  // P0 新增 Repositories
  ParentRepository: Symbol.for('ParentRepository'),
  ExpenseRepository: Symbol.for('ExpenseRepository'),
  RoomRepository: Symbol.for('RoomRepository'),
  RoomBookingRepository: Symbol.for('RoomBookingRepository'),
  ScheduleSlotRepository: Symbol.for('ScheduleSlotRepository'),
  ScheduleDraftRepository: Symbol.for('ScheduleDraftRepository'),
  // P2 新增 Repositories
  ScheduleChangeRepository: Symbol.for('ScheduleChangeRepository'),
  VisitorRepository: Symbol.for('VisitorRepository'),
  CourseAdjustmentRepository: Symbol.for('CourseAdjustmentRepository'),
  CarouselRepository: Symbol.for('CarouselRepository'),
  SchoolHonorRepository: Symbol.for('SchoolHonorRepository'),
  AnnouncementRepository: Symbol.for('AnnouncementRepository'),
  AchievementRepository: Symbol.for('AchievementRepository'),
  // P3 新增 Repositories
  AccessDeviceRepository: Symbol.for('AccessDeviceRepository'),
  AccessRecordRepository: Symbol.for('AccessRecordRepository'),
  SafetyDrillRepository: Symbol.for('SafetyDrillRepository'),
  SafetyInspectionRepository: Symbol.for('SafetyInspectionRepository'),
  AssetRepository: Symbol.for('AssetRepository'),
  RepairRequestRepository: Symbol.for('RepairRequestRepository'),
  FacilityRoomRepository: Symbol.for('FacilityRoomRepository'),
  SpaceReservationRepository: Symbol.for('SpaceReservationRepository'),
  GroupRepository: Symbol.for('GroupRepository'),
  CommunicationRepository: Symbol.for('CommunicationRepository'),
  AfterSchoolServiceRepository: Symbol.for('AfterSchoolServiceRepository'),
  TeacherAttendanceRepository: Symbol.for('TeacherAttendanceRepository'),
  WorkloadRepository: Symbol.for('WorkloadRepository'),
  SchoolStatsRepository: Symbol.for('SchoolStatsRepository'),
  StudentHonorRepository: Symbol.for('StudentHonorRepository'),
  // P4 智慧作业 Repositories
  QuestionBankRepository: Symbol.for('QuestionBankRepository'),
  ExamPaperRepository: Symbol.for('ExamPaperRepository'),
  ExamTaskRepository: Symbol.for('ExamTaskRepository'),
  // 卓越教师 Repositories
  TeacherProfileRepository: Symbol.for('TeacherProfileRepository'),
  TeacherTeamRepository: Symbol.for('TeacherTeamRepository'),
  TeacherAwardRepository: Symbol.for('TeacherAwardRepository'),

  // 附小少年 Repository
  StudentShowcaseRepository: Symbol.for('StudentShowcaseRepository'),

  // 云教学 Repositories
  CloudCourseRepository: Symbol.for('CloudCourseRepository'),
  CloudCourseChapterRepository: Symbol.for('CloudCourseChapterRepository'),
  CloudCourseEnrollmentRepository: Symbol.for('CloudCourseEnrollmentRepository'),
  CloudLearningRecordRepository: Symbol.for('CloudLearningRecordRepository'),
  CloudLiveSessionRepository: Symbol.for('CloudLiveSessionRepository'),
  CloudCoursePushRepository: Symbol.for('CloudCoursePushRepository'),

  // 课后服务选课 Repositories
  AfterSchoolCourseRepository: Symbol.for('AfterSchoolCourseRepository'),
  AfterSchoolEnrollmentRepository: Symbol.for('AfterSchoolEnrollmentRepository'),

  // 体育健康 Repositories
  HealthProfileRepository: Symbol.for('HealthProfileRepository'),
  FitnessAssessmentRepository: Symbol.for('FitnessAssessmentRepository'),
  ParentObservationRepository: Symbol.for('ParentObservationRepository'),
  HealthPortraitRepository: Symbol.for('HealthPortraitRepository'),
  HealthPrescriptionRepository: Symbol.for('HealthPrescriptionRepository'),

  // Services
  UserService: Symbol.for('UserService'),
  StudentService: Symbol.for('StudentService'),
  TeacherService: Symbol.for('TeacherService'),
  ClassService: Symbol.for('ClassService'),
  AttendanceService: Symbol.for('AttendanceService'),
  ApprovalService: Symbol.for('ApprovalService'),
  CourseService: Symbol.for('CourseService'),
  ExamService: Symbol.for('ExamService'),
  ExamScoreService: Symbol.for('ExamScoreService'),
  HomeworkService: Symbol.for('HomeworkService'),
  HomeworkSubmissionService: Symbol.for('HomeworkSubmissionService'),
  ResearchActivityService: Symbol.for('ResearchActivityService'),
  ResearchStageService: Symbol.for('ResearchStageService'),
  ResearchAchievementService: Symbol.for('ResearchAchievementService'),
  ResearchResourceService: Symbol.for('ResearchResourceService'),
  MoralActivityService: Symbol.for('MoralActivityService'),
  MoralActivitySubmissionService: Symbol.for('MoralActivitySubmissionService'),
  HabitGoalService: Symbol.for('HabitGoalService'),
  StudentHabitGoalService: Symbol.for('StudentHabitGoalService'),
  HabitRecordService: Symbol.for('HabitRecordService'),
  HabitStarService: Symbol.for('HabitStarService'),
  InformationCollectionService: Symbol.for('InformationCollectionService'),
  CollectionResponseService: Symbol.for('CollectionResponseService'),
  // 新增 Services
  SeatingPlanService: Symbol.for('SeatingPlanService'),
  ClassSOPService: Symbol.for('ClassSOPService'),
  ClassRoutineService: Symbol.for('ClassRoutineService'),
  ConversationService: Symbol.for('ConversationService'),
  MessageService: Symbol.for('MessageService'),
  SharedResourceService: Symbol.for('SharedResourceService'),
  TeachingResourceService: Symbol.for('TeachingResourceService'),
  LessonPrepService: Symbol.for('LessonPrepService'),
  MathPrepService: Symbol.for('MathPrepService'),
  ReadingTeachingService: Symbol.for('ReadingTeachingService'),
  WritingTeachingService: Symbol.for('WritingTeachingService'),
  TextbookService: Symbol.for('TextbookService'),
  // P0 新增 Services
  ParentService: Symbol.for('ParentService'),
  ExpenseService: Symbol.for('ExpenseService'),
  LeaveRequestService: Symbol.for('LeaveRequestService'),
  RoomBookingService: Symbol.for('RoomBookingService'),
  // P2 新增 Services
  ScheduleChangeService: Symbol.for('ScheduleChangeService'),
  VisitorService: Symbol.for('VisitorService'),
  CourseAdjustmentService: Symbol.for('CourseAdjustmentService'),
  CarouselService: Symbol.for('CarouselService'),
  SchoolHonorService: Symbol.for('SchoolHonorService'),
  AnnouncementService: Symbol.for('AnnouncementService'),
  AchievementService: Symbol.for('AchievementService'),
  // P3 新增 Services
  AccessDeviceService: Symbol.for('AccessDeviceService'),
  AccessRecordService: Symbol.for('AccessRecordService'),
  AccessStatisticsService: Symbol.for('AccessStatisticsService'),
  SafetyDrillService: Symbol.for('SafetyDrillService'),
  SafetyInspectionService: Symbol.for('SafetyInspectionService'),
  AssetService: Symbol.for('AssetService'),
  RepairRequestService: Symbol.for('RepairRequestService'),
  RoomService: Symbol.for('RoomService'),
  SpaceReservationService: Symbol.for('SpaceReservationService'),
  GroupService: Symbol.for('GroupService'),
  CommunicationService: Symbol.for('CommunicationService'),
  AfterSchoolServiceService: Symbol.for('AfterSchoolServiceService'),
  TeacherAttendanceService: Symbol.for('TeacherAttendanceService'),
  WorkloadService: Symbol.for('WorkloadService'),
  SchoolStatsService: Symbol.for('SchoolStatsService'),
  StudentHonorService: Symbol.for('StudentHonorService'),
  // P4 智慧作业 Services
  SmartHomeworkService: Symbol.for('SmartHomeworkService'),
  ExamTaskService: Symbol.for('ExamTaskService'),
  // 卓越教师 Services
  TeacherProfileService: Symbol.for('TeacherProfileService'),
  TeacherTeamService: Symbol.for('TeacherTeamService'),
  TeacherAwardService: Symbol.for('TeacherAwardService'),

  // 附小少年 Service
  StudentShowcaseService: Symbol.for('StudentShowcaseService'),

  // 云教学 Services
  CloudCourseService: Symbol.for('CloudCourseService'),
  CloudCourseEnrollmentService: Symbol.for('CloudCourseEnrollmentService'),
  CloudLearningRecordService: Symbol.for('CloudLearningRecordService'),
  CloudLiveSessionService: Symbol.for('CloudLiveSessionService'),

  // 课后服务选课 Services
  AfterSchoolEnrollmentService: Symbol.for('AfterSchoolEnrollmentService'),

  // 体育健康 Services
  HealthManagementService: Symbol.for('HealthManagementService'),
} as const;

/**
 * 获取服务的便捷函数
 */
export function getService<T>(identifier: ServiceIdentifier<T>): T {
  return container.resolve(identifier);
}
