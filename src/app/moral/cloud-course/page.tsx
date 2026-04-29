'use client';

/**
 * 德育处 - 云教学管理页面
 * 管理家长课程（parent）和学生课程（student）为主
 */

import { CloudCourseManagement } from '@/components/cloud-course/CloudCourseManagement';

export default function MoralCloudCoursePage() {
  return (
    <CloudCourseManagement
      mode="department"
      defaultDomain="parent"
    />
  );
}
