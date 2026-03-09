import { relations } from "drizzle-orm/relations";
import { workflowConfigs, workflowInstances, approvalRecords, courses, teacherCourses, semesters, dailySchedules, users, approvalFlows, approvalFlowNodes, approvalInstances, approvalNodeRecords, announcements, messages, messageReads, scheduleDrafts, scheduleSlots, childHeartPaths, philosophyActivities, achievementCategories, achievements, students, habitStars, habitGoalTemplates, habitStudentGoals, habitDailyRecords, moralActivities, moralActivitySubmissions, informationCollections, informationCollectionResponses } from "./schema";

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
}));

export const dailySchedulesRelations = relations(dailySchedules, ({one}) => ({
	semester: one(semesters, {
		fields: [dailySchedules.semesterId],
		references: [semesters.id]
	}),
}));

export const semestersRelations = relations(semesters, ({many}) => ({
	dailySchedules: many(dailySchedules),
}));

export const approvalFlowsRelations = relations(approvalFlows, ({one, many}) => ({
	user: one(users, {
		fields: [approvalFlows.createdBy],
		references: [users.id]
	}),
	approvalFlowNodes: many(approvalFlowNodes),
	approvalInstances: many(approvalInstances),
}));

export const usersRelations = relations(users, ({many}) => ({
	approvalFlows: many(approvalFlows),
	approvalInstances: many(approvalInstances),
	announcements: many(announcements),
	messages_senderId: many(messages, {
		relationName: "messages_senderId_users_id"
	}),
	messages_recipientId: many(messages, {
		relationName: "messages_recipientId_users_id"
	}),
	messageReads: many(messageReads),
}));

export const approvalFlowNodesRelations = relations(approvalFlowNodes, ({one}) => ({
	approvalFlow: one(approvalFlows, {
		fields: [approvalFlowNodes.flowId],
		references: [approvalFlows.id]
	}),
}));

export const approvalInstancesRelations = relations(approvalInstances, ({one, many}) => ({
	approvalFlow: one(approvalFlows, {
		fields: [approvalInstances.flowId],
		references: [approvalFlows.id]
	}),
	user: one(users, {
		fields: [approvalInstances.applicantId],
		references: [users.id]
	}),
	approvalNodeRecords: many(approvalNodeRecords),
}));

export const approvalNodeRecordsRelations = relations(approvalNodeRecords, ({one}) => ({
	approvalInstance: one(approvalInstances, {
		fields: [approvalNodeRecords.instanceId],
		references: [approvalInstances.id]
	}),
}));

export const announcementsRelations = relations(announcements, ({one}) => ({
	user: one(users, {
		fields: [announcements.authorId],
		references: [users.id]
	}),
}));

export const messagesRelations = relations(messages, ({one, many}) => ({
	user_senderId: one(users, {
		fields: [messages.senderId],
		references: [users.id],
		relationName: "messages_senderId_users_id"
	}),
	user_recipientId: one(users, {
		fields: [messages.recipientId],
		references: [users.id],
		relationName: "messages_recipientId_users_id"
	}),
	messageReads: many(messageReads),
}));

export const messageReadsRelations = relations(messageReads, ({one}) => ({
	message: one(messages, {
		fields: [messageReads.messageId],
		references: [messages.id]
	}),
	user: one(users, {
		fields: [messageReads.userId],
		references: [users.id]
	}),
}));

export const scheduleSlotsRelations = relations(scheduleSlots, ({one}) => ({
	scheduleDraft: one(scheduleDrafts, {
		fields: [scheduleSlots.draftId],
		references: [scheduleDrafts.id]
	}),
}));

export const scheduleDraftsRelations = relations(scheduleDrafts, ({many}) => ({
	scheduleSlots: many(scheduleSlots),
}));

export const philosophyActivitiesRelations = relations(philosophyActivities, ({one}) => ({
	childHeartPath: one(childHeartPaths, {
		fields: [philosophyActivities.categoryId],
		references: [childHeartPaths.id]
	}),
}));

export const childHeartPathsRelations = relations(childHeartPaths, ({many}) => ({
	philosophyActivities: many(philosophyActivities),
}));

export const achievementsRelations = relations(achievements, ({one}) => ({
	achievementCategory: one(achievementCategories, {
		fields: [achievements.categoryId],
		references: [achievementCategories.id]
	}),
}));

export const achievementCategoriesRelations = relations(achievementCategories, ({many}) => ({
	achievements: many(achievements),
}));

export const habitStarsRelations = relations(habitStars, ({one}) => ({
	student: one(students, {
		fields: [habitStars.studentId],
		references: [students.id]
	}),
}));

export const studentsRelations = relations(students, ({many}) => ({
	habitStars: many(habitStars),
}));

export const habitStudentGoalsRelations = relations(habitStudentGoals, ({one, many}) => ({
	habitGoalTemplate: one(habitGoalTemplates, {
		fields: [habitStudentGoals.goalTemplateId],
		references: [habitGoalTemplates.id]
	}),
	habitDailyRecords: many(habitDailyRecords),
}));

export const habitGoalTemplatesRelations = relations(habitGoalTemplates, ({many}) => ({
	habitStudentGoals: many(habitStudentGoals),
}));

export const habitDailyRecordsRelations = relations(habitDailyRecords, ({one}) => ({
	habitStudentGoal: one(habitStudentGoals, {
		fields: [habitDailyRecords.studentGoalId],
		references: [habitStudentGoals.id]
	}),
}));

export const moralActivitySubmissionsRelations = relations(moralActivitySubmissions, ({one}) => ({
	moralActivity: one(moralActivities, {
		fields: [moralActivitySubmissions.activityId],
		references: [moralActivities.id]
	}),
}));

export const moralActivitiesRelations = relations(moralActivities, ({many}) => ({
	moralActivitySubmissions: many(moralActivitySubmissions),
}));

export const informationCollectionResponsesRelations = relations(informationCollectionResponses, ({one}) => ({
	informationCollection: one(informationCollections, {
		fields: [informationCollectionResponses.collectionId],
		references: [informationCollections.id]
	}),
}));

export const informationCollectionsRelations = relations(informationCollections, ({many}) => ({
	informationCollectionResponses: many(informationCollectionResponses),
}));