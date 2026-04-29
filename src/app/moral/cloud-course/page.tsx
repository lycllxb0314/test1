'use client';

/**
 * 德育处 - 云教学管理页面
 * 管理家长课程（parent）和学生课程（student）为主
 */

import { CloudCourseManagement, DOMAIN_CONFIGS } from '@/components/cloud-course/CloudCourseManagement';

export default function MoralCloudCoursePage() {
  return (
    <CloudCourseManagement
      mode="department"
      title="云教学管理"
      subtitle="家长课程管理 · 学生课程管理 · 推送管理"
      domains={[
        DOMAIN_CONFIGS.parent,
        DOMAIN_CONFIGS.student,
      ]}
      defaultDomain="parent"
      creatableDomains={[
        DOMAIN_CONFIGS.parent,
        DOMAIN_CONFIGS.student,
      ]}
    />
  );
}
