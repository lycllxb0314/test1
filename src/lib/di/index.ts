/**
 * 依赖注入初始化
 * 
 * 注册所有 Repository 和 Service 到 DI 容器
 * 
 * ⚠️ 重要原则：
 * 1. Repository 层只负责数据访问，不依赖其他层
 * 2. Service 层通过 DI 容器获取 Repository，不直接 import
 * 3. API 层通过 DI 容器获取 Service，不直接 import
 * 
 * @module lib/di
 */

import { container, SERVICE_IDENTIFIERS } from './container';

// 导入 Repository 实现
import { UserRepository, userRepository } from '@/repositories/user.repository';
import { TeacherRepository, teacherRepository } from '@/repositories/teacher.repository';
import { StudentRepository, studentRepository } from '@/repositories/student.repository';
import { ClassRepository, classRepository } from '@/repositories/class.repository';
import { AttendanceRepository, attendanceRepository } from '@/repositories/attendance.repository';
import { ScheduleRepository, scheduleRepository, ActualScheduleRepository, actualScheduleRepository } from '@/repositories/schedule.repository';
import { GradeRepository, gradeRepository } from '@/repositories/grade.repository';
import { ApprovalRepository, approvalRepository } from '@/repositories/approval.repository';
import { MessageRepository, messageRepository } from '@/repositories/message.repository';
import { LeaveRepository, leaveRepository } from '@/repositories/leave.repository';
import { CourseRepository, courseRepository } from '@/repositories/course.repository';
import { ExamRepository, examRepository, ExamScoreRepository, examScoreRepository } from '@/repositories/exam.repository';
import { HomeworkRepository, homeworkRepository, HomeworkSubmissionRepository, homeworkSubmissionRepository } from '@/repositories/homework.repository';
import {
  ResearchActivityRepository, researchActivityRepository,
  ResearchStageRepository, researchStageRepository,
  ResearchAchievementRepository, researchAchievementRepository,
  ResearchResourceRepository, researchResourceRepository,
} from '@/repositories/research.repository';
import {
  MoralActivityRepository, moralActivityRepository,
  MoralActivitySubmissionRepository, moralActivitySubmissionRepository,
} from '@/repositories/moral.repository';
import {
  HabitGoalRepository, habitGoalRepository,
  StudentHabitGoalRepository, studentHabitGoalRepository,
  HabitRecordRepository, habitRecordRepository,
  HabitStarRepository, habitStarRepository,
} from '@/repositories/habit.repository';
import {
  InformationCollectionRepository, informationCollectionRepository,
  CollectionResponseRepository, collectionResponseRepository,
} from '@/repositories/information-collection.repository';

// 导入新增 Repository 实现
import { SeatingPlanRepository, seatingPlanRepository } from '@/repositories/seating-plan.repository';
import { classSopRepository } from '@/repositories/class-sop.repository';
import { ClassRoutineRepository, classRoutineRepository } from '@/repositories/class-routine.repository';
import { conversationRepository } from '@/repositories/conversation.repository';
import { sharedResourceRepository } from '@/repositories/shared-resource.repository';
import { TeachingResourceRepository, teachingResourceRepository } from '@/repositories/teaching-resource.repository';
import { LessonPrepRepository, lessonPrepRepository } from '@/repositories/lesson-prep.repository';
import { dutyTeacherRepository } from '@/repositories/duty-teacher.repository';
import { weeklyEvaluationRepository } from '@/repositories/weekly-evaluation.repository';
// P0 新增 Repository
import { parentRepository, ParentRepository } from '@/repositories/parent.repository';
import { expenseRepository, ExpenseRepository } from '@/repositories/expense.repository';
import {
  roomRepository, RoomRepository,
  roomBookingRepository, RoomBookingRepository,
  scheduleSlotRepository, ScheduleSlotRepository,
  scheduleDraftRepository, ScheduleDraftRepository,
} from '@/repositories/academic.repository';
// P2 新增 Repository
import { scheduleChangeRepository, ScheduleChangeRepository } from '@/repositories/schedule-change.repository';
import { visitorRepository, VisitorRepository } from '@/repositories/visitor.repository';
import { courseAdjustmentRepository, CourseAdjustmentRepository } from '@/repositories/course-adjustment.repository';
import {
  carouselRepository, CarouselRepository,
  schoolHonorRepository, SchoolHonorRepository,
  announcementRepository, AnnouncementRepository,
  achievementRepository, AchievementRepository,
} from '@/repositories/portal.repository';
// P3 新增 Repository
import {
  accessDeviceRepository, AccessDeviceRepository,
  accessRecordRepository, AccessRecordRepository,
  accessStatisticsRepository,
} from '@/repositories/access.repository';
import {
  safetyDrillRepository, SafetyDrillRepository,
  safetyInspectionRepository, SafetyInspectionRepository,
} from '@/repositories/safety.repository';
import {
  assetRepository, AssetRepository,
  repairRequestRepository, RepairRequestRepository,
} from '@/repositories/asset.repository';
import {
  roomRepository as facilityRoomRepository, RoomRepository as FacilityRoomRepository,
  spaceReservationRepository, SpaceReservationRepository,
} from '@/repositories/facility.repository';
import {
  messageRepository as communicationMessageRepository,
  groupRepository, GroupRepository,
  communicationRepository, CommunicationRepository,
} from '@/repositories/communication.repository';
import {
  afterSchoolServiceRepository, AfterSchoolServiceRepository,
  teacherAttendanceRepository, TeacherAttendanceRepository,
  workloadRepository, WorkloadRepository,
  schoolStatsRepository, SchoolStatsRepository,
  studentHonorRepository, StudentHonorRepository,
} from '@/repositories/misc.repository';
// P4 智慧作业 Repositories
import { QuestionBankRepository, questionBankRepository } from '@/repositories/question-bank.repository';
import { ExamPaperRepository, examPaperRepository } from '@/repositories/exam-paper.repository';
import { ExamTaskRepository, examTaskRepository } from '@/repositories/exam-task.repository';
// 卓越教师 Repositories
import {
  TeacherProfileRepository, teacherProfileRepository,
  TeacherTeamRepository, teacherTeamRepository,
  TeacherAwardRepository, teacherAwardRepository,
} from '@/repositories/teacher-excellence.repository';

import {
  StudentShowcaseRepository, studentShowcaseRepository,
} from '@/repositories/student-showcase.repository';

// 云教学 Repositories
import {
  cloudCourseRepository, CloudCourseRepository,
  cloudCourseChapterRepository, CloudCourseChapterRepository,
  cloudCourseEnrollmentRepository, CloudCourseEnrollmentRepository,
  cloudLearningRecordRepository, CloudLearningRecordRepository,
  cloudLiveSessionRepository, CloudLiveSessionRepository,
  cloudCoursePushRepository, CloudCoursePushRepository,
} from '@/repositories/cloud-course.repository';

// 导入 Service 实现
import { UserService, userService } from '@/services/user.service';
import { StudentService, studentService } from '@/services/student.service';
import { TeacherService, teacherService } from '@/services/teacher.service';
import { ClassService, classService } from '@/services/class.service';
import { AttendanceService, attendanceService } from '@/services/attendance.service';
import { ApprovalService, approvalService } from '@/services/approval.service';
import { CourseService, courseService } from '@/services/course.service';
import { ExamService, examService, ExamScoreService, examScoreService } from '@/services/exam.service';
import { HomeworkService, homeworkService, HomeworkSubmissionService, homeworkSubmissionService } from '@/services/homework.service';
import {
  ResearchActivityService, researchActivityService,
  ResearchStageService, researchStageService,
  ResearchAchievementService, researchAchievementService,
  ResearchResourceService, researchResourceService,
} from '@/services/research.service';
import {
  MoralActivityService, moralActivityService,
  MoralActivitySubmissionService, moralActivitySubmissionService,
} from '@/services/moral.service';
import {
  HabitGoalService, habitGoalService,
  StudentHabitGoalService, studentHabitGoalService,
  HabitRecordService, habitRecordService,
  HabitStarService, habitStarService,
} from '@/services/habit.service';
import {
  InformationCollectionService, informationCollectionService,
  CollectionResponseService, collectionResponseService,
} from '@/services/information-collection.service';

// 导入新增 Service 实现
import { SeatingPlanService, seatingPlanService } from '@/services/seating-plan.service';
import { classSopService } from '@/services/class-sop.service';
import { ClassRoutineService, classRoutineService } from '@/services/class-routine.service';
import { conversationService } from '@/services/conversation.service';
import { SharedResourceService, createSharedResourceService } from '@/services/shared-resource.service';
import { TeachingResourceService, teachingResourceService } from '@/services/teaching-resource.service';
import { LessonPrepService, lessonPrepService } from '@/services/lesson-prep.service';
import { MathPrepService, mathPrepService } from '@/services/math-prep.service';
import { ReadingTeachingService, createReadingTeachingService } from '@/services/reading-teaching.service';
import { WritingTeachingService, createWritingTeachingService } from '@/services/writing-teaching.service';
import { TextbookService, createTextbookService } from '@/services/textbook.service';
// P0 新增 Service
import { ParentService, parentService } from '@/services/parent.service';
import { ExpenseService, expenseService } from '@/services/expense.service';
import { LeaveRequestService, leaveRequestService } from '@/services/leave-request.service';
import { RoomBookingService, roomBookingService } from '@/services/room-booking.service';
// P2 新增 Service
import { scheduleChangeService, ScheduleChangeService } from '@/services/schedule-change.service';
import { visitorService, VisitorService } from '@/services/visitor.service';
import { courseAdjustmentService, CourseAdjustmentService } from '@/services/course-adjustment.service';
import {
  carouselService, CarouselService,
  schoolHonorService, SchoolHonorService,
  announcementService, AnnouncementService,
  achievementService, AchievementService,
} from '@/services/portal.service';
// P3 新增 Service
import {
  accessDeviceService, AccessDeviceService,
  accessRecordService, AccessRecordService,
  accessStatisticsService, AccessStatisticsService,
} from '@/services/access.service';
import {
  safetyDrillService, SafetyDrillService,
  safetyInspectionService, SafetyInspectionService,
} from '@/services/safety.service';
import {
  assetService, AssetService,
  repairRequestService, RepairRequestService,
} from '@/services/asset.service';
import {
  roomService, RoomService,
  spaceReservationService as spaceReservationSvc, SpaceReservationService,
} from '@/services/facility.service';
import {
  messageService, MessageService,
  groupService, GroupService,
  communicationService, CommunicationService,
} from '@/services/communication.service';
import {
  afterSchoolServiceService, AfterSchoolServiceService,
  teacherAttendanceService, TeacherAttendanceService,
  workloadService, WorkloadService,
  schoolStatsService, SchoolStatsService,
  studentHonorService, StudentHonorService,
} from '@/services/misc.service';
// P4 智慧作业 Service
import { SmartHomeworkService, createSmartHomeworkService } from '@/services/smart-homework.service';
import { ExamTaskService, createExamTaskService } from '@/services/exam-task.service';
// 卓越教师 Service
import {
  TeacherProfileService, teacherProfileService,
  TeacherTeamService, teacherTeamService,
  TeacherAwardService, teacherAwardService,
} from '@/services/teacher-excellence.service';

// 附小少年 Service
import {
  StudentShowcaseService, studentShowcaseService,
} from '@/services/student-showcase.service';

// 云教学 Services
import {
  CloudCourseService, cloudCourseService,
  CloudCourseEnrollmentService, cloudCourseEnrollmentService,
  CloudLearningRecordService, cloudLearningRecordService,
  CloudLiveSessionService, cloudLiveSessionService,
} from '@/services/cloud-course.service';

/**
 * 初始化 DI 容器
 * 注册所有服务到容器中
 */
export function initializeDI(): void {
  // ========================================
  // 注册 Repositories（单例）
  // ========================================
  container.registerSingleton(SERVICE_IDENTIFIERS.UserRepository, () => userRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherRepository, () => teacherRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentRepository, () => studentRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ClassRepository, () => classRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.AttendanceRepository, () => attendanceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ScheduleRepository, () => scheduleRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ActualScheduleRepository, () => actualScheduleRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.GradeRepository, () => gradeRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ApprovalRepository, () => approvalRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.MessageRepository, () => messageRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.LeaveRepository, () => leaveRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CourseRepository, () => courseRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamRepository, () => examRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamScoreRepository, () => examScoreRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HomeworkRepository, () => homeworkRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HomeworkSubmissionRepository, () => homeworkSubmissionRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchActivityRepository, () => researchActivityRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchStageRepository, () => researchStageRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchAchievementRepository, () => researchAchievementRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchResourceRepository, () => researchResourceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.MoralActivityRepository, () => moralActivityRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.MoralActivitySubmissionRepository, () => moralActivitySubmissionRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitGoalRepository, () => habitGoalRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentHabitGoalRepository, () => studentHabitGoalRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitRecordRepository, () => habitRecordRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitStarRepository, () => habitStarRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.InformationCollectionRepository, () => informationCollectionRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CollectionResponseRepository, () => collectionResponseRepository);

  // 注册新增 Repositories
  container.registerSingleton(SERVICE_IDENTIFIERS.SeatingPlanRepository, () => seatingPlanRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ClassSOPRepository, () => classSopRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ClassRoutineRepository, () => classRoutineRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ConversationRepository, () => conversationRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.SharedResourceRepository, () => sharedResourceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeachingResourceRepository, () => teachingResourceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.LessonPrepRepository, () => lessonPrepRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.DutyTeacherRepository, () => dutyTeacherRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.WeeklyEvaluationRepository, () => weeklyEvaluationRepository);
  // P0 新增 Repositories
  container.registerSingleton(SERVICE_IDENTIFIERS.ParentRepository, () => parentRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExpenseRepository, () => expenseRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.RoomRepository, () => roomRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.RoomBookingRepository, () => roomBookingRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ScheduleSlotRepository, () => scheduleSlotRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ScheduleDraftRepository, () => scheduleDraftRepository);
  // P2 新增 Repositories
  container.registerSingleton(SERVICE_IDENTIFIERS.ScheduleChangeRepository, () => scheduleChangeRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.VisitorRepository, () => visitorRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CourseAdjustmentRepository, () => courseAdjustmentRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CarouselRepository, () => carouselRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.SchoolHonorRepository, () => schoolHonorRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.AnnouncementRepository, () => announcementRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.AchievementRepository, () => achievementRepository);
  // P3 新增 Repositories
  container.registerSingleton(SERVICE_IDENTIFIERS.AccessDeviceRepository, () => accessDeviceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.AccessRecordRepository, () => accessRecordRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.SafetyDrillRepository, () => safetyDrillRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.SafetyInspectionRepository, () => safetyInspectionRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.AssetRepository, () => assetRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.RepairRequestRepository, () => repairRequestRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.FacilityRoomRepository, () => facilityRoomRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.SpaceReservationRepository, () => spaceReservationRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.GroupRepository, () => groupRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CommunicationRepository, () => communicationRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.AfterSchoolServiceRepository, () => afterSchoolServiceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherAttendanceRepository, () => teacherAttendanceRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.WorkloadRepository, () => workloadRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.SchoolStatsRepository, () => schoolStatsRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentHonorRepository, () => studentHonorRepository);
  // P4 智慧作业 Repositories
  container.registerSingleton(SERVICE_IDENTIFIERS.QuestionBankRepository, () => questionBankRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamPaperRepository, () => examPaperRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamTaskRepository, () => examTaskRepository);
  // 卓越教师 Repositories
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherProfileRepository, () => teacherProfileRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherTeamRepository, () => teacherTeamRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherAwardRepository, () => teacherAwardRepository);
  // 附小少年 Repository
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentShowcaseRepository, () => studentShowcaseRepository);

  // 云教学 Repositories
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudCourseRepository, () => cloudCourseRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudCourseChapterRepository, () => cloudCourseChapterRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudCourseEnrollmentRepository, () => cloudCourseEnrollmentRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudLearningRecordRepository, () => cloudLearningRecordRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudLiveSessionRepository, () => cloudLiveSessionRepository);
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudCoursePushRepository, () => cloudCoursePushRepository);

  // ========================================
  // 注册 Services（单例）
  // ========================================
  container.registerSingleton(SERVICE_IDENTIFIERS.UserService, () => userService);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentService, () => studentService);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherService, () => teacherService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ClassService, () => classService);
  container.registerSingleton(SERVICE_IDENTIFIERS.AttendanceService, () => attendanceService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ApprovalService, () => approvalService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CourseService, () => courseService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamService, () => examService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamScoreService, () => examScoreService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HomeworkService, () => homeworkService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HomeworkSubmissionService, () => homeworkSubmissionService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchActivityService, () => researchActivityService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchStageService, () => researchStageService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchAchievementService, () => researchAchievementService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ResearchResourceService, () => researchResourceService);
  container.registerSingleton(SERVICE_IDENTIFIERS.MoralActivityService, () => moralActivityService);
  container.registerSingleton(SERVICE_IDENTIFIERS.MoralActivitySubmissionService, () => moralActivitySubmissionService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitGoalService, () => habitGoalService);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentHabitGoalService, () => studentHabitGoalService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitRecordService, () => habitRecordService);
  container.registerSingleton(SERVICE_IDENTIFIERS.HabitStarService, () => habitStarService);
  container.registerSingleton(SERVICE_IDENTIFIERS.InformationCollectionService, () => informationCollectionService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CollectionResponseService, () => collectionResponseService);

  // 注册新增 Services
  container.registerSingleton(SERVICE_IDENTIFIERS.SeatingPlanService, () => seatingPlanService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ClassSOPService, () => classSopService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ClassRoutineService, () => classRoutineService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ConversationService, () => conversationService);
  container.registerSingleton(SERVICE_IDENTIFIERS.MessageService, () => messageService);
  container.registerSingleton(SERVICE_IDENTIFIERS.SharedResourceService, () => createSharedResourceService());
  container.registerSingleton(SERVICE_IDENTIFIERS.TeachingResourceService, () => teachingResourceService);
  container.registerSingleton(SERVICE_IDENTIFIERS.LessonPrepService, () => lessonPrepService);
  container.registerSingleton(SERVICE_IDENTIFIERS.MathPrepService, () => mathPrepService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ReadingTeachingService, () => createReadingTeachingService());
  container.registerSingleton(SERVICE_IDENTIFIERS.WritingTeachingService, () => createWritingTeachingService());
  container.registerSingleton(SERVICE_IDENTIFIERS.TextbookService, () => createTextbookService());
  // P0 新增 Services
  container.registerSingleton(SERVICE_IDENTIFIERS.ParentService, () => parentService);
  container.registerSingleton(SERVICE_IDENTIFIERS.ExpenseService, () => expenseService);
  container.registerSingleton(SERVICE_IDENTIFIERS.LeaveRequestService, () => leaveRequestService);
  container.registerSingleton(SERVICE_IDENTIFIERS.RoomBookingService, () => roomBookingService);
  // P2 新增 Services
  container.registerSingleton(SERVICE_IDENTIFIERS.ScheduleChangeService, () => scheduleChangeService);
  container.registerSingleton(SERVICE_IDENTIFIERS.VisitorService, () => visitorService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CourseAdjustmentService, () => courseAdjustmentService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CarouselService, () => carouselService);
  container.registerSingleton(SERVICE_IDENTIFIERS.SchoolHonorService, () => schoolHonorService);
  container.registerSingleton(SERVICE_IDENTIFIERS.AnnouncementService, () => announcementService);
  container.registerSingleton(SERVICE_IDENTIFIERS.AchievementService, () => achievementService);
  // P3 新增 Services
  container.registerSingleton(SERVICE_IDENTIFIERS.AccessDeviceService, () => accessDeviceService);
  container.registerSingleton(SERVICE_IDENTIFIERS.AccessRecordService, () => accessRecordService);
  container.registerSingleton(SERVICE_IDENTIFIERS.AccessStatisticsService, () => accessStatisticsService);
  container.registerSingleton(SERVICE_IDENTIFIERS.SafetyDrillService, () => safetyDrillService);
  container.registerSingleton(SERVICE_IDENTIFIERS.SafetyInspectionService, () => safetyInspectionService);
  container.registerSingleton(SERVICE_IDENTIFIERS.AssetService, () => assetService);
  container.registerSingleton(SERVICE_IDENTIFIERS.RepairRequestService, () => repairRequestService);
  container.registerSingleton(SERVICE_IDENTIFIERS.RoomService, () => roomService);
  container.registerSingleton(SERVICE_IDENTIFIERS.SpaceReservationService, () => spaceReservationSvc);
  container.registerSingleton(SERVICE_IDENTIFIERS.GroupService, () => groupService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CommunicationService, () => communicationService);
  container.registerSingleton(SERVICE_IDENTIFIERS.AfterSchoolServiceService, () => afterSchoolServiceService);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherAttendanceService, () => teacherAttendanceService);
  container.registerSingleton(SERVICE_IDENTIFIERS.WorkloadService, () => workloadService);
  container.registerSingleton(SERVICE_IDENTIFIERS.SchoolStatsService, () => schoolStatsService);
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentHonorService, () => studentHonorService);
  // P4 智慧作业 Services
  container.registerSingleton(SERVICE_IDENTIFIERS.SmartHomeworkService, () => createSmartHomeworkService());
  container.registerSingleton(SERVICE_IDENTIFIERS.ExamTaskService, () => createExamTaskService());
  // 卓越教师 Services
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherProfileService, () => teacherProfileService);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherTeamService, () => teacherTeamService);
  container.registerSingleton(SERVICE_IDENTIFIERS.TeacherAwardService, () => teacherAwardService);
  // 附小少年 Services
  container.registerSingleton(SERVICE_IDENTIFIERS.StudentShowcaseService, () => studentShowcaseService);

  // 云教学 Services
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudCourseService, () => cloudCourseService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudCourseEnrollmentService, () => cloudCourseEnrollmentService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudLearningRecordService, () => cloudLearningRecordService);
  container.registerSingleton(SERVICE_IDENTIFIERS.CloudLiveSessionService, () => cloudLiveSessionService);
}

// 导出
export { container, SERVICE_IDENTIFIERS, getService } from './container';
// 从统一类型目录导出 Repository 接口
export type {
  IBaseRepository,
  IUserRepository,
  ITeacherRepository,
  IStudentRepository,
  IClassRepository,
  IGradeRepository,
  IApprovalRepository,
  IMessageRepository,
  ICourseRepository,
  IExamRepository,
  IExamScoreRepository,
  IHomeworkRepository,
  IHomeworkSubmissionRepository,
  IResearchActivityRepository,
  IResearchStageRepository,
  IResearchAchievementRepository,
  IResearchResourceRepository,
  IMoralActivityRepository,
  IMoralActivitySubmissionRepository,
  IHabitGoalRepository,
  IStudentHabitGoalRepository,
  IHabitRecordRepository,
  IHabitStarRepository,
  IInformationCollectionRepository,
  ICollectionResponseRepository,
  ExamQueryOptions,
  HomeworkQueryOptions,
  ResearchQueryOptions,
  MoralQueryOptions,
  HabitQueryOptions,
  CollectionQueryOptions,
} from '@/types/repository';

// 自动初始化（在模块加载时执行）
initializeDI();
