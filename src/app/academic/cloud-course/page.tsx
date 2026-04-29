'use client';

/**
 * 教务处 - 云教学管理页面
 * 管理教师研修课程（research）为主，可兼管家长/学生课程
 */

import { CloudCourseManagement } from '@/components/cloud-course/CloudCourseManagement';

export default function AcademicCloudCoursePage() {
  return (
    <CloudCourseManagement
      mode="department"
      defaultDomain="research"
    />
  );
}
