'use client';

/**
 * 申报表打印页面
 *
 * 功能：
 * - 展示申报表内容
 * - 学校 Logo 水印
 * - 审批意见
 * - 打印样式
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Printer, ArrowLeft, Loader2 } from 'lucide-react';
import type { HonorApplication } from '@/types/honor-campaign';
import { APPROVAL_STEP_NAMES } from '@/types/honor-campaign';

// ==================== 主组件 ====================

export default function HonorApplicationPrintPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params.id as string;

  const [application, setApplication] = useState<HonorApplication | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载申报详情
  useEffect(() => {
    const loadApplication = async () => {
      try {
        const res = await fetch(`/api/honor-applications/${applicationId}`, {
          credentials: 'include',
        });
        const result = await res.json();

        if (result.success) {
          setApplication(result.data);
        } else {
          toast.error(result.message || '加载失败');
        }
      } catch (err) {
        console.error('加载申报详情失败:', err);
        toast.error('加载失败');
      } finally {
        setLoading(false);
      }
    };

    if (applicationId) {
      loadApplication();
    }
  }, [applicationId]);

  // 打印
  const handlePrint = () => {
    window.print();
  };

  // 返回
  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">申报记录不存在</p>
      </div>
    );
  }

  // ==================== 渲染 ====================

  return (
    <div className="min-h-screen bg-gray-50 py-8 print:py-0 print:bg-white">
      {/* 工具栏 - 打印时隐藏 */}
      <div className="max-w-4xl mx-auto px-4 mb-4 print:hidden">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            打印
          </Button>
        </div>
      </div>

      {/* 申报表内容 */}
      <div className="max-w-4xl mx-auto px-4 print:px-8 print:max-w-none">
        <Card className="border-2 print:border-gray-300 print:shadow-none print:rounded-none">
          <CardContent className="p-8 print:p-12">
            {/* 学校 Logo 和标题 */}
            <div className="text-center mb-8 print:mb-12">
              <div className="flex items-center justify-center gap-4 mb-4">
                {/* 学校 Logo */}
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center print:bg-gray-100">
                  <span className="text-2xl font-bold text-primary print:text-gray-700">校</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold print:text-xl">{application.campaign?.title}</h1>
                  <p className="text-gray-500 print:text-gray-600 mt-1">申报表</p>
                </div>
              </div>
              <div className="w-32 h-1 bg-primary/20 mx-auto print:bg-gray-200"></div>
            </div>

            {/* 基本信息 */}
            <div className="grid grid-cols-2 gap-6 mb-8 print:mb-10 print:gap-8">
              <div className="border-b border-gray-200 pb-3 print:pb-4">
                <span className="text-gray-500 print:text-gray-600 text-sm">学生姓名</span>
                <p className="text-lg font-medium print:font-normal">{application.studentName}</p>
              </div>
              <div className="border-b border-gray-200 pb-3 print:pb-4">
                <span className="text-gray-500 print:text-gray-600 text-sm">所在班级</span>
                <p className="text-lg font-medium print:font-normal">{application.className}</p>
              </div>
              <div className="border-b border-gray-200 pb-3 print:pb-4">
                <span className="text-gray-500 print:text-gray-600 text-sm">申报荣誉</span>
                <p className="text-lg font-medium print:font-normal">{application.campaign?.honorType}</p>
              </div>
              <div className="border-b border-gray-200 pb-3 print:pb-4">
                <span className="text-gray-500 print:text-gray-600 text-sm">申报日期</span>
                <p className="text-lg font-medium print:font-normal">
                  {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '-'}
                </p>
              </div>
            </div>

            {/* 申报内容 */}
            <div className="space-y-6 mb-8 print:mb-10">
              {Object.entries(application.formData).map(([key, value]) => (
                <div key={key} className="border-b border-gray-200 pb-4 print:pb-6">
                  <h3 className="font-medium mb-2 print:font-normal print:mb-3">{key}</h3>
                  <p className="text-gray-600 print:text-gray-800 whitespace-pre-wrap leading-relaxed print:leading-loose">
                    {value || '-'}
                  </p>
                </div>
              ))}
            </div>

            {/* 已获奖荣誉 */}
            {application.existingHonors && application.existingHonors.length > 0 && (
              <div className="mb-8 print:mb-10">
                <h3 className="font-medium mb-4 print:font-normal print:mb-6">已获奖荣誉</h3>
                <table className="w-full border-collapse border border-gray-300 print:border-gray-400">
                  <thead>
                    <tr className="bg-gray-50 print:bg-gray-100">
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">荣誉名称</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">级别</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">类别</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">颁发单位</th>
                      <th className="border border-gray-300 px-3 py-2 text-left text-sm">获奖日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {application.existingHonors.map((honor, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{honor.title}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{honor.level || '校级'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{honor.category || '其他'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{honor.issuer || '-'}</td>
                        <td className="border border-gray-300 px-3 py-2 text-sm">{honor.date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 审批意见 */}
            <div className="border-t-2 border-gray-200 pt-8 print:pt-10">
              <h3 className="font-medium mb-6 print:font-normal print:mb-8">审批意见</h3>
              <div className="space-y-6 print:space-y-8">
                {application.approvalComments.map((comment, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 print:rounded-none print:border-0 print:border-b print:p-0 print:pb-6">
                    <div className="flex items-center justify-between mb-3 print:mb-4">
                      <span className="font-medium print:font-normal">{APPROVAL_STEP_NAMES[comment.step]}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 print:text-gray-600">
                          {comment.approverName}
                        </span>
                        {comment.result === 'approved' ? (
                          <Badge className="bg-green-100 text-green-700 print:bg-transparent print:text-green-600">
                            同意
                          </Badge>
                        ) : comment.result === 'rejected' ? (
                          <Badge className="bg-red-100 text-red-700 print:bg-transparent print:text-red-600">
                            不同意
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    {comment.comment && (
                      <p className="text-gray-600 print:text-gray-800 bg-gray-50 p-3 rounded print:bg-transparent print:p-0">
                        {comment.comment}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-2 print:mt-3">
                      {new Date(comment.time).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 底部签字栏 */}
            <div className="mt-12 print:mt-16 grid grid-cols-3 gap-8 print:gap-12">
              <div className="text-center">
                <div className="border-b-2 border-gray-300 mb-2 print:mb-3"></div>
                <p className="text-sm text-gray-500 print:text-gray-600">家长签字</p>
                <p className="text-xs text-gray-400 print:text-gray-500 mt-1">日期：______年______月______日</p>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-gray-300 mb-2 print:mb-3"></div>
                <p className="text-sm text-gray-500 print:text-gray-600">班主任签字</p>
                <p className="text-xs text-gray-400 print:text-gray-500 mt-1">日期：______年______月______日</p>
              </div>
              <div className="text-center">
                <div className="border-b-2 border-gray-300 mb-2 print:mb-3"></div>
                <p className="text-sm text-gray-500 print:text-gray-600">学校盖章</p>
                <p className="text-xs text-gray-400 print:text-gray-500 mt-1">日期：______年______月______日</p>
              </div>
            </div>

            {/* 底部信息 */}
            <div className="mt-12 print:mt-16 text-center text-xs text-gray-400 print:text-gray-500">
              <p>申报编号：{application.id}</p>
              {application.certificateNo && (
                <p className="mt-1">证书编号：{application.certificateNo}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 打印样式 */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          
          /* 隐藏非打印内容 */
          .print\\:hidden {
            display: none !important;
          }
          
          /* 打印特定样式 */
          .print\\:py-0 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          
          .print\\:bg-white {
            background-color: white !important;
          }
          
          .print\\:px-8 {
            padding-left: 2rem !important;
            padding-right: 2rem !important;
          }
          
          .print\\:max-w-none {
            max-width: none !important;
          }
          
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          
          .print\\:p-12 {
            padding: 3rem !important;
          }
          
          .print\\:mb-12 {
            margin-bottom: 3rem !important;
          }
          
          .print\\:text-xl {
            font-size: 1.25rem !important;
          }
          
          .print\\:text-gray-600 {
            color: #4b5563 !important;
          }
          
          .print\\:bg-gray-200 {
            background-color: #e5e7eb !important;
          }
          
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          
          .print\\:text-gray-700 {
            color: #374151 !important;
          }
          
          .print\\:mb-10 {
            margin-bottom: 2.5rem !important;
          }
          
          .print\\:gap-8 {
            gap: 2rem !important;
          }
          
          .print\\:pb-4 {
            padding-bottom: 1rem !important;
          }
          
          .print\\:font-normal {
            font-weight: normal !important;
          }
          
          .print\\:text-gray-800 {
            color: #1f2937 !important;
          }
          
          .print\\:leading-loose {
            line-height: 2 !important;
          }
          
          .print\\:pt-10 {
            padding-top: 2.5rem !important;
          }
          
          .print\\:mb-8 {
            margin-bottom: 2rem !important;
          }
          
          .print\\:space-y-8 > * + * {
            margin-top: 2rem !important;
          }
          
          .print\\:rounded-none {
            border-radius: 0 !important;
          }
          
          .print\\:border-0 {
            border-width: 0 !important;
          }
          
          .print\\:border-b {
            border-bottom-width: 1px !important;
          }
          
          .print\\:p-0 {
            padding: 0 !important;
          }
          
          .print\\:pb-6 {
            padding-bottom: 1.5rem !important;
          }
          
          .print\\:mb-4 {
            margin-bottom: 1rem !important;
          }
          
          .print\\:bg-transparent {
            background-color: transparent !important;
          }
          
          .print\\:text-green-600 {
            color: #16a34a !important;
          }
          
          .print\\:text-red-600 {
            color: #dc2626 !important;
          }
          
          .print\\:mt-3 {
            margin-top: 0.75rem !important;
          }
          
          .print\\:mt-16 {
            margin-top: 4rem !important;
          }
          
          .print\\:gap-12 {
            gap: 3rem !important;
          }
          
          .print\\:mb-3 {
            margin-bottom: 0.75rem !important;
          }
          
          .print\\:text-gray-500 {
            color: #6b7280 !important;
          }
          
          .print\\:pb-6 {
            padding-bottom: 1.5rem !important;
          }
          
          /* 签字栏边框 */
          .print\\:border-b-2 {
            border-bottom-width: 2px !important;
          }
          
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
        }
      `}</style>
    </div>
  );
}
