import { pgTable, serial, timestamp, varchar, text, jsonb, boolean, integer } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 主页内容区块类型
export type HomepageSectionType = 
  | 'hero'           // 顶部横幅
  | 'motto'          // 校训内涵
  | 'five_education' // 五育并举
  | 'teacher_dev'    // 教师发展
  | 'activities'     // 校园活动
  | 'honors'         // 荣誉展示
  | 'news'           // 新闻动态
  | 'smart_campus'   // 智慧校园
  | 'contact';       // 联系方式

// 主页内容配置表
export const homepageSections = pgTable("homepage_sections", {
  id: serial().notNull().primaryKey(),
  sectionType: varchar("section_type", { length: 50 }).notNull(), // 区块类型
  sectionTitle: varchar("section_title", { length: 200 }),        // 区块标题
  sectionSubtitle: varchar("section_subtitle", { length: 500 }), // 区块副标题
  content: jsonb("content"),                                       // 区块内容 (JSON)
  sortOrder: integer("sort_order").default(0),                    // 排序顺序
  isActive: boolean("is_active").default(true),                   // 是否启用
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedBy: varchar("updated_by", { length: 100 }),              // 更新人
});

// 新闻/公告表
export const homepageNews = pgTable("homepage_news", {
  id: serial().notNull().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  summary: text("summary"),                                        // 摘要
  content: text("content"),                                        // 正文
  category: varchar("category", { length: 50 }),                  // 分类：新闻、喜讯、活动、通知
  coverImage: varchar("cover_image", { length: 500 }),            // 封面图
  isTop: boolean("is_top").default(false),                        // 是否置顶
  viewCount: integer("view_count").default(0),                    // 浏览次数
  publishDate: timestamp("publish_date", { withTimezone: true, mode: 'string' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  createdBy: varchar("created_by", { length: 100 }),
});

// 荣誉展示表
export const homepageHonors = pgTable("homepage_honors", {
  id: serial().notNull().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  year: varchar("year", { length: 10 }),                          // 获奖年份
  organization: varchar("organization", { length: 200 }),         // 颁发机构
  level: varchar("level", { length: 50 }),                        // 级别：国家级、省级、市级
  image: varchar("image", { length: 500 }),                       // 荣誉证书图片
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 图片资源表
export const homepageImages = pgTable("homepage_images", {
  id: serial().notNull().primaryKey(),
  sectionType: varchar("section_type", { length: 50 }).notNull(), // 所属区块
  title: varchar("title", { length: 200 }),                       // 图片标题
  description: varchar("description", { length: 500 }),           // 图片描述
  imageUrl: varchar("image_url", { length: 500 }).notNull(),      // 图片URL
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ========== 工作流配置相关表 ==========

// 审批流程类型
export type WorkflowType = 'leave' | 'repair' | 'purchase';

// 审批流程配置表
export const workflowConfigs = pgTable("workflow_configs", {
  id: serial().notNull().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),                // 流程类型: leave, repair, purchase
  name: varchar("name", { length: 100 }).notNull(),               // 流程名称
  description: text("description"),                               // 流程描述
  isActive: boolean("is_active").default(true),                   // 是否启用
  steps: jsonb("steps").notNull(),                                // 审批步骤配置 (JSON Array)
  conditions: jsonb("conditions"),                                // 条件分支配置 (JSON Array)
  version: integer("version").default(1),                         // 版本号
  createdBy: varchar("created_by", { length: 100 }),              // 创建人
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 工作流实例表
export const workflowInstances = pgTable("workflow_instances", {
  id: serial().notNull().primaryKey(),
  type: varchar("type", { length: 50 }).notNull(),                // 流程类型
  configId: integer("config_id").notNull(),                       // 流程配置ID
  applicantId: varchar("applicant_id", { length: 100 }).notNull(),// 申请人ID
  applicantName: varchar("applicant_name", { length: 100 }).notNull(),
  applicantRole: varchar("applicant_role", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),             // 申请标题
  content: jsonb("content").notNull(),                            // 申请内容
  status: varchar("status", { length: 50 }).default('pending'),   // 状态: pending, approved, rejected, cancelled
  currentStep: integer("current_step").default(0),                // 当前步骤
  steps: jsonb("steps").notNull(),                                // 各步骤状态
  completedAt: timestamp("completed_at", { withTimezone: true, mode: 'string' }),
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// 审批记录表
export const approvalRecords = pgTable("approval_records", {
  id: serial().notNull().primaryKey(),
  instanceId: integer("instance_id").notNull(),                   // 工作流实例ID
  workflowType: varchar("workflow_type", { length: 50 }).notNull(),
  stepId: varchar("step_id", { length: 50 }).notNull(),           // 步骤ID
  stepName: varchar("step_name", { length: 100 }).notNull(),      // 步骤名称
  approverId: varchar("approver_id", { length: 100 }).notNull(),  // 审批人ID
  approverName: varchar("approver_name", { length: 100 }).notNull(),
  approverRole: varchar("approver_role", { length: 50 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),            // 动作: approve, reject, withdraw, transfer
  comment: text("comment"),                                       // 审批意见
  createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});
