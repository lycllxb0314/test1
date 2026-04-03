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
  const [watermarkUrl, setWatermarkUrl] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);

  // 创建水印图片（包含logo和文字）
  const createWatermark = useCallback(async () => {
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

    // 计算文字宽度
    ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
    const textWidth = ctx.measureText(schoolName).width;

    // 移动到中心点并旋转
    ctx.translate(gap, gap);
    ctx.rotate((rotate * Math.PI) / 180);

    // 尝试加载并绘制logo
    let logoWidth = 0;
    try {
      const logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = '/logo-school.png';
      });
      
      // 计算总宽度
      logoWidth = logoSize + logoTextGap;
      const totalWidth = logoWidth + textWidth;
      
      // 从中心点开始绘制
      let currentX = -totalWidth / 2;
      
      // 绘制logo
      ctx.globalAlpha = 0.15;
      ctx.drawImage(logoImg, currentX, -logoSize / 2, logoSize, logoSize);
      currentX += logoWidth;
      
      // 绘制文字
      ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = 'rgba(180, 180, 180, 0.15)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(schoolName, currentX, 0);
    } catch {
      // logo加载失败，只绘制文字
      const totalWidth = textWidth;
      const currentX = -totalWidth / 2;
      
      ctx.globalAlpha = 0.15;
      ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.fillStyle = 'rgba(180, 180, 180, 0.15)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(schoolName, currentX, 0);
    }

    return canvas.toDataURL('image/png');
  }, [schoolName]);

  // 初始化水印
  useEffect(() => {
    createWatermark().then(url => {
      setWatermarkUrl(url);
    });
  }, [createWatermark]);

  // 生成 PDF
  const generatePdf = useCallback(async () => {
    if (!contentRef.current || !application) return;

    setGenerating(true);
    const startTime = Date.now();
    
    try {
      const contentElement = contentRef.current;
      
      console.log(`开始生成PDF...`);
      
      // html2pdf.js 配置
      const opt = {
        margin: [10, 10, 10, 10] as [number, number, number, number],
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
        pagebreak: {
          mode: ['avoid-all', 'css', 'legacy'] as const,
        },
      };

      // 生成 PDF
      const pdf = await html2pdf().set(opt).from(contentElement).outputPdf('blob');
      
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
  }, [application]);

  // 打开时异步生成 PDF
  useEffect(() => {
    if (open && application) {
      setPdfUrl(null);
      const timer = setTimeout(() => {
        generatePdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [open, application?.id, generatePdf]);

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

  // 快速打印 HTML
  const handleQuickPrint = () => {
    if (!contentRef.current || !application) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('无法打开打印窗口，请检查浏览器设置');
      return;
    }

    const contentHtml = contentRef.current.innerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>申报表打印 - ${application.studentName}</title>
        <style>
          @page { size: A4; margin: 10mm; }
          body { margin: 0; padding: 0; font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif; }
          .export-table { border-collapse: separate; border-spacing: 0; width: 100%; }
          .export-table td, .export-table th { border: 1px solid #000; padding: 8px 12px; }
          .bg-gray { background: #f5f5f5; }
        </style>
      </head>
      <body>${contentHtml}</body>
      </html>
    `);
    printWindow.document.close();
    
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
              <Button size="sm" variant="outline" onClick={handleQuickPrint}>
                <FileOutput className="w-4 h-4 mr-1" />
                快速打印
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownload} disabled={!pdfUrl}>
                <Download className="w-4 h-4 mr-1" />
                下载
              </Button>
              <Button size="sm" onClick={handlePrint} disabled={!pdfUrl}>
                <Printer className="w-4 h-4 mr-1" />
                打印
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* 预览区域 */}
        <div className="flex-1 overflow-auto bg-white flex justify-center py-8">
          {/* 全局样式 */}
          <style jsx global>{`
            .export-table {
              border-collapse: separate !important;
              border-spacing: 0 !important;
              table-layout: fixed !important;
              width: 100% !important;
            }
            .export-table td,
            .export-table th {
              border: 1px solid #000 !important;
              box-sizing: border-box !important;
            }
            .export-table .bg-gray {
              background: #f5f5f5 !important;
            }
            .export-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          `}</style>
          
          {/* 内容容器 - 固定宽度居中 */}
          <div 
            ref={contentRef}
            className="bg-white mx-auto"
            style={{ 
              width: '590px', // 约156mm
              minHeight: '800px',
              padding: '20px',
              backgroundImage: watermarkUrl ? `url('${watermarkUrl}')` : 'none',
              backgroundRepeat: 'repeat',
            }}
          >
            {/* 标题 */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                <img 
                  src="/logo-school.png" 
                  alt={schoolName}
                  style={{ width: '40px', height: '40px', objectFit: 'contain' }}
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
            <table className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", serif' }}>
              <tbody>
                <tr>
                  <td className="bg-gray" style={{ width: '20%', textAlign: 'center', fontWeight: 500, padding: '8px 12px' }}>姓　名</td>
                  <td style={{ width: '30%', textAlign: 'center', padding: '8px 12px' }}>{application.studentName}</td>
                  <td className="bg-gray" style={{ width: '20%', textAlign: 'center', fontWeight: 500, padding: '8px 12px' }}>班　级</td>
                  <td style={{ width: '30%', textAlign: 'center', padding: '8px 12px' }}>{application.className}</td>
                </tr>
                <tr>
                  <td className="bg-gray" style={{ textAlign: 'center', fontWeight: 500, padding: '8px 12px' }}>申报荣誉</td>
                  <td style={{ textAlign: 'center', padding: '8px 12px' }}>{campaign?.honorType || '-'}</td>
                  <td className="bg-gray" style={{ textAlign: 'center', fontWeight: 500, padding: '8px 12px' }}>申报日期</td>
                  <td style={{ textAlign: 'center', padding: '8px 12px' }}>
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
                <table key={key} className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", serif', marginTop: '-1px' }}>
                  <tbody>
                    <tr>
                      <td className="bg-gray" style={{ width: '20%', textAlign: 'center', fontWeight: 500, verticalAlign: 'top', padding: '8px 12px' }}>
                        {fieldLabels[key] || key}
                      </td>
                      <td style={{ width: '80%', padding: '8px 12px', minHeight: '60px', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
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
                <table className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", serif', marginTop: '-1px' }}>
                  <tbody>
                    <tr>
                      <td className="bg-gray" style={{ textAlign: 'center', fontWeight: 500, padding: '8px 12px' }}>已获奖荣誉</td>
                    </tr>
                  </tbody>
                </table>
                <table className="export-table" style={{ fontSize: '12px', fontFamily: '"SimSun", serif', marginTop: '-1px' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '35%', textAlign: 'center', fontWeight: 500, padding: '6px 8px' }}>荣誉名称</th>
                      <th style={{ width: '15%', textAlign: 'center', fontWeight: 500, padding: '6px 8px' }}>级别</th>
                      <th style={{ width: '15%', textAlign: 'center', fontWeight: 500, padding: '6px 8px' }}>类别</th>
                      <th style={{ width: '20%', textAlign: 'center', fontWeight: 500, padding: '6px 8px' }}>颁发单位</th>
                      <th style={{ width: '15%', textAlign: 'center', fontWeight: 500, padding: '6px 8px' }}>获奖日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {application.existingHonors.map((honor, index) => (
                      <tr key={index}>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>{honor.title}</td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>{honor.level || '校级'}</td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>{honor.category || '其他'}</td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>{honor.issuer || '-'}</td>
                        <td style={{ textAlign: 'center', padding: '6px 8px' }}>{honor.date || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* 审批意见表格 */}
            {application.approvalComments.length > 0 && (
              <>
                <table className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", serif', marginTop: '-1px' }}>
                  <tbody>
                    <tr>
                      <td className="bg-gray" style={{ textAlign: 'center', fontWeight: 500, padding: '8px 12px' }}>审批意见</td>
                    </tr>
                  </tbody>
                </table>
                {application.approvalComments.map((comment, index) => (
                  <table key={index} className="export-table" style={{ fontSize: '12px', fontFamily: '"SimSun", serif', marginTop: '-1px' }}>
                    <tbody>
                      <tr>
                        <td className="bg-gray" style={{ width: '20%', textAlign: 'center', padding: '8px 12px' }}>{APPROVAL_STEP_NAMES[comment.step]}</td>
                        <td style={{ width: '80%', padding: '8px 12px' }}>
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
            <table className="export-table" style={{ fontSize: '14px', fontFamily: '"SimSun", serif', marginTop: '30px' }}>
              <tbody>
                <tr style={{ height: '60px' }}>
                  <td style={{ width: '33.33%', verticalAlign: 'bottom', padding: '8px 12px' }}>家长签字：</td>
                  <td style={{ width: '33.33%', verticalAlign: 'bottom', padding: '8px 12px' }}>班主任签字：</td>
                  <td style={{ width: '33.33%', verticalAlign: 'bottom', padding: '8px 12px' }}>学校盖章：</td>
                </tr>
                <tr>
                  <td style={{ fontSize: '12px', padding: '8px 12px' }}>日期：　　年　　月　　日</td>
                  <td style={{ fontSize: '12px', padding: '8px 12px' }}>日期：　　年　　月　　日</td>
                  <td style={{ fontSize: '12px', padding: '8px 12px' }}>日期：　　年　　月　　日</td>
                </tr>
              </tbody>
            </table>

            {/* 底部信息 */}
            <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '11px', color: '#666' }}>
              <span style={{ marginRight: '100px' }}>申报编号：{application.id}</span>
              <span>{schoolName}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
