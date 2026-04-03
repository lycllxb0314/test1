-- 心理数字人系统数据库表
-- 用于支持实时视频对话、危机预警、档案管理等功能

-- 心理会话表
CREATE TABLE IF NOT EXISTS psychology_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  session_type VARCHAR(20) NOT NULL DEFAULT 'chat' CHECK (session_type IN ('chat', 'crisis', 'follow_up')),
  summary TEXT,
  emotion_analysis JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 心理消息表
CREATE TABLE IF NOT EXISTS psychology_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES psychology_sessions(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  audio_url TEXT,
  emotion VARCHAR(50),
  emotion_score DECIMAL(3,2),
  is_crisis BOOLEAN DEFAULT FALSE,
  crisis_keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 心理预警表
CREATE TABLE IF NOT EXISTS psychology_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES psychology_sessions(id) ON DELETE SET NULL,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  alert_level VARCHAR(20) NOT NULL CHECK (alert_level IN ('red', 'orange', 'yellow')),
  alert_type VARCHAR(50) NOT NULL,
  keywords TEXT[] NOT NULL,
  content TEXT NOT NULL,
  context TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'closed')),
  handler_id UUID REFERENCES users(id),
  handler_name VARCHAR(50),
  handled_at TIMESTAMP WITH TIME ZONE,
  handle_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 心理档案表
CREATE TABLE IF NOT EXISTS psychology_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID UNIQUE NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  risk_level VARCHAR(20) DEFAULT 'normal' CHECK (risk_level IN ('normal', 'attention', 'warning', 'crisis')),
  personality_traits JSONB DEFAULT '{}',
  emotional_patterns JSONB DEFAULT '{}',
  interests TEXT[],
  concerns TEXT[],
  last_session_at TIMESTAMP WITH TIME ZONE,
  total_sessions INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_psychology_sessions_student ON psychology_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_psychology_sessions_status ON psychology_sessions(status);
CREATE INDEX IF NOT EXISTS idx_psychology_sessions_started_at ON psychology_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_psychology_messages_session ON psychology_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_psychology_messages_created_at ON psychology_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_psychology_alerts_student ON psychology_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_psychology_alerts_level ON psychology_alerts(alert_level);
CREATE INDEX IF NOT EXISTS idx_psychology_alerts_status ON psychology_alerts(status);
CREATE INDEX IF NOT EXISTS idx_psychology_alerts_created_at ON psychology_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_psychology_profiles_student ON psychology_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_psychology_profiles_risk_level ON psychology_profiles(risk_level);

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_psychology_sessions_updated_at
  BEFORE UPDATE ON psychology_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psychology_alerts_updated_at
  BEFORE UPDATE ON psychology_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_psychology_profiles_updated_at
  BEFORE UPDATE ON psychology_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE psychology_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychology_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychology_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychology_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 策略：学生只能查看自己的会话
CREATE POLICY "Students can view own sessions" ON psychology_sessions
  FOR SELECT USING (student_id = current_setting('request.jwt.claims')->>'sub');

-- RLS 策略：教师可以查看所教班级学生的会话（需要根据实际权限调整）
CREATE POLICY "Teachers can view sessions" ON psychology_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM classes c
      JOIN students s ON s.class_id = c.id
      WHERE s.id = psychology_sessions.student_id
      AND (c.head_teacher_id = current_setting('request.jwt.claims')->>'employee_id'
           OR c.sub_teacher_id = current_setting('request.jwt.claims')->>'employee_id')
    )
  );

-- RLS 策略：德育处可以查看所有预警
CREATE POLICY "Moral staff can view alerts" ON psychology_alerts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = current_setting('request.jwt.claims')->>'sub'
      AND u.role IN ('moral_vice_principal', 'moral_director', 'principal')
    )
  );

-- 注释
COMMENT ON TABLE psychology_sessions IS '心理辅导会话记录';
COMMENT ON TABLE psychology_messages IS '心理辅导对话消息';
COMMENT ON TABLE psychology_alerts IS '心理危机预警';
COMMENT ON TABLE psychology_profiles IS '学生心理档案';
