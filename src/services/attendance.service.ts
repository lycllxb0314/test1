/**
 * 考勤服务层
 * 
 * 处理考勤相关的业务逻辑
 */

import { BaseService, ServiceResult, PaginatedServiceResult } from './base.service';
import { attendanceRepository, studentRepository, classRepository } from '@/repositories';
import type { StudentAttendance, AttendanceStatus } from '@/types';

/**
 * 考勤记录参数
 */
export interface RecordAttendanceParams {
  studentId: string;
  classId: string;
  date: string;
  status: AttendanceStatus;
  reason?: string;
  recorderId?: string;
  recorderName?: string;
}

/**
 * 批量考勤参数
 */
export interface BatchAttendanceParams {
  classId: string;
  date: string;
  records: {
    studentId: string;
    status: AttendanceStatus;
    reason?: string;
  }[];
  recorderId?: string;
  recorderName?: string;
}

/**
 * 考勤查询参数
 */
export interface AttendanceQueryParams {
  classId?: string;
  studentId?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: number;
  pageSize?: number;
}

/**
 * 考勤服务
 */
export class AttendanceService extends BaseService {
  /**
   * 记录考勤
   */
  async recordAttendance(params: RecordAttendanceParams): Promise<ServiceResult<StudentAttendance>> {
    // 验证学生存在
    const student = await studentRepository.findById(params.studentId);
    if (!student) {
      return this.fail('学生不存在', 'STUDENT_NOT_FOUND');
    }

    const record = await attendanceRepository.create({
      studentId: params.studentId,
      classId: params.classId,
      date: params.date,
      status: params.status,
      reason: params.reason,
      recorderId: params.recorderId,
      recorderName: params.recorderName,
    } as Partial<StudentAttendance>);

    if (!record) {
      return this.fail('记录考勤失败', 'RECORD_FAILED');
    }

    return this.ok(record);
  }

  /**
   * 批量记录考勤
   */
  async batchRecordAttendance(params: BatchAttendanceParams): Promise<ServiceResult<{
    success: number;
    failed: number;
    records: StudentAttendance[];
  }>> {
    // 获取班级学生列表验证
    const students = await studentRepository.findByClass(params.classId);
    const studentIds = new Set(students.map((s: { id: string }) => s.id));

    // 验证所有学生都在该班级
    for (const record of params.records) {
      if (!studentIds.has(record.studentId)) {
        return this.fail(`学生${record.studentId}不在该班级`, 'INVALID_STUDENT');
      }
    }

    // 构建记录
    const records = params.records.map(r => ({
      studentId: r.studentId,
      classId: params.classId,
      date: params.date,
      status: r.status,
      reason: r.reason,
      recorderId: params.recorderId,
      recorderName: params.recorderName,
    }));

    const result = await attendanceRepository.upsertBatch(records as Partial<StudentAttendance>[]);

    return this.ok({
      success: result.length,
      failed: params.records.length - result.length,
      records: result,
    });
  }

  /**
   * 获取班级今日考勤
   */
  async getTodayAttendance(classId: string, date?: string): Promise<ServiceResult<{
    recorded: StudentAttendance[];
    unrecorded: string[];
    statistics: {
      total: number;
      present: number;
      absent: number;
      late: number;
    };
  }>> {
    const today = date || new Date().toISOString().split('T')[0];

    // 获取班级学生总数
    const students = await studentRepository.findByClass(classId);
    const total = students.length;

    // 获取已记录考勤
    const recorded = await attendanceRepository.findByClassAndDate(classId, today);

    // 获取未记录学生
    const unrecorded = await attendanceRepository.findUnrecordedToday(classId, today);

    // 统计
    const statistics = {
      total,
      present: recorded.filter((r: { status: string }) => r.status === 'present').length,
      absent: recorded.filter((r: { status: string }) => r.status === 'absent').length,
      late: recorded.filter((r: { status: string }) => r.status === 'late').length,
    };

    return this.ok({
      recorded,
      unrecorded,
      statistics,
    });
  }

  /**
   * 查询考勤记录
   */
  async listAttendance(params: AttendanceQueryParams): Promise<PaginatedServiceResult<StudentAttendance>> {
    const { page = 1, pageSize = 20 } = params;

    const result = await attendanceRepository.findPaginatedWithFilters({
      filters: {
        classId: params.classId,
        studentId: params.studentId,
        date: params.date,
        startDate: params.startDate,
        endDate: params.endDate,
        status: params.status,
      },
      page,
      pageSize,
    });

    return {
      success: true,
      data: result.data,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * 获取学生考勤统计
   */
  async getStudentStatistics(
    studentId: string,
    startDate?: string,
    endDate?: string
  ): Promise<ServiceResult<{
    total: number;
    present: number;
    absent: number;
    late: number;
    leaveEarly: number;
    excused: number;
    attendanceRate: number;
  }>> {
    const stats = await attendanceRepository.getStudentStatistics(studentId, startDate, endDate);

    const attendanceRate = stats.total > 0
      ? ((stats.present + stats.late + stats.excused) / stats.total) * 100
      : 100;

    return this.ok({
      ...stats,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
    });
  }

  /**
   * 获取班级考勤统计
   */
  async getClassStatistics(
    classId: string,
    startDate: string,
    endDate: string
  ): Promise<ServiceResult<{
    total: number;
    present: number;
    absent: number;
    late: number;
    leaveEarly: number;
    excused: number;
    attendanceRate: number;
    dailyStats: { date: string; present: number; absent: number }[];
  }>> {
    const stats = await attendanceRepository.getClassStatistics(classId, startDate, endDate);

    const attendanceRate = stats.total > 0
      ? ((stats.present + stats.late + stats.excused) / stats.total) * 100
      : 100;

    // 获取每日统计
    const { data: dailyRecords } = await attendanceRepository.findPaginatedWithFilters({
      filters: { classId, startDate, endDate },
      pageSize: 1000,
    });

    // 按日期聚合
    const dailyMap = new Map<string, { present: number; absent: number }>();
    dailyRecords.forEach((r: { date: string; status: string }) => {
      if (!dailyMap.has(r.date)) {
        dailyMap.set(r.date, { present: 0, absent: 0 });
      }
      const day = dailyMap.get(r.date)!;
      if (r.status === 'present') day.present++;
      if (r.status === 'absent') day.absent++;
    });

    const dailyStats = Array.from(dailyMap.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return this.ok({
      ...stats,
      attendanceRate: Math.round(attendanceRate * 100) / 100,
      dailyStats,
    });
  }

  /**
   * 获取考勤异常学生
   */
  async getAbnormalAttendance(
    classId: string,
    options: {
      threshold?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<ServiceResult<{
    studentId: string;
    studentName: string;
    absentCount: number;
    lateCount: number;
  }[]>> {
    const { threshold = 3, startDate, endDate } = options;
    const students = await studentRepository.findByClass(classId);

    const abnormalStudents: {
      studentId: string;
      studentName: string;
      absentCount: number;
      lateCount: number;
    }[] = [];

    for (const student of students) {
      const stats = await attendanceRepository.getStudentStatistics(
        student.id,
        startDate,
        endDate
      );

      if (stats.absent >= threshold || stats.late >= threshold) {
        abnormalStudents.push({
          studentId: student.id,
          studentName: student.name || '',
          absentCount: stats.absent,
          lateCount: stats.late,
        });
      }
    }

    return this.ok(abnormalStudents);
  }
}

// 导出单例
export const attendanceService = new AttendanceService();
