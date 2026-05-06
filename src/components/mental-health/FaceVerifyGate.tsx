'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, CheckCircle, XCircle, Loader2, RefreshCw, Users } from 'lucide-react';
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
  }, []);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // 打开摄像头
  const startCamera = useCallback(async () => {
    try {
      setCameraError('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStep('camera');
    } catch (err) {
      console.error('camera error:', err);
      setCameraError('无法访问摄像头，请检查浏览器权限设置');
    }
  }, []);

  // 拍照并验证
  const captureAndVerify = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || !selectedChild) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 镜像翻转绘制（前置摄像头）
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

    // 停止摄像头
    stopCamera();
    setStep('verifying');

    try {
      const res = await fetch('/api/mental-health/face-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedChild.studentId,
          image: imageBase64,
        }),
      });
      const data = await res.json();

      if (data.data) {
        const result = data.data as { verified: boolean; similarity: number; error?: string };
        setVerifyResult({
          success: result.verified,
          similarity: result.similarity,
          error: result.error,
        });
        setStep('result');

        if (result.verified) {
          // 验证通过，2 秒后进入聊天
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
  }, [selectedChild, stopCamera, onVerified]);

  // 重试
  const retry = useCallback(() => {
    setVerifyResult(null);
    setStep('select_child');
    setSelectedChild(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // 第一步：选择孩子
  if (step === 'select_child') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">安全验证</h2>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            访问心理健康模块需要人脸验证，请选择要访问的孩子
          </p>
        </div>

        {children.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">未找到关联的孩子信息</p>
          </Card>
        ) : (
          <div className="grid gap-3 w-full max-w-md">
            {children.map((child) => (
              <Card
                key={child.studentId}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedChild?.studentId === child.studentId
                    ? 'ring-2 ring-primary'
                    : ''
                } ${!child.hasFaceVector ? 'opacity-60' : ''}`}
                onClick={() => child.hasFaceVector && setSelectedChild(child)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {child.photoUrl ? (
                      <Image src={child.photoUrl} alt={child.studentName} width={40} height={40} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-medium">{child.studentName.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{child.studentName}</p>
                    <p className="text-xs text-muted-foreground">{child.className}</p>
                  </div>
                  {!child.hasFaceVector && (
                    <span className="text-xs text-muted-foreground whitespace-nowrap">未录入人脸</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {selectedChild && (
          <Button onClick={startCamera} size="lg" className="gap-2">
            <Camera className="h-5 w-5" />
            开始人脸验证
          </Button>
        )}

        {cameraError && (
          <p className="text-sm text-destructive">{cameraError}</p>
        )}
      </div>
    );
  }

  // 第二步：摄像头
  if (step === 'camera') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <h2 className="text-lg font-semibold">请对准孩子面部</h2>
        <p className="text-sm text-muted-foreground">确保光线充足，面部清晰可见</p>

        <div className="relative w-[320px] h-[240px] rounded-xl overflow-hidden bg-black">
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
            <div className="w-40 h-48 border-2 border-white/40 rounded-2xl" />
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { stopCamera(); setStep('select_child'); }}>
            返回
          </Button>
          <Button onClick={captureAndVerify} size="lg" className="gap-2">
            <Camera className="h-5 w-5" />
            拍照验证
          </Button>
        </div>
      </div>
    );
  }

  // 第三步：验证中
  if (step === 'verifying') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">正在验证...</p>
        <p className="text-sm text-muted-foreground">请稍候，正在比对人脸信息</p>
      </div>
    );
  }

  // 第四步：验证结果
  if (step === 'result' && verifyResult) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        {verifyResult.success ? (
          <>
            <CheckCircle className="h-16 w-16 text-green-500" />
            <p className="text-lg font-semibold text-green-600">验证通过</p>
            <p className="text-sm text-muted-foreground">正在进入暖心童童...</p>
          </>
        ) : (
          <>
            <XCircle className="h-16 w-16 text-destructive" />
            <p className="text-lg font-semibold text-destructive">验证未通过</p>
            <p className="text-sm text-muted-foreground">
              {verifyResult.error || '人脸比对失败'}
            </p>
            <p className="text-xs text-muted-foreground">
              相似度: {(verifyResult.similarity * 100).toFixed(1)}%
            </p>
            <Button onClick={retry} className="gap-2 mt-2">
              <RefreshCw className="h-4 w-4" />
              重新验证
            </Button>
          </>
        )}
      </div>
    );
  }

  return null;
}
