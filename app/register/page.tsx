"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [isReferralLocked, setIsReferralLocked] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  // Tự động lấy mã giới thiệu từ URL (VD: ?ref=12345)
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      setIsReferralLocked(true); // Khóa ô nhập nếu có mã từ link
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setMessage('');

    try {
      // 1. Tạo tài khoản Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // 2. LƯU PROFILE BẰNG UPSERT (TRÁNH LỖI TRÙNG ID) VÀ TẶNG 30K
      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').upsert([
          { 
            id: authData.user.id, 
            balance: 30000, // Tặng tiền tân thủ
            has_purchased_package: false,
            referred_by: referralCode ? referralCode : null // Lưu mã giới thiệu vào DB
          }
        ]);
        
        // NẾU CÓ LỖI TỪ SUPABASE, BÁO NGAY RA MÀN HÌNH ĐỂ DỄ SỬA
        if (profileError) {
          console.error("Lỗi tạo profile:", profileError);
          throw new Error("Lỗi lưu dữ liệu: " + profileError.message);
        }
      }

      setMessage('Đăng ký thành công! Bạn được tặng 30,000 VNĐ vào tài khoản.');
      
      // Chuyển hướng thẳng vào trang Dashboard ngay lập tức
      setTimeout(() => {
          router.push('/dashboard');
      }, 1000);

    } catch (error: any) {
      setMessage(error.message || 'Có lỗi xảy ra khi đăng ký.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
      <div className="flex justify-center mb-8">
          <div className="bg-blue-600 p-3 rounded-xl">
              <Activity className="w-8 h-8 text-white" />
          </div>
      </div>
      <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">Tạo tài khoản mới</h2>
      <p className="text-center text-emerald-600 font-medium mb-8 bg-emerald-50 py-2 rounded-lg">🎁 Đăng ký nhận ngay 30,000 VNĐ</p>
      
      <form onSubmit={handleRegister} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
          <input 
            type="email" 
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="nhap@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
          <input 
            type="password" 
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="••••••••"
          />
        </div>
        
        {/* Ô nhập Mã Giới Thiệu */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Mã giới thiệu (Nếu có)</label>
          <input 
            type="text" 
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            disabled={isReferralLocked}
            className={`w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              isReferralLocked ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
            }`}
            placeholder="Nhập mã giới thiệu..."
          />
          {isReferralLocked && (
            <p className="text-xs font-semibold text-emerald-600 mt-2 flex items-center gap-1">
               ✓ Đã tự động áp dụng mã từ link mời
            </p>
          )}
        </div>
        
        {message && (
            <div className={`p-3 rounded-lg text-sm font-medium text-center ${message.includes('thành công') ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {message}
            </div>
        )}

        <button 
          type="submit" 
          disabled={isProcessing}
          className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors mt-2"
        >
          {isProcessing ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
        </button>
      </form>

      <div className="mt-6 text-center">
          <a href="/login" className="text-sm text-blue-600 hover:underline font-medium">Đã có tài khoản? Đăng nhập</a>
      </div>
    </div>
  );
}

// Bọc Component bằng Suspense theo tiêu chuẩn của Next.js App Router
export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-slate-500 font-medium animate-pulse">Đang tải trang đăng ký...</div>}>
        <RegisterFormContent />
      </Suspense>
    </div>
  );
}