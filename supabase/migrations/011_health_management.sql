-- =====================================================
-- 学生体育健康管理平台 - 数据库迁移
-- =====================================================
-- 模块归属：德育处（独立模块，数据共享至教务/班主任/家长端）
-- 核心表：健康档案、体质测评、家长观察、健康画像、健康处方、周期报告

-- 1. 健康档案（聚合根：一个学生一条档案）
CREATE TABLE IF NOT EXISTS health_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(20) NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  blood_type VARCHAR(10),
  allergies TEXT[],
  chronic_conditions TEXT[],
  emergency_contact VARCHAR(50),
  emergency_phone VARCHAR(20),
  medical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 体质健康测评记录（学期级，批量导入）
CREATE TABLE IF NOT EXISTS fitness_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(20) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  academic_year VARCHAR(10) NOT NULL,      -- 如 2025-2026
  semester VARCHAR(5) NOT NULL,            -- 上学期/下学期
  test_date DATE,
  
  -- 身体形态
  height_cm DECIMAL(5,1),                  -- 身高(cm)
  weight_kg DECIMAL(5,1),                  -- 体重(kg)
  bmi DECIMAL(4,1),                        -- BMI
  
  -- 身体机能
  vital_capacity INTEGER,                  -- 肺活量(ml)
  
  -- 身体素质 - 速度
  run_50m DECIMAL(4,2),                    -- 50米跑(秒)
  run_50x8 DECIMAL(5,2),                   -- 50米×8往返跑(秒)
  
  -- 身体素质 - 柔韧
  sit_and_reach DECIMAL(4,1),              -- 坐位体前屈(cm)
  
  -- 身体素质 - 力量
  sit_ups_1min INTEGER,                    -- 1分钟仰卧起坐(次)
  rope_jump_1min INTEGER,                  -- 1分钟跳绳(次)
  
  -- 综合评价
  total_score DECIMAL(5,1),                -- 总分
  grade_level VARCHAR(10),                 -- 等级：优秀/良好/及格/不及格
  
  -- 视力（体检数据合并至此）
  vision_left DECIMAL(3,1),               -- 左眼视力
  vision_right DECIMAL(3,1),              -- 右眼视力

  -- 体检扩展字段
  dental_caries_left INTEGER,              -- 龋齿(左)
  dental_caries_right INTEGER,             -- 龋齿(右)
  dental_filling_left INTEGER,             -- 已补(左)
  dental_filling_right INTEGER,            -- 已补(右)
  dental_missing_left INTEGER,             -- 缺失(左)
  dental_missing_right INTEGER,            -- 缺失(右)
  spine_normal BOOLEAN,                    -- 脊柱是否正常
  systolic_bp INTEGER,                     -- 收缩压
  diastolic_bp INTEGER,                    -- 舒张压
  heart_rate INTEGER,                      -- 心率
  color_blindness VARCHAR(10),             -- 色觉
  hearing_left VARCHAR(10),               -- 左耳听力
  hearing_right VARCHAR(10),              -- 右耳听力
  checkup_notes TEXT,                      -- 体检备注

  -- 数据来源
  source VARCHAR(20) NOT NULL DEFAULT 'import',  -- import/excel/manual
  imported_by VARCHAR(20),                 -- 导入人工号
  imported_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(student_id, academic_year, semester)
);

-- 3. 家长每日观察数据（日级，极简3选1）
CREATE TABLE IF NOT EXISTS parent_daily_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id VARCHAR(20) NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  student_id VARCHAR(20) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  observation_date DATE NOT NULL,
  
  -- 3选项极简设计
  sleep_quality VARCHAR(20) NOT NULL DEFAULT 'normal',  -- sufficient/normal/insufficient
  diet_quality VARCHAR(20) NOT NULL DEFAULT 'normal',    -- balanced/picky/overeating
  energy_level VARCHAR(20) NOT NULL DEFAULT 'normal',    -- energetic/normal/tired
  
  -- 补充说明
  note TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(parent_id, observation_date)
);

-- 4. 学生健康画像（AI计算结果，多数据源收敛点）
CREATE TABLE IF NOT EXISTS student_health_portraits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(20) NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  
  -- BMI 评估
  bmi_status VARCHAR(20),                  -- underweight/normal/overweight/obese
  bmi_trend VARCHAR(20),                   -- improving/stable/worsening
  
  -- 体质综合评估
  fitness_level VARCHAR(20),               -- excellent/good/pass/fail
  fitness_trend VARCHAR(20),               -- improving/stable/declining
  
  -- 运动习惯评估
  exercise_habit_score INTEGER,            -- 0-100
  exercise_frequency VARCHAR(20),          -- daily/often/sometimes/rarely
  
  -- 睡眠评估
  sleep_score INTEGER,                     -- 0-100
  sleep_pattern VARCHAR(20),               -- good/normal/poor
  
  -- 饮食评估
  diet_score INTEGER,                      -- 0-100
  diet_pattern VARCHAR(20),                -- balanced/normal/poor
  
  -- 综合健康分
  overall_health_score INTEGER,            -- 0-100
  overall_status VARCHAR(20),              -- excellent/good/attention/warning
  
  -- AI 分析摘要
  ai_summary TEXT,
  risk_factors TEXT[],                      -- 风险因素标签
  strengths TEXT[],                         -- 优势标签
  
  -- 数据新鲜度
  last_assessment_date DATE,
  last_observation_date DATE,
  data_sources TEXT[],                      -- 参与计算的数据源列表
  
  computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. 健康处方（膳食建议 + 运动处方，存储独立）
CREATE TABLE IF NOT EXISTS health_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(20) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  portrait_id UUID REFERENCES student_health_portraits(id) ON DELETE SET NULL,
  
  prescription_type VARCHAR(20) NOT NULL,  -- diet/exercise/comprehensive
  period_type VARCHAR(20) NOT NULL,        -- weekly/monthly/quarterly
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- 膳食建议
  daily_calories_target INTEGER,           -- 目标日摄入热量(kcal)
  nutrition_advice JSONB,                  -- 营养建议（碳水/蛋白/脂肪/维生素等）
  diet_taboos TEXT[],                      -- 饮食禁忌
  meal_suggestions JSONB,                  -- 一日三餐建议
  
  -- 运动处方
  exercise_type VARCHAR(50),               -- 推荐运动类型
  exercise_frequency INTEGER,              -- 每周次数
  exercise_duration_min INTEGER,           -- 每次时长(分钟)
  exercise_intensity VARCHAR(20),          -- low/medium/high
  exercise_notes TEXT,                     -- 运动注意事项
  
  -- AI 生成信息
  ai_model VARCHAR(50),
  ai_prompt_version VARCHAR(20),
  
  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'active',  -- active/completed/superseded
  confirmed_by VARCHAR(20),                -- 确认人工号
  confirmed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. 周期报告（按时间周期生成的复合产物）
CREATE TABLE IF NOT EXISTS health_cycle_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id VARCHAR(20) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  report_type VARCHAR(20) NOT NULL,        -- weekly/monthly/semester
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- 报告内容
  summary TEXT,                             -- 综合摘要
  fitness_changes TEXT,                     -- 体质变化
  exercise_stats JSONB,                     -- 运动统计数据
  diet_assessment TEXT,                     -- 饮食评估
  sleep_assessment TEXT,                    -- 睡眠评估
  recommendations TEXT,                     -- 建议
  
  -- AI 相关
  generated_by VARCHAR(20) NOT NULL DEFAULT 'ai',  -- ai/manual
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  UNIQUE(student_id, report_type, period_start)
);

-- 7. 扩展习惯打卡表 - 新增运动维度字段
ALTER TABLE habit_daily_records ADD COLUMN IF NOT EXISTS exercise_type VARCHAR(50);
ALTER TABLE habit_daily_records ADD COLUMN IF NOT EXISTS duration_min INTEGER;
ALTER TABLE habit_daily_records ADD COLUMN IF NOT EXISTS intensity VARCHAR(20);

-- 8. 扩展习惯目标模板 - 支持健康维度
ALTER TABLE habit_goal_templates ADD COLUMN IF NOT EXISTS health_dimension VARCHAR(20);

-- 9. 扩展德育活动 - 支持健康主题活动
ALTER TABLE moral_activities ADD COLUMN IF NOT EXISTS health_dimension VARCHAR(20);
ALTER TABLE moral_activities ADD COLUMN IF NOT EXISTS health_tags TEXT[];

-- 10. 医务室部门 - 添加到部门群组体系
-- 通过 user_groups 表实现，新增 'clinic_office' 群组类型
-- 对应的 GroupType 需要在 types/user.ts 中扩展

-- 索引
CREATE INDEX IF NOT EXISTS idx_fitness_assessments_student ON fitness_assessments(student_id);
CREATE INDEX IF NOT EXISTS idx_fitness_assessments_year_sem ON fitness_assessments(academic_year, semester);
CREATE INDEX IF NOT EXISTS idx_parent_observations_student_date ON parent_daily_observations(student_id, observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_parent_observations_parent_date ON parent_daily_observations(parent_id, observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_prescriptions_student ON health_prescriptions(student_id);
CREATE INDEX IF NOT EXISTS idx_health_prescriptions_status ON health_prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_health_cycle_reports_student ON health_cycle_reports(student_id);
CREATE INDEX IF NOT EXISTS idx_health_profiles_student ON health_profiles(student_id);

-- 注释
COMMENT ON TABLE health_profiles IS '学生健康档案-聚合根';
COMMENT ON TABLE fitness_assessments IS '体质健康测评记录-学期级批量导入';
COMMENT ON TABLE parent_daily_observations IS '家长每日观察数据-3选1极简设计';
COMMENT ON TABLE student_health_portraits IS '学生健康画像-AI多数据源收敛点';
COMMENT ON TABLE health_prescriptions IS '健康处方-膳食建议+运动处方';
COMMENT ON TABLE health_cycle_reports IS '周期健康报告-周/月/学期';
