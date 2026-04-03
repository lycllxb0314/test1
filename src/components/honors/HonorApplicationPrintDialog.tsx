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
  /** 学校名称 */
  schoolName?: string;
};

/** 水印配置 - 统一CSS和PDF使用 */
const WATERMARK_CONFIG = {
  color: 'rgba(180, 180, 180, 0.15)',
  fontSize: 20,         // 字体大小
  rotate: -25,
  gap: 200,             // 间距
  logoSize: 32,         // logo大小
  logoTextGap: 10,      // logo和文字之间的间距
  scale: 2,             // 高清缩放比例
};

/**
 * 创建带logo的水印图案（返回 data URL）
 * 异步加载学校logo图片后绘制
 * logo和文字在同一条水平线上
 */
async function createWatermarkPattern(schoolName: string): Promise<string> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const { color, fontSize, rotate, gap, logoSize, logoTextGap, scale } = WATERMARK_CONFIG;
  
  // 设置高清画布尺寸（2倍分辨率）
  canvas.width = gap * 2 * scale;
  canvas.height = gap * 2 * scale;

  // 尝试加载学校logo
  let logoImage: HTMLImageElement | null = null;
  try {
    logoImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Logo load failed'));
      img.src = '/logo-school.png';
    });
  } catch {
    // logo加载失败，仅使用文字
  }

  // 缩放上下文以支持高清绘制
  ctx.scale(scale, scale);

  // 设置字体以测量文字宽度
  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  const textWidth = ctx.measureText(schoolName).width;
  
  // 计算总宽度：logo + 间距 + 文字
  const totalWidth = (logoImage ? logoSize + logoTextGap : 0) + textWidth;

  // 移动到中心点并旋转
  ctx.translate(gap, gap);  // 使用未缩放的gap值
  ctx.rotate((rotate * Math.PI) / 180);

  // 从中心点开始绘制，整体水平居中
  let currentX = -totalWidth / 2;

  // 绘制logo（如果有）- 在左边
  if (logoImage) {
    ctx.globalAlpha = 0.15;
    // 启用图像平滑
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      logoImage,
      currentX,
      -logoSize / 2, // 垂直居中
      logoSize,
      logoSize
    );
    ctx.globalAlpha = 1;
    currentX += logoSize + logoTextGap;
  }

  // 绘制文字 - 在logo右边，同一水平线
  ctx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(schoolName, currentX, 0);

  return canvas.toDataURL('image/png');
}

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
  const [watermarkPattern, setWatermarkPattern] = useState<string>('');
  const contentRef = useRef<HTMLDivElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);

  // 初始化水印（异步加载logo）
  useEffect(() => {
    createWatermarkPattern(schoolName).then(setWatermarkPattern);
  }, [schoolName]);

  // 生成 PDF（后台异步）
  const generatePdf = useCallback(async () => {
    if (!contentRef.current || !application) return;

    setGenerating(true);
    try {
      // 临时移除CSS背景水印，避免PDF双重水印
      const originalBg = contentRef.current.style.backgroundImage;
      contentRef.current.style.backgroundImage = 'none';
      
      // 使用 html2canvas 截图（降低 scale 提升速度）
      const canvas = await html2canvas(contentRef.current, {
        scale: 1.5, // 降低 scale 提升速度
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        imageTimeout: 0,
      });
      
      // 恢复CSS背景水印
      contentRef.current.style.backgroundImage = originalBg;

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

      // 创建带logo的水印图案（使用统一配置）
      const watermarkCanvas = document.createElement('canvas');
      const wCtx = watermarkCanvas.getContext('2d');
      if (wCtx) {
        const { color, fontSize, rotate, gap, logoSize, logoTextGap, scale } = WATERMARK_CONFIG;
        
        // 设置高清画布尺寸
        watermarkCanvas.width = gap * 2 * scale;
        watermarkCanvas.height = gap * 2 * scale;
        
        // 尝试加载logo
        let logoImg: HTMLImageElement | null = null;
        try {
          logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Logo load failed'));
            img.src = '/logo-school.png';
          });
        } catch {
          // logo加载失败，仅使用文字
        }

        // 缩放上下文
        wCtx.scale(scale, scale);

        // 设置字体测量文字宽度
        wCtx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        const textWidth = wCtx.measureText(schoolName).width;
        const totalWidth = (logoImg ? logoSize + logoTextGap : 0) + textWidth;

        // 移动到中心并旋转
        wCtx.translate(gap, gap);
        wCtx.rotate((rotate * Math.PI) / 180);

        // 从中心开始绘制，整体水平居中
        let currentX = -totalWidth / 2;

        // 绘制logo（左边）
        if (logoImg) {
          wCtx.globalAlpha = 0.2;
          wCtx.imageSmoothingEnabled = true;
          wCtx.imageSmoothingQuality = 'high';
          wCtx.drawImage(logoImg, currentX, -logoSize / 2, logoSize, logoSize);
          wCtx.globalAlpha = 1;
          currentX += logoSize + logoTextGap;
        }

        // 绘制文字（右边，同一水平线）
        wCtx.font = `${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;
        wCtx.fillStyle = color;
        wCtx.textAlign = 'left';
        wCtx.textBaseline = 'middle';
        wCtx.fillText(schoolName, currentX, 0);
      }

      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/png', 0.8); // 压缩图片

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

      // 添加水印到每一页（平铺）
      const totalPages = pdf.getNumberOfPages();
      const watermarkData = watermarkCanvas.toDataURL('image/png');
      // 水印单元大小：根据gap计算mm单位（假设屏幕96dpi，1mm≈3.78px）
      const watermarkSizeMm = (WATERMARK_CONFIG.gap * 2) / 3.78;
      
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        // 平铺水印覆盖整页
        for (let x = -watermarkSizeMm/2; x < 210 + watermarkSizeMm; x += watermarkSizeMm) {
          for (let y = -watermarkSizeMm/2; y < 297 + watermarkSizeMm; y += watermarkSizeMm) {
            pdf.addImage(watermarkData, 'PNG', x, y, watermarkSizeMm, watermarkSizeMm);
          }
        }
      }

      // 生成 Blob URL
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
    } catch (error) {
      console.error('生成 PDF 失败:', error);
      toast.error('生成 PDF 失败');
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
            background-image: url('${watermarkPattern}');
            background-repeat: repeat;
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
              padding: '20mm 25mm',
              // 水印在文档内容区域内
              backgroundImage: watermarkPattern ? `url(${watermarkPattern})` : 'none',
              backgroundRepeat: 'repeat',
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

            {/* 主表格 - 整体合并 */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '14px',
              fontFamily: '"SimSun", "Songti SC", "Noto Serif SC", serif',
            }}>
              <tbody>
                {/* 基本信息行 */}
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

                {/* 申报内容 */}
                {(() => {
                  const fieldLabels: Record<string, string> = {};
                  if (campaign?.formConfig?.fields) {
                    campaign.formConfig.fields.forEach(f => {
                      fieldLabels[f.field] = f.label;
                    });
                  }
                  return Object.entries(application.formData).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500, verticalAlign: 'top' }}>
                        {fieldLabels[key] || key}
                      </td>
                      <td colSpan={3} style={{ border: '1px solid #000', padding: '8px 12px', minHeight: '60px', whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
                        {value || '-'}
                      </td>
                    </tr>
                  ));
                })()}

                {/* 已获奖荣誉 */}
                {application.existingHonors && application.existingHonors.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500 }}>已获奖荣誉</td>
                    </tr>
                    <tr>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>荣誉名称</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>级别</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>类别</td>
                      <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center', fontWeight: 500 }}>颁发单位/日期</td>
                    </tr>
                    {application.existingHonors.map((honor, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.title}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.level || '校级'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.category || '其他'}</td>
                        <td style={{ border: '1px solid #000', padding: '6px 8px', textAlign: 'center' }}>{honor.issuer || '-'} / {honor.date || '-'}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* 审批意见 */}
                {application.approvalComments.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={4} style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'center', fontWeight: 500 }}>审批意见</td>
                    </tr>
                    {application.approvalComments.map((comment, index) => (
                      <tr key={index}>
                        <td style={{ border: '1px solid #000', padding: '8px 12px', backgroundColor: '#f5f5f5', textAlign: 'center' }}>{APPROVAL_STEP_NAMES[comment.step]}</td>
                        <td colSpan={3} style={{ border: '1px solid #000', padding: '8px 12px' }}>
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
                    ))}
                  </>
                )}

                {/* 签字栏 */}
                <tr style={{ height: '60px' }}>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', verticalAlign: 'bottom' }}>家长签字：</td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', verticalAlign: 'bottom' }}>班主任签字：</td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '8px 12px', verticalAlign: 'bottom' }}>学校盖章：</td>
                </tr>
                <tr>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '12px' }}>日期：&emsp;&emsp;年&emsp;&emsp;月&emsp;&emsp;日</td>
                  <td style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '12px' }}>日期：&emsp;&emsp;年&emsp;&emsp;月&emsp;&emsp;日</td>
                  <td colSpan={2} style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '12px' }}>日期：&emsp;&emsp;年&emsp;&emsp;月&emsp;&emsp;日</td>
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
