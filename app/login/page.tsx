"use client";

import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Kết nối file supabase

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        // Gọi Supabase để kiểm tra đăng nhập
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            setErrorMsg("Email hoặc mật khẩu không chính xác!");
            setLoading(false);
        } else {
            // Đăng nhập thành công, bay thẳng vào Dashboard
            window.location.href = '/dashboard';
        }
    };

    return (
        <div className="bg-gray-50 text-gray-800 flex flex-col min-h-screen font-sans">
            <nav className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        <div className="flex items-center cursor-pointer" onClick={() => window.location.href='/'}>
                            <div className="bg-[#1E6EFF] p-2 rounded-lg mr-2">
                                <Activity className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-slate-900">FinVest</span>
                        </div>
                        <div className="flex space-x-4">
                            <a href="/register" className="bg-[#1E6EFF] hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-md">Đăng ký</a>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow flex items-center justify-center">
                <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100 my-10">
                    <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">Đăng Nhập</h2>
                    
                    {errorMsg && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm font-medium text-center">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-slate-700 text-sm font-bold mb-2">Email</label>
                            <input 
                                type="email" 
                                required 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] focus:border-transparent transition-all" 
                                placeholder="nguyenvana@email.com" 
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-slate-700 text-sm font-bold mb-2">Mật khẩu</label>
                            <input 
                                type="password" 
                                required 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E6EFF] focus:border-transparent transition-all" 
                                placeholder="********" 
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className={`w-full text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-[#1E6EFF] hover:bg-blue-700 shadow-blue-500/30'}`}
                        >
                            {loading ? 'Đang kiểm tra...' : 'Đăng nhập vào Dashboard'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Chưa có tài khoản? <a href="/register" className="text-[#1E6EFF] font-bold hover:underline">Đăng ký ngay</a>
                    </p>
                </div>
            </main>
        </div>
    );
}