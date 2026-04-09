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
  const [dailyRate, setDailyRate] = useState<number>(0); 
  const [isCopied, setIsCopied] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Thông tin thanh toán cố định (BẠN CÓ THỂ SỬA LẠI TÊN VÀ STK CỦA BẠN NẾU CẦN)
  const BANK_NAME = "VPBank";
  const ACCOUNT_NUMBER = "6869558386";
  const ACCOUNT_NAME = "HOANG QUOC VIET";
  const API_BANK = "https://thueapibank.vn/historyapivpbankneov2/d33a5cde4962560a0138920f20d550df";

  // Khởi tạo dữ liệu người dùng, lấy giá gói, lãi suất và tạo nội dung chuyển khoản
  useEffect(() => {
    const initData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        window.location.href = '/login';
        return;
      }

      const email = session.user.email || '';
      
      const name = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      setUserName(name);
      setUserId(session.user.id);
      
      // MẤU CHỐT CHỐNG DUYỆT NHẦM: TẠO 5 SỐ NGẪU NHIÊN ĐỘC NHẤT
      const randomCode = Math.floor(10000 + Math.random() * 90000);
      const safePackageName = packageName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      const content = `MUA ${safePackageName} ${name} ${randomCode}`;
      setTransferContent(content);

      const { data: pkgData, error: pkgError } = await supabase
        .from('packages')
        .select('limits, return_rate')
        .eq('name', packageName)
        .single();

      let currentPrice = 0;
      let currentDailyRate = 0;

      if (pkgData && !pkgError) {
        if (pkgData.limits) {
          const numericPrice = parseInt(pkgData.limits.replace(/\D/g, ''), 10) || 0;
          setPackagePrice(numericPrice);
          currentPrice = numericPrice;
        }
        
        if (pkgData.return_rate) {
          const rateMatch = pkgData.return_rate.match(/\d+/);
          const yearlyRate = rateMatch ? parseInt(rateMatch[0], 10) : 0;
          const calculatedDailyRate = yearlyRate / 365 / 100;
          setDailyRate(calculatedDailyRate);
          currentDailyRate = calculatedDailyRate;
        }
      }

      // ĐĂNG KÝ ĐƠN HÀNG PENDING VÀO DATABASE
      await supabase.from('user_packages').insert({
        user_id: session.user.id,
        package_name: packageName,
        invested_amount: currentPrice,
        daily_interest_rate: currentDailyRate,
        status: 'pending', 
        transfer_content: content 
      });

      setIsLoading(false);
    };

    initData();
  }, [packageName]);

  // Hệ thống Auto-Check (Polling) API Bank, Chia Hoa Hồng & Lưu Gói Đầu Tư
  useEffect(() => {
    if (!transferContent || !userId) return;

    let intervalId: NodeJS.Timeout;
    let isChecking = false;

    const checkPaymentStatus = async () => {
      if (isChecking) return;
      isChecking = true;

      try {
        const res = await fetch(API_BANK);
        const data = await res.json();
        
        const targetContent = transferContent.toLowerCase().trim();

        let transactionsArray = [];
        if (Array.isArray(data)) transactionsArray = data;
        else if (data.data && Array.isArray(data.data)) transactionsArray = data.data;
        else if (data.transactions && Array.isArray(data.transactions)) transactionsArray = data.transactions;
        else if (data.records && Array.isArray(data.records)) transactionsArray = data.records;

        // TÌM GIAO DỊCH KHỚP VỚI MÃ CÓ 5 SỐ NGẪU NHIÊN
        const matchedTx = transactionsArray.find((tx: any) => {
            const txString = JSON.stringify(tx).toLowerCase();
            return txString.includes(targetContent);
        });

        if (matchedTx) {
          clearInterval(intervalId); 
          
          const paidAmount = Number(matchedTx.amount || matchedTx.creditAmount || matchedTx.sotien || matchedTx.tien || 0);

          // Cập nhật trạng thái profile
          await supabase
            .from('profiles')
            .update({ has_purchased_package: true })
            .eq('id', userId);

          // Kích hoạt gói từ pending -> active
          if (paidAmount > 0) {
              await supabase
                .from('user_packages')
                .update({ 
                    status: 'active',
                    invested_amount: paidAmount 
                })
                .eq('user_id', userId)
                .eq('transfer_content', transferContent);
                
              // Chia hoa hồng
              await supabase.rpc('distribute_commission', { 
                  p_buyer_id: userId, 
                  p_amount: paidAmount 
              });
          }

          // KHI THÀNH CÔNG, NGAY LẬP TỨC ĐÁ VỀ TRANG DASHBOARD
          window.location.href = '/dashboard';
        }
      } catch (error) {
        console.error("Lỗi khi fetch API Bank:", error);
      } finally {
        isChecking = false;
      }
    };

    checkPaymentStatus();
    intervalId = setInterval(checkPaymentStatus, 5000); // Quét 5 giây/lần

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
              Hệ thống sẽ tự động xác nhận ngay khi nhận được tiền. Bạn có thể đóng trang này sau khi chuyển.
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

            {/* SỐ TIỀN CẦN THANH TOÁN */}
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

            {/* Nội dung chuyển khoản */}
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

// Bọc Component bằng Suspense
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