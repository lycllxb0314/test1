'use client';

/**
 * 班主任 - 云教学管理页面
 * 管理本班学生课程推送 + 查看学习进度
 */

import { CloudCourseManagement, DOMAIN_CONFIGS } from '@/components/cloud-course/CloudCourseManagement';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherCloudCourseManagePage() {
  const { user } = useAuth();

  return (
    <CloudCourseManagement
      mode="class"
      title="云教学管理"
      subtitle="推送学生课程 · 查看本班学习进度"
      domains={[DOMAIN_CONFIGS.student]}
      defaultDomain="student"
      classId={user?.classId}
      className={user?.className}
    />
  );
}
