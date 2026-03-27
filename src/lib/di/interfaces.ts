/**
 * Repository 接口定义
 * 
 * 定义各 Repository 的公共接口，Service 层依赖此接口而非具体实现
 * 遵循依赖倒置原则：高层模块依赖抽象，不依赖具体实现
 * 
 * @module lib/di/interfaces
 */

import type { QueryOptions, PaginatedResult } from '@/repositories/base.repository';
import type {
  User,
  Teacher,
  Student,
  Class,
  Grade,
  Approval,
  Message,
  Course,
} from '@/types';

// 从独立模块导入精确类型
import type {
  Exam as ExamDetail,
  ExamScore,
  ExamStatus,
  ExamStatistics,
} from '@/types/exam';

import type {
  Homework,
  HomeworkSubmission,
  HomeworkStatus,
  HomeworkStatistics,
} from '@/types/homework';

import type {
  MoralActivity as MoralActivityDetail,
  MoralActivitySubmission,
  MoralActivityStatus,
} from '@/types/moral';

import type {
  HabitGoal,
  HabitGoalType,
  HabitCategory as HabitCategoryDetail,
  StudentHabitGoal,
  HabitRecord,
  HabitStar,
} from '@/types/habit';

import type {
  InformationCollection,
  CollectionResponse,
  CollectionStatus,
  FormField,
} from '@/types/information-collection';

import type {
  ResearchActivity as ResearchActivityDetail,
  ResearchStage,
  ResearchAchievement,
  ResearchResource,
  ActivityStatus as ResearchActivityStatus,
} from '@/types/research';

// ==================== 基础接口 ====================

/**
 * 基础 Repository 接口
 */
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  findWhere(conditions: Record<string, unknown>): Promise<T[]>;
  create(data: Partial<T>): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  findPaginated(options: QueryOptions): Promise<PaginatedResult<T>>;
}

// ==================== 用户与权限 ====================

export interface IUserRepository extends IBaseRepository<User> {
  findByUsername(username: string): Promise<User | null>;
  findByEmployeeId(employeeId: string): Promise<User | null>;
  findByPhone(phone: string): Promise<User | null>;
  findByRole(role: string): Promise<User[]>;
  updateLastLogin(id: string): Promise<void>;
}

// ==================== 教师管理 ====================

export interface ITeacherRepository extends IBaseRepository<Teacher> {
  findByDepartment(department: string): Promise<Teacher[]>;
  findByStatus(status: string): Promise<Teacher[]>;
}

// ==================== 学生管理 ====================

export interface IStudentRepository extends IBaseRepository<Student> {
  findByStudentNumber(studentNumber: string): Promise<Student | null>;
  findByClass(classId: string): Promise<Student[]>;
  findByGrade(grade: string): Promise<Student[]>;
  findWithClass(filters: Record<string, unknown>, options: QueryOptions): Promise<PaginatedResult<Student>>;
  findDetailById(id: string): Promise<{ parents: unknown[] }>;
  promoteGrade(currentGrade: string, nextGrade: string): Promise<number>;
}

// ==================== 班级管理 ====================

export interface IClassRepository extends IBaseRepository<Class> {
  findByGrade(grade: number): Promise<Class[]>;
  findByGradeWithStudentCount(grade: number): Promise<(Class & { student_count: number })[]>;
}

// ==================== 成绩管理 ====================

export interface IGradeRepository extends IBaseRepository<Grade> {
  findByExam(examId: string): Promise<Grade[]>;
  findByStudent(studentId: string): Promise<Grade[]>;
  findByClass(classId: string, examId: string): Promise<Grade[]>;
}

// ==================== 审批管理 ====================

export interface IApprovalRepository extends IBaseRepository<Approval> {
  findByApplicant(applicantId: string): Promise<Approval[]>;
  findByApprover(approverId: string): Promise<Approval[]>;
  findPending(): Promise<Approval[]>;
}

// ==================== 消息管理 ====================

export interface IMessageRepository extends IBaseRepository<Message> {
  findByRecipient(recipientId: string): Promise<Message[]>;
  findBySender(senderId: string): Promise<Message[]>;
  markAsRead(id: string): Promise<boolean>;
}

// ==================== 课程管理 ====================

export interface ICourseRepository extends IBaseRepository<Course> {
  findByTeacher(teacherId: string): Promise<Course[]>;
  findByClass(classId: string): Promise<Course[]>;
  findBySemester(semester: string): Promise<Course[]>;
}

// ==================== 考试管理 ====================

/** 考试查询选项 */
export interface ExamQueryOptions extends QueryOptions {
  type?: 'midterm' | 'final' | 'unit' | 'mock';
  status?: ExamStatus;
  semester?: string;
  grade?: number;
}

export interface IExamRepository extends IBaseRepository<ExamDetail> {
  findBySemester(semester: string): Promise<ExamDetail[]>;
  findByStatus(status: ExamStatus): Promise<ExamDetail[]>;
  updateStatus(id: string, status: ExamStatus): Promise<ExamDetail | null>;
  getStatistics(id: string): Promise<ExamStatistics>;
}

export interface IExamScoreRepository extends IBaseRepository<ExamScore> {
  findByExamId(examId: string): Promise<ExamScore[]>;
  findByStudentId(studentId: string): Promise<ExamScore[]>;
  importScores(scores: Partial<ExamScore>[]): Promise<ExamScore[]>;
  getClassStatistics(examId: string, classId: string): Promise<{
    count: number;
    avgScore: number;
    maxScore: number;
    minScore: number;
  }>;
}

// ==================== 作业管理 ====================

/** 作业查询选项 */
export interface HomeworkQueryOptions extends QueryOptions {
  type?: 'daily' | 'weekly' | 'project' | 'practice';
  status?: HomeworkStatus;
  subject?: string;
  classId?: string;
  teacherId?: string;
}

export interface IHomeworkRepository extends IBaseRepository<Homework> {
  findByTeacher(teacherId: string): Promise<Homework[]>;
  findByClass(classId: string): Promise<Homework[]>;
  findBySubject(subject: string): Promise<Homework[]>;
  getStatistics(id: string): Promise<HomeworkStatistics>;
}

export interface IHomeworkSubmissionRepository extends IBaseRepository<HomeworkSubmission> {
  findByHomework(homeworkId: string): Promise<HomeworkSubmission[]>;
  findByStudent(studentId: string): Promise<HomeworkSubmission[]>;
}

// ==================== 教研管理 ====================

/** 教研查询选项 */
export interface ResearchQueryOptions extends QueryOptions {
  type?: string;
  status?: ResearchActivityStatus;
  organizerId?: string;
}

export interface IResearchActivityRepository extends IBaseRepository<ResearchActivityDetail> {
  findByOrganizer(organizerId: string): Promise<ResearchActivityDetail[]>;
  findByStatus(status: ResearchActivityStatus): Promise<ResearchActivityDetail[]>;
  findOngoing(): Promise<ResearchActivityDetail[]>;
  getStatistics(): Promise<{
    total: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
  }>;
}

export interface IResearchStageRepository extends IBaseRepository<ResearchStage> {
  findByActivity(activityId: string): Promise<ResearchStage[]>;
}

export interface IResearchAchievementRepository extends IBaseRepository<ResearchAchievement> {
  findByActivity(activityId: string): Promise<ResearchAchievement[]>;
  findByAuthor(authorId: string): Promise<ResearchAchievement[]>;
}

export interface IResearchResourceRepository extends IBaseRepository<ResearchResource> {
  findByActivity(activityId: string): Promise<ResearchResource[]>;
  incrementDownloadCount(id: string): Promise<void>;
}

// ==================== 德育管理 ====================

/** 德育查询选项 */
export interface MoralQueryOptions extends QueryOptions {
  type?: string;
  status?: MoralActivityStatus;
  organizerId?: string;
}

export interface IMoralActivityRepository extends IBaseRepository<MoralActivityDetail> {
  findByOrganizer(organizerId: string): Promise<MoralActivityDetail[]>;
  findByType(type: string): Promise<MoralActivityDetail[]>;
}

export interface IMoralActivitySubmissionRepository extends IBaseRepository<MoralActivitySubmission> {
  findByActivity(activityId: string): Promise<MoralActivitySubmission[]>;
  findByStudent(studentId: string): Promise<MoralActivitySubmission[]>;
}

// ==================== 习惯培养 ====================

/** 习惯查询选项 */
export interface HabitQueryOptions extends QueryOptions {
  category?: HabitCategoryDetail;
  type?: HabitGoalType;
  isActive?: boolean;
}

export interface IHabitGoalRepository extends IBaseRepository<HabitGoal> {
  findActive(): Promise<HabitGoal[]>;
  findByCategory(category: HabitCategoryDetail): Promise<HabitGoal[]>;
}

export interface IStudentHabitGoalRepository extends IBaseRepository<StudentHabitGoal> {
  findByStudent(studentId: string): Promise<StudentHabitGoal[]>;
  findByGoal(goalId: string): Promise<StudentHabitGoal[]>;
}

export interface IHabitRecordRepository extends IBaseRepository<HabitRecord> {
  findByStudent(studentId: string, date: string): Promise<HabitRecord[]>;
  findByDate(date: string): Promise<HabitRecord[]>;
}

export interface IHabitStarRepository extends IBaseRepository<HabitStar> {
  findByStudent(studentId: string): Promise<HabitStar[]>;
  findByDate(date: string): Promise<HabitStar[]>;
}

// ==================== 信息采集 ====================

/** 信息采集查询选项 */
export interface CollectionQueryOptions extends QueryOptions {
  status?: CollectionStatus;
  creatorId?: string;
}

export interface IInformationCollectionRepository extends IBaseRepository<InformationCollection> {
  findByCreator(creatorId: string): Promise<InformationCollection[]>;
  findByStatus(status: CollectionStatus): Promise<InformationCollection[]>;
}

export interface ICollectionResponseRepository extends IBaseRepository<CollectionResponse> {
  findByCollection(collectionId: string): Promise<CollectionResponse[]>;
  findByResponder(responderId: string): Promise<CollectionResponse[]>;
}
