-- 课后服务选课系统数据库迁移
-- 扩展 after_school_services 表 + 新建 after_school_enrollments 表 + RPC防超卖函数

-- ============================================
-- 1. 扩展 after_school_services 表
-- ============================================

-- 添加面向年级字段
ALTER TABLE after_school_services ADD COLUMN IF NOT EXISTS target_grades integer[] DEFAULT '{}';
-- 添加学期字段
ALTER TABLE after_school_services ADD COLUMN IF NOT EXISTS semester varchar(20) DEFAULT '2025-2026-2';
-- 添加课程封面
ALTER TABLE after_school_services ADD COLUMN IF NOT EXISTS cover_image varchar(500);
-- 添加课程分类（兴趣拓展/学科辅导/体育艺术/科技创客）
ALTER TABLE after_school_services ADD COLUMN IF NOT EXISTS category varchar(50) DEFAULT 'interest';
-- 添加选课开始时间
ALTER TABLE after_school_services ADD COLUMN IF NOT EXISTS enrollment_start timestamptz;
-- 添加选课截止时间
ALTER TABLE after_school_services ADD COLUMN IF NOT EXISTS enrollment_end timestamptz;

-- 将现有数据更新 target_grades 为空数组（已有记录）
UPDATE after_school_services SET target_grades = '{}' WHERE target_grades IS NULL;
UPDATE after_school_services SET semester = '2025-2026-2' WHERE semester IS NULL;

-- ============================================
-- 2. 新建 after_school_enrollments 选课记录表
-- ============================================
CREATE TABLE IF NOT EXISTS after_school_enrollments (
  id varchar(50) PRIMARY KEY,
  course_id varchar(50) NOT NULL REFERENCES after_school_services(id),
  student_id varchar(50) NOT NULL,
  student_name varchar(100),
  class_name varchar(100),
  parent_id varchar(50) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'success',  -- success/cancelled
  cancelled_at timestamptz,
  cancel_reason varchar(200),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- 唯一约束：同一学生同一课程只能选一次
  CONSTRAINT uq_student_course UNIQUE (student_id, course_id),
  -- 检查约束：状态只能是 success 或 cancelled
  CONSTRAINT chk_enrollment_status CHECK (status IN ('success', 'cancelled'))
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON after_school_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON after_school_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_parent_id ON after_school_enrollments(parent_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON after_school_enrollments(status);

-- ============================================
-- 3. 原子选课 RPC 函数（防超卖核心）
-- ============================================
-- 使用 PostgreSQL 事务 + 行级锁保证并发安全
-- 返回 JSON: { success: boolean, enrollment_id: text, error: text }

CREATE OR REPLACE FUNCTION enroll_after_school_course(
  p_course_id varchar,
  p_student_id varchar,
  p_student_name varchar,
  p_class_name varchar,
  p_parent_id varchar
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_course RECORD;
  v_enrollment_id varchar;
  v_existing_count integer;
  v_result jsonb;
BEGIN
  -- 1. 查询课程信息并加行级锁（SELECT FOR UPDATE 防超卖）
  SELECT * INTO v_course
  FROM after_school_services
  WHERE id = p_course_id
  FOR UPDATE;

  -- 课程不存在
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '课程不存在'
    );
  END IF;

  -- 2. 检查课程状态
  IF v_course.status != 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '该课程当前不可选'
    );
  END IF;

  -- 3. 检查选课时间
  IF v_course.enrollment_start IS NOT NULL AND now() < v_course.enrollment_start THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '选课尚未开始'
    );
  END IF;

  IF v_course.enrollment_end IS NOT NULL AND now() > v_course.enrollment_end THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '选课已截止'
    );
  END IF;

  -- 4. 检查容量（使用 enrolledCount = 成功选课记录数）
  SELECT COUNT(*) INTO v_existing_count
  FROM after_school_enrollments
  WHERE course_id = p_course_id AND status = 'success';

  IF v_existing_count >= v_course.max_students THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '该课程名额已满'
    );
  END IF;

  -- 5. 检查时间冲突（同一天已有课程）
  IF EXISTS (
    SELECT 1 FROM after_school_enrollments e
    JOIN after_school_services c ON c.id = e.course_id
    WHERE e.student_id = p_student_id
      AND e.status = 'success'
      AND c.day_of_week = v_course.day_of_week
      AND c.id != p_course_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '该时间段已选报其他课程'
    );
  END IF;

  -- 6. 检查是否已选过该课程（幂等性）
  IF EXISTS (
    SELECT 1 FROM after_school_enrollments
    WHERE student_id = p_student_id AND course_id = p_course_id AND status = 'success'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '您已选报该课程'
    );
  END IF;

  -- 7. 如果之前取消过，恢复状态；否则新建
  IF EXISTS (
    SELECT 1 FROM after_school_enrollments
    WHERE student_id = p_student_id AND course_id = p_course_id AND status = 'cancelled'
  ) THEN
    UPDATE after_school_enrollments
    SET status = 'success',
        cancelled_at = NULL,
        cancel_reason = NULL,
        updated_at = now()
    WHERE student_id = p_student_id AND course_id = p_course_id AND status = 'cancelled'
    RETURNING id INTO v_enrollment_id;
  ELSE
    -- 生成ID并创建选课记录
    v_enrollment_id := 'enr_' || substr(md5(random()::text), 1, 12);

    INSERT INTO after_school_enrollments (id, course_id, student_id, student_name, class_name, parent_id, status)
    VALUES (v_enrollment_id, p_course_id, p_student_id, p_student_name, p_class_name, p_parent_id, 'success');
  END IF;

  -- 8. 更新课程已报名人数（使用真实计数）
  UPDATE after_school_services
  SET current_students = (
    SELECT COUNT(*) FROM after_school_enrollments
    WHERE course_id = p_course_id AND status = 'success'
  ),
  updated_at = now()
  WHERE id = p_course_id;

  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', v_enrollment_id
  );
END;
$$;

-- ============================================
-- 4. 取消选课 RPC 函数
-- ============================================
CREATE OR REPLACE FUNCTION cancel_after_school_enrollment(
  p_course_id varchar,
  p_student_id varchar,
  p_cancel_reason varchar DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_enrollment RECORD;
BEGIN
  -- 查找选课记录并加锁
  SELECT * INTO v_enrollment
  FROM after_school_enrollments
  WHERE course_id = p_course_id AND student_id = p_student_id AND status = 'success'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', '未找到有效的选课记录'
    );
  END IF;

  -- 更新状态为取消
  UPDATE after_school_enrollments
  SET status = 'cancelled',
      cancelled_at = now(),
      cancel_reason = p_cancel_reason,
      updated_at = now()
  WHERE id = v_enrollment.id;

  -- 更新课程人数
  UPDATE after_school_services
  SET current_students = (
    SELECT COUNT(*) FROM after_school_enrollments
    WHERE course_id = p_course_id AND status = 'success'
  ),
  updated_at = now()
  WHERE id = p_course_id;

  RETURN jsonb_build_object(
    'success', true
  );
END;
$$;
