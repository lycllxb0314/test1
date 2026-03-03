"use client";
import React, { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, User, Eye, EyeOff, Loader2, Sparkles, ArrowLeft } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();

    const {
        login,
        isLoading
    } = useAuth();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!username.trim()) {
            setError("请输入用户名");
            return;
        }

        if (!password) {
            setError("请输入密码");
            return;
        }

        setIsLoggingIn(true);

        try {
            const success = await login(username.trim(), password);

            if (success) {
                setTimeout(() => {
                    router.push("/");
                    router.refresh();
                }, 100);
            } else {
                setError("用户名或密码错误");
                setIsLoggingIn(false);
            }
        } catch (err) {
            setError("登录失败，请稍后重试");
            setIsLoggingIn(false);
        }
    }, [username, password, login, router]);

    return (
        <div className="min-h-screen flex">
            {}
            <div
                className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-400 via-orange-500 to-amber-500 relative overflow-hidden">
                {}
                <div className="absolute inset-0">
                    <div
                        className="absolute top-20 left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
                    <div
                        className="absolute bottom-20 right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
                    <div
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-2xl" />
                </div>
                <div
                    className="relative z-10 flex flex-col justify-center items-center text-white p-12">
                    {}
                    <div className="mb-8">
                        <img
                            src="/logo.png"
                            alt="龙岩师范附属小学"
                            className="h-24 w-24 rounded-2xl object-contain bg-white/20 backdrop-blur-sm p-3" />
                    </div>
                    <h1 className="text-4xl font-bold mb-4 text-center">龙岩师范附属小学</h1>
                    <p className="text-xl text-white/80 mb-8 text-center">统一身份认证中心</p>
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="h-5 w-5" />
                        <span className="text-lg">统一门户 · 统一身份认证 · 统一数据</span>
                    </div>
                    <p className="text-white/70 text-center max-w-md mt-8">百年名校，薪火相传。以"明德、博学、笃行、创新"为校训，
                                                            打造有温度的智慧校园，为每一位师生提供贴心服务。
                                                          </p>
                    {}
                    <div className="absolute bottom-12 left-12 right-12">
                        <div className="flex items-center justify-center gap-8 text-white/60 text-sm">
                            <span>福建省示范小学</span>
                            <span>•</span>
                            <span>全国文明校园</span>
                            <span>•</span>
                            <span>百年名校</span>
                        </div>
                    </div>
                </div>
            </div>
            {}
            <div
                className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-orange-50 via-white to-amber-50">
                <div className="w-full max-w-md">
                    {}
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-primary mb-8 transition-colors">
                        <ArrowLeft className="h-4 w-4" />返回首页
                                                          </Link>
                    {}
                    <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
                        <img
                            src="/logo.png"
                            alt="龙岩师范附属小学"
                            className="h-12 w-12 rounded-lg object-contain" />
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">龙岩师范附属小学</h1>
                            <p className="text-sm text-gray-500">统一身份认证中心</p>
                        </div>
                    </div>
                    <Card className="border-0 shadow-2xl shadow-orange-500/10">
                        <CardHeader className="space-y-1 pb-4">
                            <CardTitle className="text-2xl font-bold text-center">欢迎登录</CardTitle>
                            <CardDescription className="text-center">请输入您的账号和密码
                                                                              </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} className="space-y-4">
                                {}
                                <div className="space-y-2">
                                    <Label htmlFor="username">账号</Label>
                                    <div className="relative">
                                        <User
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="username"
                                            type="text"
                                            placeholder="请输入工号或手机号"
                                            value={username}
                                            onChange={e => setUsername(e.target.value)}
                                            className="pl-10 h-12" />
                                    </div>
                                </div>
                                {}
                                <div className="space-y-2">
                                    <Label htmlFor="password">密码</Label>
                                    <div className="relative">
                                        <Lock
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="请输入密码"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            className="pl-10 pr-10 h-12" />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </button>
                                    </div>
                                </div>
                                {}
                                {error && <div className="text-sm text-red-500 text-center py-2 bg-red-50 rounded-lg">
                                    {error}
                                </div>}
                                {}
                                <Button
                                    type="submit"
                                    className="w-full h-12 bg-primary hover:bg-primary/90 text-white text-lg font-medium"
                                    disabled={isLoggingIn}>
                                    {isLoggingIn ? <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />登录中...
                                                                                                    </> : "登 录"}
                                </Button>
                            </form>
                            {}
                            <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                                <p className="text-sm text-gray-600 text-center">首次登录默认密码为 <span className="font-medium text-primary">lysf2026</span></p>
                                <p className="text-xs text-gray-500 text-center mt-2">如有账号问题，请联系教务处或年级组长
                                                                                        </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}