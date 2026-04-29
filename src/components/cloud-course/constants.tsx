import React from 'react';
import { GraduationCap, Users, BookOpen } from 'lucide-react';
import type { CourseDomain } from '@/types/cloud-course';

export type DomainConfig = {
  domain: CourseDomain;
  label: string;
  color: string;
  bg: string;
  icon: React.ReactNode;
  gradient: string;
};

export const DOMAIN_CONFIGS: Record<string, DomainConfig> = {
  research: { domain: 'research', label: '教师研修', color: 'text-[#A0785A]', bg: 'bg-[#FBF7F2]', icon: <GraduationCap className="h-5 w-5" />, gradient: 'from-[#A0785A] to-[#C9A96E]' },
  parent:   { domain: 'parent',   label: '家长课程', color: 'text-[#5C7A72]', bg: 'bg-[#F0F5F3]', icon: <Users className="h-5 w-5" />, gradient: 'from-[#5C7A72] to-[#7DB5A8]' },
  student:  { domain: 'student',  label: '学生课程', color: 'text-[#C8956C]', bg: 'bg-[#FBF3ED]', icon: <BookOpen className="h-5 w-5" />, gradient: 'from-[#C8956C] to-[#C9A96E]' },
};

export type ModeConfig = {
  department: { domains: DomainConfig[] };
  class: { domains: DomainConfig[] };
};

export const MODE_CONFIGS: ModeConfig = {
  department: {
    domains: [DOMAIN_CONFIGS.research, DOMAIN_CONFIGS.parent, DOMAIN_CONFIGS.student],
  },
  class: {
    domains: [DOMAIN_CONFIGS.parent, DOMAIN_CONFIGS.student],
  },
};
