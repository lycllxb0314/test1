-- 云教学系统数据库迁移
-- 三大课程域：教师研修(research) | 家长课程(parent) | 学生课程(student)
-- 两种形态：在线教学(live) | 慕课学习(recorded)

-- 1. 云课程表
CREATE TABLE IF NOT EXISTS cloud_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  cover_image TEXT,
  domain VARCHAR(20) NOT NULL CHECK (domain IN ('research', 'parent', 'student')),
  format VARCHAR(20) NOT NULL CHECK (format IN ('live', 'recorded')),
  category VARCHAR(50) NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  target_audience VARCHAR(50) DEFAULT '',
  creator_id VARCHAR(50) NOT NULL,
  creator_name VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewing', 'published', 'archived')),
  total_chapters INTEGER NOT NULL DEFAULT 0,
  total_duration INTEGER NOT NULL DEFAULT 0,  -- 总时长(秒)
  enrolled_count INTEGER NOT NULL DEFAULT 0,
  rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 云课程章节表
CREATE TABLE IF NOT EXISTS cloud_course_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES cloud_courses(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  video_url TEXT,
  document_url TEXT,
  duration INTEGER NOT NULL DEFAULT 0,  -- 时长(秒)
  is_free BOOLEAN NOT NULL DEFAULT false,
  quiz_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 选课/推送记录表
CREATE TABLE IF NOT EXISTS cloud_course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES cloud_courses(id) ON DELETE CASCADE,
  user_id VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'manager')),
  target_student_id VARCHAR(50),  -- 家长代管时的目标学生ID
  source VARCHAR(20) NOT NULL DEFAULT 'self' CHECK (source IN ('self', 'assigned', 'pushed')),
  status VARCHAR(20) NOT NULL DEFAULT 'pushed' CHECK (status IN ('pushed', 'scheduled', 'learning', 'completed')),
  scheduled_at TIMESTAMPTZ,  -- 家长安排的学习时间
  progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- 0-100
  last_chapter_id UUID,  -- 断点续学
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, user_id, target_student_id)
);

-- 4. 学习记录表
CREATE TABLE IF NOT EXISTS cloud_learning_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES cloud_course_enrollments(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES cloud_course_chapters(id) ON DELETE CASCADE,
  record_type VARCHAR(20) NOT NULL DEFAULT 'video' CHECK (record_type IN ('video', 'live', 'quiz', 'document')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  watch_duration INTEGER NOT NULL DEFAULT 0,  -- 观看时长(秒)
  quiz_score DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 直播会话表
CREATE TABLE IF NOT EXISTS cloud_live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES cloud_courses(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES cloud_course_chapters(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT DEFAULT '',
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL DEFAULT 3600,  -- 默认1小时
  room_url TEXT,
  recording_url TEXT,  -- 课后生成回放
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'ended', 'cancelled')),
  max_participants INTEGER NOT NULL DEFAULT 300,
  current_participants INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 课程推送表
CREATE TABLE IF NOT EXISTS cloud_course_pushes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES cloud_courses(id) ON DELETE CASCADE,
  pushed_by VARCHAR(50) NOT NULL,
  pusher_name VARCHAR(50) NOT NULL,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('class', 'grade', 'individual')),
  target_ids TEXT[] NOT NULL DEFAULT '{}',
  message TEXT NOT NULL DEFAULT '',
  deadline TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_cloud_courses_domain ON cloud_courses(domain);
CREATE INDEX IF NOT EXISTS idx_cloud_courses_status ON cloud_courses(status);
CREATE INDEX IF NOT EXISTS idx_cloud_courses_creator ON cloud_courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_cloud_course_chapters_course ON cloud_course_chapters(course_id);
CREATE INDEX IF NOT EXISTS idx_cloud_course_enrollments_user ON cloud_course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_cloud_course_enrollments_course ON cloud_course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_cloud_course_enrollments_status ON cloud_course_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_cloud_course_enrollments_student ON cloud_course_enrollments(target_student_id);
CREATE INDEX IF NOT EXISTS idx_cloud_learning_records_enrollment ON cloud_learning_records(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_cloud_learning_records_chapter ON cloud_learning_records(chapter_id);
CREATE INDEX IF NOT EXISTS idx_cloud_live_sessions_course ON cloud_live_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_cloud_live_sessions_status ON cloud_live_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cloud_live_sessions_scheduled ON cloud_live_sessions(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_cloud_course_pushes_course ON cloud_course_pushes(course_id);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_cloud_courses_updated_at BEFORE UPDATE ON cloud_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cloud_course_chapters_updated_at BEFORE UPDATE ON cloud_course_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cloud_course_enrollments_updated_at BEFORE UPDATE ON cloud_course_enrollments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cloud_live_sessions_updated_at BEFORE UPDATE ON cloud_live_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 评论
COMMENT ON TABLE cloud_courses IS '云教学课程表';
COMMENT ON TABLE cloud_course_chapters IS '云教学课程章节表';
COMMENT ON TABLE cloud_course_enrollments IS '云教学选课/推送记录表';
COMMENT ON TABLE cloud_learning_records IS '云教学学习记录表';
COMMENT ON TABLE cloud_live_sessions IS '云教学直播会话表';
COMMENT ON TABLE cloud_course_pushes IS '云教学课程推送表';
