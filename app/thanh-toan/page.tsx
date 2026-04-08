"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Copy, CheckCircle2, Loader2, QrCode, CreditCard, 
  User, ArrowLeft, ShieldCheck, AlertCircle 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Component chứa logic chính để sử dụng được useSearchParams
function PaymentContent() {
  const searchParams = useSearchParams();
  const packageName = searchParams.get('package') || 'Goi_Tieu_Chuan';

  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [transferContent, setTransferContent] = useState<string>('');
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Thông tin thanh toán cố định
  const BANK_NAME = "VPBank";
  const ACCOUNT_NUMBER = "6869558386";
  const ACCOUNT_NAME = "HOANG QUOC VIET";
  const API_BANK = "https://thueapibank.vn/historyapivpbankneov2/d33a5cde4962560a0138920f20d550df";

  // Khởi tạo dữ liệu người dùng và tạo nội dung chuyển khoản
  useEffect(() => {
    const initData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        window.location.href = '/login';
        return;
      }

      const email = session.user.email || '';
      const name = email.split('@')[0];
      setUserName(name);
      setUserId(session.user.id);
      
      // Tạo nội dung chuyển khoản: MUA [Tên gói] [userName]
      const content = `MUA ${packageName} ${name}`;
      // Xóa dấu cách thừa và ký tự đặc biệt nếu cần để QR dễ quét hơn
      setTransferContent(content);
      setIsLoading(false);
    };

    initData();
  }, [packageName]);

  // Hệ thống Auto-Check (Polling)
  useEffect(() => {
    if (!transferContent || !userId) return;

    let intervalId: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(API_BANK);
        const data = await res.json();
        
        // Chuyển toàn bộ response thành string và lowercase để tìm kiếm nội dung an toàn nhất
        const responseString = JSON.stringify(data).toLowerCase();
        const targetContent = transferContent.toLowerCase().trim();

        if (responseString.includes(targetContent)) {
          // Nếu tìm thấy nội dung chuyển khoản trong lịch sử giao dịch
          clearInterval(intervalId); // Dừng polling ngay lập tức
          
          // Cập nhật trạng thái đã mua gói vào Supabase
          await supabase
            .from('profiles')
            .update({ has_purchased_package: true })
            .eq('id', userId);

          alert("Thanh toán thành công! Hệ thống đang chuyển hướng về trang chủ.");
          window.location.href = '/';
        }
      } catch (error) {
        console.error("Lỗi khi fetch API Bank:", error);
      }
    };

    // Chạy ngay lần đầu tiên
    checkPaymentStatus();
    
    // Thiết lập vòng lặp kiểm tra mỗi 5 giây
    intervalId = setInterval(checkPaymentStatus, 5000);

    // Cleanup interval khi component unmount
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [transferContent, userId]);

  // Hàm xử lý copy
  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(prev => ({ ...prev, [field]: true }));
    setTimeout(() => {
      setIsCopied(prev => ({ ...prev, [field]: false }));
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E6EFF]" />
      </div>
    );
  }

  const qrUrl = `https://img.vietqr.io/image/VPBank-${ACCOUNT_NUMBER}-qr_only.png?amount=0&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

  return (
    <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* CỘT TRÁI: QR CODE */}
        <div className="w-full md:w-5/12 bg-gradient-to-b from-[#1E6EFF]/5 to-blue-50/50 p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
          <div className="w-full flex justify-start mb-6">
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </button>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6">
            <img 
              src={qrUrl} 
              alt="Mã QR Thanh Toán" 
              className="w-64 h-64 object-contain"
            />
          </div>

          <div className="flex flex-col items-center justify-center text-center space-y-3">
            <div className="flex items-center gap-2 text-[#1E6EFF] bg-blue-50 px-4 py-2 rounded-full">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-bold animate-pulse">Đang chờ thanh toán...</span>
            </div>
            <p className="text-xs text-slate-400 max-w-[250px]">
              Hệ thống sẽ tự động xác nhận ngay khi nhận được tiền. Không cần tải lại trang.
            </p>
          </div>
        </div>

        {/* CỘT PHẢI: THÔNG TIN CHI TIẾT */}
        <div className="w-full md:w-7/12 p-8 lg:p-10 bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-emerald-500" />
              Thanh toán hóa đơn
            </h2>
            <p className="text-slate-500 mt-2 text-sm">
              Sử dụng App ngân hàng của bạn để quét mã QR hoặc chuyển khoản thủ công theo thông tin bên dưới.
            </p>
          </div>

          <div className="space-y-4">
            {/* Tên Ngân Hàng */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <CreditCard className="w-5 h-5 text-[#1E6EFF]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Ngân hàng hưởng</p>
                  <p className="text-sm font-bold text-slate-800">{BANK_NAME}</p>
                </div>
              </div>
              <button 
                onClick={() => handleCopy(BANK_NAME, 'bank')}
                className="text-slate-400 hover:text-[#1E6EFF] transition-colors p-2"
              >
                {isCopied['bank'] ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Số Tài Khoản */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <QrCode className="w-5 h-5 text-[#1E6EFF]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Số tài khoản</p>
                  <p className="text-xl font-extrabold text-[#1E6EFF] tracking-wide">{ACCOUNT_NUMBER}</p>
                </div>
              </div>
              <button 
                onClick={() => handleCopy(ACCOUNT_NUMBER, 'accNum')}
                className="text-slate-400 hover:text-[#1E6EFF] transition-colors p-2"
              >
                {isCopied['accNum'] ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Tên Chủ Tài Khoản */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <User className="w-5 h-5 text-[#1E6EFF]" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Tên chủ tài khoản</p>
                  <p className="text-sm font-bold text-slate-800">{ACCOUNT_NAME}</p>
                </div>
              </div>
              <button 
                onClick={() => handleCopy(ACCOUNT_NAME, 'accName')}
                className="text-slate-400 hover:text-[#1E6EFF] transition-colors p-2"
              >
                {isCopied['accName'] ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>

            {/* Nội dung chuyển khoản (Quan trọng nhất) */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
              <div className="flex items-center gap-3 pl-2">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-amber-600 font-semibold uppercase tracking-wider">Nội dung chuyển khoản (Bắt buộc)</p>
                  <p className="text-lg font-extrabold text-amber-700">{transferContent}</p>
                </div>
              </div>
              <button 
                onClick={() => handleCopy(transferContent, 'content')}
                className="bg-white text-amber-600 border border-amber-200 hover:bg-amber-100 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
              >
                {isCopied['content'] ? (
                  <><CheckCircle2 className="w-4 h-4" /> Đã copy</>
                ) : (
                  <><Copy className="w-4 h-4" /> Copy</>
                )}
              </button>
            </div>
            
            <p className="text-xs text-rose-500 italic mt-2 flex items-start gap-1">
              <span className="font-bold">*Lưu ý:</span> Bạn phải nhập chính xác nội dung chuyển khoản ở trên để hệ thống ghi nhận thanh toán tự động.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

// Bọc Component bằng Suspense để Next.js (App Router) không báo lỗi khi build với useSearchParams
export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F7FB] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E6EFF]" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}