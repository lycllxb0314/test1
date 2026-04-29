import React, { memo } from 'react';
import type { CloudCourse } from '@/types/cloud-course';
import type { DomainConfig } from './constants';
import { DomainCourseSection } from './DomainCourseSection';

type CoursesTabProps = {
  domains: DomainConfig[];
  includeDraft: boolean;
  onMutation: () => void;
  onEdit: (course: CloudCourse) => void;
};

export const CoursesTab = memo(function CoursesTab({ domains, includeDraft, onMutation, onEdit }: CoursesTabProps) {
  return (
    <div className="space-y-8">
      {domains.map(dc => (
        <DomainCourseSection key={dc.domain} domain={dc.domain} domainConfig={dc} includeDraft={includeDraft} onMutation={onMutation} onEdit={onEdit} />
      ))}
    </div>
  );
});
