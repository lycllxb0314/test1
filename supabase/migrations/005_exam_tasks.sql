-- 智慧作业 命题任务表
-- 执行此 SQL 创建所需的数据表

-- =====================================================
-- 1. 命题任务表（AI全自动命题工作流）
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(300) NOT NULL,
  subject VARCHAR(50) NOT NULL,
  grade INTEGER NOT NULL,
  semester VARCHAR(20) NOT NULL,
  exam_type VARCHAR(50) NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 100,
  duration INTEGER NOT NULL DEFAULT 60,
  specification JSONB NOT NULL DEFAULT '{}',
  status VARCHAR(30) NOT NULL DEFAULT 'pending',
  creator_id VARCHAR(100) NOT NULL,
  creator_name VARCHAR(100) NOT NULL DEFAULT '',
  cell_progress JSONB NOT NULL DEFAULT '[]',
  questions JSONB NOT NULL DEFAULT '[]',
  paper_html TEXT,
  paper_docx_url TEXT,
  final_paper_id VARCHAR(100),
  progress INTEGER NOT NULL DEFAULT 0,
  current_step TEXT,
  error_message TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE exam_tasks IS 'AI全自动命题任务';
COMMENT ON COLUMN exam_tasks.specification IS '命题双向细目表 JSON';
COMMENT ON COLUMN exam_tasks.cell_progress IS '各交叉格命题进度 JSON';
COMMENT ON COLUMN exam_tasks.questions IS '最终生成的所有题目 JSON';
COMMENT ON COLUMN exam_tasks.status IS '任务状态：pending/generating/reviewing/revision/formatting/completed/failed';

-- 索引
CREATE INDEX IF NOT EXISTS idx_exam_tasks_creator ON exam_tasks(creator_id);
CREATE INDEX IF NOT EXISTS idx_exam_tasks_status ON exam_tasks(status);
