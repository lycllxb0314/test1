import { pgTable, serial, varchar, integer, boolean, timestamp, text, jsonb, index, date, foreignKey, check, uuid, unique, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const homepageHonors = pgTable("homepage_honors", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	year: varchar({ length: 10 }),
	organization: varchar({ length: 200 }),
	level: varchar({ length: 50 }),
	image: varchar({ length: 500 }),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const homepageImages = pgTable("homepage_images", {
	id: serial().primaryKey().notNull(),
	sectionType: varchar("section_type", { length: 50 }).notNull(),
	title: varchar({ length: 200 }),
	description: varchar({ length: 500 }),
	imageUrl: varchar("image_url", { length: 500 }).notNull(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const homepageNews = pgTable("homepage_news", {
	id: serial().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	summary: text(),
	content: text(),
	category: varchar({ length: 50 }),
	coverImage: varchar("cover_image", { length: 500 }),
	isTop: boolean("is_top").default(false),
	viewCount: integer("view_count").default(0),
	publishDate: timestamp("publish_date", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdBy: varchar("created_by", { length: 100 }),
});

export const homepageSections = pgTable("homepage_sections", {
	id: serial().primaryKey().notNull(),
	sectionType: varchar("section_type", { length: 50 }).notNull(),
	sectionTitle: varchar("section_title", { length: 200 }),
	sectionSubtitle: varchar("section_subtitle", { length: 500 }),
	content: jsonb(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedBy: varchar("updated_by", { length: 100 }),
});

export const workflowConfigs = pgTable("workflow_configs", {
	id: serial().primaryKey().notNull(),
	type: varchar({ length: 50 }).notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	isActive: boolean("is_active").default(true),
	nodes: jsonb(),
	steps: jsonb(),
	startNodeId: varchar("start_node_id", { length: 50 }),
	endNodeId: varchar("end_node_id", { length: 50 }),
	formFields: jsonb("form_fields"),
	conditions: jsonb(),
	version: integer().default(1),
	createdBy: varchar("created_by", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_workflow_configs_active").using("btree", table.isActive.asc().nullsLast().op("bool_ops")),
	index("idx_workflow_configs_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const studentAttendance = pgTable("student_attendance", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	studentName: varchar("student_name", { length: 50 }).notNull(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	className: varchar("class_name", { length: 50 }),
	date: date().notNull(),
	status: varchar({ length: 20 }).notNull(),
	reason: text(),
	recordedBy: varchar("recorded_by", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_student_attendance_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_student_attendance_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_student_attendance_student").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
]);

export const teacherHonors = pgTable("teacher_honors", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	teacherId: varchar("teacher_id", { length: 50 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	level: varchar({ length: 50 }),
	organization: varchar({ length: 200 }),
	date: date(),
	description: text(),
	certificateNo: varchar("certificate_no", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_teacher_honors_teacher").using("btree", table.teacherId.asc().nullsLast().op("text_ops")),
]);

export const workflowInstances = pgTable("workflow_instances", {
	id: serial().primaryKey().notNull(),
	type: varchar({ length: 50 }).notNull(),
	configId: integer("config_id").notNull(),
	applicantId: varchar("applicant_id", { length: 100 }).notNull(),
	applicantName: varchar("applicant_name", { length: 100 }).notNull(),
	applicantRole: varchar("applicant_role", { length: 50 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: jsonb().notNull(),
	status: varchar({ length: 50 }).default('pending'),
	currentNodeId: varchar("current_node_id", { length: 50 }),
	nodeHistory: jsonb("node_history"),
	currentStep: integer("current_step").default(0),
	steps: jsonb(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_workflow_instances_applicant").using("btree", table.applicantId.asc().nullsLast().op("text_ops")),
	index("idx_workflow_instances_current_node").using("btree", table.currentNodeId.asc().nullsLast().op("text_ops")),
	index("idx_workflow_instances_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.configId],
			foreignColumns: [workflowConfigs.id],
			name: "workflow_instances_config_id_fkey"
		}),
]);

export const approvalRecords = pgTable("approval_records", {
	id: serial().primaryKey().notNull(),
	instanceId: integer("instance_id").notNull(),
	workflowType: varchar("workflow_type", { length: 50 }).notNull(),
	nodeId: varchar("node_id", { length: 50 }).notNull(),
	stepId: varchar("step_id", { length: 50 }),
	nodeName: varchar("node_name", { length: 100 }).notNull(),
	stepName: varchar("step_name", { length: 100 }),
	approverId: varchar("approver_id", { length: 100 }).notNull(),
	approverName: varchar("approver_name", { length: 100 }).notNull(),
	approverRole: varchar("approver_role", { length: 50 }).notNull(),
	action: varchar({ length: 50 }).notNull(),
	comment: text(),
	returnToNodeId: varchar("return_to_node_id", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_approval_records_instance").using("btree", table.instanceId.asc().nullsLast().op("int4_ops")),
	index("idx_approval_records_node").using("btree", table.nodeId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.instanceId],
			foreignColumns: [workflowInstances.id],
			name: "approval_records_instance_id_fkey"
		}),
]);

export const teacherRecords = pgTable("teacher_records", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	teacherId: varchar("teacher_id", { length: 50 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 200 }).notNull(),
	startDate: date("start_date"),
	endDate: date("end_date"),
	hours: integer(),
	location: varchar({ length: 200 }),
	description: text(),
	result: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_teacher_records_teacher").using("btree", table.teacherId.asc().nullsLast().op("text_ops")),
]);

export const courses = pgTable("courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }),
	subject: varchar({ length: 50 }).notNull(),
	grade: integer().notNull(),
	type: varchar({ length: 20 }).default('required'),
	hoursPerWeek: integer("hours_per_week").default(1),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	check("courses_grade_check", sql`(grade >= 1) AND (grade <= 6)`),
	check("courses_type_check", sql`(type)::text = ANY ((ARRAY['required'::character varying, 'elective'::character varying, 'activity'::character varying])::text[])`),
]);

export const teacherCourses = pgTable("teacher_courses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teacherId: uuid("teacher_id").notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	courseId: uuid("course_id"),
	courseName: varchar("course_name", { length: 100 }).notNull(),
	classId: uuid("class_id").notNull(),
	className: varchar("class_name", { length: 50 }).notNull(),
	subject: varchar({ length: 50 }).notNull(),
	weeklyHours: integer("weekly_hours").default(1),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_teacher_courses_class").using("btree", table.classId.asc().nullsLast().op("uuid_ops")),
	index("idx_teacher_courses_teacher").using("btree", table.teacherId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "teacher_courses_course_id_fkey"
		}),
]);

export const semesters = pgTable("semesters", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	code: varchar({ length: 50 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	totalWeeks: integer("total_weeks").default(20),
	currentWeek: integer("current_week").default(1),
	isActive: boolean("is_active").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("semesters_code_key").on(table.code),
]);

export const dailySchedules = pgTable("daily_schedules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	semesterId: uuid("semester_id"),
	name: varchar({ length: 100 }).notNull(),
	periods: jsonb().notNull(),
	effectiveFrom: date("effective_from"),
	effectiveTo: date("effective_to"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [semesters.id],
			name: "daily_schedules_semester_id_fkey"
		}),
]);

export const scheduleSlots = pgTable("schedule_slots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	classId: uuid("class_id").notNull(),
	className: varchar("class_name", { length: 50 }).notNull(),
	grade: integer().notNull(),
	weekDay: integer("week_day").notNull(),
	periodIndex: integer("period_index").notNull(),
	periodName: varchar("period_name", { length: 20 }),
	startTime: varchar("start_time", { length: 10 }),
	endTime: varchar("end_time", { length: 10 }),
	courseId: uuid("course_id"),
	courseName: varchar("course_name", { length: 100 }),
	subject: varchar({ length: 50 }),
	teacherId: uuid("teacher_id").notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	classroomId: uuid("classroom_id"),
	classroomName: varchar("classroom_name", { length: 50 }),
	status: varchar({ length: 20 }).default('normal'),
	originalTeacherId: uuid("original_teacher_id"),
	originalTeacherName: varchar("original_teacher_name", { length: 50 }),
	adjustRecordId: uuid("adjust_record_id"),
	effectiveDate: date("effective_date"),
	expireDate: date("expire_date"),
	semesterId: uuid("semester_id"),
	weekStart: integer("week_start").default(1),
	weekEnd: integer("week_end").default(20),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_schedule_slots_class").using("btree", table.classId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_slots_semester").using("btree", table.semesterId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_slots_teacher").using("btree", table.teacherId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "schedule_slots_course_id_fkey"
		}),
	foreignKey({
			columns: [table.semesterId],
			foreignColumns: [semesters.id],
			name: "schedule_slots_semester_id_fkey"
		}),
	unique("schedule_slots_semester_id_class_id_week_day_period_index_e_key").on(table.classId, table.weekDay, table.periodIndex, table.effectiveDate, table.semesterId),
	check("schedule_slots_week_day_check", sql`(week_day >= 1) AND (week_day <= 7)`),
	check("schedule_slots_period_index_check", sql`period_index >= 1`),
	check("schedule_slots_status_check", sql`(status)::text = ANY ((ARRAY['normal'::character varying, 'substituted'::character varying, 'swapped'::character varying, 'cancelled'::character varying, 'makeup'::character varying])::text[])`),
]);

export const courseAdjustments = pgTable("course_adjustments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workflowInstanceId: uuid("workflow_instance_id"),
	leaveRequestId: uuid("leave_request_id"),
	applicantId: uuid("applicant_id").notNull(),
	applicantName: varchar("applicant_name", { length: 50 }).notNull(),
	adjusterId: uuid("adjuster_id"),
	adjusterName: varchar("adjuster_name", { length: 50 }),
	adjustType: varchar("adjust_type", { length: 20 }).notNull(),
	originalSlot: jsonb("original_slot").notNull(),
	adjustResult: jsonb("adjust_result"),
	reason: text(),
	reasonType: varchar("reason_type", { length: 20 }).default('leave'),
	status: varchar({ length: 20 }).default('pending'),
	approvedBy: uuid("approved_by"),
	approvedByName: varchar("approved_by_name", { length: 50 }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	syncStatus: jsonb("sync_status").default({"classSchedule":false,"electronicBoard":false,"teacherSchedule":false,"academicSchedule":false,"teacherAttendance":false}),
	notifyStatus: jsonb("notify_status").default({"headTeacher":false,"classParents":false,"classStudents":false,"originalTeacher":false,"substituteTeacher":false}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_course_adjustments_applicant").using("btree", table.applicantId.asc().nullsLast().op("uuid_ops")),
	index("idx_course_adjustments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	check("course_adjustments_adjust_type_check", sql`(adjust_type)::text = ANY ((ARRAY['substitute'::character varying, 'swap'::character varying, 'cancel'::character varying, 'makeup'::character varying])::text[])`),
	check("course_adjustments_reason_type_check", sql`(reason_type)::text = ANY ((ARRAY['leave'::character varying, 'meeting'::character varying, 'training'::character varying, 'personal'::character varying, 'other'::character varying])::text[])`),
	check("course_adjustments_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying])::text[])`),
]);

export const teacherAttendance = pgTable("teacher_attendance", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teacherId: uuid("teacher_id").notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	date: date().notNull(),
	status: varchar({ length: 20 }).default('present'),
	leaveRequestId: uuid("leave_request_id"),
	leaveType: varchar("leave_type", { length: 20 }),
	leaveDuration: numeric("leave_duration", { precision: 4, scale:  1 }),
	scheduledCourses: integer("scheduled_courses").default(0),
	actualCourses: integer("actual_courses").default(0),
	substitutedCourses: integer("substituted_courses").default(0),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_teacher_attendance_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_teacher_attendance_teacher").using("btree", table.teacherId.asc().nullsLast().op("uuid_ops")),
	unique("teacher_attendance_teacher_id_date_key").on(table.teacherId, table.date),
	check("teacher_attendance_status_check", sql`(status)::text = ANY ((ARRAY['present'::character varying, 'absent'::character varying, 'leave'::character varying, 'business_trip'::character varying, 'late'::character varying, 'early_leave'::character varying])::text[])`),
]);

export const electronicBoardSchedules = pgTable("electronic_board_schedules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	classId: uuid("class_id").notNull(),
	className: varchar("class_name", { length: 50 }).notNull(),
	date: date().notNull(),
	slots: jsonb().notNull(),
	notices: jsonb(),
	syncedAt: timestamp("synced_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("electronic_board_schedules_class_id_date_key").on(table.classId, table.date),
]);

export const rooms = pgTable("rooms", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	building: varchar({ length: 100 }),
	floor: integer(),
	capacity: integer().default(50),
	type: varchar({ length: 50 }).notNull(),
	facilities: jsonb(),
	status: varchar({ length: 20 }).default('available'),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_rooms_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_rooms_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

export const classes = pgTable("classes", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	grade: integer().notNull(),
	gradeName: varchar("grade_name", { length: 20 }).notNull(),
	classNumber: integer("class_number").notNull(),
	headTeacherId: varchar("head_teacher_id", { length: 50 }).notNull(),
	headTeacherName: varchar("head_teacher_name", { length: 50 }).notNull(),
	classroomId: varchar("classroom_id", { length: 50 }),
	classroomName: varchar("classroom_name", { length: 50 }),
	building: varchar({ length: 50 }),
	studentCount: integer("student_count").default(0),
	status: varchar({ length: 20 }).default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_classes_grade").using("btree", table.grade.asc().nullsLast().op("int4_ops")),
	index("idx_classes_head_teacher").using("btree", table.headTeacherId.asc().nullsLast().op("text_ops")),
]);

export const schools = pgTable("schools", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	shortName: varchar("short_name", { length: 50 }),
	fullName: varchar("full_name", { length: 300 }),
	motto: varchar({ length: 200 }),
	address: varchar({ length: 300 }),
	establishedYear: integer("established_year"),
	campusArea: varchar("campus_area", { length: 50 }),
	totalGrades: integer("total_grades").default(6),
	currentSemester: varchar("current_semester", { length: 20 }),
	academicYear: varchar("academic_year", { length: 20 }),
	facilities: jsonb(),
	awards: jsonb(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const students = pgTable("students", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	studentNo: varchar("student_no", { length: 50 }).notNull(),
	name: varchar({ length: 50 }).notNull(),
	gender: varchar({ length: 10 }),
	birthDate: varchar("birth_date", { length: 20 }),
	classId: varchar("class_id", { length: 50 }).notNull(),
	className: varchar("class_name", { length: 50 }),
	grade: integer(),
	parentName: varchar("parent_name", { length: 50 }),
	parentPhone: varchar("parent_phone", { length: 20 }),
	address: varchar({ length: 200 }),
	status: varchar({ length: 20 }).default('在校'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_students_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_students_grade").using("btree", table.grade.asc().nullsLast().op("int4_ops")),
	index("idx_students_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("students_student_no_key").on(table.studentNo),
]);

export const teachers = pgTable("teachers", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 50 }).notNull(),
	gender: varchar({ length: 10 }),
	subjects: jsonb().notNull(),
	isHeadTeacher: boolean("is_head_teacher").default(false),
	headTeacherClassIds: jsonb("head_teacher_class_ids").default([]),
	department: varchar({ length: 50 }),
	title: varchar({ length: 50 }),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 100 }),
	status: varchar({ length: 20 }).default('active'),
	password: varchar({ length: 100 }),                // 登录密码
	employeeId: varchar("employee_id", { length: 20 }), // 工号
	// 角色和课时配置
	role: varchar({ length: 30 }),                    // 教师角色：head_teacher, subject_teacher, skill_teacher
	primarySubject: varchar("primary_subject", { length: 20 }),  // 主教学科
	secondarySubjects: jsonb("secondary_subjects"),   // 兼任科目
	totalWeeklyHours: integer("total_weekly_hours"),  // 总周课时
	mainClassCount: integer("main_class_count"),      // 主科带班数
	mainSubjectHours: integer("main_subject_hours"),  // 主科课时
	teachableGrades: jsonb("teachable_grades"),       // 可任教年级
	teachableSubjects: jsonb("teachable_subjects"),   // 可任教科目
	additionalRoles: jsonb("additional_roles"),       // 兼任职务
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_teachers_department").using("btree", table.department.asc().nullsLast().op("text_ops")),
	index("idx_teachers_is_head_teacher").using("btree", table.isHeadTeacher.asc().nullsLast().op("bool_ops")),
	index("idx_teachers_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
]);

export const assets = pgTable("assets", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	assetNo: varchar("asset_no", { length: 50 }).notNull(),
	name: varchar({ length: 200 }).notNull(),
	category: varchar({ length: 50 }).notNull(),
	specification: varchar({ length: 200 }),
	quantity: integer().default(1),
	unit: varchar({ length: 20 }),
	value: numeric({ precision: 12, scale:  2 }),
	purchaseDate: date("purchase_date"),
	warrantyExpiry: date("warranty_expiry"),
	location: varchar({ length: 200 }),
	department: varchar({ length: 100 }),
	status: varchar({ length: 20 }).default('在用'),
	responsiblePerson: varchar("responsible_person", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_assets_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
	index("idx_assets_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("assets_asset_no_key").on(table.assetNo),
]);

export const exams = pgTable("exams", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	grade: integer(),
	subject: varchar({ length: 50 }),
	startDate: date("start_date"),
	endDate: date("end_date"),
	status: varchar({ length: 20 }).default('draft'),
	totalStudents: integer("total_students").default(0),
	submittedCount: integer("submitted_count").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_exams_grade").using("btree", table.grade.asc().nullsLast().op("int4_ops")),
	index("idx_exams_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
]);

export const grades = pgTable("grades", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	examId: varchar("exam_id", { length: 50 }).notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	studentName: varchar("student_name", { length: 50 }).notNull(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	className: varchar("class_name", { length: 50 }),
	grade: integer(),
	subject: varchar({ length: 50 }).notNull(),
	score: numeric({ precision: 5, scale:  2 }),
	level: varchar({ length: 20 }),
	rank: integer(),
	classRank: integer("class_rank"),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_grades_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_grades_exam").using("btree", table.examId.asc().nullsLast().op("text_ops")),
	index("idx_grades_student").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
]);

export const afterSchoolServices = pgTable("after_school_services", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	name: varchar({ length: 200 }).notNull(),
	type: varchar({ length: 50 }).notNull(),
	teacherId: varchar("teacher_id", { length: 50 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	classroom: varchar({ length: 100 }),
	dayOfWeek: integer("day_of_week"),
	startTime: varchar("start_time", { length: 10 }),
	endTime: varchar("end_time", { length: 10 }),
	maxStudents: integer("max_students").default(30),
	currentStudents: integer("current_students").default(0),
	fee: numeric({ precision: 10, scale:  2 }),
	status: varchar({ length: 20 }).default('active'),
	description: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_after_school_teacher").using("btree", table.teacherId.asc().nullsLast().op("text_ops")),
]);

export const homeworks = pgTable("homeworks", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	subject: varchar({ length: 50 }).notNull(),
	teacherId: varchar("teacher_id", { length: 50 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	className: varchar("class_name", { length: 50 }),
	content: text().notNull(),
	dueDate: date("due_date"),
	status: varchar({ length: 20 }).default('published'),
	submittedCount: integer("submitted_count").default(0),
	totalStudents: integer("total_students").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_homeworks_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_homeworks_teacher").using("btree", table.teacherId.asc().nullsLast().op("text_ops")),
]);
