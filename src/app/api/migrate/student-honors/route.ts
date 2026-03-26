/**
 * 学生荣誉表迁移 API
 * 
 * 用于创建 student_honors 表
 */

import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 创建学生荣誉表
 * 
 * POST /api/migrate/student-honors
 */
export async function POST() {
  try {
    const supabase = getSupabaseClient();
    
    // 先检查表是否存在
    const { error: checkError } = await supabase
      .from('student_honors')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      return NextResponse.json({
        success: true,
        message: 'student_honors 表已存在',
        exists: true,
      });
    }
    
    // 如果错误不是"表不存在"，返回错误
    if (!checkError.message.includes('does not exist') && !checkError.message.includes('relation')) {
      return NextResponse.json({
        success: false,
        error: '检查表失败',
        details: checkError.message,
      }, { status: 500 });
    }
    
    // 表不存在，尝试使用 RPC 创建表
    // 注意：Supabase 不支持直接执行 DDL，需要在控制台创建
    // 这里返回表结构定义供手动创建
    
    return NextResponse.json({
      success: false,
      exists: false,
      message: 'student_honors 表不存在，请在 Supabase 控制台执行以下 SQL 创建表：',
      sql: `
-- 学生荣誉表
CREATE TABLE IF NOT EXISTS student_honors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(50) NOT NULL,
  class_name VARCHAR(50),
  grade VARCHAR(20),
  title VARCHAR(100) NOT NULL,
  level VARCHAR(20) NOT NULL CHECK (level IN ('国家级', '省级', '市级', '区级', '校级', '班级')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('综合', '学习', '德育', '体育', '艺术', '劳动', '科技')),
  issuer VARCHAR(100),
  date DATE NOT NULL,
  certificate_no VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_student_honors_student_id ON student_honors(student_id);
CREATE INDEX IF NOT EXISTS idx_student_honors_grade ON student_honors(grade);
CREATE INDEX IF NOT EXISTS idx_student_honors_level ON student_honors(level);
CREATE INDEX IF NOT EXISTS idx_student_honors_category ON student_honors(category);
CREATE INDEX IF NOT EXISTS idx_student_honors_date ON student_honors(date);

-- 添加注释
COMMENT ON TABLE student_honors IS '学生荣誉表';
COMMENT ON COLUMN student_honors.student_id IS '学生ID';
COMMENT ON COLUMN student_honors.student_name IS '学生姓名';
COMMENT ON COLUMN student_honors.class_name IS '班级名称';
COMMENT ON COLUMN student_honors.grade IS '年级';
COMMENT ON COLUMN student_honors.title IS '荣誉名称';
COMMENT ON COLUMN student_honors.level IS '荣誉级别：国家级/省级/市级/区级/校级/班级';
COMMENT ON COLUMN student_honors.category IS '荣誉类别：综合/学习/德育/体育/艺术/劳动/科技';
COMMENT ON COLUMN student_honors.issuer IS '颁发单位';
COMMENT ON COLUMN student_honors.date IS '获奖日期';
COMMENT ON COLUMN student_honors.certificate_no IS '证书编号';
COMMENT ON COLUMN student_honors.description IS '荣誉描述';

-- 插入测试数据（可选）
INSERT INTO student_honors (student_id, student_name, class_name, grade, title, level, category, issuer, date, description) VALUES
('1', '张三', '三年级1班', '三年级', '学习标兵', '校级', '学习', '学校', '2025-01-15', '期末考试第一名'),
('2', '李四', '三年级1班', '三年级', '优秀少先队员', '区级', '综合', '区教育局', '2025-01-10', '表现优秀'),
('3', '王五', '四年级2班', '四年级', '科技创新大赛一等奖', '市级', '科技', '市教育局', '2025-01-08', '市级科技比赛获奖'),
('4', '赵六', '五年级1班', '五年级', '运动会百米冠军', '校级', '体育', '学校', '2025-01-05', '校运动会第一名'),
('5', '孙七', '六年级3班', '六年级', '绘画比赛特等奖', '省级', '艺术', '省教育厅', '2024-12-20', '省级绘画比赛获奖'),
('1', '张三', '三年级1班', '三年级', '优秀班干部', '校级', '德育', '学校', '2024-12-15', '班级管理表现突出'),
('6', '周八', '三年级2班', '三年级', '劳动小能手', '班级', '劳动', '班级', '2024-12-10', '劳动积极'),
('7', '吴九', '四年级1班', '四年级', '数学竞赛一等奖', '市级', '学习', '市教育局', '2024-11-28', '市级数学竞赛'),
('8', '郑十', '五年级2班', '五年级', '三好学生', '校级', '综合', '学校', '2024-11-20', '全面发展'),
('9', '钱十一', '六年级1班', '六年级', '作文比赛一等奖', '国家级', '学习', '教育部', '2024-10-15', '全国作文比赛获奖');
`,
    });
    
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({
      success: false,
      error: '迁移失败',
      details: String(err),
    }, { status: 500 });
  }
}
