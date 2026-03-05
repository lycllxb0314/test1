'use client';

import React, { use } from 'react';
import ExamFormPage from '@/components/exam/ExamFormPage';

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  return <ExamFormPage examId={resolvedParams.id} />;
}
