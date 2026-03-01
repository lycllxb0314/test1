import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import {
  MASTER_SCHOOL,
  MASTER_CLASSES,
  MASTER_TEACHERS,
  MASTER_STUDENTS,
  type MasterClass,
  type MasterTeacher,
  type MasterStudent,
} from '@/lib/mock/master-data';
import {
  MOCK_EXAMS,
  MOCK_COURSES,
  MOCK_GRADES,
  MOCK_AFTER_SCHOOL_SERVICES,
  MOCK_HOMEWORKS,
} from '@/lib/mock/academic.mock';
import { MOCK_ROOMS, MOCK_ASSETS } from '@/lib/mock/general.mock';
import { MOCK_TEACHER_HONORS, MOCK_TEACHER_RECORDS } from '@/lib/mock/teachers.mock';
import { MOCK_STUDENT_ATTENDANCE } from '@/lib/mock/moral.mock';

interface MigrationResult {
  table: string;
  action: 'inserted' | 'skipped' | 'error';
  count: number;
  message?: string;
}

export async function POST() {
  const client = getSupabaseClient();
  const results: MigrationResult[] = [];

  try {
    // 1. 迁移学校数据
    console.log('Migrating school data...');
    const { data: existingSchool } = await client
      .from('schools')
      .select('id')
      .eq('id', MASTER_SCHOOL.id)
      .single();

    if (!existingSchool) {
      const { error: schoolError } = await client.from('schools').insert({
        id: MASTER_SCHOOL.id,
        name: MASTER_SCHOOL.name,
        short_name: MASTER_SCHOOL.shortName,
        total_grades: MASTER_SCHOOL.totalGrades,
        current_semester: MASTER_SCHOOL.currentSemester,
        academic_year: MASTER_SCHOOL.academicYear,
      });
      
      if (schoolError) {
        results.push({ table: 'schools', action: 'error', count: 0, message: schoolError.message });
      } else {
        results.push({ table: 'schools', action: 'inserted', count: 1 });
      }
    } else {
      results.push({ table: 'schools', action: 'skipped', count: 1, message: '已存在' });
    }

    // 2. 迁移班级数据
    console.log('Migrating classes data...');
    const { count: classesCount } = await client.from('classes').select('*', { count: 'exact', head: true });
    if (classesCount === 0) {
      const classesData = MASTER_CLASSES.map(c => ({
        id: c.id,
        name: c.name,
        grade: c.grade,
        grade_name: c.gradeName,
        class_number: c.classNumber,
        head_teacher_id: c.headTeacherId,
        head_teacher_name: c.headTeacherName,
        classroom_id: c.classroomId,
        classroom_name: c.classroomName,
        building: c.building,
      }));

      const { error: classesError } = await client.from('classes').insert(classesData);
      
      if (classesError) {
        results.push({ table: 'classes', action: 'error', count: 0, message: classesError.message });
      } else {
        results.push({ table: 'classes', action: 'inserted', count: MASTER_CLASSES.length });
      }
    } else {
      results.push({ table: 'classes', action: 'skipped', count: classesCount || 0, message: '已存在' });
    }

    // 3. 迁移教师数据
    console.log('Migrating teachers data...');
    const { count: teachersCount } = await client.from('teachers').select('*', { count: 'exact', head: true });
    if (teachersCount === 0) {
      const teachersData = MASTER_TEACHERS.map(t => ({
        id: t.id,
        name: t.name,
        gender: t.gender,
        subjects: t.subjects,
        is_head_teacher: t.isHeadTeacher,
        head_teacher_class_ids: t.headTeacherClassIds,
        department: t.department,
        title: t.title,
      }));

      const { error: teachersError } = await client.from('teachers').insert(teachersData);
      
      if (teachersError) {
        results.push({ table: 'teachers', action: 'error', count: 0, message: teachersError.message });
      } else {
        results.push({ table: 'teachers', action: 'inserted', count: MASTER_TEACHERS.length });
      }
    } else {
      results.push({ table: 'teachers', action: 'skipped', count: teachersCount || 0, message: '已存在' });
    }

    // 4. 迁移学生数据
    console.log('Migrating students data...');
    const { count: studentsCount } = await client.from('students').select('*', { count: 'exact', head: true });
    if (studentsCount === 0) {
      const studentsData = MASTER_STUDENTS.map(s => {
        const cls = MASTER_CLASSES.find(c => c.id === s.classId);
        return {
          id: s.id,
          student_no: s.studentNo,
          name: s.name,
          gender: s.gender,
          birth_date: s.birthDate,
          class_id: s.classId,
          class_name: cls?.name || '',
          grade: cls?.grade || 1,
          status: s.status,
        };
      });

      const { error: studentsError } = await client.from('students').insert(studentsData);
      
      if (studentsError) {
        results.push({ table: 'students', action: 'error', count: 0, message: studentsError.message });
      } else {
        results.push({ table: 'students', action: 'inserted', count: MASTER_STUDENTS.length });
      }
    } else {
      results.push({ table: 'students', action: 'skipped', count: studentsCount || 0, message: '已存在' });
    }

    // 5. 迁移考试数据
    console.log('Migrating exams data...');
    const { count: examsCount } = await client.from('exams').select('*', { count: 'exact', head: true });
    if ((!examsCount || examsCount === 0) && MOCK_EXAMS.length > 0) {
      const examsData = MOCK_EXAMS.map(e => ({
        id: e.id,
        name: e.name,
        type: e.type || '期中考试',
        subjects: e.subjects || [],
        grades: e.grades || [],
        start_date: e.startDate,
        end_date: e.endDate,
        status: e.status || 'completed',
      }));

      const { error: examsError } = await client.from('exams').insert(examsData);
      
      if (examsError) {
        results.push({ table: 'exams', action: 'error', count: 0, message: examsError.message });
      } else {
        results.push({ table: 'exams', action: 'inserted', count: MOCK_EXAMS.length });
      }
    } else {
      results.push({ table: 'exams', action: 'skipped', count: examsCount || 0, message: '已存在' });
    }

    // 6. 迁移成绩数据
    console.log('Migrating grades data...');
    const { count: gradesCount } = await client.from('grades').select('*', { count: 'exact', head: true });
    if ((!gradesCount || gradesCount === 0) && MOCK_GRADES.length > 0) {
      const gradesData = MOCK_GRADES.map(g => {
        // 从学生数据中查找班级ID
        const student = MASTER_STUDENTS.find(s => s.id === g.studentId);
        return {
          id: g.id || `g${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          exam_id: g.examId,
          student_id: g.studentId,
          student_name: g.studentName,
          class_id: student?.classId || '',
          class_name: g.className,
          grade: g.studentGrade,
          subject: g.subject,
          score: g.score,
          class_rank: g.classRank,
        };
      });

      const { error: gradesError } = await client.from('grades').insert(gradesData);
      
      if (gradesError) {
        results.push({ table: 'grades', action: 'error', count: 0, message: gradesError.message });
      } else {
        results.push({ table: 'grades', action: 'inserted', count: MOCK_GRADES.length });
      }
    } else {
      results.push({ table: 'grades', action: 'skipped', count: gradesCount || 0, message: '已存在' });
    }

    // 7. 迁移课后服务数据
    console.log('Migrating after-school services data...');
    const { count: servicesCount } = await client.from('after_school_services').select('*', { count: 'exact', head: true });
    if ((!servicesCount || servicesCount === 0) && MOCK_AFTER_SCHOOL_SERVICES.length > 0) {
      const servicesData = MOCK_AFTER_SCHOOL_SERVICES.map(s => ({
        id: s.id,
        name: s.serviceType || '课后服务',
        type: s.serviceType,
        teacher_id: s.teacherId,
        teacher_name: s.teacherName,
        classroom: s.className,
        day_of_week: s.weekNumber,
        start_time: s.startTime,
        end_time: s.endTime,
        max_students: s.studentCount,
        current_students: s.studentCount,
        status: s.status || 'active',
      }));

      const { error: servicesError } = await client.from('after_school_services').insert(servicesData);
      
      if (servicesError) {
        results.push({ table: 'after_school_services', action: 'error', count: 0, message: servicesError.message });
      } else {
        results.push({ table: 'after_school_services', action: 'inserted', count: MOCK_AFTER_SCHOOL_SERVICES.length });
      }
    } else {
      results.push({ table: 'after_school_services', action: 'skipped', count: servicesCount || 0, message: '已存在' });
    }

    // 8. 迁移作业数据
    console.log('Migrating homeworks data...');
    const { count: homeworksCount } = await client.from('homeworks').select('*', { count: 'exact', head: true });
    if ((!homeworksCount || homeworksCount === 0) && MOCK_HOMEWORKS.length > 0) {
      const homeworksData = MOCK_HOMEWORKS.map(h => ({
        id: h.id,
        title: h.title,
        subject: h.subject,
        teacher_id: h.teacherId,
        teacher_name: h.teacherName,
        class_id: h.classId,
        class_name: h.className,
        content: h.content,
        due_date: h.dueDate,
        status: h.status || 'published',
        submitted_count: h.submissionCount || 0,
        total_students: h.totalStudents || 0,
      }));

      const { error: homeworksError } = await client.from('homeworks').insert(homeworksData);
      
      if (homeworksError) {
        results.push({ table: 'homeworks', action: 'error', count: 0, message: homeworksError.message });
      } else {
        results.push({ table: 'homeworks', action: 'inserted', count: MOCK_HOMEWORKS.length });
      }
    } else {
      results.push({ table: 'homeworks', action: 'skipped', count: homeworksCount || 0, message: '已存在' });
    }

    // 9. 迁移场地数据
    console.log('Migrating rooms data...');
    const { count: roomsCount } = await client.from('rooms').select('*', { count: 'exact', head: true });
    if ((!roomsCount || roomsCount === 0) && MOCK_ROOMS.length > 0) {
      const roomsData = MOCK_ROOMS.map(r => ({
        id: r.id,
        name: r.name,
        building: r.building,
        floor: r.floor,
        capacity: r.capacity,
        type: r.type,
        facilities: r.facilities,
        status: r.status || 'available',
      }));

      const { error: roomsError } = await client.from('rooms').insert(roomsData);
      
      if (roomsError) {
        results.push({ table: 'rooms', action: 'error', count: 0, message: roomsError.message });
      } else {
        results.push({ table: 'rooms', action: 'inserted', count: MOCK_ROOMS.length });
      }
    } else {
      results.push({ table: 'rooms', action: 'skipped', count: roomsCount || 0, message: '已存在' });
    }

    // 10. 迁移资产数据
    console.log('Migrating assets data...');
    const { count: assetsCount } = await client.from('assets').select('*', { count: 'exact', head: true });
    if ((!assetsCount || assetsCount === 0) && MOCK_ASSETS.length > 0) {
      const assetsData = MOCK_ASSETS.map(a => ({
        id: a.id,
        asset_no: a.assetNo,
        name: a.name,
        category: a.category,
        specification: a.specification,
        quantity: a.quantity,
        unit: a.unit,
        value: a.value,
        purchase_date: a.purchaseDate,
        warranty_expiry: a.warrantyExpiry,
        location: a.location,
        department: a.department,
        status: a.status || '在用',
      }));

      const { error: assetsError } = await client.from('assets').insert(assetsData);
      
      if (assetsError) {
        results.push({ table: 'assets', action: 'error', count: 0, message: assetsError.message });
      } else {
        results.push({ table: 'assets', action: 'inserted', count: MOCK_ASSETS.length });
      }
    } else {
      results.push({ table: 'assets', action: 'skipped', count: assetsCount || 0, message: '已存在' });
    }

    // 11. 迁移教师荣誉数据
    console.log('Migrating teacher honors data...');
    const { count: honorsCount } = await client.from('teacher_honors').select('*', { count: 'exact', head: true });
    if ((!honorsCount || honorsCount === 0) && MOCK_TEACHER_HONORS.length > 0) {
      const honorsData = MOCK_TEACHER_HONORS.map(h => {
        // 从教师数据中查找教师姓名
        const teacher = MASTER_TEACHERS.find(t => t.id === h.teacherId);
        // 处理日期格式：如果是 "2023-09" 格式，转换为 "2023-09-01"
        let dateValue = h.date || '';
        if (dateValue && dateValue.length === 7 && dateValue.includes('-')) {
          dateValue = `${dateValue}-01`;
        }
        return {
          id: h.id,
          teacher_id: h.teacherId,
          teacher_name: teacher?.name || '',
          title: h.title,
          level: h.level,
          organization: h.issuer || '',
          date: dateValue,
          certificate_no: h.certificateNo || '',
        };
      });

      const { error: honorsError } = await client.from('teacher_honors').insert(honorsData);
      
      if (honorsError) {
        results.push({ table: 'teacher_honors', action: 'error', count: 0, message: honorsError.message });
      } else {
        results.push({ table: 'teacher_honors', action: 'inserted', count: MOCK_TEACHER_HONORS.length });
      }
    } else {
      results.push({ table: 'teacher_honors', action: 'skipped', count: honorsCount || 0, message: '已存在' });
    }

    // 12. 迁移教师培训记录数据
    console.log('Migrating teacher records data...');
    const { count: recordsCount } = await client.from('teacher_records').select('*', { count: 'exact', head: true });
    if ((!recordsCount || recordsCount === 0) && MOCK_TEACHER_RECORDS.length > 0) {
      const recordsData = MOCK_TEACHER_RECORDS.map(r => {
        // 从教师数据中查找教师姓名
        const teacher = MASTER_TEACHERS.find(t => t.id === r.teacherId);
        // 处理日期格式
        let startDate = r.date || '';
        if (startDate && startDate.length === 7 && startDate.includes('-')) {
          startDate = `${startDate}-01`;
        }
        return {
          id: r.id,
          teacher_id: r.teacherId,
          teacher_name: teacher?.name || '',
          type: r.type,
          title: r.title,
          start_date: startDate,
          end_date: null,  // 使用null而不是空字符串
          description: r.description || '',
        };
      });

      const { error: recordsError } = await client.from('teacher_records').insert(recordsData);
      
      if (recordsError) {
        results.push({ table: 'teacher_records', action: 'error', count: 0, message: recordsError.message });
      } else {
        results.push({ table: 'teacher_records', action: 'inserted', count: MOCK_TEACHER_RECORDS.length });
      }
    } else {
      results.push({ table: 'teacher_records', action: 'skipped', count: recordsCount || 0, message: '已存在' });
    }

    // 13. 迁移学生考勤数据
    console.log('Migrating student attendance data...');
    const { count: attendanceCount } = await client.from('student_attendance').select('*', { count: 'exact', head: true });
    if ((!attendanceCount || attendanceCount === 0) && MOCK_STUDENT_ATTENDANCE.length > 0) {
      const attendanceData = MOCK_STUDENT_ATTENDANCE.map(a => {
        // 从学生数据中查找班级ID
        const student = MASTER_STUDENTS.find(s => s.id === a.studentId);
        return {
          id: a.id,
          student_id: a.studentId,
          student_name: a.studentName,
          class_id: student?.classId || '',
          class_name: a.className,
          date: a.date,
          status: a.type || 'attendance',
          reason: a.reason || null,
          // 注意：recorder_id字段可能尚未在数据库中同步，暂时跳过
        };
      });

      const { error: attendanceError } = await client.from('student_attendance').insert(attendanceData);
      
      if (attendanceError) {
        results.push({ table: 'student_attendance', action: 'error', count: 0, message: attendanceError.message });
      } else {
        results.push({ table: 'student_attendance', action: 'inserted', count: MOCK_STUDENT_ATTENDANCE.length });
      }
    } else {
      results.push({ table: 'student_attendance', action: 'skipped', count: attendanceCount || 0, message: '已存在' });
    }

    // 更新班级学生数量
    console.log('Updating class student counts...');
    for (const cls of MASTER_CLASSES) {
      const studentCount = MASTER_STUDENTS.filter(s => s.classId === cls.id).length;
      await client
        .from('classes')
        .update({ student_count: studentCount })
        .eq('id', cls.id);
    }

    return NextResponse.json({
      success: true,
      message: '数据迁移完成',
      results,
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      message: '数据迁移失败',
      error: error instanceof Error ? error.message : 'Unknown error',
      results,
    }, { status: 500 });
  }
}

export async function GET() {
  const client = getSupabaseClient();
  
  try {
    const tables = [
      'schools', 'classes', 'teachers', 'students',
      'exams', 'grades', 'after_school_services', 'homeworks',
      'rooms', 'assets', 'teacher_honors', 'teacher_records', 'student_attendance'
    ];
    
    const counts: Record<string, number> = {};
    
    for (const table of tables) {
      const { count } = await client.from(table).select('*', { count: 'exact', head: true });
      counts[table] = count || 0;
    }

    return NextResponse.json({
      success: true,
      database: counts,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
