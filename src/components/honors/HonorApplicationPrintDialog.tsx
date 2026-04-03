/**
 * 申报表打印预览弹窗
 * 
 * @module components/honors/HonorApplicationPrintDialog
 * 
 * 功能：
 * - 将申报表 HTML 转换为 PDF
 * - 在弹窗中预览 PDF
 * - 支持下载和打印
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Download,
  Printer,
  Loader2,
  FileText,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { HonorApplication } from '@/types/honor-campaign';
import { APPROVAL_STEP_NAMES } from '@/types/honor-campaign';

/** Props 类型 */
type HonorApplicationPrintDialogProps = {
  /** 是否打开 */
  open: boolean;
  /** 打开/关闭回调 */
  onOpenChange: (open: boolean) => void;
  /** 申报记录 */
  application: HonorApplication | null;
};

/**
 * 申报表打印预览弹窗
 */
export function HonorApplicationPrintDialog({
  open,
  onOpenChange,
  application,
}: HonorApplicationPrintDialogProps) {
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 生成 PDF
  const generatePdf = useCallback(async () => {
    if (!contentRef.current || !application) return;

    setLoading(true);
    try {
      // 等待内容渲染
      await new Promise(resolve => setTimeout(resolve, 100));

      // 使用 html2canvas 截图
      const canvas = await html2canvas(contentRef.current, {
        scale: 2, // 高清
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      // 计算 PDF 尺寸 (A4)
      const imgWidth = 210; // A4 宽度 mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pageHeight = 297; // A4 高度 mm

      // 创建 PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/png');

      // 添加第一页
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 如果内容超过一页，添加更多页
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 生成 Blob URL
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('生成 PDF 失败:', error);
      toast.error('生成 PDF 失败');
    } finally {
      setLoading(false);
    }
  }, [application]);

  // 打开时生成 PDF
  useEffect(() => {
    if (open && application) {
      setPdfUrl(null);
      generatePdf();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, application?.id]);

  // 关闭时清理
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // 下载 PDF
  const handleDownload = () => {
    if (!pdfUrl || !application) return;
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${application.studentName}_${application.campaign?.title || '申报表'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // 打印
  const handlePrint = () => {
    if (!pdfUrl) return;
    const printWindow = window.open(pdfUrl, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (!application) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0">
        {/* 头部 */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-primary" />
              <span>申报表预览</span>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!pdfUrl || loading}
              >
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={!pdfUrl || loading}
              >
                <Printer className="w-4 h-4 mr-1" />
                打印
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 预览区域 */}
        <div className="flex-1 relative overflow-hidden bg-gray-100">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-10">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">正在生成 PDF...</p>
            </div>
          )}
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="PDF 预览"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-400">等待生成...</p>
            </div>
          )}
        </div>

        {/* 隐藏的 HTML 内容用于生成 PDF */}
        <div
          ref={contentRef}
          className="absolute left-[-9999px] top-0 bg-white"
          style={{ width: '800px', padding: '40px' }}
        >
          {/* 学校 Logo 和标题 */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#6b7280' }}>校</span>
              </div>
              <div>
                <h1 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>{application.campaign?.title}</h1>
                <p style={{ color: '#6b7280', marginTop: '4px', margin: 0 }}>申报表</p>
              </div>
            </div>
            <div style={{ width: '128px', height: '4px', background: '#e5e7eb', margin: '0 auto' }} />
          </div>

          {/* 基本信息 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>学生姓名</span>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0' }}>{application.studentName}</p>
            </div>
            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>所在班级</span>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0' }}>{application.className}</p>
            </div>
            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>申报荣誉</span>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0' }}>{application.campaign?.honorType}</p>
            </div>
            <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' }}>
              <span style={{ color: '#6b7280', fontSize: '12px' }}>申报日期</span>
              <p style={{ fontSize: '16px', fontWeight: 500, margin: '4px 0 0 0' }}>
                {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>

          {/* 申报内容 */}
          <div style={{ marginBottom: '32px' }}>
            {Object.entries(application.formData).map(([key, value]) => (
              <div key={key} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 500, marginBottom: '8px', fontSize: '14px' }}>{key}</h3>
                <p style={{ color: '#4b5563', whiteSpace: 'pre-wrap', lineHeight: 1.8, margin: 0, fontSize: '14px' }}>
                  {value || '-'}
                </p>
              </div>
            ))}
          </div>

          {/* 已获奖荣誉 */}
          {application.existingHonors && application.existingHonors.length > 0 && (
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{ fontWeight: 500, marginBottom: '16px', fontSize: '14px' }}>已获奖荣誉</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left' }}>荣誉名称</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left' }}>级别</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left' }}>类别</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left' }}>颁发单位</th>
                    <th style={{ border: '1px solid #d1d5db', padding: '8px', textAlign: 'left' }}>获奖日期</th>
                  </tr>
                </thead>
                <tbody>
                  {application.existingHonors.map((honor, index) => (
                    <tr key={index}>
                      <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{honor.title}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{honor.level || '校级'}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{honor.category || '其他'}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{honor.issuer || '-'}</td>
                      <td style={{ border: '1px solid #d1d5db', padding: '8px' }}>{honor.date || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* 审批意见 */}
          {application.approvalComments.length > 0 && (
            <div style={{ borderTop: '2px solid #e5e7eb', paddingTop: '32px', marginBottom: '32px' }}>
              <h3 style={{ fontWeight: 500, marginBottom: '24px' }}>审批意见</h3>
              {application.approvalComments.map((comment, index) => (
                <div key={index} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '16px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 500 }}>{APPROVAL_STEP_NAMES[comment.step]}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>{comment.approverName}</span>
                      <span style={{
                        fontSize: '12px',
                        color: comment.result === 'approved' ? '#16a34a' : '#dc2626',
                      }}>
                        {comment.result === 'approved' ? '同意' : comment.result === 'rejected' ? '不同意' : ''}
                      </span>
                    </div>
                  </div>
                  {comment.comment && (
                    <p style={{ color: '#4b5563', background: '#f9fafb', padding: '12px', borderRadius: '4px', margin: 0, fontSize: '14px' }}>
                      {comment.comment}
                    </p>
                  )}
                  <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '8px', margin: '8px 0 0 0' }}>
                    {new Date(comment.time).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 底部签字栏 */}
          <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '2px solid #d1d5db', marginBottom: '8px' }} />
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>家长签字</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>日期：______年______月______日</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '2px solid #d1d5db', marginBottom: '8px' }} />
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>班主任签字</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>日期：______年______月______日</p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ borderBottom: '2px solid #d1d5db', marginBottom: '8px' }} />
              <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>学校盖章</p>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px', margin: '4px 0 0 0' }}>日期：______年______月______日</p>
            </div>
          </div>

          {/* 底部信息 */}
          <div style={{ marginTop: '48px', textAlign: 'center', fontSize: '11px', color: '#9ca3af' }}>
            <p style={{ margin: 0 }}>申报编号：{application.id}</p>
            {application.certificateNo && (
              <p style={{ marginTop: '4px', margin: '4px 0 0 0' }}>证书编号：{application.certificateNo}</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
