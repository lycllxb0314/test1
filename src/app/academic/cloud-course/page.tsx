'use client';

/**
 * 教务处 - 云教学管理页面
 * 管理教师研修课程（research）为主，可兼管家长/学生课程
 */

import { CloudCourseManagement, DOMAIN_CONFIGS } from '@/components/cloud-course/CloudCourseManagement';

export default function AcademicCloudCoursePage() {
  return (
    <CloudCourseManagement
      mode="department"
      title="云教学管理"
      subtitle="教师研修课程管理 · 家长/学生课程管理 · 推送管理"
      domains={[
        DOMAIN_CONFIGS.research,
        DOMAIN_CONFIGS.parent,
        DOMAIN_CONFIGS.student,
      ]}
      defaultDomain="research"
      creatableDomains={[
        DOMAIN_CONFIGS.research,
        DOMAIN_CONFIGS.parent,
        DOMAIN_CONFIGS.student,
      ]}
    />
  );
}
