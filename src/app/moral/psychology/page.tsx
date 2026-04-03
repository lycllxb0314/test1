/**
 * 德育端 - 心理预警管理页面
 */

import { Metadata } from 'next';
import { PsychologyAlertsContent } from './PsychologyAlertsContent';

export const metadata: Metadata = {
  title: '心理预警管理',
  description: '管理学生心理危机预警',
};

export default function PsychologyAlertsPage() {
  return <PsychologyAlertsContent />;
}
