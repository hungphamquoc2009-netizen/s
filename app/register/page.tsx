"use client";

import React, { useState } from 'react';
import { Activity, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // Kết nối với file supabase vừa tạo

export default function Register() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        // Gọi Supabase để tạo tài khoản
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            alert('Đăng ký thành công! Bạn được tặng 30.000 VNĐ vào tài khoản.');
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
                            <a href="/login" className="text-slate-500 hover:text-[#1E6EFF] font-semibold text-sm transition-colors">Đăng nhập</a>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-grow flex items-center justify-center">
                <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-xl border border-gray-100 my-10">
                    <h2 className="text-2xl font-bold text-center text-slate-900 mb-6">Mở Tài Khoản</h2>
                    
                    <div className="bg-blue-50 border border-blue-100 text-[#1E6EFF] px-4 py-3 rounded-xl mb-6 text-sm flex items-center shadow-sm">
                        <Gift className="w-5 h-5 mr-2 flex-shrink-0" />
                        <span>Tặng ngay <strong>30.000 VNĐ</strong> vào tài khoản sau khi đăng ký!</span>
                    </div>

                    {errorMsg && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm font-medium text-center">
                            Lỗi: {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleRegister}>
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
                            <label className="block text-slate-700 text-sm font-bold mb-2">Mật khẩu (từ 6 ký tự)</label>
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
                            {loading ? 'Đang xử lý...' : 'Đăng ký & Vào Dashboard'}
                        </button>
                    </form>
                    <p className="text-center text-sm text-slate-500 mt-6">
                        Đã có tài khoản? <a href="/login" className="text-[#1E6EFF] font-bold hover:underline">Đăng nhập</a>
                    </p>
                </div>
            </main>
        </div>
    );
}