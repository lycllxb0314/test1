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
