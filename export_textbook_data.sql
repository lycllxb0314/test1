-- ============================================
-- 课文篇目数据导出脚本
-- 用于同步到生产环境
-- ============================================

-- 1. 语文课文篇目表 textbook_lessons (323条)
-- 导出为 CSV:
-- COPY (SELECT * FROM textbook_lessons ORDER BY grade, semester, unit_number, lesson_number) TO STDOUT WITH CSV HEADER;

-- 2. 语文习作篇目表 writing_topics (94条)  
-- 导出为 CSV:
-- COPY (SELECT * FROM writing_topics ORDER BY grade, semester, unit_number, topic_number) TO STDOUT WITH CSV HEADER;

-- 3. 数学教学内容表 math_teaching_contents (306条)
-- 导出为 CSV:
-- COPY (SELECT * FROM math_teaching_contents ORDER BY grade, semester, unit_order) TO STDOUT WITH CSV HEADER;

-- ============================================
-- 如果生产环境表不存在，先创建表结构
-- ============================================

-- textbook_lessons 表结构
CREATE TABLE IF NOT EXISTS textbook_lessons (
    id SERIAL PRIMARY KEY,
    grade INTEGER NOT NULL,
    semester TEXT NOT NULL,
    unit_number INTEGER NOT NULL,
    unit_theme TEXT,
    lesson_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    genre TEXT,
    author TEXT,
    content TEXT,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- writing_topics 表结构
CREATE TABLE IF NOT EXISTS writing_topics (
    id SERIAL PRIMARY KEY,
    grade INTEGER NOT NULL,
    semester VARCHAR(10) NOT NULL,
    unit_number INTEGER NOT NULL,
    unit_theme VARCHAR(100),
    topic_number INTEGER NOT NULL,
    title VARCHAR(100) NOT NULL,
    writing_type VARCHAR(20),
    requirements TEXT,
    word_count_min INTEGER,
    word_count_max INTEGER,
    key_points TEXT[],
    tips TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- math_teaching_contents 表结构
CREATE TABLE IF NOT EXISTS math_teaching_contents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grade INTEGER NOT NULL,
    semester TEXT NOT NULL,
    domain TEXT NOT NULL,
    unit_name TEXT NOT NULL,
    unit_order INTEGER NOT NULL,
    content_name TEXT NOT NULL,
    content_key TEXT NOT NULL,
    lesson_type TEXT,
    prior_knowledge TEXT[],
    subsequent_extension TEXT[],
    core_competencies TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_textbook_lessons_grade_sem ON textbook_lessons(grade, semester);
CREATE INDEX IF NOT EXISTS idx_writing_topics_grade_sem ON writing_topics(grade, semester);
CREATE INDEX IF NOT EXISTS idx_math_contents_grade_sem ON math_teaching_contents(grade, semester);
