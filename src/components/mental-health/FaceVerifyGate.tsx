'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  RefreshCw, 
  Users,
  Shield,
  Sparkles,
  ArrowLeft,
  ScanFace
} from 'lucide-react';
import Image from 'next/image';

type ChildInfo = {
  studentId: string;
  studentName: string;
  className: string;
  hasFaceVector: boolean;
  photoUrl: string | null;
};

type FaceVerifyGateProps = {
  onVerified: (studentId: string) => void;
};

type VerifyStep = 'select_child' | 'camera' | 'verifying' | 'result';

export default function FaceVerifyGate({ onVerified }: FaceVerifyGateProps) {
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [selectedChild, setSelectedChild] = useState<ChildInfo | null>(null);
  const [step, setStep] = useState<VerifyStep>('select_child');
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ success: boolean; similarity: number; error?: string } | null>(null);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 加载孩子列表
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch('/api/mental-health/children');
        const data = await res.json();
        if (data.data) {
          setChildren(data.data as ChildInfo[]);
        }
      } catch (err) {
        console.error('fetch children error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchChildren();
  }, []);

  // 清理摄像头
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // 打开摄像头
  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      setStep('camera');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          setIsStreaming(true);
        };
      }
    } catch (err) {
      console.error('camera error:', err);
      setCameraError('无法访问摄像头，请检查浏览器权限设置');
    }
  }, []);

  // 拍照并验证
  const captureAndVerify = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !selectedChild) return;

    if (!isStreaming || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

    stopCamera();
    setStep('verifying');

    try {
      const res = await fetch('/api/mental-health/face-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedChild.studentId,
          imageBase64: imageBase64,
        }),
      });
      const data = await res.json();

      if (data.data) {
        const result = data.data as { success: boolean; similarity: number; error?: string };
        setVerifyResult({
          success: result.success,
          similarity: result.similarity,
          error: result.error,
        });
        setStep('result');

        if (result.success) {
          setTimeout(() => onVerified(selectedChild.studentId), 1500);
        }
      } else {
        setVerifyResult({ success: false, similarity: 0, error: '验证请求失败' });
        setStep('result');
      }
    } catch (err) {
      console.error('verify error:', err);
      setVerifyResult({ success: false, similarity: 0, error: '网络错误，请重试' });
      setStep('result');
    }
  }, [selectedChild, stopCamera, onVerified, isStreaming]);

  // 重试
  const retry = useCallback(() => {
    setVerifyResult(null);
    setStep('select_child');
    setSelectedChild(null);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-teal-500 border-t-transparent" />
          <Sparkles className="absolute inset-0 m-auto h-5 w-5 text-teal-500" />
        </div>
        <p className="text-muted-foreground">正在准备验证...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4 py-8">
      {/* 规则1：video 元素始终渲染，用 CSS 控制显隐 */}
      <div className={`w-full max-w-md ${step === 'camera' ? 'block' : 'hidden'}`}>
        <Card className="border-0 shadow-xl overflow-hidden bg-gradient-to-br from-card to-teal-50/30 dark:to-teal-950/20">
          <div className="h-1 bg-gradient-to-r from-teal-500 via-teal-400 to-teal-500" />
          <CardContent className="p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 text-center">
                <ScanFace className="h-5 w-5 text-teal-500" />
                <h2 className="text-lg font-semibold text-foreground">请对准孩子面部</h2>
              </div>
              <p className="text-sm text-muted-foreground text-center">确保光线充足，面部清晰可见</p>

              {/* 规则4：视频容器有尺寸约束 + aspect-ratio */}
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 shadow-inner"
                style={{ aspectRatio: '4/3' }}
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
                {/* 人脸框引导 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="relative">
                    <div
                      className="w-44 h-52 border-3 rounded-[2rem]"
                      style={{ borderColor: 'rgba(255,255,255,0.4)', borderWidth: '3px' }}
                    />
                    {/* 角标装饰 */}
                    <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-2xl" />
                    <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-2xl" />
                    <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-2xl" />
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-2xl" />
                  </div>
                </div>
                {/* 未就绪提示 */}
                {!isStreaming && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 space-y-3">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
                    <p className="text-sm text-white/70">正在启动摄像头...</p>
                  </div>
                )}
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="flex gap-3 w-full">
                <Button 
                  variant="outline" 
                  onClick={() => { stopCamera(); setStep('select_child'); }}
                  className="flex-1"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> 返回
                </Button>
                <Button
                  onClick={captureAndVerify}
                  size="lg"
                  className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-md shadow-teal-500/20"
                  disabled={!isStreaming}
                >
                  <Camera className="h-5 w-5 mr-2" />
                  拍照验证
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 选择孩子 */}
      {step === 'select_child' && (
        <div className="flex flex-col items-center gap-6 w-full max-w-md">
          {/* 头部 */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-950/20 flex items-center justify-center">
                <Shield className="h-10 w-10 text-teal-500" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-amber-500" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">安全验证</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                访问心理健康模块需要人脸验证，请选择要访问的孩子
              </p>
            </div>
          </div>

          {children.length === 0 ? (
            <Card className="border-0 shadow-sm w-full">
              <CardContent className="py-10 flex flex-col items-center space-y-3">
                <div className="p-3 rounded-full bg-muted">
                  <Users className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">未找到关联的孩子信息</p>
                <p className="text-xs text-muted-foreground/60">请联系班主任确认家长关联状态</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 w-full">
              {children.map((child) => (
                <Card
                  key={child.studentId}
                  className={`border-0 shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md ${
                    selectedChild?.studentId === child.studentId
                      ? 'ring-2 ring-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                      : 'bg-card'
                  } ${!child.hasFaceVector ? 'opacity-60' : ''}`}
                  onClick={() => child.hasFaceVector && setSelectedChild(child)}
                >
                  <div className="h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-0 group-hover:opacity-100" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-950/20 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                        {child.photoUrl ? (
                          <Image src={child.photoUrl} alt={child.studentName} width={48} height={48} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-medium text-teal-600">{child.studentName.charAt(0)}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{child.studentName}</p>
                        <p className="text-sm text-muted-foreground">{child.className}</p>
                      </div>
                      {!child.hasFaceVector ? (
                        <Badge variant="secondary" className="text-xs">
                          未录入人脸
                        </Badge>
                      ) : selectedChild?.studentId === child.studentId ? (
                        <div className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                          <CheckCircle className="h-4 w-4 text-white" />
                        </div>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedChild && (
            <Button 
              onClick={startCamera} 
              size="lg" 
              className="w-full bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/20 gap-2"
            >
              <Camera className="h-5 w-5" />
              开始人脸验证
            </Button>
          )}

          {cameraError && (
            <p className="text-sm text-destructive text-center">{cameraError}</p>
          )}
        </div>
      )}

      {/* 验证中 */}
      {step === 'verifying' && (
        <div className="flex flex-col items-center gap-5">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-2 border-teal-500 border-t-transparent" />
            <Sparkles className="absolute inset-0 m-auto h-6 w-6 text-teal-500" />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-foreground">正在验证</p>
            <p className="text-sm text-muted-foreground mt-1">请稍候，正在比对人脸信息</p>
          </div>
        </div>
      )}

      {/* 验证结果 */}
      {step === 'result' && verifyResult && (
        <div className="flex flex-col items-center gap-5">
          {verifyResult.success ? (
            <>
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-100 to-teal-50 dark:from-teal-900/30 dark:to-teal-950/20 flex items-center justify-center">
                  <CheckCircle className="h-12 w-12 text-teal-500" />
                </div>
                <div className="absolute inset-0 rounded-full bg-teal-500/20 animate-ping" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-teal-600">验证通过</p>
                <p className="text-sm text-muted-foreground mt-2">正在进入暖心童童...</p>
              </div>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 flex items-center justify-center">
                <XCircle className="h-12 w-12 text-destructive" />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-destructive">验证未通过</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {verifyResult.error || '人脸比对失败'}
                </p>
                <Badge variant="outline" className="mt-2">
                  相似度: {(verifyResult.similarity * 100).toFixed(1)}%
                </Badge>
              </div>
              <Button 
                onClick={retry} 
                className="gap-2 mt-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
              >
                <RefreshCw className="h-4 w-4" />
                重新验证
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
