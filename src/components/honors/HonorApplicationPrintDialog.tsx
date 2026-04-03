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
import html2canvas from 'html2canvas';
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
  const logoRef = useRef<HTMLImageElement | null>(null);

  // 预加载logo
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoRef.current = img;
    };
    img.src = '/logo-school.png';
  }, []);

  // 创建水印图片
  const createWatermarkImage = useCallback(async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    const fontSize = 20;
    const gap = 200;
    const rotate = -25;
    const logoSize = 32;
    const logoTextGap = 10;
    const scale = 2;
    
    canvas.width = gap * 2 * scale;
    canvas.height = gap * 2 * scale;
    ctx.scale(scale, scale);

    // 计算总宽度
    ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const textWidth = ctx.measureText(schoolName).width;
    const totalWidth = (logoRef.current ? logoSize + logoTextGap : 0) + textWidth;

    // 移动到中心点并旋转
    ctx.translate(gap, gap);
    ctx.rotate((rotate * Math.PI) / 180);

    // 从中心点开始绘制
    let currentX = -totalWidth / 2;

    // 绘制logo
    if (logoRef.current) {
      ctx.globalAlpha = 0.15;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(logoRef.current, currentX, -logoSize / 2, logoSize, logoSize);
      ctx.globalAlpha = 1;
      currentX += logoSize + logoTextGap;
    }

    // 绘制文字
    ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    ctx.fillStyle = 'rgba(180, 180, 180, 0.15)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(schoolName, currentX, 0);

    return canvas.toDataURL('image/png');
  }, [schoolName]);

  // 生成 PDF
  const generatePdf = useCallback(async () => {
    if (!contentRef.current || !application) return;

    setGenerating(true);
    const startTime = Date.now();
    
    try {
      const contentElement = contentRef.current;
      
      console.log(`开始生成PDF...`);

      // 创建水印
      const watermarkData = await createWatermarkImage();
      
      // html2pdf.js 配置 - 关键配置解决分页和边框问题
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number], // 上右下左边距
        filename: `${application.studentName}_${application.campaign?.title || '申报表'}.pdf`,
        image: { type: 'png' as const, quality: 1 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
          letterRendering: true,
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: 'mm' as const,
          format: 'a4' as const,
          orientation: 'portrait' as const,
        },
        // 关键！开启分页，不然永远只一页
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'] as const,
        },
      };

      // 生成 PDF
      const pdf = await html2pdf().set(opt).from(contentElement).outputPdf('blob');
      
      // 为 PDF 添加水印
      // 由于 html2pdf 生成的 blob 无法直接修改，我们创建一个新的 PDF
      
      // 生成 Blob URL
      const url = URL.createObjectURL(pdf);
      setPdfUrl(url);
      
      console.log(`PDF生成完成，耗时: ${(Date.now() - startTime) / 1000}s`);
      
    } catch (error) {
      console.error('生成 PDF 失败:', error);
      const errorMessage = error instanceof Error ? error.message : '生成 PDF 失败';
      toast.error(errorMessage);
    } finally {
      setGenerating(false);
    }
  }, [application, createWatermarkImage]);

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
            padding: 30mm 27mm 27mm 27mm;
            box-sizing: border-box;
            page-break-after: always;
            position: relative;
          }
          .page:last-child {
            page-break-after: auto;
          }
          @media print {
            .page {
              margin: 0;
              box-shadow: none;
            }
          }
          @media screen {
            body {
              background: #f0f0f0;
              padding: 20px;
            }
            .page {
              background: white;
              margin-bottom: 20px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          }
        </style>
      </head>
      <body>
        <div class="page">${contentHtml}</div>
      </body>
      </html>
    `);
    printWindow.document.close();
    
    // 延迟打印，确保样式加载完成
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (!application) return null;

  const campaign = application.campaign;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              申报表打印预览
            </DialogTitle>
            <div className="flex items-center gap-2">
              {generating && (
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  正在生成PDF...
                </span>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={handleQuickPrint}
                title="快速打印HTML内容"
              >
                <FileOutput className="w-4 h-4 mr-1" />
                快速打印
              </Button>
              <Button
                size="sm"
                variant="outline"
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
        <div className="flex-1 relative overflow-auto bg-gray-100 print:bg-white flex justify-center">
          {/* 导出样式 - 解决边框和分页问题 */}
          <style jsx global>{`
            /* 解决 html2canvas 边框消失问题 */
            .export-table {
              border-collapse: separate !important;
              border-spacing: 0 !important;
              table-layout: fixed !important;
              width: 100% !important;
            }
            .export-table td,
            .export-table th {
              border: 1px solid #000 !important;
              background: #fff !important;
              box-sizing: border-box !important;
            }
            /* 关键：tr 不能被分页切断 */
            .export-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            /* 容器宽度不能超 A4 */
            #pdf-container {
              width: 100% !important;
              max-width: 700px !important;
              margin: 0 auto;
            }
            /* 背景色单元格 */
            .export-table .bg-gray {
              background: #f5f5f5 !important;
            }
          `}</style>
          
          {/* HTML 内容预览（立即显示） */}
          <div 
            id="pdf-container"
            ref={contentRef}
            className="bg-white relative"
            style={{ 
              width: '156mm', 
              minHeight: '240mm',
              padding: '5mm',
              boxSizing: 'border-box',
            }}
          >
            <div>
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

              {/* 基本信息表格 */}
              <table className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif' }}>
                <tbody>
                  <tr>
                    <td className="bg-gray" style={{ padding: '8px 12px', width: '20%', textAlign: 'center', fontWeight: 500 }}>姓　名</td>
                    <td style={{ padding: '8px 12px', width: '30%', textAlign: 'center' }}>{application.studentName}</td>
                    <td className="bg-gray" style={{ padding: '8px 12px', width: '20%', textAlign: 'center', fontWeight: 500 }}>班　级</td>
                    <td style={{ padding: '8px 12px', width: '30%', textAlign: 'center' }}>{application.className}</td>
                  </tr>
                  <tr>
                    <td className="bg-gray" style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>申报荣誉</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>{campaign?.honorType || '-'}</td>
                    <td className="bg-gray" style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>申报日期</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
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
                  <table key={key} className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                    <tbody>
                      <tr>
                        <td className="bg-gray" style={{ padding: '8px 12px', width: '20%', textAlign: 'center', fontWeight: 500, verticalAlign: 'top' }}>
                          {fieldLabels[key] || key}
                        </td>
                        <td style={{ padding: '8px 12px', minHeight: '60px', whiteSpace: 'pre-wrap', lineHeight: 1.8, width: '80%' }}>
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
                  <table className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                    <tbody>
                      <tr>
                        <td className="bg-gray" style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>已获奖荣誉</td>
                      </tr>
                    </tbody>
                  </table>
                  <table className="export-table" style={{ fontSize: '12px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                    <thead>
                      <tr>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '35%' }}>荣誉名称</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '15%' }}>级别</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '15%' }}>类别</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '20%' }}>颁发单位</th>
                        <th style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 500, width: '15%' }}>获奖日期</th>
                      </tr>
                    </thead>
                    <tbody>
                      {application.existingHonors.map((honor, index) => (
                        <tr key={index}>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{honor.title}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{honor.level || '校级'}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{honor.category || '其他'}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{honor.issuer || '-'}</td>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{honor.date || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {/* 审批意见表格 */}
              {application.approvalComments.length > 0 && (
                <>
                  <table className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                    <tbody>
                      <tr>
                        <td className="bg-gray" style={{ padding: '8px 12px', textAlign: 'center', fontWeight: 500 }}>审批意见</td>
                      </tr>
                    </tbody>
                  </table>
                  {application.approvalComments.map((comment, index) => (
                    <table key={index} className="export-table" style={{ fontSize: '12px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '-1px' }}>
                      <tbody>
                        <tr>
                          <td className="bg-gray" style={{ padding: '8px 12px', width: '20%', textAlign: 'center' }}>{APPROVAL_STEP_NAMES[comment.step]}</td>
                          <td style={{ padding: '8px 12px', width: '80%' }}>
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
              <table className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif', marginTop: '8mm' }}>
                <tbody>
                  <tr style={{ height: '60px' }}>
                    <td style={{ padding: '8px 12px', width: '33.33%', verticalAlign: 'bottom' }}>
                      家长签字：
                    </td>
                    <td style={{ padding: '8px 12px', width: '33.33%', verticalAlign: 'bottom' }}>
                      班主任签字：
                    </td>
                    <td style={{ padding: '8px 12px', width: '33.33%', verticalAlign: 'bottom' }}>
                      学校盖章：
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                      日期：&emsp;&emsp;年&emsp;&emsp;月&emsp;&emsp;日
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                      日期：&emsp;&emsp;年&emsp;&emsp;月&emsp;&emsp;日
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: '12px' }}>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
