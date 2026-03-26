import { pgTable, serial, varchar, integer, boolean, timestamp, text, jsonb, index, date, foreignKey, uuid, check, unique, numeric, time } from "drizzle-orm/pg-core"
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

export const teacherCourses = pgTable("teacher_courses", {
	id: varchar({ length: 50 }).default(sql`gen_random_uuid()`).primaryKey().notNull(),
	teacherId: varchar("teacher_id", { length: 50 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }),
	courseId: uuid("course_id"),
	courseName: varchar("course_name", { length: 100 }).notNull(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	className: varchar("class_name", { length: 50 }),
	subject: varchar({ length: 50 }).notNull(),
	weeklyHours: integer("weekly_hours").default(1),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_teacher_courses_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_teacher_courses_teacher").using("btree", table.teacherId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [courses.id],
			name: "teacher_courses_course_id_fkey"
		}),
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
	semester: varchar({ length: 50 }),
	description: text(),
	subjects: jsonb().default([]),
	grades: jsonb().default([]),
	examRooms: jsonb("exam_rooms").default([]),
	createdBy: varchar("created_by", { length: 50 }),
	createdByName: varchar("created_by_name", { length: 100 }),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_exams_grade").using("btree", table.grade.asc().nullsLast().op("int4_ops")),
	index("idx_exams_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
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

export const studentAcademicRecords = pgTable("student_academic_records", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	studentName: varchar("student_name", { length: 50 }),
	classId: varchar("class_id", { length: 50 }),
	semester: varchar({ length: 20 }),
	examType: varchar("exam_type", { length: 20 }),
	subject: varchar({ length: 20 }),
	score: integer(),
	level: varchar({ length: 10 }),
	classRank: integer("class_rank"),
	gradeRank: integer("grade_rank"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const studentHonors = pgTable("student_honors", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	title: varchar({ length: 100 }),
	level: varchar({ length: 20 }),
	category: varchar({ length: 20 }),
	issuer: varchar({ length: 50 }),
	date: varchar({ length: 20 }),
});

export const studentGrowthRecords = pgTable("student_growth_records", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	type: varchar({ length: 20 }),
	title: varchar({ length: 100 }),
	description: text(),
	date: varchar({ length: 20 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const studentHabitAssessments = pgTable("student_habit_assessments", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	studentName: varchar("student_name", { length: 50 }),
	classId: varchar("class_id", { length: 50 }),
	className: varchar("class_name", { length: 50 }),
	category: varchar({ length: 20 }),
	type: varchar({ length: 20 }),
	title: varchar({ length: 100 }),
	content: text(),
	score: integer(),
	scene: varchar({ length: 20 }),
	occurredAt: varchar("occurred_at", { length: 20 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

export const studentMoralRecords = pgTable("student_moral_records", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	type: varchar({ length: 20 }),
	title: varchar({ length: 100 }),
	content: text(),
	score: integer(),
	date: varchar({ length: 20 }),
	recorder: varchar({ length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

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
	subTeacherId: varchar("sub_teacher_id", { length: 50 }),
	subTeacherName: varchar("sub_teacher_name", { length: 50 }),
	subjectTeachers: jsonb("subject_teachers").default({}),
}, (table) => [
	index("idx_classes_grade").using("btree", table.grade.asc().nullsLast().op("int4_ops")),
	index("idx_classes_head_teacher").using("btree", table.headTeacherId.asc().nullsLast().op("text_ops")),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	employeeId: varchar("employee_id", { length: 50 }),
	name: varchar({ length: 100 }).notNull(),
	role: varchar({ length: 50 }).notNull(),
	additionalRoles: text("additional_roles").array(),
	phone: varchar({ length: 20 }),
	email: varchar({ length: 100 }),
	department: varchar({ length: 100 }),
	position: varchar({ length: 100 }),
	classId: varchar("class_id", { length: 50 }),
	className: varchar("class_name", { length: 100 }),
	subjects: text().array(),
	avatar: varchar({ length: 255 }),
	children: jsonb(),
	passwordHash: varchar("password_hash", { length: 255 }),
	status: varchar({ length: 20 }).default('active'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	managedGrades: integer("managed_grades").array(),
}, (table) => [
	index("idx_users_class_id").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_users_employee_id").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	index("idx_users_role").using("btree", table.role.asc().nullsLast().op("text_ops")),
	index("idx_users_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	unique("users_employee_id_key").on(table.employeeId),
]);

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
	ethnicity: varchar({ length: 20 }),
	nativePlace: varchar("native_place", { length: 50 }),
	politicalStatus: varchar("political_status", { length: 20 }),
	enrollmentDate: varchar("enrollment_date", { length: 20 }),
	studentType: varchar("student_type", { length: 20 }),
	familyType: varchar("family_type", { length: 20 }),
	parents: jsonb(),
	emergencyContact: varchar("emergency_contact", { length: 50 }),
	emergencyPhone: varchar("emergency_phone", { length: 20 }),
	homeAddress: varchar("home_address", { length: 100 }),
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
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	baseWeeklyHours: integer("base_weekly_hours").default(16),
	role: varchar({ length: 50 }).default('subject_head'),
	primarySubject: varchar("primary_subject", { length: 50 }),
	secondarySubjects: jsonb("secondary_subjects").default([]),
	mainClassCount: integer("main_class_count").default(2),
	mainSubjectHours: integer("main_subject_hours").default(11),
	totalWeeklyHours: integer("total_weekly_hours").default(16),
	teachableGrades: jsonb("teachable_grades").default([1,2,3,4,5,6]),
	subjectHeadClassId: varchar("subject_head_class_id", { length: 50 }),
	additionalRoles: jsonb("additional_roles").default([]),
	teachingClasses: jsonb("teaching_classes").default([]),
	employeeId: varchar("employee_id", { length: 50 }),
	birthDate: date("birth_date"),
	idCard: varchar("id_card", { length: 20 }),
	ethnicity: varchar({ length: 20 }).default('汉族'),
	politicalStatus: varchar("political_status", { length: 20 }),
	nativePlace: varchar("native_place", { length: 50 }),
	emergencyContact: varchar("emergency_contact", { length: 20 }),
	emergencyPhone: varchar("emergency_phone", { length: 20 }),
	address: varchar({ length: 200 }),
	education: varchar({ length: 20 }).default('本科'),
	school: varchar({ length: 100 }),
	major: varchar({ length: 50 }),
	graduationDate: varchar("graduation_date", { length: 10 }),
	joinDate: date("join_date"),
	titleDate: date("title_date"),
	teachYears: integer("teach_years").default(10),
	password: varchar({ length: 100 }),
	teachableSubjects: jsonb("teachable_subjects").default([]),
	managedGrades: integer("managed_grades").array(),
	currentTeachingGrades: integer("current_teaching_grades").array().default([]),
}, (table) => [
	index("idx_teachers_department").using("btree", table.department.asc().nullsLast().op("text_ops")),
	index("idx_teachers_is_head_teacher").using("btree", table.isHeadTeacher.asc().nullsLast().op("bool_ops")),
]);

export const scheduleDrafts = pgTable("schedule_drafts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	grade: integer(),
	scheduleData: jsonb("schedule_data").default([]),
}, (table) => [
	unique("schedule_drafts_grade_key").on(table.grade),
]);

export const schoolHonors = pgTable("school_honors", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	year: varchar({ length: 50 }),
	description: text(),
	icon: varchar({ length: 50 }),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_school_honors_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const parents = pgTable("parents", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	studentName: varchar("student_name", { length: 50 }).notNull(),
	classId: varchar("class_id", { length: 50 }),
	className: varchar("class_name", { length: 50 }),
	name: varchar({ length: 50 }).notNull(),
	relation: varchar({ length: 20 }).notNull(),
	relationName: varchar("relation_name", { length: 20 }),
	phone: varchar({ length: 20 }),
	wechat: varchar({ length: 50 }),
	idCard: varchar("id_card", { length: 20 }),
	occupation: varchar({ length: 100 }),
	workUnit: varchar("work_unit", { length: 200 }),
	isPrimary: boolean("is_primary").default(false),
	hasAccount: boolean("has_account").default(false),
	accountId: varchar("account_id", { length: 50 }),
	password: varchar({ length: 100 }),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	status: varchar({ length: 20 }).default('active'),
	notifySettings: jsonb("notify_settings").default({"app":true,"sms":true,"wechat":true}),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	gender: varchar({ length: 10 }),
	birthDate: varchar("birth_date", { length: 20 }),
	education: varchar({ length: 50 }),
	politicalStatus: varchar("political_status", { length: 50 }),
	householdAddress: text("household_address"),
	currentAddress: text("current_address"),
	emergencyContact: varchar("emergency_contact", { length: 50 }),
	emergencyPhone: varchar("emergency_phone", { length: 20 }),
	email: varchar({ length: 100 }),
}, (table) => [
	index("idx_parents_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_parents_has_account").using("btree", table.hasAccount.asc().nullsLast().op("bool_ops")),
	index("idx_parents_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	index("idx_parents_student").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
]);

export const groupMembers = pgTable("group_members", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	groupId: varchar("group_id", { length: 50 }).notNull(),
	groupType: varchar("group_type", { length: 50 }).notNull(),
	userId: varchar("user_id", { length: 50 }).notNull(),
	isAdmin: boolean("is_admin").default(false),
	joinType: varchar("join_type", { length: 20 }).default('manual'),
	joinedAt: timestamp("joined_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_group_members_group_type").using("btree", table.groupType.asc().nullsLast().op("text_ops")),
	index("idx_group_members_is_admin").using("btree", table.isAdmin.asc().nullsLast().op("bool_ops")),
	index("idx_group_members_user_id").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	unique("group_members_group_type_user_id_key").on(table.groupType, table.userId),
	check("group_members_join_type_check", sql`(join_type)::text = ANY ((ARRAY['auto'::character varying, 'manual'::character varying])::text[])`),
]);

export const approvalFlows = pgTable("approval_flows", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	description: text(),
	type: varchar({ length: 50 }).notNull(),
	department: varchar({ length: 100 }),
	isActive: boolean("is_active").default(true),
	createdBy: uuid("created_by"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_approval_flows_department").using("btree", table.department.asc().nullsLast().op("text_ops")),
	index("idx_approval_flows_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "approval_flows_created_by_fkey"
		}).onDelete("set null"),
]);

export const approvalFlowNodes = pgTable("approval_flow_nodes", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	flowId: uuid("flow_id"),
	nodeType: varchar("node_type", { length: 30 }).notNull(),
	nodeName: varchar("node_name", { length: 100 }).notNull(),
	nodeOrder: integer("node_order").notNull(),
	approverType: varchar("approver_type", { length: 30 }).notNull(),
	approverRoles: jsonb("approver_roles").default([]),
	approverUserIds: jsonb("approver_user_ids").default([]),
	isRequired: boolean("is_required").default(true),
	timeoutHours: integer("timeout_hours"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.flowId],
			foreignColumns: [approvalFlows.id],
			name: "approval_flow_nodes_flow_id_fkey"
		}).onDelete("cascade"),
]);

export const approvalInstances = pgTable("approval_instances", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	flowId: uuid("flow_id"),
	flowName: varchar("flow_name", { length: 100 }),
	businessType: varchar("business_type", { length: 50 }).notNull(),
	businessId: varchar("business_id", { length: 100 }).notNull(),
	title: varchar({ length: 255 }).notNull(),
	applicantName: varchar("applicant_name", { length: 100 }),
	applicantDepartment: varchar("applicant_department", { length: 100 }),
	currentNodeOrder: integer("current_node_order").default(1),
	status: varchar({ length: 20 }).default('pending'),
	submitAt: timestamp("submit_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	finishAt: timestamp("finish_at", { withTimezone: true, mode: 'string' }),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	applicantId: varchar("applicant_id", { length: 100 }),
}, (table) => [
	index("idx_approval_instances_business").using("btree", table.businessType.asc().nullsLast().op("text_ops"), table.businessId.asc().nullsLast().op("text_ops")),
	index("idx_approval_instances_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.flowId],
			foreignColumns: [approvalFlows.id],
			name: "approval_instances_flow_id_fkey"
		}).onDelete("set null"),
]);

export const approvalNodeRecords = pgTable("approval_node_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	instanceId: uuid("instance_id"),
	nodeOrder: integer("node_order").notNull(),
	nodeName: varchar("node_name", { length: 100 }),
	nodeType: varchar("node_type", { length: 30 }),
	status: varchar({ length: 20 }).default('pending'),
	approverIds: jsonb("approver_ids").default([]),
	approvedBy: jsonb("approved_by").default([]),
	finalApproverId: uuid("final_approver_id"),
	finalApproverName: varchar("final_approver_name", { length: 100 }),
	action: varchar({ length: 20 }),
	comment: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	finishedAt: timestamp("finished_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_approval_node_records_instance").using("btree", table.instanceId.asc().nullsLast().op("uuid_ops")),
	index("idx_approval_node_records_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.instanceId],
			foreignColumns: [approvalInstances.id],
			name: "approval_node_records_instance_id_fkey"
		}).onDelete("cascade"),
]);

export const announcements = pgTable("announcements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text().notNull(),
	type: varchar({ length: 20 }).default('announcement').notNull(),
	category: varchar({ length: 50 }),
	authorId: uuid("author_id"),
	authorName: varchar("author_name", { length: 100 }),
	department: varchar({ length: 100 }),
	coverImage: varchar("cover_image", { length: 500 }),
	attachments: jsonb().default([]),
	isPublished: boolean("is_published").default(false),
	isExternal: boolean("is_external").default(false),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	externalId: varchar("external_id", { length: 100 }),
	status: varchar({ length: 20 }).default('draft'),
	viewCount: integer("view_count").default(0),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	summary: text(),
	mediaLevel: varchar("media_level", { length: 20 }),
	images: jsonb().default([]),
	publishStatus: varchar("publish_status", { length: 20 }).default('pending'),
	scheduledPublishAt: timestamp("scheduled_publish_at", { withTimezone: true, mode: 'string' }),
	unpublishedAt: timestamp("unpublished_at", { withTimezone: true, mode: 'string' }),
	autoUnpublish: boolean("auto_unpublish").default(false),
	autoUnpublishAt: timestamp("auto_unpublish_at", { withTimezone: true, mode: 'string' }),
	isPinned: boolean("is_pinned").default(false),
	pinOrder: integer("pin_order"),
	recipients: jsonb(),
}, (table) => [
	index("idx_announcements_author").using("btree", table.authorId.asc().nullsLast().op("uuid_ops")),
	index("idx_announcements_department").using("btree", table.department.asc().nullsLast().op("text_ops")),
	index("idx_announcements_published_at").using("btree", table.publishedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_announcements_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_announcements_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.authorId],
			foreignColumns: [users.id],
			name: "announcements_author_id_fkey"
		}).onDelete("set null"),
]);

export const messages = pgTable("messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 255 }).notNull(),
	content: text(),
	type: varchar({ length: 50 }).default('notification').notNull(),
	priority: varchar({ length: 20 }).default('normal'),
	senderId: uuid("sender_id"),
	senderName: varchar("sender_name", { length: 100 }),
	senderAvatar: varchar("sender_avatar", { length: 500 }),
	recipientId: uuid("recipient_id"),
	isRead: boolean("is_read").default(false),
	isArchived: boolean("is_archived").default(false),
	metadata: jsonb().default({}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	archivedAt: timestamp("archived_at", { withTimezone: true, mode: 'string' }),
	recipientType: varchar("recipient_type", { length: 20 }).default('individual'),
	roles: text().array(),
	classIds: uuid("class_ids").array(),
	grades: integer().array(),
	userIds: uuid("user_ids").array(),
	senderRole: varchar("sender_role", { length: 50 }),
	sentAt: timestamp("sent_at", { withTimezone: true, mode: 'string' }),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_messages_created_at").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_messages_is_read").using("btree", table.isRead.asc().nullsLast().op("bool_ops")),
	index("idx_messages_recipient_id").using("btree", table.recipientId.asc().nullsLast().op("uuid_ops")),
	index("idx_messages_sender_id").using("btree", table.senderId.asc().nullsLast().op("uuid_ops")),
	index("idx_messages_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.senderId],
			foreignColumns: [users.id],
			name: "messages_sender_id_fkey"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.recipientId],
			foreignColumns: [users.id],
			name: "messages_recipient_id_fkey"
		}).onDelete("cascade"),
]);

export const messageReads = pgTable("message_reads", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	messageId: uuid("message_id").notNull(),
	userId: uuid("user_id").notNull(),
	readAt: timestamp("read_at", { withTimezone: true, mode: 'string' }),
	isPinned: boolean("is_pinned").default(false),
	status: varchar({ length: 20 }).default('unread'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_message_reads_message_id").using("btree", table.messageId.asc().nullsLast().op("uuid_ops")),
	index("idx_message_reads_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.messageId],
			foreignColumns: [messages.id],
			name: "message_reads_message_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "message_reads_user_id_fkey"
		}).onDelete("cascade"),
	unique("message_reads_message_id_user_id_key").on(table.messageId, table.userId),
]);

export const scheduleSlots = pgTable("schedule_slots", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	className: varchar("class_name", { length: 50 }).notNull(),
	grade: integer().notNull(),
	weekDay: integer("week_day").notNull(),
	periodIndex: integer("period_index").notNull(),
	periodName: varchar("period_name", { length: 20 }),
	subject: varchar({ length: 50 }),
	teacherId: varchar("teacher_id", { length: 50 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	draftId: uuid("draft_id"),
	status: varchar({ length: 20 }).default('active'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	employeeId: varchar("employee_id", { length: 20 }),
}, (table) => [
	index("idx_schedule_slots_class_id").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_schedule_slots_draft_id").using("btree", table.draftId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedule_slots_teacher_id").using("btree", table.teacherId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.draftId],
			foreignColumns: [scheduleDrafts.id],
			name: "schedule_slots_draft_id_fkey"
		}),
]);

export const teacherWorkload = pgTable("teacher_workload", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	employeeId: varchar("employee_id", { length: 20 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	primarySubject: varchar("primary_subject", { length: 20 }),
	academicYear: varchar("academic_year", { length: 10 }),
	semester: varchar({ length: 10 }),
	weekNumber: integer("week_number"),
	weekStartDate: date("week_start_date"),
	weekEndDate: date("week_end_date"),
	totalLessons: integer("total_lessons").default(0),
	actualLessons: integer("actual_lessons").default(0),
	substituteLessons: integer("substitute_lessons").default(0),
	adjustedLessons: integer("adjusted_lessons").default(0),
	leaveDays: numeric("leave_days", { precision: 4, scale:  1 }).default('0'),
	dailyBreakdown: jsonb("daily_breakdown"),
	subjectBreakdown: jsonb("subject_breakdown"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_teacher_workload_employee").using("btree", table.employeeId.asc().nullsLast().op("text_ops")),
	index("idx_teacher_workload_period").using("btree", table.academicYear.asc().nullsLast().op("text_ops"), table.semester.asc().nullsLast().op("text_ops"), table.weekNumber.asc().nullsLast().op("int4_ops")),
	unique("teacher_workload_employee_id_academic_year_semester_week_nu_key").on(table.employeeId, table.academicYear, table.semester, table.weekNumber),
]);

export const courseAdjustments = pgTable("course_adjustments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	workflowInstanceId: uuid("workflow_instance_id"),
	leaveRequestId: uuid("leave_request_id"),
	applicantId: varchar("applicant_id", { length: 20 }).notNull(),
	applicantName: varchar("applicant_name", { length: 50 }).notNull(),
	adjusterId: varchar("adjuster_id", { length: 20 }),
	adjusterName: varchar("adjuster_name", { length: 50 }),
	adjustType: varchar("adjust_type", { length: 20 }).notNull(),
	originalSlot: jsonb("original_slot").notNull(),
	adjustResult: jsonb("adjust_result"),
	reason: text(),
	reasonType: varchar("reason_type", { length: 20 }).default('leave'),
	status: varchar({ length: 20 }).default('pending'),
	approvedBy: varchar("approved_by", { length: 20 }),
	approvedByName: varchar("approved_by_name", { length: 50 }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	syncStatus: jsonb("sync_status").default({"classSchedule":false,"electronicBoard":false,"teacherSchedule":false,"academicSchedule":false,"teacherAttendance":false}),
	notifyStatus: jsonb("notify_status").default({"headTeacher":false,"classParents":false,"classStudents":false,"originalTeacher":false,"substituteTeacher":false}),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
	effectiveWeek: date("effective_week"),
	effectiveWeekNumber: integer("effective_week_number"),
	effectiveYear: varchar("effective_year", { length: 10 }),
	classId: varchar("class_id", { length: 50 }),
	className: varchar("class_name", { length: 50 }),
	grade: integer(),
	weekDay: integer("week_day"),
	periodIndex: integer("period_index"),
	subject: varchar({ length: 20 }),
	substituteEmployeeId: varchar("substitute_employee_id", { length: 20 }),
	substituteName: varchar("substitute_name", { length: 50 }),
}, (table) => [
	index("idx_course_adjustments_applicant").using("btree", table.applicantId.asc().nullsLast().op("text_ops")),
	index("idx_course_adjustments_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_course_adjustments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_course_adjustments_week").using("btree", table.effectiveWeek.asc().nullsLast().op("date_ops")),
	check("course_adjustments_adjust_type_check", sql`(adjust_type)::text = ANY ((ARRAY['substitute'::character varying, 'swap'::character varying, 'cancel'::character varying, 'makeup'::character varying])::text[])`),
	check("course_adjustments_reason_type_check", sql`(reason_type)::text = ANY ((ARRAY['leave'::character varying, 'meeting'::character varying, 'training'::character varying, 'personal'::character varying, 'other'::character varying])::text[])`),
	check("course_adjustments_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying])::text[])`),
]);

export const leaveRequests = pgTable("leave_requests", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	applicantId: varchar("applicant_id", { length: 20 }).notNull(),
	applicantName: varchar("applicant_name", { length: 50 }).notNull(),
	applicantType: varchar("applicant_type", { length: 20 }).default('teacher'),
	applicantGrade: integer("applicant_grade"),
	type: varchar({ length: 20 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	startTime: time("start_time"),
	endTime: time("end_time"),
	duration: numeric({ precision: 4, scale:  1 }),
	durationUnit: varchar("duration_unit", { length: 10 }).default('day'),
	reason: text().notNull(),
	attachments: jsonb(),
	needAdjustment: boolean("need_adjustment").default(false),
	affectedSlots: jsonb("affected_slots"),
	workflowInstanceId: integer("workflow_instance_id"),
	status: varchar({ length: 20 }).default('draft'),
	currentStep: integer("current_step").default(0),
	approverSelection: jsonb("approver_selection"),
	approvedBy: varchar("approved_by", { length: 20 }),
	approvedAt: timestamp("approved_at", { mode: 'string' }),
	rejectReason: text("reject_reason"),
	adjustmentStatus: varchar("adjustment_status", { length: 20 }),
	adjustedBy: varchar("adjusted_by", { length: 20 }),
	adjustedAt: timestamp("adjusted_at", { mode: 'string' }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	submittedAt: timestamp("submitted_at", { mode: 'string' }),
	approvedByList: jsonb("approved_by_list").default([]),
	rejectedAt: timestamp("rejected_at", { mode: 'string' }),
	returnedAt: timestamp("returned_at", { mode: 'string' }),
	returnReason: text("return_reason"),
	cancelledAt: timestamp("cancelled_at", { mode: 'string' }),
}, (table) => [
	index("idx_leave_requests_applicant").using("btree", table.applicantId.asc().nullsLast().op("text_ops")),
	index("idx_leave_requests_dates").using("btree", table.startDate.asc().nullsLast().op("date_ops"), table.endDate.asc().nullsLast().op("date_ops")),
	index("idx_leave_requests_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_leave_requests_workflow").using("btree", table.workflowInstanceId.asc().nullsLast().op("int4_ops")),
]);

export const carouselItems = pgTable("carousel_items", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	type: varchar({ length: 20 }).default('image').notNull(),
	image: varchar({ length: 500 }).notNull(),
	videoUrl: varchar("video_url", { length: 500 }),
	bilibiliUrl: varchar("bilibili_url", { length: 500 }),
	bilibiliBvid: varchar("bilibili_bvid", { length: 50 }),
	title: varchar({ length: 200 }).notNull(),
	subtitle: varchar({ length: 200 }),
	tag: varchar({ length: 50 }),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_carousel_items_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	check("carousel_items_type_check", sql`(type)::text = ANY ((ARRAY['image'::character varying, 'video'::character varying, 'bilibili'::character varying])::text[])`),
]);

export const childHeartPaths = pgTable("child_heart_paths", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	icon: varchar({ length: 50 }).notNull(),
	title: varchar({ length: 100 }).notNull(),
	subtitle: varchar({ length: 50 }).notNull(),
	image: varchar({ length: 500 }).notNull(),
	description: text(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	imageKey: text("image_key"),
}, (table) => [
	index("idx_child_heart_paths_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
]);

export const philosophyActivities = pgTable("philosophy_activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	categoryId: uuid("category_id").notNull(),
	title: varchar({ length: 200 }).notNull(),
	image: text().notNull(),
	imageKey: text("image_key"),
	date: varchar({ length: 50 }),
	summary: text(),
	content: text(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_philosophy_activities_category").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_philosophy_activities_category_id").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_philosophy_activities_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [childHeartPaths.id],
			name: "philosophy_activities_category_id_fkey"
		}).onDelete("cascade"),
]);

export const achievements = pgTable("achievements", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	image: text().notNull(),
	imageKey: text("image_key"),
	date: varchar({ length: 50 }),
	summary: text(),
	highlights: text().array(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	categoryId: uuid("category_id"),
}, (table) => [
	index("idx_achievements_category_id").using("btree", table.categoryId.asc().nullsLast().op("uuid_ops")),
	index("idx_achievements_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.categoryId],
			foreignColumns: [achievementCategories.id],
			name: "achievements_category_id_fkey"
		}),
]);

export const achievementCategories = pgTable("achievement_categories", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: varchar({ length: 100 }).notNull(),
	slug: varchar({ length: 50 }).notNull(),
	icon: varchar({ length: 50 }).notNull(),
	tag: varchar({ length: 50 }),
	description: text(),
	sortOrder: integer("sort_order").default(0),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	featuredAwardTitle: text("featured_award_title"),
	featuredAwardContent: text("featured_award_content"),
	stats: jsonb().default([]),
	honorsList: jsonb("honors_list").default([]),
}, (table) => [
	index("idx_achievement_categories_slug").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("idx_achievement_categories_sort").using("btree", table.sortOrder.asc().nullsLast().op("int4_ops")),
	unique("achievement_categories_slug_key").on(table.slug),
]);

export const habitStars = pgTable("habit_stars", {
	id: varchar({ length: 50 }).default(sql`((\'hs\'::text || to_char(now(), \'YYYYMMDDHH24MISS\'::text)) || (floor((random() * (1000)::double precision)))::text)`).primaryKey().notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	month: varchar({ length: 10 }).notNull(),
	categories: varchar({ length: 20 }).array().default([""]),
	totalScore: integer("total_score").default(0),
	achievements: text(),
	grade: integer(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_habit_stars_grade").using("btree", table.grade.asc().nullsLast().op("int4_ops")),
	index("idx_habit_stars_month").using("btree", table.month.asc().nullsLast().op("text_ops")),
	index("idx_habit_stars_student").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.studentId],
			foreignColumns: [students.id],
			name: "fk_habit_stars_student"
		}).onDelete("cascade"),
]);

export const studentGoals = pgTable("student_goals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentId: uuid("student_id").notNull(),
	goalId: uuid("goal_id"),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	category: varchar({ length: 50 }).notNull(),
	targetCount: integer("target_count").default(30).notNull(),
	completedCount: integer("completed_count").default(0),
	startDate: date("start_date").notNull(),
	endDate: date("end_date"),
	status: varchar({ length: 20 }).default('active'),
	month: varchar({ length: 7 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_student_goals_month").using("btree", table.month.asc().nullsLast().op("text_ops")),
	index("idx_student_goals_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_student_goals_student").using("btree", table.studentId.asc().nullsLast().op("uuid_ops")),
	unique("student_goals_student_id_goal_id_month_key").on(table.studentId, table.goalId, table.month),
]);

export const habitSystemRules = pgTable("habit_system_rules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	academicYear: varchar("academic_year", { length: 20 }).notNull(),
	semester: varchar({ length: 10 }).notNull(),
	startDate: date("start_date").notNull(),
	endDate: date("end_date").notNull(),
	monthlyDeadline: integer("monthly_deadline").default(25),
	checkFrequency: varchar("check_frequency", { length: 20 }).default('daily'),
	makeUpDays: integer("make_up_days").default(3),
	passThreshold: integer("pass_threshold").default(80),
	starQuotaPerClass: integer("star_quota_per_class").default(5),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	unique("habit_system_rules_academic_year_semester_key").on(table.academicYear, table.semester),
]);

export const moralActivities = pgTable("moral_activities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	content: text().notNull(),
	targetGrades: integer("target_grades").array().default([]),
	targetRoles: varchar("target_roles", { length: 50 }).array().default(["head_teacher", "grade_leader"]),
	requireSubmission: boolean("require_submission").default(false),
	submissionConfig: jsonb("submission_config").default({}),
	deadline: timestamp({ withTimezone: true, mode: 'string' }),
	status: varchar({ length: 20 }).default('draft'),
	createdBy: varchar("created_by", { length: 100 }).notNull(),
	createdByName: varchar("created_by_name", { length: 100 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
	attachments: jsonb().default([]),
}, (table) => [
	index("idx_moral_activities_created_by").using("btree", table.createdBy.asc().nullsLast().op("text_ops")),
	index("idx_moral_activities_grades").using("gin", table.targetGrades.asc().nullsLast().op("array_ops")),
	index("idx_moral_activities_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	check("moral_activities_status_check", sql`(status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'archived'::character varying])::text[])`),
]);

export const habitGoalTemplates = pgTable("habit_goal_templates", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	category: varchar({ length: 50 }).notNull(),
	code: varchar({ length: 20 }),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	gradeRange: varchar("grade_range", { length: 20 }).default('1-6'),
	difficulty: varchar({ length: 20 }).default('medium'),
	isActive: boolean("is_active").default(true),
	sortOrder: integer("sort_order").default(0),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_habit_goal_templates_category").using("btree", table.category.asc().nullsLast().op("text_ops")),
]);

export const habitStudentGoals = pgTable("habit_student_goals", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	month: varchar({ length: 10 }).notNull(),
	academicYear: varchar("academic_year", { length: 20 }).notNull(),
	goalTemplateId: uuid("goal_template_id"),
	customTitle: varchar("custom_title", { length: 200 }),
	customDescription: text("custom_description"),
	status: varchar({ length: 20 }).default('pending'),
	approvalStatus: varchar("approval_status", { length: 20 }).default('pending'),
	approvalComment: text("approval_comment"),
	approvedBy: varchar("approved_by", { length: 50 }),
	approvedAt: timestamp("approved_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_habit_student_goals_month").using("btree", table.month.asc().nullsLast().op("text_ops")),
	index("idx_habit_student_goals_student").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.goalTemplateId],
			foreignColumns: [habitGoalTemplates.id],
			name: "habit_student_goals_goal_template_id_fkey"
		}),
	unique("habit_student_goals_student_id_month_goal_template_id_key").on(table.studentId, table.month, table.goalTemplateId),
]);

export const habitDailyRecords = pgTable("habit_daily_records", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	studentGoalId: uuid("student_goal_id").notNull(),
	studentId: varchar("student_id", { length: 50 }).notNull(),
	checkDate: date("check_date").notNull(),
	month: varchar({ length: 10 }).notNull(),
	status: varchar({ length: 20 }).default('pending'),
	photoUrl: text("photo_url"),
	description: text(),
	parentComment: text("parent_comment"),
	teacherComment: text("teacher_comment"),
	makeUpDate: date("make_up_date"),
	createdBy: varchar("created_by", { length: 50 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_habit_daily_records_date").using("btree", table.checkDate.asc().nullsLast().op("date_ops")),
	index("idx_habit_daily_records_student").using("btree", table.studentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.studentGoalId],
			foreignColumns: [habitStudentGoals.id],
			name: "habit_daily_records_student_goal_id_fkey"
		}),
	unique("habit_daily_records_student_goal_id_check_date_key").on(table.studentGoalId, table.checkDate),
]);

export const moralActivitySubmissions = pgTable("moral_activity_submissions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	activityId: uuid("activity_id").notNull(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	className: varchar("class_name", { length: 100 }),
	grade: integer(),
	submitterId: varchar("submitter_id", { length: 100 }).notNull(),
	submitterName: varchar("submitter_name", { length: 100 }),
	submitterRole: varchar("submitter_role", { length: 50 }),
	textContent: text("text_content"),
	attachments: jsonb().default([]),
	status: varchar({ length: 20 }).default('pending'),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }),
	reviewedAt: timestamp("reviewed_at", { withTimezone: true, mode: 'string' }),
	reviewedBy: varchar("reviewed_by", { length: 100 }),
	reviewComment: text("review_comment"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_moral_activity_submissions_activity").using("btree", table.activityId.asc().nullsLast().op("uuid_ops")),
	index("idx_moral_activity_submissions_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_moral_activity_submissions_submitter").using("btree", table.submitterId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.activityId],
			foreignColumns: [moralActivities.id],
			name: "moral_activity_submissions_activity_id_fkey"
		}).onDelete("cascade"),
	unique("moral_activity_submissions_activity_id_class_id_key").on(table.activityId, table.classId),
	check("moral_activity_submissions_status_check", sql`(status)::text = ANY ((ARRAY['pending'::character varying, 'submitted'::character varying, 'reviewed'::character varying, 'rejected'::character varying])::text[])`),
]);

export const informationCollections = pgTable("information_collections", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	teacherId: uuid("teacher_id").notNull(),
	teacherName: varchar("teacher_name", { length: 100 }),
	fields: jsonb().default([]).notNull(),
	status: varchar({ length: 20 }).default('draft').notNull(),
	deadline: timestamp({ withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	publishedAt: timestamp("published_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_info_collections_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_info_collections_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_info_collections_teacher").using("btree", table.teacherId.asc().nullsLast().op("uuid_ops")),
]);

export const informationCollectionResponses = pgTable("information_collection_responses", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	collectionId: uuid("collection_id").notNull(),
	studentId: varchar("student_id", { length: 100 }),
	parentId: varchar("parent_id", { length: 100 }).notNull(),
	parentName: varchar("parent_name", { length: 100 }),
	responses: jsonb().default({}).notNull(),
	submittedAt: timestamp("submitted_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_info_responses_collection").using("btree", table.collectionId.asc().nullsLast().op("uuid_ops")),
	index("idx_info_responses_parent").using("btree", table.parentId.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.collectionId],
			foreignColumns: [informationCollections.id],
			name: "information_collection_responses_collection_id_fkey"
		}).onDelete("cascade"),
	unique("information_collection_responses_collection_id_parent_id_key").on(table.collectionId, table.parentId),
]);

export const roomBookings = pgTable("room_bookings", {
	id: varchar({ length: 50 }).primaryKey().notNull(),
	roomId: varchar("room_id", { length: 50 }).notNull(),
	roomName: varchar("room_name", { length: 200 }).notNull(),
	roomType: varchar("room_type", { length: 50 }).notNull(),
	building: varchar({ length: 100 }).notNull(),
	location: varchar({ length: 200 }),
	applicantId: varchar("applicant_id", { length: 50 }).notNull(),
	applicantName: varchar("applicant_name", { length: 100 }).notNull(),
	applicantRole: varchar("applicant_role", { length: 50 }).notNull(),
	department: varchar({ length: 100 }),
	phone: varchar({ length: 20 }),
	purpose: varchar({ length: 50 }).notNull(),
	purposeDetail: varchar("purpose_detail", { length: 500 }),
	title: varchar({ length: 200 }).notNull(),
	description: text(),
	bookingDate: date("booking_date").notNull(),
	startTime: varchar("start_time", { length: 10 }).notNull(),
	endTime: varchar("end_time", { length: 10 }).notNull(),
	duration: integer().notNull(),
	expectedAttendees: integer("expected_attendees").notNull(),
	attendeeType: varchar("attendee_type", { length: 20 }),
	requiredFacilities: jsonb("required_facilities"),
	status: varchar({ length: 20 }).default('pending').notNull(),
	approvalFlow: jsonb("approval_flow").default([]),
	currentStep: integer("current_step").default(0),
	rejectReason: text("reject_reason"),
	conflictWith: jsonb("conflict_with"),
	cancelledAt: timestamp("cancelled_at", { withTimezone: true, mode: 'string' }),
	cancelledBy: varchar("cancelled_by", { length: 50 }),
	cancelledByName: varchar("cancelled_by_name", { length: 100 }),
	cancelReason: text("cancel_reason"),
	actualStartTime: varchar("actual_start_time", { length: 10 }),
	actualEndTime: varchar("actual_end_time", { length: 10 }),
	actualAttendees: integer("actual_attendees"),
	usageReport: text("usage_report"),
	maintenanceRequest: varchar("maintenance_request", { length: 50 }),
	cleaningRequired: boolean("cleaning_required").default(false),
	cleaningRequested: boolean("cleaning_requested").default(false),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	timeSlot: varchar("time_slot", { length: 50 }),
	timeSlots: text("time_slots").array(),
}, (table) => [
	index("idx_room_bookings_applicant").using("btree", table.applicantId.asc().nullsLast().op("text_ops")),
	index("idx_room_bookings_date").using("btree", table.bookingDate.asc().nullsLast().op("date_ops")),
	index("idx_room_bookings_room").using("btree", table.roomId.asc().nullsLast().op("text_ops")),
	index("idx_room_bookings_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [rooms.id],
			name: "room_bookings_room_id_fkey"
		}).onDelete("cascade"),
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
	code: varchar({ length: 50 }),
	location: varchar({ length: 200 }),
	area: integer(),
	extraFacilities: jsonb("extra_facilities"),
	managerId: varchar("manager_id", { length: 50 }),
	managerName: varchar("manager_name", { length: 100 }),
	departmentId: varchar("department_id", { length: 50 }),
	usageStats: jsonb("usage_stats"),
	images: jsonb(),
	remark: text(),
}, (table) => [
	index("idx_rooms_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_rooms_type").using("btree", table.type.asc().nullsLast().op("text_ops")),
]);

// 值日老师安排表
export const dutyTeachers = pgTable("duty_teachers", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	teacherId: varchar("teacher_id", { length: 50 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	grade: integer().notNull(),
	weekDay: integer("week_day").notNull(),
	isActive: boolean("is_active").default(true),
	startDate: date("start_date"),
	endDate: date("end_date"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_duty_teachers_grade").using("btree", table.grade.asc().nullsLast().op("int4_ops")),
	index("idx_duty_teachers_teacher").using("btree", table.teacherId.asc().nullsLast().op("text_ops")),
	index("idx_duty_teachers_week_day").using("btree", table.weekDay.asc().nullsLast().op("int4_ops")),
]);

// 班级常规评分表
export const routineScores = pgTable("routine_scores", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	classId: varchar("class_id", { length: 50 }).notNull(),
	className: varchar("class_name", { length: 50 }).notNull(),
	grade: integer().notNull(),
	date: date().notNull(),
	category: varchar({ length: 50 }).notNull(),
	score: integer().notNull(),
	maxScore: integer("max_score").default(10),
	teacherId: varchar("teacher_id", { length: 50 }).notNull(),
	teacherName: varchar("teacher_name", { length: 50 }).notNull(),
	remark: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_routine_scores_class").using("btree", table.classId.asc().nullsLast().op("text_ops")),
	index("idx_routine_scores_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_routine_scores_grade").using("btree", table.grade.asc().nullsLast().op("int4_ops")),
	index("idx_routine_scores_teacher").using("btree", table.teacherId.asc().nullsLast().op("text_ops")),
]);
