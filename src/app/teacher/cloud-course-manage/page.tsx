'use client';

/**
 * 班主任 - 云教学管理页面
 * 管理本班家长课程和学生课程的推送 + 查看学习进度
 */

import { CloudCourseManagement } from '@/components/cloud-course/CloudCourseManagement';
import { useAuth } from '@/contexts/AuthContext';

export default function TeacherCloudCourseManagePage() {
  const { user } = useAuth();

  return (
    <CloudCourseManagement
      mode="class"
      defaultDomain="parent"
      classId={user?.classId}
      className={user?.className}
    />
  );
}
