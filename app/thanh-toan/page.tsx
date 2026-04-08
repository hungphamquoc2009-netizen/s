"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Copy, CheckCircle2, Loader2, QrCode, CreditCard, 
  User, ArrowLeft, ShieldCheck, AlertCircle, Banknote
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Component chứa logic chính để sử dụng được useSearchParams
function PaymentContent() {
  const searchParams = useSearchParams();
  const packageName = searchParams.get('package') || 'Goi_Tieu_Chuan';

  const [userName, setUserName] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [transferContent, setTransferContent] = useState<string>('');
  const [packagePrice, setPackagePrice] = useState<number>(0);
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Thông tin thanh toán cố định
  const BANK_NAME = "VPBank";
  const ACCOUNT_NUMBER = "6869558386";
  const ACCOUNT_NAME = "HOANG QUOC VIET";
  const API_BANK = "https://thueapibank.vn/historyapivpbankneov2/d33a5cde4962560a0138920f20d550df";

  // Khởi tạo dữ liệu người dùng, lấy giá gói và tạo nội dung chuyển khoản
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
      setTransferContent(content);

      // Lấy thông tin giá tiền của gói từ bảng packages
      const { data: pkgData, error: pkgError } = await supabase
        .from('packages')
        .select('limits')
        .eq('name', packageName)
        .single();

      if (pkgData && pkgData.limits && !pkgError) {
        // Dùng Regex để loại bỏ tất cả chữ cái, dấu phẩy, khoảng trắng... chỉ giữ lại số
        const numericPrice = parseInt(pkgData.limits.replace(/\D/g, ''), 10) || 0;
        setPackagePrice(numericPrice);
      }

      setIsLoading(false);
    };

    initData();
  }, [packageName]);

  // Hệ thống Auto-Check (Polling) API Bank và Chia Hoa Hồng
  useEffect(() => {
    if (!transferContent || !userId) return;

    let intervalId: NodeJS.Timeout;

    const checkPaymentStatus = async () => {
      try {
        const res = await fetch(API_BANK);
        const data = await res.json();
        
        const targetContent = transferContent.toLowerCase().trim();

        // Xử lý linh hoạt format dữ liệu của API Bank (có thể là data.data, data.transactions, hoặc trực tiếp data)
        let transactionsArray = [];
        if (Array.isArray(data)) transactionsArray = data;
        else if (data.data && Array.isArray(data.data)) transactionsArray = data.data;
        else if (data.transactions && Array.isArray(data.transactions)) transactionsArray = data.transactions;
        else if (data.records && Array.isArray(data.records)) transactionsArray = data.records;

        // Tìm giao dịch chứa nội dung chuyển khoản tương ứng
        const matchedTx = transactionsArray.find((tx: any) => {
            const txString = JSON.stringify(tx).toLowerCase();
            return txString.includes(targetContent);
        });

        if (matchedTx) {
          // Nếu tìm thấy giao dịch hợp lệ
          clearInterval(intervalId); // Dừng polling
          
          // Lấy chính xác số tiền khách đã chuyển (Tùy API trả về key là amount, creditAmount hay sotien)
          const paidAmount = Number(matchedTx.amount || matchedTx.creditAmount || matchedTx.sotien || matchedTx.tien || 0);

          // 1. Cập nhật trạng thái đã mua gói vào Supabase
          await supabase
            .from('profiles')
            .update({ has_purchased_package: true })
            .eq('id', userId);

          // 2. GỌI HÀM RPC ĐỂ CHIA HOA HỒNG TỰ ĐỘNG CHO F1, F2, F3
          if (paidAmount > 0) {
              const { error: rpcError } = await supabase.rpc('distribute_commission', { 
                  p_buyer_id: userId, 
                  p_amount: paidAmount 
              });

              if (rpcError) {
                  console.error("Lỗi khi chia hoa hồng:", rpcError);
              }
          }

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

  // Tích hợp số tiền động (packagePrice) vào mã VietQR
  const qrUrl = `https://img.vietqr.io/image/VPBank-${ACCOUNT_NUMBER}-qr_only.png?amount=${packagePrice}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(ACCOUNT_NAME)}`;

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

            {/* SỐ TIỀN CẦN THANH TOÁN (MỚI THÊM) */}
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Banknote className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <p className="text-xs text-rose-500 font-semibold uppercase tracking-wider">Số tiền cần thanh toán</p>
                  <p className="text-xl font-extrabold text-rose-600 tracking-wide">{packagePrice > 0 ? packagePrice.toLocaleString('vi-VN') : '0'} VNĐ</p>
                </div>
              </div>
              <button 
                onClick={() => handleCopy(packagePrice.toString(), 'price')}
                className="text-rose-400 hover:text-rose-600 transition-colors p-2"
              >
                {isCopied['price'] ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
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
              <span className="font-bold">*Lưu ý:</span> Bạn phải nhập chính xác Nội dung chuyển khoản và Số tiền ở trên để hệ thống ghi nhận thanh toán tự động.
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