/**
 * 申报表打印预览弹窗
 * 
 * @module components/honors/HonorApplicationPrintDialog
 * 
 * 功能：
 * - 立即显示HTML预览（无需等待）
 * - 后台异步生成PDF
 * - 申报专属水印（学校logo+学校名称）
 * - 支持下载和打印
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Download,
  Printer,
  Loader2,
  FileText,
  FileOutput,
} from 'lucide-react';
import html2pdf from 'html2pdf.js';
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
  /** 学校名称 */
  schoolName?: string;
};

/**
 * 申报表打印预览弹窗
 */
export function HonorApplicationPrintDialog({
  open,
  onOpenChange,
  application,
  schoolName = '龙岩师范附属小学',
}: HonorApplicationPrintDialogProps) {
  const [generating, setGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 生成 PDF（使用 html2pdf.js）
  const generatePdf = useCallback(async () => {
    if (!contentRef.current || !application) return;

    setGenerating(true);
    const startTime = Date.now();
    
    try {
      // html2pdf 配置
      const opt = {
        margin: [30, 27, 27, 27] as [number, number, number, number], // 上、左、下、右（mm）
        filename: `${application.studentName}_${application.campaign?.title || '申报表'}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.95 },
        html2canvas: { 
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
        },
        jsPDF: { 
          unit: 'mm' as const, 
          format: 'a4' as const, 
          orientation: 'portrait' as const,
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'],
          before: '.page-break-before',
          after: '.page-break-after',
          avoid: ['tr', 'table'],
        },
      };

      // 生成 PDF blob
      const pdfBlob = await html2pdf().set(opt).from(contentRef.current).outputPdf('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      
      console.log(`PDF生成完成，耗时: ${(Date.now() - startTime) / 1000}s`);
      
    } catch (error) {
      console.error('生成 PDF 失败:', error);
      const errorMessage = error instanceof Error ? error.message : '生成 PDF 失败';
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  }, [application, schoolName]);

  // 打开时异步生成 PDF
  useEffect(() => {
    if (open && application) {
      setPdfUrl(null);
      // 延迟生成 PDF，让用户先看到 HTML 预览
      const timer = setTimeout(() => {
        generatePdf();
      }, 500);
      return () => clearTimeout(timer);
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

  // 快速打印 HTML（直接打印预览内容）
  const handleQuickPrint = () => {
    if (!contentRef.current || !application) return;
    
    // 创建打印窗口
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('无法打开打印窗口，请检查浏览器设置');
      return;
    }

    // 获取当前内容的 HTML
    const contentHtml = contentRef.current.innerHTML;
    
    // 创建打印页面
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>申报表打印 - ${application.studentName}</title>
        <style>
          @page {
            size: A4;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: 0 auto;
            box-sizing: border-box;
          }
          @media print {
            .page {
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="page">${contentHtml}</div>
        <script>
          // 自动打印
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!application) return null;

  const campaign = application.campaign;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col p-0">
        {/* 头部 */}
        <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-base">
              <FileText className="w-5 h-5 text-primary" />
              <span>申报表预览</span>
              {generating && (
                <span className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  生成PDF中...
                </span>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickPrint}
                title="直接打印（快速）"
              >
                <FileOutput className="w-4 h-4 mr-1" />
                快速打印
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={!pdfUrl}
                title="下载PDF文件"
              >
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button
                size="sm"
                onClick={handlePrint}
                disabled={!pdfUrl}
                title="打印PDF文件"
              >
                <Printer className="w-4 h-4 mr-1" />
                打印
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 预览区域 - 立即显示 HTML 预览 */}
        <div className="flex-1 relative overflow-auto bg-gray-100 print:bg-white">
          {/* HTML 内容预览（立即显示） */}
          <div 
            ref={contentRef}
            className="bg-white mx-auto print:mx-0 print:w-full relative"
            style={{ 
              width: '210mm', 
              minHeight: '297mm',
              padding: '30mm 27mm 27mm 27mm',
            }}
          >
            {/* 标题 */}
            <div style={{ textAlign: 'center', marginBottom: '8mm' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
                {/* 学校 Logo */}
                <img 
                  src="/logo-school.png" 
                  alt={schoolName}
                  style={{
                    width: '40px',
                    height: '40px',
                    objectFit: 'contain',
                  }}
                />
                <h1 style={{ 
                  fontSize: '22px', 
                  fontWeight: 'bold', 
                  margin: 0, 
                  fontFamily: 'SimHei, "Microsoft YaHei", sans-serif',
                  letterSpacing: '4px',
                }}>
                  {campaign?.title || '荣誉评选申报表'}
                </h1>
              </div>
            </div>

            {/* 主表格 */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '14px',
              fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif',
            }}>
              {/* 基本信息行 */}
              <tbody>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', width: '20%', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500 }}>姓　名</td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', width: '30%', textAlign: 'center' }}>{application.studentName}</td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', width: '20%', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500 }}>班　级</td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', width: '30%', textAlign: 'center' }}>{application.className}</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500 }}>申报荣誉</td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>{campaign?.honorType || '-'}</td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500 }}>申报日期</td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'center' }}>
                    {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 申报内容表格 */}
            {(() => {
              const fieldLabels: Record<string, string> = {};
              if (campaign?.formConfig?.fields) {
                campaign.formConfig.fields.forEach(f => {
                  fieldLabels[f.field] = f.label;
                });
              }
              return Object.entries(application.formData).map(([key, value]) => (
                <table key={key} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', width: '20%', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500, verticalAlign: 'top' }}>
                        {fieldLabels[key] || key}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', minHeight: '60px', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {value || '-'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ));
            })()}

            {/* 已获奖荣誉表格 */}
            {application.existingHonors && application.existingHonors.length > 0 && (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500 }}>已获奖荣誉</td>
                    </tr>
                  </tbody>
                </table>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                  <thead>
                    <tr>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '35%' }}>荣誉名称</th>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '15%' }}>级别</th>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '15%' }}>类别</th>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '20%' }}>颁发单位</th>
                      <th style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '15%' }}>获奖日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {application.existingHonors.map((honor, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.title}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.level || '校级'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.category || '其他'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.issuer || '-'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* 审批意见表格 */}
            {application.approvalComments.length > 0 && (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                  <tbody>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500 }}>审批意见</td>
                    </tr>
                  </tbody>
                </table>
                {application.approvalComments.map((comment, index) => (
                  <table key={index} style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid #000', padding: '8px 12px', width: '20%', backgroundColor: '#f5f5f5', textAlign: 'center' }}>{APPROVAL_STEP_NAMES[comment.step]}</td>
                        <td style={{ border: '1px solid #000', padding: '8px 12px' }}>
                          <div style={{ marginBottom: '4px' }}>
                            <span style={{ marginRight: '16px' }}>审批人：{comment.approverName}</span>
                            <span>结果：
                              <span style={{ color: comment.result === 'approved' ? '#16a34a' : '#dc2626' }}>
                                {comment.result === 'approved' ? '同意' : comment.result === 'rejected' ? '不同意' : ''}
                              </span>
                            </span>
                          </div>
                          {comment.comment && <div style={{ marginTop: '4px' }}>意见：{comment.comment}</div>}
                          <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{new Date(comment.time).toLocaleString()}</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                ))}
              </>
            )}

            {/* 签字栏表格 */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '8mm' }}>
              <tbody>
                <tr style={{ height: '60px' }}>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', width: '33.33%', verticalAlign: 'bottom' }}>
                    家长签字：
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', width: '33.33%', verticalAlign: 'bottom' }}>
                    班主任签字：
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', width: '33.33%', verticalAlign: 'bottom' }}>
                    学校盖章：
                  </td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '12px' }}>
                    日期：&emsp;&emsp;年&emsp;&emsp;月&emsp;&emsp;日
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '12px' }}>
                    日期：&emsp;&emsp;年&emsp;&emsp;月&emsp;&emsp;日
                  </td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '12px' }}>
                    日期：&emsp;&emsp;年&emsp;&emsp;月&emsp;&emsp;日
                  </td>
                </tr>
              </tbody>
            </table>

            {/* 底部信息 */}
            <div style={{ marginTop: '8mm', textAlign: 'center', fontSize: '11px', color: '#666' }}>
              <span style={{ marginRight: '24mm' }}>申报编号：{application.id}</span>
              <span>{schoolName}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
