import { relations } from "drizzle-orm/relations";
import { workflowConfigs, workflowInstances, approvalRecords, courses, teacherCourses, semesters, dailySchedules, scheduleSlots } from "./schema";

export const workflowInstancesRelations = relations(workflowInstances, ({one, many}) => ({
	workflowConfig: one(workflowConfigs, {
		fields: [workflowInstances.configId],
		references: [workflowConfigs.id]
	}),
	approvalRecords: many(approvalRecords),
}));

export const workflowConfigsRelations = relations(workflowConfigs, ({many}) => ({
	workflowInstances: many(workflowInstances),
}));

export const approvalRecordsRelations = relations(approvalRecords, ({one}) => ({
	workflowInstance: one(workflowInstances, {
		fields: [approvalRecords.instanceId],
		references: [workflowInstances.id]
	}),
}));

export const teacherCoursesRelations = relations(teacherCourses, ({one}) => ({
	course: one(courses, {
		fields: [teacherCourses.courseId],
		references: [courses.id]
	}),
}));

export const coursesRelations = relations(courses, ({many}) => ({
	teacherCourses: many(teacherCourses),
	scheduleSlots: many(scheduleSlots),
}));

export const dailySchedulesRelations = relations(dailySchedules, ({one}) => ({
	semester: one(semesters, {
		fields: [dailySchedules.semesterId],
		references: [semesters.id]
	}),
}));

export const semestersRelations = relations(semesters, ({many}) => ({
	dailySchedules: many(dailySchedules),
	scheduleSlots: many(scheduleSlots),
}));

export const scheduleSlotsRelations = relations(scheduleSlots, ({one}) => ({
	course: one(courses, {
		fields: [scheduleSlots.courseId],
		references: [courses.id]
	}),
	semester: one(semesters, {
		fields: [scheduleSlots.semesterId],
		references: [semesters.id]
	}),
}));