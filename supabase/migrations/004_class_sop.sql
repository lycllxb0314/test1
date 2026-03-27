-- 班级 SOP 智能台账数据库表
-- 执行此 SQL 创建所需的数据表

-- =====================================================
-- 1. SOP 模板表
-- =====================================================
CREATE TABLE IF NOT EXISTS sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL, -- hygiene, safety, conflict, communication, discipline, attendance, activity, emergency
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  applicable_roles JSONB DEFAULT '["班主任"]',
  evidence_required BOOLEAN DEFAULT true,
  timeout_minutes INTEGER,
  is_system BOOLEAN DEFAULT false, -- 是否系统预置模板
  creator_id VARCHAR(100),
  school_id VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE sop_templates IS 'SOP 标准操作流程模板';
COMMENT ON COLUMN sop_templates.steps IS '操作步骤，JSON 格式：[{order, title, description, isRequired, evidenceType, checkpoints[]}]';

-- =====================================================
-- 2. SOP 执行记录表
-- =====================================================
CREATE TABLE IF NOT EXISTS sop_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES sop_templates(id),
  template_name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  executor_id VARCHAR(100) NOT NULL,
  executor_name VARCHAR(100) NOT NULL,
  class_id VARCHAR(100) NOT NULL,
  class_name VARCHAR(100),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'in_progress', -- in_progress, completed, timeout, aborted
  steps JSONB NOT NULL DEFAULT '[]',
  summary TEXT,
  attachments JSONB DEFAULT '[]',
  signatures JSONB DEFAULT '[]',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE sop_executions IS 'SOP 执行记录';
COMMENT ON COLUMN sop_executions.steps IS '步骤执行记录，JSON 格式：[{stepOrder, stepTitle, status, startedAt, completedAt, content, attachments[], operatorId}]';
COMMENT ON COLUMN sop_executions.signatures IS '签字确认记录';

-- =====================================================
-- 3. 台账条目表
-- =====================================================
CREATE TABLE IF NOT EXISTS ledger_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL, -- routine, incident, safety, communication, discipline
  title VARCHAR(200) NOT NULL,
  description TEXT,
  class_id VARCHAR(100) NOT NULL,
  class_name VARCHAR(100),
  involved_persons JSONB DEFAULT '[]',
  execution_id UUID REFERENCES sop_executions(id),
  occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'open', -- open, investigating, resolved, closed
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  handler_id VARCHAR(100) NOT NULL,
  handler_name VARCHAR(100) NOT NULL,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  follow_up_notes TEXT,
  tags JSONB DEFAULT '[]',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ledger_entries IS '台账条目';
COMMENT ON COLUMN ledger_entries.involved_persons IS '涉及人员，JSON 格式：[{id, name, role, className}]';

-- =====================================================
-- 4. 索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_sop_templates_category ON sop_templates(category);
CREATE INDEX IF NOT EXISTS idx_sop_templates_is_active ON sop_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_sop_templates_school_id ON sop_templates(school_id);

CREATE INDEX IF NOT EXISTS idx_sop_executions_template_id ON sop_executions(template_id);
CREATE INDEX IF NOT EXISTS idx_sop_executions_class_id ON sop_executions(class_id);
CREATE INDEX IF NOT EXISTS idx_sop_executions_executor_id ON sop_executions(executor_id);
CREATE INDEX IF NOT EXISTS idx_sop_executions_status ON sop_executions(status);
CREATE INDEX IF NOT EXISTS idx_sop_executions_started_at ON sop_executions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_entries_type ON ledger_entries(type);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_class_id ON ledger_entries(class_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_status ON ledger_entries(status);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_handler_id ON ledger_entries(handler_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_occurred_at ON ledger_entries(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_follow_up ON ledger_entries(follow_up_required, follow_up_date);

-- =====================================================
-- 5. 初始数据 - 系统 SOP 模板
-- =====================================================

-- 5.1 卫生检查 SOP
INSERT INTO sop_templates (name, category, description, steps, is_system) VALUES
('班级卫生值日检查', 'hygiene', '每日班级卫生检查标准流程，确保班级环境整洁', 
'[
  {"order": 1, "title": "地面检查", "description": "检查地面是否干净整洁", "isRequired": true, "evidenceType": "photo", "checkpoints": ["地面无纸屑、垃圾", "地面无明显污渍", "拖把、扫帚摆放整齐"]},
  {"order": 2, "title": "桌椅检查", "description": "检查桌椅摆放是否整齐", "isRequired": true, "evidenceType": "photo", "checkpoints": ["桌椅排列整齐", "桌面整洁无杂物", "椅子归位"]},
  {"order": 3, "title": "黑板检查", "description": "检查黑板及讲台整洁度", "isRequired": true, "evidenceType": "photo", "checkpoints": ["黑板擦干净", "粉笔摆放整齐", "讲台整洁"]},
  {"order": 4, "title": "门窗检查", "description": "检查门窗玻璃是否干净", "isRequired": false, "evidenceType": "photo", "checkpoints": ["玻璃干净明亮", "窗台无灰尘", "门框整洁"]},
  {"order": 5, "title": "卫生角检查", "description": "检查卫生角工具摆放", "isRequired": true, "evidenceType": "photo", "checkpoints": ["工具摆放整齐", "垃圾桶清理", "无异味"]}
]'::jsonb, true);

-- 5.2 学生矛盾处理 SOP
INSERT INTO sop_templates (name, category, description, steps, is_system, evidence_required) VALUES
('学生矛盾处理流程', 'conflict', '学生之间发生矛盾/冲突时的标准化处理流程，确保问题得到妥善解决并形成完整记录', 
'[
  {"order": 1, "title": "隔离双方", "description": "将冲突双方分开，避免事态扩大", "isRequired": true, "evidenceType": "text", "checkpoints": ["确保安全距离", "安抚情绪", "确认无身体伤害"]},
  {"order": 2, "title": "了解情况", "description": "分别询问双方当事人，了解事件经过", "isRequired": true, "evidenceType": "text", "checkpoints": ["单独询问", "记录时间、地点、起因、经过", "询问目击证人"]},
  {"order": 3, "title": "记录事实", "description": "客观记录事件经过，不做主观判断", "isRequired": true, "evidenceType": "photo", "checkpoints": ["拍照记录现场", "记录双方陈述", "收集相关证据"]},
  {"order": 4, "title": "调解处理", "description": "组织双方进行调解，达成和解", "isRequired": true, "evidenceType": "signature", "checkpoints": ["分析对错", "引导反思", "达成和解", "签字确认"]},
  {"order": 5, "title": "通知家长", "description": "根据情况决定是否通知家长", "isRequired": false, "evidenceType": "text", "checkpoints": ["评估严重程度", "电话/微信沟通", "记录沟通内容"]},
  {"order": 6, "title": "后续跟进", "description": "持续关注双方关系恢复情况", "isRequired": true, "evidenceType": "text", "checkpoints": ["一周后回访", "观察日常相处", "记录跟进情况"]}
]'::jsonb, true, true);

-- 5.3 安全隐患排查 SOP
INSERT INTO sop_templates (name, category, description, steps, is_system) VALUES
('班级安全隐患排查', 'safety', '定期排查班级安全隐患，预防安全事故发生', 
'[
  {"order": 1, "title": "用电安全检查", "description": "检查教室用电设施安全", "isRequired": true, "evidenceType": "photo", "checkpoints": ["插座完好无损", "电线无裸露", "电器正常工作", "开关灵活有效"]},
  {"order": 2, "title": "消防设施检查", "description": "检查消防设施是否完备有效", "isRequired": true, "evidenceType": "photo", "checkpoints": ["灭火器在位", "灭火器在有效期内", "消防通道畅通"]},
  {"order": 3, "title": "门窗锁具检查", "description": "检查门窗锁具是否完好", "isRequired": true, "evidenceType": "photo", "checkpoints": ["门锁完好", "窗户开关正常", "玻璃无裂纹"]},
  {"order": 4, "title": "桌椅设施检查", "description": "检查桌椅等设施是否安全", "isRequired": true, "evidenceType": "photo", "checkpoints": ["桌椅稳固无松动", "无尖锐边角暴露", "无钉子外露"]},
  {"order": 5, "title": "尖锐物品检查", "description": "检查是否有危险物品", "isRequired": true, "evidenceType": "photo", "checkpoints": ["剪刀等工具收纳", "无玻璃碎片", "无其他危险物品"]},
  {"order": 6, "title": "上报整改", "description": "发现隐患及时上报处理", "isRequired": true, "evidenceType": "text", "checkpoints": ["填写隐患上报单", "联系总务处", "跟踪整改进度"]}
]'::jsonb, true);

-- 5.4 家校沟通记录 SOP
INSERT INTO sop_templates (name, category, description, steps, is_system) VALUES
('家校沟通记录流程', 'communication', '与家长沟通时的标准化记录流程，确保沟通有据可查', 
'[
  {"order": 1, "title": "确定沟通事由", "description": "明确本次沟通的目的和内容", "isRequired": true, "evidenceType": "text", "checkpoints": ["明确沟通主题", "准备相关材料", "预判家长反应"]},
  {"order": 2, "title": "进行沟通", "description": "与家长进行沟通", "isRequired": true, "evidenceType": "text", "checkpoints": ["说明情况客观", "听取家长意见", "共同商讨方案"]},
  {"order": 3, "title": "记录沟通内容", "description": "详细记录沟通内容", "isRequired": true, "evidenceType": "text", "checkpoints": ["记录时间、方式", "记录沟通要点", "记录达成的共识"]},
  {"order": 4, "title": "留存证据", "description": "保存沟通证据", "isRequired": false, "evidenceType": "photo", "checkpoints": ["截图保存微信记录", "保存通话录音", "保留书面确认"]},
  {"order": 5, "title": "后续跟进", "description": "根据需要设置后续跟进", "isRequired": true, "evidenceType": "text", "checkpoints": ["设置跟进提醒", "记录跟进结果", "闭环处理"]}
]'::jsonb, true);

-- 5.5 违纪处理 SOP
INSERT INTO sop_templates (name, category, description, steps, is_system, evidence_required) VALUES
('学生违纪处理流程', 'discipline', '学生违纪行为的标准化处理流程', 
'[
  {"order": 1, "title": "核实违纪事实", "description": "客观核实违纪行为", "isRequired": true, "evidenceType": "photo", "checkpoints": ["确认违纪事实", "收集相关证据", "询问当事人"]},
  {"order": 2, "title": "与学生谈话", "description": "与学生进行教育谈话", "isRequired": true, "evidenceType": "text", "checkpoints": ["指出错误行为", "了解违纪原因", "引导认识错误", "学生书面说明"]},
  {"order": 3, "title": "确定处理方式", "description": "根据情节确定处理方式", "isRequired": true, "evidenceType": "text", "checkpoints": ["评估违纪程度", "参照校规规定", "确定处分等级"]},
  {"order": 4, "title": "通知家长", "description": "通知家长并取得配合", "isRequired": true, "evidenceType": "signature", "checkpoints": ["电话通知家长", "说明处理意见", "家长签字确认"]},
  {"order": 5, "title": "上报存档", "description": "按要求上报并存档", "isRequired": true, "evidenceType": "text", "checkpoints": ["上报德育处", "存档记录", "跟踪教育效果"]},
  {"order": 6, "title": "后续教育", "description": "持续关注学生表现", "isRequired": true, "evidenceType": "text", "checkpoints": ["定期谈话", "观察日常表现", "记录转变情况"]}
]'::jsonb, true, true);

-- 5.6 应急处置 SOP
INSERT INTO sop_templates (name, category, description, steps, is_system, timeout_minutes) VALUES
('突发安全事件应急处置', 'emergency', '发生突发安全事件时的紧急处置流程', 
'[
  {"order": 1, "title": "立即控制现场", "description": "第一时间控制事态发展", "isRequired": true, "evidenceType": "text", "checkpoints": ["确保学生安全", "保护现场", "防止事态扩大"]},
  {"order": 2, "title": "紧急上报", "description": "立即向学校领导汇报", "isRequired": true, "evidenceType": "text", "checkpoints": ["通知校领导", "通知相关处室", "启动应急预案"]},
  {"order": 3, "title": "救助受伤人员", "description": "如有受伤立即救助", "isRequired": true, "evidenceType": "photo", "checkpoints": ["联系校医/120", "初步急救处理", "送医救治"]},
  {"order": 4, "title": "通知家长", "description": "及时通知相关家长", "isRequired": true, "evidenceType": "text", "checkpoints": ["说明情况", "安抚家长情绪", "告知处理进展"]},
  {"order": 5, "title": "记录过程", "description": "详细记录事件处理全过程", "isRequired": true, "evidenceType": "photo", "checkpoints": ["记录时间线", "保留证据", "拍照留痕"]},
  {"order": 6, "title": "配合调查", "description": "配合学校/相关部门调查", "isRequired": true, "evidenceType": "text", "checkpoints": ["如实说明情况", "提供相关材料", "协助调查"]},
  {"order": 7, "title": "善后处理", "description": "做好后续善后工作", "isRequired": true, "evidenceType": "signature", "checkpoints": ["安抚学生情绪", "心理辅导", "总结反思", "完善预案"]}
]'::jsonb, true, true, 120);

-- =====================================================
-- 6. 更新时间触发器
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_sop_templates_updated_at
  BEFORE UPDATE ON sop_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sop_executions_updated_at
  BEFORE UPDATE ON sop_executions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ledger_entries_updated_at
  BEFORE UPDATE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
